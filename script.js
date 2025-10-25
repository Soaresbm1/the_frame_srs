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

function makeMatchBlock({ club, team, matchName }) {
  const block = document.createElement('section');
  block.className = 'match-block';
  block.dataset.club = club;
  block.dataset.team = team;
  block.dataset.match = matchName;

  const title = document.createElement('h3');
  title.className = 'match-title';
  // Affichage propre : vs_Neuchatel_Xamax -> vs Neuchatel Xamax
  title.textContent = matchName.replace(/^vs_/, 'vs ').replace(/_/g, ' ');

  const grid = document.createElement('div');
  grid.className = 'match-grid';

  block.appendChild(title);
  block.appendChild(grid);
  return { block, grid };
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
      const teamFolder = `full/${clubPath}/${teamPath}`;

      // 1) Liste le contenu du dossier d'équipe
      const entries = await githubList(teamFolder);

      // 2) Détecte les dossiers de match "vs_xxx"
      const matchDirs = entries.filter(e => e && e.type === 'dir' && /^vs_/.test(e.name));

      if (matchDirs.length > 0) {
        // — Cas NOUVEAU : sous-dossiers par match —
        for (const m of matchDirs) {
          const matchName = m.name; // ex: vs_Neuchatel_Xamax
          const { block, grid } = makeMatchBlock({ club, team, matchName });

          // Récupère les fichiers du match
          const files = await githubList(`${teamFolder}/${matchName}`);
          const images = files.filter(f => f.type === 'file' && isImage(f.name));

          images.forEach(img => {
            const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${teamFolder}/${matchName}/${img.name}`;
            grid.appendChild(makeCard({ club, team, filename: img.name, rawUrl: raw }));
            total++;
          });

          // Ajoute le bloc à la galerie seulement s'il y a au moins 1 photo
          if (images.length > 0) {
            galleryEl.appendChild(block);
          }
        }
      } else {
        // — Cas ANCIEN : images directement dans le dossier d'équipe (rétro-compatibilité) —
        const files = entries.filter(e => e.type === 'file' && isImage(e.name));
        if (files.length > 0) {
          // On fait un bloc "match" générique pour garder un aspect cohérent
          const { block, grid } = makeMatchBlock({ club, team, matchName: "vs_Inconnu" });
          files.forEach(f => {
            const raw = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${teamFolder}/${f.name}`;
            grid.appendChild(makeCard({ club, team, filename: f.name, rawUrl: raw }));
            total++;
          });
          galleryEl.appendChild(block);
        }
      }
    }
  }

  if (total === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column:1/-1; padding:1rem; border:1px dashed #c0b28a; border-radius:8px; background:#fff;">
        Aucune image détectée.<br>
        Vérifie que tes photos sont bien <strong>commitées/pushées sur GitHub</strong>
        dans <code>full/&lt;Club&gt;/&lt;Équipe&gt;/vs_Adversaire</code> (ex: <code>full/FC_La_Chaux_de_Fonds/Inter_A/vs_Neuchatel_Xamax</code>).<br>
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
  filterGallery(); // premier passage
}

function filterGallery() {
  const club = clubSelect ? clubSelect.value : 'all';
  const team = teamSelect ? teamSelect.value : 'all';

  // Affiche/masque chaque PHOTO
  document.querySelectorAll('.photo').forEach(photo => {
    const okClub = (club === 'all' || photo.dataset.club === club);
    const okTeam = (team === 'all' || photo.dataset.team === team);
    photo.style.display = (okClub && okTeam) ? 'block' : 'none';
  });

  // Affiche/masque les BLOCS de match si toutes leurs photos sont masquées
  document.querySelectorAll('.match-block').forEach(block => {
    const okClub = (club === 'all' || block.dataset.club === club);
    const okTeam = (team === 'all' || block.dataset.team === team);
    if (!okClub || !okTeam) {
      block.style.display = 'none';
      return;
    }
    const anyVisible = block.querySelector('.photo[style*="display: block"]');
    block.style.display = anyVisible ? 'block' : 'none';
  });
}

/**********************
 *  LANCEMENT
 **********************/
loadGallery();

// Année footer
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
