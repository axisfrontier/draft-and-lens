/**
 * Shared upload-format rules — importable by BOTH client and server (no
 * `server-only`, no IP). Keeps the accepted-format list, the per-format
 * failure messages, and the readable-text gate in one place so the drop zone,
 * the file picker's `accept` attribute and /api/upload cannot drift apart.
 *
 * Why this exists: the drop zone used to hand every accepted extension to
 * `FileReader.readAsText`. That is correct for genuinely textual formats and
 * silently wrong for .docx and .pdf, which are binary containers — the reader
 * returns mojibake rather than throwing, the file "uploads", and the analyst
 * is handed the mojibake. Binary formats now carry `transport: 'server'` and
 * are extracted properly in the API route instead.
 */

export type UploadTransport = 'text' | 'server';

export interface UploadFormat {
  /** Lower-case extension including the leading dot. */
  readonly ext: string;
  /** Display label for the drop zone hint. */
  readonly label: string;
  /** How the file's text is obtained: read in the browser, or extracted server-side. */
  readonly transport: UploadTransport;
}

/**
 * NOT listed, deliberately: `.fdx` (Final Draft). It is XML, so it passes the
 * readable-text gate and reaches the analyst as raw markup — a reading degraded
 * in a way nothing tells the writer. Silently degraded analysis is worse than
 * an honest "not supported", so it is unadvertised until a real parser exists.
 * Do not re-add it without extracting `<Paragraph>`/`<Text>` content the way
 * .docx is extracted server-side. See SESSION_LOG.md, 2026-08-10.
 */
export const UPLOAD_FORMATS: readonly UploadFormat[] = [
  { ext: '.txt', label: '.TXT', transport: 'text' },
  { ext: '.md', label: '.MD', transport: 'text' },
  { ext: '.fountain', label: '.FOUNTAIN', transport: 'text' },
  { ext: '.docx', label: '.DOCX', transport: 'server' },
  { ext: '.pdf', label: '.PDF', transport: 'server' },
];

/** `accept` attribute for the file input, derived so it cannot drift. */
export const UPLOAD_ACCEPT = UPLOAD_FORMATS.map((f) => f.ext).join(',');

/** Human-readable format list for the drop zone hint. */
export const UPLOAD_FORMAT_HINT = UPLOAD_FORMATS.map((f) => f.label).join(' · ');

/**
 * Hard ceiling on an uploaded file, in bytes. Well above any manuscript that
 * fits the 4,000-word tester cap, low enough that a mis-drop is rejected at
 * the drop zone rather than after a slow round trip.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Lower-case extension of a filename, including the leading dot. */
export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

/** The format record for a filename, or null if the extension is not accepted. */
export function formatFor(filename: string): UploadFormat | null {
  const ext = extensionOf(filename);
  return UPLOAD_FORMATS.find((f) => f.ext === ext) ?? null;
}

/**
 * Fraction of a sample that is genuinely readable text. Control bytes, C1
 * controls and U+FFFD replacement characters all count against it, so a binary
 * file decoded as UTF-8 scores low while real prose scores ~1.
 *
 * This is the net that catches a binary file wearing a textual extension (a
 * .docx renamed .txt, a PDF saved as .md). Without it the mojibake reaches the
 * analyst and the failure only surfaces on the analysis screen.
 */
export function readableRatio(text: string): number {
  const sample = Array.from(text.slice(0, 4000));
  if (sample.length === 0) return 0;
  let readable = 0;
  for (const ch of sample) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 9 || code === 10 || code === 13) { readable += 1; continue; }
    if (code < 32) continue;
    if (code === 0xfffd) continue;
    if (code >= 0x7f && code <= 0x9f) continue;
    readable += 1;
  }
  return readable / sample.length;
}

/** Below this, treat the content as binary rather than prose. */
export const READABLE_MIN = 0.95;

/** Shortest extraction we will accept as a real submission, in characters. */
export const MIN_EXTRACTED_CHARS = 20;

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/**
 * Per-format failure copy. Specific beats generic: every message names what
 * went wrong with this file and what to do instead, and every one of them is
 * shown on the upload screen, so the writer never leaves the page they need to
 * be on to try again.
 */
export const UPLOAD_MESSAGES = {
  legacyDoc:
    "I can't open old-style .doc files. Re-save it as .docx, .pdf or .txt and send it again.",

  unsupported: (ext: string): string =>
    `${ext === '' ? 'That file has no extension' : `I can't read ${ext} files`}. I read ${UPLOAD_FORMAT_HINT.replace(/ · /g, ', ')}.`,

  tooLarge: (bytes: number): string =>
    `That's ${formatMb(bytes)}MB, past the ${formatMb(MAX_UPLOAD_BYTES)}MB I can take. Send a single chapter rather than the whole manuscript.`,

  empty: (label: string): string =>
    `That ${label} opened but there was nothing in it.`,

  binary: (label: string): string =>
    `That file is named ${label}, but what's inside isn't readable text — it may have been renamed from another format. Re-save it as ${label} and send it again.`,

  scannedPdf:
    "There's no selectable text in that PDF — it looks like a scan, or images of pages. Send me the original .docx or .txt.",

  extractionFailed: (label: string): string =>
    `I couldn't read that ${label} — it may be password-protected or damaged. Re-save it, or send a .txt or .md copy.`,

  readFailed: (label: string): string =>
    `I couldn't open that ${label}. Send it again, or a .txt or .md copy.`,
} as const;

/**
 * Gate extracted text before it is allowed anywhere near the analysis request.
 * Returns a specific message to show the writer, or null when the text is good.
 */
export function rejectionReason(text: string, format: UploadFormat): string | null {
  if (text.trim().length < MIN_EXTRACTED_CHARS) {
    return format.ext === '.pdf' ? UPLOAD_MESSAGES.scannedPdf : UPLOAD_MESSAGES.empty(format.label);
  }
  if (readableRatio(text) < READABLE_MIN) {
    return UPLOAD_MESSAGES.binary(format.label);
  }
  return null;
}

/**
 * Strip Markdown *syntax* while leaving every word intact. Obsidian and other
 * markdown-native writers are a target audience, and raw `##`, `**` and YAML
 * frontmatter would otherwise reach the analyst as if the writer had typed
 * them into their prose.
 *
 * Deliberately conservative. Line-leading list and dash markers are left
 * alone: a dash opening a line is meaningful in prose and in dialogue, and
 * mangling that would be worse than leaving a stray bullet in. No lookbehind
 * assertions, which older Safari cannot parse.
 */
export function stripMarkdown(text: string): string {
  return text
    // YAML frontmatter, only when it opens the file (Obsidian's default).
    .replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '')
    // Fenced code delimiters, keeping the code's own lines.
    .replace(/^[ \t]*(?:```|~~~).*$/gm, '')
    // ATX headings.
    .replace(/^ {0,3}#{1,6}[ \t]+/gm, '')
    // Blockquote markers.
    .replace(/^ {0,3}>[ \t]?/gm, '')
    // Horizontal rules.
    .replace(/^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, '')
    // Images, then links, keeping the link's own words.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Obsidian wikilinks, keeping the display text after a pipe where present.
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
    // Emphasis and highlight markers.
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/gm, '$1$2')
    .replace(/==([^=\n]+)==/g, '$1')
    // Inline code.
    .replace(/`([^`\n]+)`/g, '$1')
    .trim();
}
