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
const clubSelect  = document.getElementById("club-select");
const teamSelect  = document.getElementById("team-select");
const matchSelect = document.getElementById("match-select");
const galleryEl   = document.getElementById("gallery");

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

/* ------- Listing via jsDelivr flat API ------- */
let __JSD_FILES = null;
async function fetchAllFilesOnce() {
  if (__JSD_FILES) return __JSD_FILES;
  const url = `https://data.jsdelivr.com/v1/package/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/flat`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("jsDelivr listing failed", res.status, await res.text());
    return (__JSD_FILES = []);
  }
  const data = await res.json();
  __JSD_FILES = (data.files || []).map((f) => f.name);
  return __JSD_FILES;
}
async function listImagesUnder(prefix) {
  const files = await fetchAllFilesOnce();
  const clean = prefix.replace(/^\/+/, "");
  return files
    .filter((p) => p.startsWith(clean + "/"))
    .filter((p) => isImage(p.split("/").pop()))
    .map((p) => ({
      name: p.split("/").pop(),
      path: p,
      cdn: `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/${p}`,
    }));
}
async function listMatches(club, team) {
  const files = await fetchAllFilesOnce();
  const prefix = `full/${slugifyPath(club)}/${slugifyPath(team)}/`;
  const set = new Set();
  files.forEach((p) => {
    if (p.startsWith(prefix)) {
      const parts = p.slice(prefix.length).split("/");
      if (parts.length > 1 && parts[0]) set.add(parts[0]);
    }
  });
  return Array.from(set).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
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
function attachInfoBox(total) {
  const old = document.querySelector(".gallery-info");
  if (old) old.remove();
  const infoBox = document.createElement("div");
  infoBox.className = "gallery-info";
  const date = new Date();
  infoBox.innerHTML = `
    <p>📸 <strong id="photoCount">${total}</strong> photos affichées</p>
    <p>🕓 Dernière mise à jour : <strong>${date.toLocaleDateString("fr-FR")}</strong></p>
  `;
  galleryEl.parentElement.appendChild(infoBox);
}

/**********************
 *  CHARGEMENT GALERIE
 **********************/
async function renderGallery() {
  galleryEl.innerHTML = "";
  let all = [];

  const club  = clubSelect.value;
  const team  = teamSelect.value;
  const match = matchSelect.value;

  if (club === "all" && team === "all" && match === "all") {
    const fav = await listImagesUnder("full/favorites");
    fav.forEach((img) =>
      all.push({ club: "Favoris", team: "", filename: img.name, rawUrl: img.cdn })
    );
  } else {
    const roots = [];
    if (club !== "all" && team !== "all") {
      if (match !== "all") roots.push(`full/${slugifyPath(club)}/${slugifyPath(team)}/${match}`);
      else roots.push(`full/${slugifyPath(club)}/${slugifyPath(team)}`);
    } else if (club !== "all" && team === "all") {
      (STRUCTURE[club] || []).forEach((t) =>
        roots.push(`full/${slugifyPath(club)}/${slugifyPath(t)}`)
      );
    } else if (club === "all" && team !== "all") {
      Object.keys(STRUCTURE).forEach((c) => {
        if (STRUCTURE[c].includes(team)) roots.push(`full/${slugifyPath(c)}/${slugifyPath(team)}`);
      });
    }

    for (const root of roots) {
      const imgs = await listImagesUnder(root);
      imgs.forEach((img) => {
        let inferredClub = "Club";
        let inferredTeam = "Équipe";
        const parts = img.path.split("/");
        if (parts.length >= 4) {
          inferredClub = parts[1].replaceAll("_", " ");
          inferredTeam = parts[2].replaceAll("_", " ");
        }
        all.push({ club: inferredClub, team: inferredTeam, filename: img.name, rawUrl: img.cdn });
      });
    }
  }

  all.sort((a, b) => b.filename.localeCompare(a.filename, undefined, { numeric: true }));
  all.forEach((p) => galleryEl.appendChild(makeCard(p)));
  attachInfoBox(all.length);

  if (all.length === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column:1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
        Aucune image détectée pour ce filtre.<br>
        Vérifie tes dossiers ou retire un filtre.
      </div>`;
  }
}

/**********************
 *  MISE À JOUR LISTE MATCHS
 **********************/
async function refreshMatchOptions() {
  const club = clubSelect.value;
  const team = teamSelect.value;
  matchSelect.innerHTML = `<option value="all">Tous les matchs</option>`;
  matchSelect.disabled = true;
  if (club !== "all" && team !== "all") {
    const matches = await listMatches(club, team);
    matches.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m.replaceAll("_", " ");
      matchSelect.appendChild(opt);
    });
    matchSelect.disabled = false;
  }
}

/**********************
 *  INIT
 **********************/
function setupFilters() {
  clubSelect.addEventListener("change", async () => {
    await refreshMatchOptions();
    renderGallery();
  });
  teamSelect.addEventListener("change", async () => {
    await refreshMatchOptions();
    renderGallery();
  });
  matchSelect.addEventListener("change", renderGallery);
}

async function init() {
  await fetchAllFilesOnce();
  await refreshMatchOptions();
  await renderGallery();
}
init();

const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();
