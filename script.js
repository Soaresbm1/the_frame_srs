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
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
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
 *  UI
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
  let allPhotos = [];

  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {
      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const teamFolder = `full/${clubPath}/${teamPath}`;

      // Liste le dossier de l'équipe
      const entries = await githubList(teamFolder);
      if (!entries.length) continue;

      // 1) images directement dans le dossier de l'équipe
      entries
        .filter(e => e.type === "file" && isImage(e.name))
        .forEach(img => {
          const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${teamFolder}/${img.name}`;
          allPhotos.push({ club, team, filename: img.name, rawUrl: raw });
        });

      // 2) images dans les SOUS-DOSSIERS (matchs)
      const subdirs = entries.filter(e => e.type === "dir");
      for (const dir of subdirs) {
        const matchFolder = `${teamFolder}/${dir.name}`;
        const files = await githubList(matchFolder);
        files
          .filter(f => f.type === "file" && isImage(f.name))
          .forEach(img => {
            const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${matchFolder}/${img.name}`;
            allPhotos.push({ club, team, filename: img.name, rawUrl: raw });
          });
      }
    }
  }

  // Trie par nom décroissant (les plus récentes d'abord si nom type IMG_1234)
  allPhotos.sort((a, b) => b.filename.localeCompare(a.filename, undefined, { numeric: true }));

  // Affichage
  if (allPhotos.length === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column:1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
        Aucune image détectée.<br>
        Vérifie que tes photos sont bien <strong>commitées/pushées sur GitHub</strong>
        dans <code>full/&lt;Club&gt;/&lt;Équipe&gt;/(éventuellement « Match – AAAA-MM-JJ »)</code>.<br>
        Puis recharge la page (Ctrl+F5).
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
  filterGallery();
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
