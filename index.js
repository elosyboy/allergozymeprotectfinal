// ================================
// AllergoZymeProtect - index.js
// ================================

// --- 1. Configuration Supabase (préparation)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ⚠️ Remplace par tes propres identifiants Supabase
const SUPABASE_URL = "https://votre-projet.supabase.co";
const SUPABASE_KEY = "votre_clef_api";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. Navigation fluide entre les pages
document.querySelectorAll("[data-supabase-action]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const action = btn.getAttribute("data-supabase-action");
    if (action === "signup") {
      window.location.href = "inscription.html";
    } else if (action === "login") {
      window.location.href = "identification.html";
    }
  });
});

// --- 3. Effet de scroll fluide pour les ancres internes
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 70,
        behavior: "smooth",
      });
    }
  });
});

// --- 4. Animation du QR code simulé
const qrElement = document.querySelector(".qr");
if (qrElement) {
  let rotation = 0;
  setInterval(() => {
    rotation += 1.5;
    qrElement.style.transform = `rotate(${rotation}deg)`;
  }, 80);
}

// --- 5. Marquee duplicateur automatique (bande défilante)
const marquees = document.querySelectorAll(".marquee span");
if (marquees.length === 2) {
  marquees[1].innerHTML = marquees[0].innerHTML;
}

// --- 6. Placeholder futur : compteur de signatures
async function updateSignatureCount() {
  try {
    const { count, error } = await supabase
      .from("signatures")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    const counterEl = document.getElementById("signatureCount");
    if (counterEl) counterEl.textContent = count || 0;
  } catch (err) {
    console.warn("Compteur de signatures indisponible :", err.message);
  }
}

// Appel automatique si l’élément existe
if (document.getElementById("signatureCount")) {
  updateSignatureCount();
}

// --- 7. Logs simples en console
console.log("%cAllergoZymeProtect", "color:#c9a227;font-weight:bold;font-size:14px;");
console.log("Interface connectée. Supabase prêt à être intégré.");

// --- 8. Gestion basique d’état de session (à activer plus tard)
async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (data?.session) {
    console.log("Utilisateur connecté :", data.session.user.email);
  }
}
checkSession();
