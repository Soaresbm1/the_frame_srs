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
