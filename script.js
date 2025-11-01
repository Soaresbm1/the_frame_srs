/**********************
 *  CONFIG GITHUB
 **********************/
const GH_OWNER  = "Soaresbm1";
const GH_REPO   = "the_frame_srs";
const GH_BRANCH = "main";

/**********************
 *  ACCORDÉON FILTRES
 **********************/
const acc   = document.querySelector('.accordion');
const panel = document.querySelector('.panel');
if (acc && panel) {
  acc.addEventListener('click', () => {
    acc.classList.toggle('active');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
}

/**********************
 *  STRUCTURE CLUBS/ÉQUIPES
 *  (mets ici exactement les libellés que tu utilises dans gallery.html)
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
    .replaceAll("â", "a")
    .replaceAll("î", "i")
    .replaceAll("ï", "i")
    .replaceAll("ô", "o")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function isImage(name) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

// Liste les fichiers d’un dossier via l’API GitHub
async function githubList(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  const res = await fetch(url);
  if (!res.ok) return [];               // 404/403 => on renvoie liste vide
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Fabrique une carte image
function makeCard({ club, team, filename, rawUrl, badge }) {
  const fig = document.createElement('figure');
  fig.className = 'card photo';
  if (club) fig.dataset.club = club;
  if (team) fig.dataset.team = team;
  fig.innerHTML = `
    <img src="${rawUrl}" alt="${(club || 'Favorites')} ${(team || '')}" loading="lazy">
    <figcaption>
      <div>
        <strong>${club ? `${club} – ${team}` : 'Favoris'}</strong>
        ${badge ? `<span style="margin-left:.4rem;font-size:.8rem;opacity:.7">${badge}</span>` : ""}
      </div>
      <a class="btn-sm" href="${rawUrl}" download>Télécharger</a>
    </figcaption>
  `;
  return fig;
}

/**********************
 *  CHARGEMENT (FAVORIS + ÉQUIPES)
 **********************/
// Charge le dossier favorites s’il existe
async function loadFavorites() {
  const favPath = `full/favorites`;
  const files = await githubList(favPath);
  const images = files.filter(f => f.type === 'file' && isImage(f.name));
  // tri décroissant sur le nom (souvent IMG_0001 → IMG_9999)
  images.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
  const cards = images.map(img => {
    const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${favPath}/${img.name}`;
    return makeCard({ club: null, team: null, filename: img.name, rawUrl: raw, badge: "⭐" });
  });
  return cards;
}

// Charge un dossier d’équipe
async function loadTeam(clubLabel, teamLabel) {
  const clubPath = slugifyPath(clubLabel);
  const teamPath = slugifyPath(teamLabel);
  const folder   = `full/${clubPath}/${teamPath}`;

  const files  = await githubList(folder);
  const images = files.filter(f => f.type === 'file' && isImage(f.name));
  images.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));

  return images.map(img => {
    const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${folder}/${img.name}`;
    return makeCard({ club: clubLabel, team: teamLabel, filename: img.name, rawUrl: raw });
  });
}

/**********************
 *  ÉTATS & AFFICHAGE
 **********************/
function clearGallery() {
  galleryEl.innerHTML = "";
}

function showEmptyMessage() {
  galleryEl.innerHTML = `
    <div style="grid-column:1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
      Aucune image détectée.<br>
      Place des photos dans
      <code>full/favorites</code>
      OU
      <code>full/&lt;Club&gt;/&lt;Équipe&gt;/ (Match – AAAA-MM-JJ)</code>
      puis recharge (Ctrl+F5).
    </div>`;
}

async function showDefault() {
  clearGallery();
  // 1) favorites d’abord
  const favCards = await loadFavorites();
  if (favCards.length) favCards.forEach(c => galleryEl.appendChild(c));

  // Si aucun favoris, tu peux décider d’afficher un club/équipe par défaut.
  if (!favCards.length) showEmptyMessage();
}

/**********************
 *  FILTRES
 **********************/
async function applyFilters() {
  const club = clubSelect ? clubSelect.value : 'all';
  const team = teamSelect ? teamSelect.value : 'all';

  clearGallery();

  // Aucun filtre => on affiche les favoris
  if (club === 'all' && team === 'all') {
    await showDefault();
    return;
  }

  // Si club choisi mais équipe = all -> on charge toutes les équipes de ce club
  if (club !== 'all' && team === 'all') {
    const teams = STRUCTURE[club] || [];
    let total = 0;
    for (const t of teams) {
      const cards = await loadTeam(club, t);
      cards.forEach(c => galleryEl.appendChild(c));
      total += cards.length;
    }
    if (total === 0) showEmptyMessage();
    return;
  }

  // Si club + équipe choisis
  if (club !== 'all' && team !== 'all') {
    const cards = await loadTeam(club, team);
    if (cards.length === 0) {
      showEmptyMessage();
    } else {
      cards.forEach(c => galleryEl.appendChild(c));
    }
    return;
  }

  // Cas: équipe != all mais club = all -> on cherche l’équipe dans tous les clubs
  if (club === 'all' && team !== 'all') {
    let total = 0;
    for (const c of Object.keys(STRUCTURE)) {
      if ((STRUCTURE[c] || []).includes(team)) {
        const cards = await loadTeam(c, team);
        cards.forEach(card => galleryEl.appendChild(card));
        total += cards.length;
      }
    }
    if (total === 0) showEmptyMessage();
  }
}

/**********************
 *  INIT
 **********************/
async function init() {
  // par défaut : favoris
  await showDefault();

  // Écouteurs des filtres
  if (clubSelect) clubSelect.addEventListener('change', applyFilters);
  if (teamSelect) teamSelect.addEventListener('change', applyFilters);
}

init();

// Année footer (si id="year" est présent quelque part)
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
