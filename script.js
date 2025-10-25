/**********************
 *  CONFIG GITHUB
 **********************/
const GH_OWNER  = "Soaresbm1";
const GH_REPO   = "the_frame_srs";
const GH_BRANCH = "main";

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

async function githubList(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**********************
 *  UI BUILDERS
 **********************/
function makeCard({ club, team, filename, rawUrl }) {
  const fig = document.createElement('figure');
  fig.className = 'card photo';
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
  let total = 0;

  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {

      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const folder = `full/${clubPath}/${teamPath}`;

      const files = await githubList(folder);
      const images = files.filter(f => f.type === 'file' && isImage(f.name));

      images.forEach(img => {
        const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${folder}/${img.name}`;
        galleryEl.appendChild(makeCard({ club, team, filename: img.name, rawUrl: raw }));
        total++;
      });
    }
  }

  if (total === 0) {
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
 *  FILTRES
 **********************/
function setupFilters() {
  if (clubSelect) clubSelect.addEventListener('change', filterGallery);
  if (teamSelect) teamSelect.addEventListener('change', filterGallery);
  filterGallery(); // premier affichage
}

function filterGallery() {
  const club = clubSelect ? clubSelect.value : 'all';
  const team = teamSelect ? teamSelect.value : 'all';

  document.querySelectorAll('.photo').forEach(photo => {
    const okClub = (club === 'all' || photo.dataset.club === club);
    const okTeam = (team === 'all' || photo.dataset.team === team);
    photo.style.display = (okClub && okTeam) ? 'block' : 'none';
  });
}

/**********************
 *  LANCEMENT
 **********************/
loadGallery();

// Année footer
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
