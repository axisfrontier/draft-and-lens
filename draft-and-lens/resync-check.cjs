// D&L Stage 2 prompt re-sync: mechanical diff of HTML (source of truth) vs ported TS.
// Run from project root:  node draft-and-lens/resync-check.cjs
const fs = require('fs');
const html = fs.readFileSync('DraftAndLens.html', 'utf8');
const root = 'draft-and-lens/src/prompts/';

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
function norm(s) {
  return s == null ? null
    : s.replace(/\r\n/g, '\n').replace(/^\n/, '').replace(/[ \t]+\n/g, '\n').replace(/\s+$/, '');
}
function firstDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n'), n = Math.max(A.length, B.length);
  for (let k = 0; k < n; k++) {
    if (A[k] !== B[k]) {
      return `  first diff at line ${k + 1}:\n   HTML: ${JSON.stringify((A[k] || '').slice(0, 200))}\n   TS:   ${JSON.stringify((B[k] || '').slice(0, 200))}`;
    }
  }
  return null;
}
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
  else if (t == null) s = 'TS-NOT-FOUND (different name or not a plain double-quoted const)';
  else if (h === t) s = `MATCH (${h.length} chars)`;
  else s = 'DRIFT\n' + (firstDiff(h, t) || '  (whitespace/length only)') + `\n  [HTML ${h.length} / TS ${t.length} chars]`;
  console.log(`${hn} -> ${tf}: ${s}`);
}
