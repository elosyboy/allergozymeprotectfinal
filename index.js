// ================================
// AllergoZymeProtect - index.js
// ================================

// --- 1) Configuration Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tmrraeutjrcsozijjbzm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcnJhZXV0anJjc296aWpqYnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDA4NzIsImV4cCI6MjA3NjM3Njg3Mn0.015qUFsUyndsesz5RHGKWO1Ipoz7C3vcVZulACGmq0g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2) Navigation fluide
document.querySelectorAll("[data-supabase-action]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    const action = btn.getAttribute("data-supabase-action");
    if (action === "signup") window.location.href = "inscription.html";
    if (action === "login") window.location.href = "identification.html";
  }, { passive: true });
});

// --- 3) Scroll doux
const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    if (!prefersReduced) target.scrollIntoView({ behavior:"smooth", block:"start" });
    else window.scrollTo(0, target.offsetTop - 70);
  });
});

// --- 4) Animation QR
(() => {
  const qr = document.querySelector(".qr");
  if (!qr) return;
  let angle = 0, raf = null;
  const tick = () => { angle=(angle+0.8)%360; qr.style.transform=`rotate(${angle}deg)`; raf=requestAnimationFrame(tick); };
  document.addEventListener("visibilitychange",()=>{ if(document.hidden&&raf){cancelAnimationFrame(raf);raf=null;} else if(!document.hidden&&!raf){raf=requestAnimationFrame(tick);} });
  raf=requestAnimationFrame(tick);
})();

// --- 5) Marquee clone
(() => {
  const spans = document.querySelectorAll(".marquee span");
  if (spans.length === 2 && !spans[1].dataset.cloned) {
    spans[1].innerHTML = spans[0].innerHTML;
    spans[1].dataset.cloned = "true";
  }
})();

// --- 6) Compteur Signatures AVEC OFFSET
async function updateSignatureCount() {
  const el = document.getElementById("signatureCount");
  if (!el) return;
  try {
    const { count, error } = await supabase.from("signatures").select("*",{count:"exact",head:true});
    if (error) throw error;
    el.textContent = (18446 + (count||0)).toLocaleString('fr-FR');
  } catch(e){
    console.warn("SignatureCount err:",e);
    el.textContent="—";
  }
}

// lancement une seule fois
if(document.getElementById("signatureCount")){
  updateSignatureCount();
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateSignatureCount();});
  window.addEventListener("online",updateSignatureCount);
}

// --- 7) Logs
console.log("%cAllergoZymeProtect","color:#c9a227;font-weight:bold;font-size:14px;");
console.log("Index.js chargé");

// --- 8) Session simple
(async()=>{
  const {data}=await supabase.auth.getSession();
  if(data?.session?.user?.email) console.log("Connecté:",data.session.user.email);
})();
