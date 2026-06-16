// D&L Stage 2 prompt re-sync: mechanical diff of HTML (source of truth) vs ported TS.
// Run from project root:  node draft-and-lens/resync-check.cjs
//
// Covers the static-text IP: 4 mode systems, 3 report structures, the diagnostician
// and structural-reader systems, and all 27 lens prompts. Interpolated builder
// prompts (scorer/market/bible/narrator/conversation/fragments) are verified by hand.
const fs = require('fs');
const html = fs.readFileSync('DraftAndLens.html', 'utf8');
const root = 'draft-and-lens/src/prompts/';

// --- extractors -----------------------------------------------------------
// Backtick template literal assigned to `const NAME = ` in the HTML.
function htmlTemplate(name) {
  const m = html.indexOf('const ' + name + ' = `');
  if (m < 0) return null;
  let i = m + ('const ' + name + ' = `').length, out = '';
  while (i < html.length) {
    const c = html[i];
    if (c === '\\') { out += html[i] + html[i + 1]; i += 2; continue; }
    if (c === '`') break;
    out += c; i++;
  }
  return out;
}
// Double-quoted JS string `export const NAME = "..."`, escapes decoded.
function tsString(file, name) {
  const src = fs.readFileSync(root + file, 'utf8');
  const m = src.match(new RegExp('export const ' + name + '\\s*=\\s*"'));
  if (!m) return null;
  let j = m.index + m[0].length, out = '';
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { out += src[j] + src[j + 1]; j += 2; continue; }
    if (c === '"') break;
    out += c; j++;
  }
  try { return JSON.parse('"' + out + '"'); } catch (e) { return '__DECODE_ERROR__:' + e.message; }
}
// HTML object literal of `'key': `template`` entries → { key: value }.
function htmlObject(objName) {
  const s = html.indexOf('const ' + objName + ' = {');
  if (s < 0) return null;
  let i = html.indexOf('{', s) + 1;
  const map = {};
  while (i < html.length) {
    while (i < html.length && /[\s,]/.test(html[i])) i++;
    if (html[i] === '}') break;
    const q = html[i];
    if (q !== "'" && q !== '"') break;
    i++; let key = '';
    while (i < html.length && html[i] !== q) { key += html[i]; i++; }
    i++;
    while (i < html.length && /[\s:]/.test(html[i])) i++;
    if (html[i] !== '`') break; // value not a template literal
    i++; let val = '';
    while (i < html.length) {
      const c = html[i];
      if (c === '\\') { val += html[i] + html[i + 1]; i += 2; continue; }
      if (c === '`') break;
      val += c; i++;
    }
    i++;
    map[key] = val;
  }
  return map;
}
// TS object literal of `"key": "value"` entries → { key: value } (decoded).
function tsObject(file, objName) {
  const src = fs.readFileSync(root + file, 'utf8');
  const s = src.indexOf(objName);
  if (s < 0) return null;
  let i = src.indexOf('{', src.indexOf('=', s)) + 1;
  const map = {};
  while (i < src.length) {
    while (i < src.length && /[\s,]/.test(src[i])) i++;
    if (src[i] === '}') break;
    const q = src[i];
    if (q !== '"' && q !== "'") break;
    i++; let key = '';
    while (i < src.length && src[i] !== q) { key += src[i]; i++; }
    i++;
    while (i < src.length && /[\s:]/.test(src[i])) i++;
    const vq = src[i];
    if (vq !== '"' && vq !== "'") break;
    i++; let val = '';
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { val += src[i] + src[i + 1]; i += 2; continue; }
      if (c === vq) break;
      val += c; i++;
    }
    i++;
    // `val` was captured with its backslash-escapes intact, so it is already a
    // valid JSON string body — do NOT re-escape quotes (that double-escaped the
    // \" sequences in coens/carver/bukowski/etc and broke the parse).
    try { map[key] = JSON.parse('"' + val + '"'); }
    catch (e) { map[key] = '__DECODE_ERROR__:' + e.message; }
  }
  return map;
}

