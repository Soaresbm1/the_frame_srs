// --- Accordéon ---
const acc = document.querySelector('.accordion');
const panel = document.querySelector('.panel');

acc.addEventListener('click', () => {
  acc.classList.toggle('active');
  panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
});

// --- Filtres Club / Équipe ---
const clubSelect = document.getElementById('club-select');
const teamSelect = document.getElementById('team-select');
const photos = document.querySelectorAll('.photo');

function filterGallery() {
  const club = clubSelect.value;
  const team = teamSelect.value;

  photos.forEach(photo => {
    const matchesClub = club === 'all' || photo.dataset.club === club;
    const matchesTeam = team === 'all' || photo.dataset.team === team;
    photo.style.display = (matchesClub && matchesTeam) ? 'block' : 'none';
  });
}

clubSelect.addEventListener('change', filterGallery);
teamSelect.addEventListener('change', filterGallery);

// --- Année automatique dans le footer ---
document.getElementById('year').textContent = new Date().getFullYear();


fetch("data.json")
  .then(response => response.json())
  .then(data => {
    const gallery = document.getElementById("gallery");

    Object.keys(data).forEach(club => {
      Object.keys(data[club]).forEach(team => {
        const photos = data[club][team];

        photos.forEach(filename => {
          const figure = document.createElement("figure");
          figure.classList.add("card", "photo");
          figure.dataset.club = club;
          figure.dataset.team = team;

          figure.innerHTML = `
            <img src="thumbs/${club.replaceAll(' ', '_')}/${team.replaceAll(' ', '_')}/${filename}"
                 alt="${club} ${team}" loading="lazy">
            <figcaption>
              <div>
                <strong>${club} – ${team}</strong>
              </div>
              <a class="btn btn--sm" href="full/${club.replaceAll(' ', '_')}/${team.replaceAll(' ', '_')}/${filename}" download>
                Télécharger
              </a>
            </figcaption>
          `;
          gallery.appendChild(figure);
        });
      });
    });
  })
  .catch(error => console.error("Erreur de chargement des données :", error));
