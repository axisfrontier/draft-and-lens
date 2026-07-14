/**
 * Anchor resolver — §18, client-side. Ported from the prototype.
 *
 * The analyst wraps verbatim quotes in ⟦…⟧. We extract each quote together with
 * the note it sits in, locate the quote in the submitted manuscript, and hand
 * back render-ready segments + margin notes. This is presentation logic, NOT
 * prompt IP — the bracket glyphs are built from char codes so the literal
 * characters never appear in client source (the security check greps for ⟦).
 */

const OPEN = String.fromCharCode(0x27e6);
const CLOSE = String.fromCharCode(0x27e7);

export interface Anchor {
  id: string;
  quote: string;
  note: string;
  occurrence: number;
}

export interface ResolvedAnchor extends Anchor {
  start: number;
  end: number;
}

export interface AnchorSegment {
  text: string;
  /** Index into `notes` when this segment is an anchored span; null otherwise. */
  anchorIndex: number | null;
}

export interface NoteGroup {
  note: string;
  /** How many manuscript spans share this note (Fix 1 dedup). */
  spanCount: number;
}

export interface AnchorResolution {
  segments: AnchorSegment[];
  /** One entry per UNIQUE note, in document order — its spans all share its index. */
  notes: NoteGroup[];
  /** Unique general-note texts that couldn't be pinned to a line. */
  orphans: string[];
}

/** True if the report contains at least one bracketed quote. */
export function hasAnchors(report: string): boolean {
  const re = new RegExp(OPEN + '[^' + OPEN + CLOSE + ']+' + CLOSE);
  return re.test(report || '');
}

/** Pull each ⟦quote⟧ out of the report with the sentence/clause it belongs to. */
export function extractAnchors(report: string): Anchor[] {
  if (!report) return [];
  const anchors: Anchor[] = [];
  const re = new RegExp(OPEN + '([^' + OPEN + CLOSE + ']{1,400})' + CLOSE, 'g');
  const bracketStrip = new RegExp('[' + OPEN + CLOSE + ']', 'g');
  let m: RegExpExecArray | null;
  let idx = 0;

  while ((m = re.exec(report)) !== null) {
    const quote = (m[1] ?? '').trim();
    if (!quote) continue;
    const ctxStart = Math.max(
      0,
      report.lastIndexOf('. ', m.index) + 1,
      report.lastIndexOf('\n', m.index) + 1
    );
    let ctxEnd = report.indexOf('. ', re.lastIndex);
    const nl = report.indexOf('\n', re.lastIndex);
    if (ctxEnd === -1) ctxEnd = report.length;
    if (nl !== -1 && nl < ctxEnd) ctxEnd = nl;
    let note = report
      .slice(ctxStart, ctxEnd + 1)
      .replace(bracketStrip, '')
      .replace(/\*\*/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^[-•\d.]+\s*/, '')
      .trim();
    // FIX 1 (NotesPanel doc) — if what's left after removing the quote itself
    // is too thin, the analyst gave no real commentary. No note is better than
    // a fake note: drop this anchor entirely rather than show the quote back
    // to the writer as if it were a note, or a placeholder in its place.
    const quoteEsc = quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withoutQuote = note.replace(new RegExp(quoteEsc, 'i'), '').replace(/[\s.,;:—-]+/g, ' ').trim();
    if (withoutQuote.length < 12) continue;
    // Sentence-boundary detection can land mid-clause; always present a note
    // starting with a capital letter.
    const firstChar = note.charAt(0);
    if (firstChar >= 'a' && firstChar <= 'z') note = firstChar.toUpperCase() + note.slice(1);
    anchors.push({ id: 'anchor-' + idx++, quote, note, occurrence: 0 });
  }

  // Number repeated quotes so each maps to a distinct location.
  const seen: Record<string, number> = {};
  for (const a of anchors) {
    const key = a.quote.toLowerCase();
    a.occurrence = seen[key] ?? 0;
    seen[key] = a.occurrence + 1;
  }
  return anchors;
}

/** Locate a quote in the text. Exact (case-insensitive) first, then whitespace-tolerant. */
export function findAnchor(
  quote: string,
  text: string,
  occurrence: number
): { start: number; end: number } | null {
  if (!quote || !text) return null;
  const occ = occurrence || 0;
  const tl = text.toLowerCase();
  const ql = quote.toLowerCase();

  let from = 0;
  let found = -1;
  let n = 0;
  let first = -1;
  while ((found = tl.indexOf(ql, from)) !== -1) {
    if (first === -1) first = found;
    if (n === occ) return { start: found, end: found + quote.length };
    n++;
    from = found + 1;
  }
  if (first !== -1) return { start: first, end: first + quote.length };

  try {
    const esc = quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const rx = new RegExp(esc, 'i');
    const mm = rx.exec(text);
    if (mm) return { start: mm.index, end: mm.index + mm[0].length };
  } catch {
    /* malformed regex — fall through to orphan */
  }
  return null;
}

/** Resolve all anchors against the submitted text into render-ready segments. */
export function resolveAnchors(report: string, text: string): AnchorResolution {
  const anchors = extractAnchors(report);
  const pinned: ResolvedAnchor[] = [];
  const unpinned: Anchor[] = [];

  for (const a of anchors) {
    const pos = findAnchor(a.quote, text, a.occurrence);
    if (pos) pinned.push({ ...a, ...pos });
    else unpinned.push(a);
  }

  // Sort by position; drop overlaps (spans can't nest).
  pinned.sort((x, y) => x.start - y.start);
  const clean: ResolvedAnchor[] = [];
  let lastEnd = -1;
  for (const r of pinned) {
    if (r.start >= lastEnd) {
      clean.push(r);
      lastEnd = r.end;
    }
  }

  // FIX 1 — dedup: spans whose note text is identical collapse to ONE note that
  // highlights all of them. A note makes its point once and marks every line it
  // applies to, instead of repeating verbatim down the margin.
  const noteIndex = new Map<string, number>();
  const notes: NoteGroup[] = [];
  const segments: AnchorSegment[] = [];
  let cursor = 0;
  for (const r of clean) {
    let gi = noteIndex.get(r.note);
    if (gi === undefined) {
      gi = notes.length;
      noteIndex.set(r.note, gi);
      notes.push({ note: r.note, spanCount: 0 });
    }
    const group = notes[gi];
    if (group) group.spanCount += 1;
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start), anchorIndex: null });
    segments.push({ text: text.slice(r.start, r.end), anchorIndex: gi });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), anchorIndex: null });

  // Orphans — unique note texts not already pinned (so a note never shows both
  // pinned and as a general note).
  const orphanSeen = new Set<string>();
  const orphans: string[] = [];
  for (const o of unpinned) {
    if (noteIndex.has(o.note) || orphanSeen.has(o.note)) continue;
    orphanSeen.add(o.note);
    orphans.push(o.note);
  }

  return { segments, notes, orphans };
}
