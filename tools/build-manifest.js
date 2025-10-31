// tools/build-manifest.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'full');
const OUT  = path.join(process.cwd(), 'manifest.json');
const IMG_RE = /\.(jpe?g|png|webp)$/i;
const FAV_RE = /(^FAV_|[-_\.]fav\.)/i;

function list(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return []; }
}

function isImg(name) { return IMG_RE.test(name); }

function slugify(s) {
  return s.trim()
    .replaceAll(' ', '_').replaceAll('-', '_')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ç', 'c');
}

function rawUrl(relPath) {
  return `https://raw.githubusercontent.com/Soaresbm1/the_frame_srs/main/${encodeURI(relPath)}`;
}

function build() {
  const manifest = {
    updated: new Date().toISOString(),
    counts: { totalPhotos: 0, byClub: {} },
    favorites: [],
    clubs: {}
  };

  if (!fs.existsSync(ROOT)) {
    fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
    return manifest;
  }

  const clubs = list(ROOT).filter(d => d.isDirectory());
  for (const clubDirent of clubs) {
    const clubFolder = clubDirent.name;
    const isFav = clubFolder.toLowerCase() === 'favorites';
    const clubPath = path.join(ROOT, clubFolder);

    if (isFav) {
      const stack = [clubPath];
      while (stack.length) {
        const cur = stack.pop();
        for (const d of list(cur)) {
          const p = path.join(cur, d.name);
          if (d.isDirectory()) { stack.push(p); continue; }
          if (!isImg(d.name)) continue;
          const rel = p.replace(process.cwd() + path.sep, '').replaceAll(path.sep, '/');
          manifest.favorites.push({ club: '—', team: '—', match: 'Favoris', filename: d.name, url: rawUrl(rel) });
          manifest.counts.totalPhotos++;
        }
      }
      continue;
    }

    const clubName = clubFolder.replaceAll('_', ' ');
    manifest.clubs[clubName] = manifest.clubs[clubName] || {};
    manifest.counts.byClub[clubName] = manifest.counts.byClub[clubName] || 0;

    const teams = list(clubPath).filter(d => d.isDirectory());
    for (const t of teams) {
      const teamName = t.name.replaceAll('_', ' ');
      manifest.clubs[clubName][teamName] = { matches: {} };

      const matches = list(path.join(clubPath, t.name)).filter(d => d.isDirectory());
      for (const m of matches) {
        const matchName = m.name;
        const files = list(path.join(clubPath, t.name, m.name))
          .filter(f => f.isFile() && isImg(f.name))
          .map(f => f.name)
          .sort((a, b) => a.localeCompare(b, 'fr'));

        manifest.clubs[clubName][teamName].matches[matchName] = files;
        manifest.counts.totalPhotos += files.length;
        manifest.counts.byClub[clubName] += files.length;

        files.forEach(file => {
          if (FAV_RE.test(file)) {
            const rel = `full/${slugify(clubName)}/${slugify(teamName)}/${matchName}/${file}`;
            manifest.favorites.push({
              club: clubName, team: teamName, match: matchName, filename: file, url: rawUrl(rel)
            });
          }
        });
      }
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
  return manifest;
}

const m = build();
console.log('✅ manifest.json généré avec', m.counts.totalPhotos, 'photos et', m.favorites.length, 'favoris.');
