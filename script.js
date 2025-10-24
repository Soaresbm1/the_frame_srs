/*************** CONFIG ***************/
const GH_OWNER = "Soaresbm1";          // <-- ton pseudo GitHub
const GH_REPO  = "the_frame_srs";      // <-- nom du dépôt
const GH_BRANCH = "main";              // <-- branche principale

// Clubs et équipes
const STRUCTURE = {
  "FC Le Parc": ["Inter A", "Juniors B", "2ème Futsal"],
  "FC La Chaux-de-Fonds": ["Inter A", "Juniors B"]
};
/*************************************/

// --- Accordéon ---
const acc = document.querySelector('.accordion');
const panel = document.querySelector('.panel');
if (acc && panel) {
  acc.addEventListener('click', () => {
    acc.classList.toggle('active');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
}

// --- Filtres & galerie ---
const clubSelect = document.getElementById('club-select');
const teamSelect = document.getElementById('team-select');
const galleryEl  = document.getElementById('gallery');

// Fonction pour transformer les noms (sans accents/espaces)
function slugifyPath(text) {
  return text
    .replaceAll(" ", "_")
    .replaceAll("é","e")
    .replaceAll("è","e")
    .replaceAll("ê","e")
    .replaceAll("à","a")
    .replaceAll("ç","c");
}

// Vérifie si le fichier est une image valide
function fileIsImage(name) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

// Liste les fichiers depuis GitHub via API
async function listGithubFiles(path) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.filter(f => f && f.name && fileIsImage(f.name)) : [];
}

// Crée une carte (photo + légende)
function makeCard({club, team, filename}) {
  const clubPath = slugifyPath(club);
  const teamPath = slugifyPath(team);

  // On affiche directement les images du dossier full/
  const fullHref = `full/${clubPath}/${teamPath}/${filename}`;
  const thumbSrc = fullHref; // pas besoin de thumbs séparé

  const fig = document.createElement('figure');
  fig.className = 'card photo';
  fig.dataset.club = club;
  fig.dataset.team = team;

  fig.innerHTML = `
    <img src="${thumbSrc}" alt="${club} ${team}" loading="lazy" />
    <figcaption>
      <div><strong>${club} — ${team}</strong></div>
      <a class="btn btn--sm" href="${fullHref}" download>Télécharger</a>
    </figcaption>
  `;
  return fig;
}

// Charge automatiquement toutes les photos
async function loadGallery() {
  galleryEl.innerHTML = "";
  for (const club of Object.keys(STRUCTURE)) {
    for (const team of STRUCTURE[club]) {
      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const path = `full/${clubPath}/${teamPath}`; // <== on lit directement dans "full"
      try {
        const files = await listGithubFiles(path);
        files.forEach(f => {
          const card = makeCard({club, team, filename: f.name});
          galleryEl.appendChild(card);
        });
      } catch (e) {
        console.error("Erreur chargement dossier:", path, e);
      }
    }
  }
  setupFilters();
}

// Filtrage par club et équipe
function setupFilters() {
  const photos = document.querySelectorAll('.photo');
  function filterGallery() {
    const club = clubSelect ? clubSelect.value : 'all';
    const team = teamSelect ? teamSelect.value : 'all';
    photos.forEach(p => {
      const okClub = club === 'all' || p.dataset.club === club;
      const okTeam = team === 'all' || p.dataset.team === team;
      p.style.display = (okClub && okTeam) ? 'block' : 'none';
    });
  }
  if (clubSelect) clubSelect.addEventListener('change', filterGallery);
  if (teamSelect) teamSelect.addEventListener('change', filterGallery);
  filterGallery();
}

// --- Année automatique ---
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// --- Lancement ---
if (galleryEl) loadGallery();
