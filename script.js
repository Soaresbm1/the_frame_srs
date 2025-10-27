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
const clubSelect   = document.getElementById('club-select');
const teamSelect   = document.getElementById('team-select');
const galleryEl    = document.getElementById('gallery');
const statsEl      = document.getElementById('gallery-stats');
const refreshBtn   = document.getElementById('refresh-cache');
const themeBtn     = document.getElementById('theme-toggle');

/**********************
 *  THEME (persisté)
 **********************/
const THEME_KEY = 'tfs_theme';
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === 'dark') document.body.classList.add('dark');
if (themeBtn) {
  themeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
    themeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });
}

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
 *  CACHE INTELLIGENT
 **********************/
const CACHE_KEY = 'tfs_gallery_cache_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.savedAt || !parsed.items) return null;
    const age = Date.now() - parsed.savedAt;
    if (age > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(items) {
  const payload = { savedAt: Date.now(), items };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

/**********************
 *  UI BUILDERS
 **********************/
function makeCard({ club, team, rawUrl }) {
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
 *  CHARGEMENT (avec cache)
 **********************/
async function fetchAllPhotos() {
  const items = [];
  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {
      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const folder = `full/${clubPath}/${teamPath}`;
      const files = await githubList(folder);
      const images = files.filter(f => f.type === 'file' && isImage(f.name));
      images.forEach(img => {
        const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${folder}/${img.name}`;
        items.push({ club, team, url: raw });
      });
    }
  }
  return items;
}

async function loadGallery() {
  galleryEl.innerHTML = "";

  // 1) essaie le cache
  let cache = readCache();
  let items;
  if (cache) {
    items = cache.items;
    updateStats(items.length, cache.savedAt, true);
  } else {
    // 2) sinon fetch puis écris le cache
    items = await fetchAllPhotos();
    writeCache(items);
    updateStats(items.length, Date.now(), false);
  }

  // 3) build DOM
  items.forEach(item => {
    const card = makeCard({ club: item.club, team: item.team, rawUrl: item.url });
    galleryEl.appendChild(card);
  });

  setupFilters();
}

/**********************
 *  STATS
 **********************/
function fmtDate(ts){
  const d = new Date(ts);
  return d.toLocaleString('fr-CH', { dateStyle:'medium', timeStyle:'short' });
}

function updateStats(count, savedAt, fromCache){
  if (!statsEl) return;
  const badge = fromCache ? 'cache' : 'réseau';
  statsEl.textContent = `Photos: ${count} • Source: ${badge} • Dernière mise à jour: ${fmtDate(savedAt)}`;
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    localStorage.removeItem(CACHE_KEY);
    statsEl.textContent = 'Actualisation…';
    await loadGallery();
  });
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

// Année footer si présent
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
