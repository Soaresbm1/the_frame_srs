/**********************
 *  CONFIG GITHUB
 **********************/
const GH_OWNER  = "Soaresbm1";
const GH_REPO   = "the_frame_srs";
const GH_BRANCH = "main";
const FAVORITES_PATH = "full/favorites";

/**********************
 *  ACCORDÉON FILTRES
 **********************/
const acc = document.querySelector('.accordion');
const panel = document.querySelector('.panel');
if (acc && panel) {
  acc.addEventListener('click', () => {
    acc.classList.toggle('active');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
}

/**********************
 *  STRUCTURE CLUBS/ÉQUIPES
 **********************/
const STRUCTURE = {
  "FC Le Parc": ["Inter A", "Juniors B", "2ème Futsal"],
  "FC La Chaux-de-Fonds": ["Inter A", "Juniors B"]
};

/**********************
 *  SÉLECTEURS
 **********************/
const clubSelect = document.getElementById('club-select');
const teamSelect = document.getElementById('team-select');
const galleryEl  = document.getElementById('gallery');

/**********************
 *  OUTILS
 **********************/
function slugifyPath(text) {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
function isImage(name) { return /\.(jpe?g|png|webp)$/i.test(name); }

async function githubList(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**********************
 *  UI
 **********************/
function makeCard({ club, team, filename, rawUrl, favorite=false }) {
  const fig = document.createElement('figure');
  fig.className = 'card photo';
  fig.dataset.club = club;
  fig.dataset.team = team;
  if (favorite) fig.dataset.favorite = "true";
  fig.innerHTML = `
    <img src="${rawUrl}" alt="${club} ${team}" loading="lazy">
    <figcaption>
      <div><strong>${favorite ? "⭐ Favori" : `${club} – ${team}`}</strong></div>
      <a class="btn-sm" href="${rawUrl}" download>Télécharger</a>
    </figcaption>
  `;
  return fig;
}

/**********************
 *  CHARGEMENT
 **********************/
async function loadFavorites(intoArray) {
  const files = await githubList(FAVORITES_PATH);
  files
    .filter(f => f.type === "file" && isImage(f.name))
    .forEach(img => {
      const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${FAVORITES_PATH}/${img.name}`;
      intoArray.push({
        club: "__favorites__", // marqueur interne
        team: "__favorites__",
        filename: img.name,
        rawUrl: raw,
        favorite: true
      });
    });
}

async function loadTeams(intoArray) {
  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {
      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const teamFolder = `full/${clubPath}/${teamPath}`;

      const entries = await githubList(teamFolder);
      if (!entries.length) continue;

      // Fichiers directement dans le dossier de l’équipe
      entries
        .filter(e => e.type === "file" && isImage(e.name))
        .forEach(img => {
          const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${teamFolder}/${img.name}`;
          intoArray.push({ club, team, filename: img.name, rawUrl: raw, favorite:false });
        });

      // Sous-dossiers (Match – AAAA-MM-JJ)
      const subdirs = entries.filter(e => e.type === "dir");
      for (const dir of subdirs) {
        const matchFolder = `${teamFolder}/${dir.name}`;
        const files = await githubList(matchFolder);
        files
          .filter(f => f.type === "file" && isImage(f.name))
          .forEach(img => {
            const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${matchFolder}/${img.name}`;
            intoArray.push({ club, team, filename: img.name, rawUrl: raw, favorite:false });
          });
      }
    }
  }
}

async function loadGallery() {
  galleryEl.innerHTML = "";
  const allPhotos = [];

  // 1) charger FAVORIS
  await loadFavorites(allPhotos);

  // 2) charger EQUIPES
  await loadTeams(allPhotos);

  // 3) tri (noms décroissants pour avoir les plus “récentes” en haut si IMG_1234)
  allPhotos.sort((a, b) => b.filename.localeCompare(a.filename, undefined, { numeric:true }));

  // 4) rendu
  if (allPhotos.length === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column:1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
        Aucune image détectée.<br>
        Place des photos dans <code>full/favorites</code> ou
        <code>full/&lt;Club&gt;/&lt;Équipe&gt;/(Match – AAAA-MM-JJ)</code> puis recharge (Ctrl+F5).
      </div>`;
  } else {
    allPhotos.forEach(p => galleryEl.appendChild(makeCard(p)));
  }

  setupFilters();
}

/**********************
 *  FILTRES
 **********************/
function setupFilters() {
  if (clubSelect) clubSelect.addEventListener('change', filterGallery);
  if (teamSelect) teamSelect.addEventListener('change', filterGallery);
  filterGallery(); // affichage initial
}

/* Règle :
   - Si Club == 'all' ET Team == 'all' → n’afficher que data-favorite="true"
   - Sinon → masquer les favorites et appliquer le filtre club/équipe
*/
function filterGallery() {
  const club = clubSelect ? clubSelect.value : 'all';
  const team = teamSelect ? teamSelect.value : 'all';

  const photos = document.querySelectorAll('.photo');
  if (club === 'all' && team === 'all') {
    photos.forEach(p => {
      const isFav = p.dataset.favorite === "true";
      p.style.display = isFav ? 'block' : 'none';
    });
    return;
  }

  // Filtrage normal (favorites masquées)
  photos.forEach(p => {
    if (p.dataset.favorite === "true") { p.style.display = 'none'; return; }
    const okClub = (club === 'all' || p.dataset.club === club);
    const okTeam = (team === 'all' || p.dataset.team === team);
    p.style.display = (okClub && okTeam) ? 'block' : 'none';
  });
}

/**********************
 *  LANCEMENT
 **********************/
loadGallery();

// Année footer
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
