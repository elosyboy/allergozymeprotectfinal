import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ⚙️ À remplir avec tes identifiants Supabase (à faire plus tard)
const SUPABASE_URL = "https://tmrraeutjrcsozijjbzm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcnJhZXV0anJjc296aWpqYnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDA4NzIsImV4cCI6MjA3NjM3Njg3Mn0.015qUFsUyndsesz5RHGKWO1Ipoz7C3vcVZulACGmq0g";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIG DE BASE ---
const qrGeneralContainer = document.getElementById("qr-general");
const qrTablesContainer = document.getElementById("qr-tables");
const btnAddTable = document.getElementById("add-table");
const btnGenerateGeneral = document.getElementById("generate-general");
const colorPicker = document.getElementById("qr-color");
const formShape = document.getElementById("qr-shape");
const logoPath = "assets/logo.png"; // chemin de ton logo AllergoZyme

// --- Génération QR Code ---
async function generateQRCode(container, data, color = "#000000", shape = "square") {
  container.innerHTML = "";

  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  // Lib QRCode officielle
  const qr = new QRCode(canvas, {
    text: data,
    width: 180,
    height: 180,
    colorDark: color,
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  // Attendre que le QR soit dessiné
  setTimeout(() => {
    const ctx = canvas.getContext("2d");
    const logo = new Image();
    logo.src = logoPath;
    logo.onload = () => {
      const size = 40;
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;
      ctx.save();

      // Si forme ronde
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, size / 2 + 10, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.clip();
      }

      ctx.drawImage(logo, x, y, size, size);
      ctx.restore();
    };
  }, 300);
}

// --- Génération du QR Général ---
btnGenerateGeneral.addEventListener("click", async () => {
  const restaurantId = localStorage.getItem("restaurant_id");
  const color = colorPicker.value;
  const shape = formShape.value;

  if (!restaurantId) {
    alert("Erreur : identifiant du restaurant manquant !");
    return;
  }

  const qrData = `https://votre-site.com/signature.html?restaurant=${restaurantId}&type=general`;
  generateQRCode(qrGeneralContainer, qrData, color, shape);

  // Enregistrement dans Supabase
  const { data, error } = await supabase.from("qr_codes").insert([
    {
      restaurant_id: restaurantId,
      type: "general",
      couleur: color,
      forme: shape,
      lien: qrData
    }
  ]);

  if (error) console.error("Erreur Supabase :", error.message);
  else console.log("QR général enregistré ✅", data);
});

// --- Ajout d’un QR table ---
btnAddTable.addEventListener("click", async () => {
  const nomTable = prompt("Nom ou numéro de la table :");
  if (!nomTable) return;

  const restaurantId = localStorage.getItem("restaurant_id");
  const color = colorPicker.value;
  const shape = formShape.value;

  const qrData = `https://votre-site.com/signature.html?restaurant=${restaurantId}&table=${encodeURIComponent(nomTable)}`;
  const tableDiv = document.createElement("div");
  tableDiv.classList.add("table-qr");

  const title = document.createElement("p");
  title.textContent = `Table : ${nomTable}`;
  tableDiv.appendChild(title);

  const qrCanvas = document.createElement("div");
  tableDiv.appendChild(qrCanvas);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑 Supprimer";
  deleteBtn.classList.add("delete-btn");
  tableDiv.appendChild(deleteBtn);

  qrTablesContainer.appendChild(tableDiv);

  generateQRCode(qrCanvas, qrData, color, shape);

  // Sauvegarde Supabase
  const { data, error } = await supabase.from("qr_codes").insert([
    {
      restaurant_id: restaurantId,
      type: "table",
      nom_table: nomTable,
      couleur: color,
      forme: shape,
      lien: qrData
    }
  ]);

  if (error) console.error("Erreur Supabase :", error.message);
  else console.log("QR table ajouté ✅", data);

  // Suppression
  deleteBtn.addEventListener("click", async () => {
    tableDiv.remove();
    await supabase.from("qr_codes").delete().eq("restaurant_id", restaurantId).eq("nom_table", nomTable);
    console.log(`QR de la table ${nomTable} supprimé`);
  });
});
