/**********************
 *  CONFIG REPO
 **********************/
const GH_OWNER  = "Soaresbm1";
const GH_REPO   = "the_frame_srs";
const GH_BRANCH = "main";

/**********************
 *  ACCORDÉON FILTRES
 **********************/
const acc = document.querySelector(".accordion");
const panel = document.querySelector(".panel");
if (acc && panel) {
  acc.addEventListener("click", () => {
    acc.classList.toggle("active");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  });
}

/**********************
 *  STRUCTURE CLUBS/ÉQUIPES
 **********************/
const STRUCTURE = {
  "FC Le Parc": ["Inter A", "Juniors B", "2ème Futsal"],
  "FC La Chaux-de-Fonds": ["Inter A", "Juniors B"],
};

/**********************
 *  SÉLECTEURS
 **********************/
const clubSelect = document.getElementById("club-select");
const teamSelect = document.getElementById("team-select");
const galleryEl  = document.getElementById("gallery");

/**********************
 *  OUTILS
 **********************/
function slugifyPath(text) {
  return text
    .trim()
    .replaceAll(" ", "_")
    .replaceAll("-", "_")
    .replaceAll("é", "e")
    .replaceAll("è", "e")
    .replaceAll("ê", "e")
    .replaceAll("à", "a")
    .replaceAll("ç", "c")
    .replaceAll("ô", "o")
    .replaceAll("ï", "i");
}
function isImage(name) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

/* ------- Lister les fichiers via jsDelivr (pas de rate-limit gênant) -------

 Docs : https://data.jsdelivr.com/v1/package/gh/:user/:repo@version/flat
 Retourne un tableau "files" avec les chemins complets dans le repo.

*************************************************************************** */
let __JSD_FILES = null; // cache en mémoire
async function fetchAllFilesOnce() {
  if (__JSD_FILES) return __JSD_FILES;
  const url = `https://data.jsdelivr.com/v1/package/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/flat`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("jsDelivr listing failed", res.status, await res.text());
    return (__JSD_FILES = []);
  }
  const data = await res.json();
  __JSD_FILES = (data.files || []).map((f) => f.name); // chemins, ex: "full/FC_Le_Parc/Inter_A/IMG_1234.jpeg"
  return __JSD_FILES;
}

/** Liste les images sous un préfixe donné (dossier) */
async function listImagesUnder(prefix) {
  const files = await fetchAllFilesOnce();
  const clean = prefix.replace(/^\/+/, ""); // remove leading slash
  return files
    .filter((p) => p.startsWith(clean + "/"))
    .filter((p) => isImage(p.split("/").pop()))
    .map((p) => ({
      name: p.split("/").pop(),
      path: p,
      cdn: `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/${p}`,
    }));
}

/**********************
 *  UI
 **********************/
function makeCard({ club, team, rawUrl }) {
  const fig = document.createElement("figure");
  fig.className = "card photo";
  fig.dataset.club = club;
  fig.dataset.team = team;
  fig.innerHTML = `
    <img src="${rawUrl}" alt="${club} ${team}" loading="lazy">
    <figcaption>
      <div><strong>${club} – ${team}</strong></div>
      <a class="btn-sm" href="${rawUrl}" download>Télécharger</a>
    </figcaption>
  `;
  return fig;
}

/**********************
 *  CHARGEMENT GALERIE
 **********************/
async function loadGallery() {
  galleryEl.innerHTML = "";
  let allPhotos = [];

  // 1) Récupérer toutes les images de tous les dossiers via jsDelivr
  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {
      const folder = `full/${slugifyPath(club)}/${slugifyPath(team)}`;
      const imgs = await listImagesUnder(folder);

      imgs.forEach((img) => {
        allPhotos.push({
          club,
          team,
          filename: img.name,
          rawUrl: img.cdn, // URL CDN directe
        });
      });
    }
  }

  // 2) Trier "nouvelles d'abord" (par nom décroissant, ex: IMG_999 > IMG_001)
  allPhotos.sort((a, b) =>
    b.filename.localeCompare(a.filename, undefined, { numeric: true })
  );

  // 3) Afficher
  allPhotos.forEach((p) => galleryEl.appendChild(makeCard(p)));

  // 4) Compteur + dernière mise à jour
  attachInfoBox(allPhotos.length);

  // 5) Fallback si vide
  if (allPhotos.length === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column:1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
        Aucune image détectée.<br>
        Vérifie que tes photos sont bien <strong>commitées/pushées sur GitHub</strong>
        dans <code>full/&lt;Club&gt;/&lt;Équipe&gt;</code>.<br>
        Puis recharge la page (Ctrl+F5).
      </div>`;
  }

  setupFilters();
}

/**********************
 *  COMPTEUR / MÀJ
 **********************/
function attachInfoBox(total) {
  // enlève l’ancienne si présente
  const old = document.querySelector(".gallery-info");
  if (old) old.remove();

  const infoBox = document.createElement("div");
  infoBox.className = "gallery-info";
  const date = new Date();
  infoBox.innerHTML = `
    <p>📸 <strong id="photoCount">${total}</strong> photos affichées</p>
    <p>🕓 Dernière mise à jour : <strong>${date.toLocaleDateString("fr-FR")}</strong></p>
  `;
  // inséré juste après la grille
  galleryEl.parentElement.appendChild(infoBox);
}

/**********************
 *  FILTRES
 **********************/
function setupFilters() {
  if (clubSelect) clubSelect.addEventListener("change", filterGallery);
  if (teamSelect) teamSelect.addEventListener("change", filterGallery);
  filterGallery();
}
function filterGallery() {
  const club = clubSelect ? clubSelect.value : "all";
  const team = teamSelect ? teamSelect.value : "all";
  let visible = 0;

  document.querySelectorAll(".photo").forEach((fig) => {
    const okClub = club === "all" || fig.dataset.club === club;
    const okTeam = team === "all" || fig.dataset.team === team;
    const show = okClub && okTeam;
    fig.style.display = show ? "block" : "none";
    if (show) visible++;
  });

  const counter = document.getElementById("photoCount");
  if (counter) counter.textContent = visible;
}

/**********************
 *  LANCEMENT
 **********************/
loadGallery();

// footer année
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();
