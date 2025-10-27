// supabase/functions/pay-vendeur/index.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Variables sécurisées (injectées depuis ton dashboard Supabase)
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialisation du client Supabase (clé service role)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 🔑 Récupère un token d’accès PayPal
async function getPayPalAccessToken() {
  const resp = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error("Échec de connexion à PayPal");
  return data.access_token;
}

// 💸 Envoi du paiement vers un compte PayPal
async function sendPayout(paypalEmail, montant) {
  const token = await getPayPalAccessToken();
  const body = {
    sender_batch_header: {
      sender_batch_id: `batch_${Date.now()}`,
      email_subject: "Paiement AllergoZyme Passport",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: { value: montant.toFixed(2), currency: "EUR" },
        receiver: paypalEmail,
        note: "Commission AllergoZyme Passport",
      },
    ],
  };

  const resp = await fetch("https://api-m.paypal.com/v1/payments/payouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (data.name === "ERROR" || data.error) {
    console.error("Erreur PayPal:", data);
    throw new Error("Échec du paiement PayPal");
  }
  return data;
}

// 🚀 Fonction principale
serve(async (req) => {
  try {
    const { id_paiement } = await req.json();

    // 1️⃣ Récupérer le paiement dans la table
    const { data: paiement, error: err1 } = await supabase
      .from("paiements_en_attente")
      .select("*")
      .eq("id", id_paiement)
      .single();

    if (err1 || !paiement) {
      return new Response(JSON.stringify({ error: "Paiement introuvable" }), { status: 404 });
    }

    if (paiement.statut !== "en_attente") {
      return new Response(JSON.stringify({ error: "Paiement déjà traité" }), { status: 400 });
    }

    // 2️⃣ Récupérer le vendeur associé
    const { data: vendeur, error: err2 } = await supabase
      .from("vendeurs")
      .select("paypal_email")
      .eq("code_promo", paiement.code_promo)
      .single();

    if (err2 || !vendeur?.paypal_email) {
      return new Response(JSON.stringify({ error: "Email PayPal vendeur introuvable" }), { status: 404 });
    }

    // 3️⃣ Envoi réel du paiement via PayPal
    const payout = await sendPayout(vendeur.paypal_email, paiement.montant || 10);

    // 4️⃣ Mise à jour du statut dans Supabase
    await supabase
      .from("paiements_en_attente")
      .update({
        statut: "valide",
        transaction_id: payout.batch_header?.payout_batch_id || "envoyé",
      })
      .eq("id", id_paiement);

    return new Response(JSON.stringify({ success: true, payout }), { status: 200 });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
