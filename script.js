(function () {
    const grid = document.getElementById('grid');
    const search = document.getElementById('search');
    const chips = document.querySelectorAll('.chip');
    const clubSelect = document.getElementById('clubSelect');
    const teamSelect = document.getElementById('teamSelect');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxDownload = document.getElementById('lightboxDownload');
  
    const cards = Array.from(grid.querySelectorAll('.photo'));
    const clubMap = new Map();
    cards.forEach(card => {
      const club = (card.dataset.club || 'Sans club').trim();
      const team = (card.dataset.team || 'Sans équipe').trim();
      if (!clubMap.has(club)) clubMap.set(club, new Set());
      clubMap.get(club).add(team);
    });
  
    for (const club of Array.from(clubMap.keys()).sort((a,b)=>a.localeCompare(b))) {
      const opt = document.createElement('option');
      opt.value = club;
      opt.textContent = club;
      clubSelect.appendChild(opt);
    }
  
    function fillTeams() {
      const club = clubSelect.value;
      teamSelect.innerHTML = '<option value="*">Toutes les équipes</option>';
      teamSelect.disabled = (club === '*');
      if (club === '*') return;
      const teams = Array.from(clubMap.get(club) || []).sort((a,b)=>a.localeCompare(b));
      for (const t of teams) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        teamSelect.appendChild(opt);
      }
    }
    fillTeams();
  
    clubSelect.addEventListener('change', () => {
      fillTeams();
      applyFilters();
    });
    teamSelect.addEventListener('change', applyFilters);
  
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        applyFilters();
      });
    });
  
    search?.addEventListener('input', applyFilters);
  
    function applyFilters() {
      const activeChip = document.querySelector('.chip.is-active');
      const sport = activeChip?.dataset.filter ?? '*';
      const q = (search?.value || '').toLowerCase().trim();
      const club = clubSelect?.value || '*';
      const team = teamSelect?.value || '*';
  
      cards.forEach(card => {
        const tags = (card.dataset.tags || '').toLowerCase();
        const cardSport = card.dataset.sport || '';
        const cardClub = card.dataset.club || '';
        const cardTeam = card.dataset.team || '';
        const matchSport = sport === '*' || cardSport === sport;
        const matchQuery = !q || tags.includes(q);
        const matchClub = club === '*' || cardClub === club;
        const matchTeam = team === '*' || cardTeam === team;
        card.style.display = (matchSport && matchQuery && matchClub && matchTeam) ? '' : 'none';
      });
    }
  
    grid?.addEventListener('click', (e) => {
      const img = e.target.closest('.photo img');
      if (!img) return;
      const card = img.closest('.photo');
      const link = card.querySelector('a[download]');
      const href = link?.getAttribute('href');
      lightboxImg.src = href || img.src;
      lightboxImg.alt = img.alt || '';
      lightboxDownload.href = href || '#';
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
    });
  
    lightbox?.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close') || e.target === lightbox) lightbox.close();
    });
  
  })();
  