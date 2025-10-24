/*************** CONFIG ***************/
const GH_OWNER = "Soaresbm1";          // <-- ton pseudo GitHub
const GH_REPO  = "the_frame_srs";      // <-- nom du dépôt
const GH_BRANCH = "main";               // "main" ou "gh-pages" si tu utilises une autre branche

// clubs/équipes (seulement la liste ; pas les fichiers)
const STRUCTURE = {
  "FC Le Parc": ["Inter A", "Juniors B", "2ème Futsal"],
  "FC La Chaux-de-Fonds": ["Inter A", "Juniors B"]
};
/*************************************/

const acc = document.querySelector('.accordion');
const panel = document.querySelector('.panel');
if (acc && panel) {
  acc.addEventListener('click', () => {
    acc.classList.toggle('active');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
}

const clubSelect = document.getElementById('club-select');
const teamSelect = document.getElementById('team-select');
const galleryEl  = document.getElementById('gallery');

function slugifyPath(text){
  // On garde ta convention de dossiers déjà existants
  return text
    .replaceAll(" ", "_")
    .replaceAll("é","e")
    .replaceAll("è","e")
    .replaceAll("ê","e")
    .replaceAll("à","a")
    .replaceAll("ç","c");
}

function fileIsImage(name){
  return /\.(jpe?g|png|webp)$/i.test(name);
}

// Appelle l'API GitHub pour lister les fichiers d’un dossier
async function listGithubFiles(path){
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.filter(f => f && f.name && fileIsImage(f.name)) : [];
}

// Construit une carte photo
function makeCard({club, team, filename}){
  const clubPath = slugifyPath(club);
  const teamPath = slugifyPath(team);
  const thumbSrc = `thumbs/${clubPath}/${teamPath}/${filename}`;
  const fullHref = `full/${clubPath}/${teamPath}/${filename}`;

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

// Charge toutes les photos automatiquement
async function loadGallery(){
  galleryEl.innerHTML = ""; // reset

  for (const club of Object.keys(STRUCTURE)){
    for (const team of STRUCTURE[club]){
      const clubPath = slugifyPath(club);
      const teamPath = slugifyPath(team);
      const path = `thumbs/${clubPath}/${teamPath}`;

      try{
        const files = await listGithubFiles(path);
        files.forEach(f => {
          const card = makeCard({club, team, filename: f.name});
          galleryEl.appendChild(card);
        });
      }catch(e){
        console.error("Erreur chargement dossier:", path, e);
      }
    }
  }

  // Active les filtres une fois la galerie construite
  setupFilters();
}

function setupFilters(){
  const photos = document.querySelectorAll('.photo');

  function filterGallery(){
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
  filterGallery(); // premier passage
}

// Année footer
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Lance le chargement auto
if (galleryEl) loadGallery();
