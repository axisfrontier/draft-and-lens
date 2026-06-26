/**
 * Extracts base64-encoded lens portrait images from DraftAndLens.html
 * and saves them as JPEG files in public/lenses/.
 *
 * Run from the project root: node scripts/extract-lens-images.cjs
 */

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '../../DraftAndLens.html');
const OUT_DIR = path.join(__dirname, '../public/lenses');

// Map from HTML alt text → lens ID (filename without .jpg)
const ALT_TO_ID = {
  'Spielberg': 'spielberg',
  'Coppola': 'coppola',
  'Coen Brothers': 'coens',
  'Villeneuve': 'villeneuve',
  'Ridley Scott': 'scott',
  'Orson Welles': 'welles',
  'Jeunet': 'jeunet',
  'Wim Wenders': 'wenders',
  'Tarantino': 'tarantino',
  'Wachowskis': 'wachowski',
  'Lucas': 'lucas',
  'Miyazaki': 'miyazaki',
  'Hemingway': 'hemingway',
  'Carver': 'carver',
  'Chekhov': 'chekhov',
  "O'Connor": 'oconnor',
  'Bukowski': 'bukowski',
  'Nabokov': 'nabokov',
  'Sorkin': 'sorkin',
  'Eric Roth': 'roth',
  'Roth': 'roth',
  'Bruckheimer': 'bruckheimer',
  'Feige': 'feige',
  'Mario Puzo': 'puzo',
  'Puzo': 'puzo',
  'Stephen King': 'king',
  'King': 'king',
  'Tina Fey': 'fey',
  'Fey': 'fey',
  'Atwood': 'atwood',
  'Simon': 'simon',
  'Kaufman': 'kaufman',
  'Wilder': 'wilder',
  'Pinter': 'pinter',
};

if (!fs.existsSync(HTML_PATH)) {
  console.error('DraftAndLens.html not found at:', HTML_PATH);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const html = fs.readFileSync(HTML_PATH, 'utf8');

// Match: src="data:image/jpeg;base64,B64" ... alt="ALT" class="lens-thumb"
// OR the reverse attribute order
const re = /src="data:image\/jpeg;base64,([A-Za-z0-9+\/=\s]+)"[^>]*alt="([^"]+)"[^>]*class="lens-thumb"|class="lens-thumb"[^>]*src="data:image\/jpeg;base64,([A-Za-z0-9+\/=\s]+)"[^>]*alt="([^"]+)"/g;

let m;
let count = 0;
const seen = new Set();

while ((m = re.exec(html)) !== null) {
  const b64 = (m[1] || m[3]).replace(/\s/g, '');
  const altText = (m[2] || m[4]);
  const lensId = ALT_TO_ID[altText];

  if (!lensId) {
    console.log('No mapping for alt text:', altText);
    continue;
  }
  if (seen.has(lensId)) continue;
  seen.add(lensId);

  const outPath = path.join(OUT_DIR, lensId + '.jpg');
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log('saved:', lensId + '.jpg', '(', altText, ')');
  count++;
}

// Also try: alt="NAME" ... src="data:image/jpeg;base64,B64" (inside the pill div)
const re2 = /alt="([^"]+)"[^>]*class="lens-thumb"[^>]*src="data:image\/jpeg;base64,([A-Za-z0-9+\/=\s]+)"/g;
while ((m = re2.exec(html)) !== null) {
  const altText = m[1];
  const b64 = m[2].replace(/\s/g, '');
  const lensId = ALT_TO_ID[altText];
  if (!lensId || seen.has(lensId)) continue;
  seen.add(lensId);
  const outPath = path.join(OUT_DIR, lensId + '.jpg');
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log('saved (re2):', lensId + '.jpg', '(', altText, ')');
  count++;
}

console.log('\nDone. Total images saved:', count);
console.log('Lens IDs found:', [...seen].sort().join(', '));
