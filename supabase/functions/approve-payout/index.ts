// supabase/functions/approve-payout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET")!;
const PAYPAL_ENV = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ADMIN_EMAILS = (Deno.env.get("ALLOWED_ADMIN_EMAILS") || "").split(",");

const apiBase = PAYPAL_ENV === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

async function getPayPalToken() {
  const resp = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error_description || "PayPal token error");
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    // Vérifie l’authentification (admin Supabase connecté)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "JWT manquant" }), { status: 401 });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { createClient } = await import("npm:@supabase/supabase-js");
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: user, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user?.user) {
      return new Response(JSON.stringify({ error: "Utilisateur invalide" }), { status: 401 });
    }

    if (!ALLOWED_ADMIN_EMAILS.includes(user.user.email)) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 403 });
    }

    // Lecture du payout_id envoyé
    const { payout_id } = await req.json();
    if (!payout_id) {
      return new Response(JSON.stringify({ error: "payout_id manquant" }), { status: 400 });
    }

    // Récupération des infos du paiement
    const { data: row, error: selErr } = await sb
      .from("paiements_en_attente")
      .select("id, statut, eligible_at, montant_cents, devise, code_promo, vendeur_id, vendeurs: vendeur_id (paypal_email)")
      .eq("id", payout_id)
      .single();

    if (selErr || !row)
      return new Response(JSON.stringify({ error: "Payout introuvable" }), { status: 404 });

    if (row.statut !== "approved")
      return new Response(JSON.stringify({ error: "Statut non payable" }), { status: 400 });

    if (new Date(row.eligible_at) > new Date())
      return new Response(JSON.stringify({ error: "Pas encore éligible" }), { status: 400 });

    const paypal_email = row.vendeurs?.paypal_email;
    if (!paypal_email)
      return new Response(JSON.stringify({ error: "paypal_email manquant" }), { status: 400 });

    // Envoi du paiement PayPal
    const token = await getPayPalToken();
    const batchId = crypto.randomUUID();

    const body = {
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: "AllergoZyme — Paiement de parrainage",
        email_message: "Merci ! Voici votre commission de 10€.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          receiver: paypal_email,
          amount: { value: (row.montant_cents / 100).toFixed(2), currency: row.devise },
          note: `Parrainage ${row.code_promo || ""}`,
          sender_item_id: row.id,
        },
      ],
    };

    const payResp = await fetch(`${apiBase}/v1/payments/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const payData = await payResp.json();

    if (!payResp.ok) {
      await sb.from("paiements_en_attente").update({
        statut: "error",
        admin_note: JSON.stringify(payData).slice(0, 500),
      }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "PayPal payout failed", detail: payData }), { status: 500 });
    }

    await sb.from("paiements_en_attente").update({
      statut: "paid",
      paypal_payout_batch_id: payData.batch_header?.payout_batch_id || batchId,
      processed_at: new Date().toISOString(),
    }).eq("id", row.id);

    return new Response(JSON.stringify({ ok: true, batch_id: batchId }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
