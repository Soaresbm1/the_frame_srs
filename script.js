// === CONFIG GITHUB ===
const GH_OWNER = "Soaresbm1"; // ton pseudo GitHub
const GH_REPO = "the_frame_srs"; // nom de ton dépôt
const GH_BRANCH = "main"; // branche

// === ACCORDÉON ===
const acc = document.querySelector('.accordion');
const panel = document.querySelector('.panel');
if (acc && panel) {
  acc.addEventListener('click', () => {
    acc.classList.toggle('active');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
}

// === STRUCTURE CLUBS / ÉQUIPES ===
const STRUCTURE = {
  "FC Le Parc": ["Inter A", "Juniors B", "2ème Futsal"],
  "FC La Chaux-de-Fonds": ["Inter A", "Juniors B"]
};

// === SÉLECTEURS ===
const clubSelect = document.getElementById('club-select');
const teamSelect = document.getElementById('team-select');
const galleryEl = document.getElementById('gallery');

// === FONCTIONS UTILES ===
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

function fileIsImage(name) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

// === LIRE LES FICHIERS DU DÉPÔT GITHUB ===
async function listGithubFiles(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  console.log("➡️ API call:", url);
  const res = await fetch(url);
  console.log("   ↳ status:", res.status, res.statusText);

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const files = Array.isArray(data)
    ? data.filter(f => f && f.name && fileIsImage(f.name))
    : [];
  console.log(`   ↳ ${files.length} image(s) trouvée(s) dans`, path);
  return files;
}

// === CRÉER UNE CARTE PHOTO ===
function makeCard({ club, team, filename }) {
  const figure = document.createElement('figure');
  figure.className = 'card photo';
  figure.dataset.club = club;
  figure.dataset.team = team;
  figure.innerHTML = `
    <img src="https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/full/${slugifyPath(club)}/${slugifyPath(team)}/${filename}"
         alt="${club} ${team}" loading="lazy">
    <figcaption>
      <div><strong>${club} – ${team}</strong></div>
      <a class="btn btn--sm"
         href="https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/full/${slugifyPath(club)}/${slugifyPath(team)}/${filename}"
         download>Télécharger</a>
    </figcaption>
  `;
  return figure;
}

// === FILTRAGE ===
function filterGallery() {
  const club = clubSelect.value;
  const team = teamSelect.value;

  document.querySelectorAll('.photo').forEach(photo => {
    const matchesClub = club === 'all' || photo.dataset.club === club;
    const matchesTeam = team === 'all' || photo.dataset.team === team;
    photo.style.display = (matchesClub && matchesTeam) ? 'block' : 'none';
  });
}

function setupFilters() {
  clubSelect.addEventListener('change', filterGallery);
  teamSelect.addEventListener('change', filterGallery);
}

// === CHARGEMENT PRINCIPAL ===
async function loadGallery() {
  galleryEl.innerHTML = "";
  let total = 0;

  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {
      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const path = `full/${clubPath}/${teamPath}`;

      console.log("📂 Scan dossier:", path);

      try {
        const files = await listGithubFiles(path);
        files.forEach(f => {
          const card = makeCard({ club, team, filename: f.name });
          galleryEl.appendChild(card);
        });
        total += files.length;
      } catch (e) {
        console.error("❌ Erreur chargement dossier:", path, e);
      }
    }
  }

  if (total === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column: 1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
        Aucune image détectée.<br>
        Vérifie que tes photos sont bien <strong>commitées/pushées sur GitHub</strong> dans
        <code>full/FC_La_Chaux_de_Fonds/Inter_A</code> ou les autres dossiers.<br>
        Puis recharge la page (Ctrl+F5).
      </div>`;
  }

  setupFilters();
}

// === LANCEMENT ===
loadGallery();

// === ANNÉE DANS LE FOOTER ===
document.getElementById('year').textContent = new Date().getFullYear();
