// ================================
// AllergoZymeProtect - index.js
// ================================

// --- 1) Configuration Supabase (NE PAS MODIFIER vos identifiants ici si déjà corrects)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ⚠️ Laisse tes valeurs réelles. Je garde les placeholders à titre d’exemple.
const SUPABASE_URL = "https://tmrraeutjrcsozijjbzm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcnJhZXV0anJjc296aWpqYnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDA4NzIsImV4cCI6MjA3NjM3Njg3Mn0.015qUFsUyndsesz5RHGKWO1Ipoz7C3vcVZulACGmq0g";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2) Navigation fluide (respecte cmd/ctrl + clic & middle click)
document.querySelectorAll("[data-supabase-action]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    // Si l'utilisateur veut ouvrir dans un nouvel onglet/fenêtre, on n'empêche pas
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    const action = btn.getAttribute("data-supabase-action");
    if (action === "signup") {
      window.location.href = "inscription.html";
    } else if (action === "login") {
      window.location.href = "identification.html";
    }
  }, { passive: true });
});

// --- 3) Scroll doux vers ancres, avec respect de prefers-reduced-motion
const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;

    // Si nouvel onglet souhaité, ne pas intercepter
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;

    e.preventDefault();
    if (!prefersReduced) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo(0, target.offsetTop - 70);
    }
  }, { passive: false });
});

// --- 4) Animation du QR code simulé (requestAnimationFrame + pause quand onglet caché)
(() => {
  const qr = document.querySelector(".qr");
  if (!qr) return;

  let angle = 0;
  let rafId = null;

  const tick = () => {
    angle = (angle + 0.8) % 360;
    qr.style.transform = `rotate(${angle}deg)`;
    rafId = requestAnimationFrame(tick);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  };

  document.addEventListener("visibilitychange", onVisibility, { passive: true });
  rafId = requestAnimationFrame(tick);
})();

// --- 5) Marquee : duplique automatiquement le contenu si nécessaire
(() => {
  const spans = document.querySelectorAll(".marquee span");
  if (spans.length === 2 && !spans[1].dataset.cloned) {
    spans[1].innerHTML = spans[0].innerHTML;
    spans[1].dataset.cloned = "true";
  }
})();

// --- 6) Compteur de signatures (lecture simple Supabase; pas d’écriture)
//      • Robuste : relance à la reconnexion réseau & quand l’onglet redevient visible
async function updateSignatureCount() {
  const el = document.getElementById("signatureCount");
  if (!el) return;
  try {
    const { count, error } = await supabase
      .from("signatures")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    el.textContent = typeof count === "number" ? count : 0;
  } catch (err) {
    console.warn("Compteur de signatures indisponible :", err?.message || err);
    el.textContent = "—";
  }
}

if (document.getElementById("signatureCount")) {
  updateSignatureCount();
  // Mise à jour quand on revient sur l’onglet
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateSignatureCount();
  }, { passive: true });
  // Mise à jour à la reconnexion
  window.addEventListener("online", updateSignatureCount, { passive: true });
}

// --- 7) Logs simples
console.log("%cAllergoZymeProtect", "color:#c9a227;font-weight:bold;font-size:14px;");
console.log("Interface connectée. Supabase prêt à être intégré.");

// --- 8) État de session (lecture seule ; ne pas modifier la logique d’auth réelle)
(async function checkSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.email) {
      console.log("Utilisateur connecté :", data.session.user.email);
      // Exemple : on pourrait exposer le mail dans le DOM si besoin :
      // document.getElementById("userEmail").textContent = data.session.user.email;
    }
  } catch (e) {
    console.warn("Session non vérifiable pour le moment :", e?.message || e);
  }
})();