// --- compare helpers ------------------------------------------------------
function norm(s) {
  return s == null ? null
    : s.replace(/\r\n/g, '\n').replace(/^\n/, '').replace(/[ \t]+\n/g, '\n').replace(/\s+$/, '');
}
function firstDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n'), n = Math.max(A.length, B.length);
  for (let k = 0; k < n; k++) {
    if (A[k] !== B[k]) {
      return `    L${k + 1}\n     HTML: ${JSON.stringify((A[k] || '').slice(0, 180))}\n     TS:   ${JSON.stringify((B[k] || '').slice(0, 180))}`;
    }
  }
  return null;
}

let drift = 0;

console.log('=== singleton constants ===');
const pairs = [
  ['SCRIPT_SYSTEM', 'modes/script.ts', 'SCRIPT_SYSTEM'],
  ['STORY_SYSTEM', 'modes/story.ts', 'STORY_SYSTEM'],
  ['PLAY_SYSTEM', 'modes/play.ts', 'PLAY_SYSTEM'],
  ['TREATMENT_SYSTEM', 'modes/treatment.ts', 'TREATMENT_SYSTEM'],
  ['SCRIPT_REPORT_STRUCTURE', 'report/script-structure.ts', 'SCRIPT_REPORT_STRUCTURE'],
  ['STORY_REPORT_STRUCTURE', 'report/story-structure.ts', 'STORY_REPORT_STRUCTURE'],
  ['TREATMENT_REPORT_STRUCTURE', 'report/treatment-structure.ts', 'TREATMENT_REPORT_STRUCTURE'],
  ['PASS1_SYSTEM', 'diagnostic.ts', 'PASS1_SYSTEM'],
  ['STRUCTURAL_READER_SYSTEM', 'structural-reader.ts', 'STRUCTURAL_READER_SYSTEM'],
];
for (const [hn, tf, tn] of pairs) {
  const h = norm(htmlTemplate(hn)), t = norm(tsString(tf, tn));
  let s;
  if (h == null) s = 'HTML-NOT-FOUND';
  else if (t == null) s = 'TS-NOT-FOUND';
  else if (h === t) s = `MATCH (${h.length})`;
  else { s = 'DRIFT\n' + (firstDiff(h, t) || '  (whitespace/length only)') + `  [HTML ${h.length}/TS ${t.length}]`; drift++; }
  console.log(`  ${hn} -> ${tf}: ${s}`);
}

console.log('\n=== 27 lens prompts (LENS_PROMPTS -> LENS_SYSTEM_PROMPTS) ===');
const hl = htmlObject('LENS_PROMPTS') || {};
const tl = tsObject('lenses/prompts.ts', 'LENS_SYSTEM_PROMPTS') || {};
const ids = new Set([...Object.keys(hl), ...Object.keys(tl)]);
let lensMatch = 0;
for (const id of ids) {
  let hv = hl[id];
  if (hv != null) {                                        // ${traditionContext} is appended at
    const k = hv.indexOf('${traditionContext}');           // runtime (Arch §17), not stored IP —
    if (k !== -1) hv = hv.slice(0, k).replace(/\\+$/, ''); // strip it + any stray trailing backslash
  }
  const h = norm(hv), t = norm(tl[id]);
  if (h == null) { console.log(`  ${id}: MISSING in HTML (extra in TS)`); drift++; }
  else if (t == null) { console.log(`  ${id}: MISSING in TS port`); drift++; }
  else if (h === t) lensMatch++;
  else { console.log(`  ${id}: DRIFT\n` + (firstDiff(h, t) || '  (whitespace/length only)') + `  [HTML ${h.length}/TS ${t.length}]`); drift++; }
}
console.log(`  lenses matching: ${lensMatch}/${ids.size}`);

console.log(`\n=== TOTAL DRIFTS: ${drift} ===`);
console.log('NOT covered here (verify by hand): scorer, market, bible, narrator verify/correct,');
console.log('conversation editorial+lens, genre-note objects, fragments (partial-read/anchor/known-work), craftPhilosophy.');
