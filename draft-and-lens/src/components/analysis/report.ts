/**
 * Report parsing + formatting helpers (Stage E, client-side).
 *
 * Pure functions, no server imports. Mirrors the prototype's renderLiveReport /
 * verdictColour / formatBody logic so the migrated report reads identically.
 * The analyst returns markdown: `## SECTION` headings, **bold**, *italic*,
 * `> quote` lines, and ⟦…⟧ anchors (resolved separately, §18).
 */

// ⟦ ⟧ anchor brackets (U+27E6 / U+27E7), built from char codes so the literal
// glyphs are never embedded in client source (mirrors the upload page).
const ANCHOR_OPEN = String.fromCharCode(0x27e6);
const ANCHOR_CLOSE = String.fromCharCode(0x27e7);

/** Strip the ⟦…⟧ anchor delimiters for the clean report view. */
export function stripAnchors(s: string): string {
  return s.split(ANCHOR_OPEN).join('').split(ANCHOR_CLOSE).join('');
}

export interface Verdict {
  ruling: string;
  detail: string;
}

/** Verdict accent colour — mirrors the prototype's verdictColour(). */
export function verdictColour(ruling: string): string {
  const v = ruling.toUpperCase();
  if (v.includes('RECOMMEND') || v.includes('PUBLISH')) return '#2a7a4a';
  if (v.includes('CONSIDER') || v.includes('DEVELOP')) return 'var(--amber)';
  if (v.includes('WATCH')) return '#2a7a7a';
  return '#8b2020';
}

const VERDICT_RE =
  /VERDICT:\s*\[?([^\]\n[]{3,60})\]?\n?([\s\S]{0,400}?)(?=\n##|\n---|$)/i;

/** Pull the VERDICT ruling + detail out of the report, if present. */
export function extractVerdict(report: string): Verdict | null {
  const m = report.match(VERDICT_RE);
  if (!m) return null;
  const rawRuling = m[1];
  if (rawRuling === undefined) return null;
  const ruling = rawRuling.replace(/[[\]]/g, '').replace(/\*\*/g, '').trim();
  const detail = (m[2] ?? '').replace(/\[.*?\]/g, '').replace(/\*\*/g, '').trim();
  if (!ruling) return null;
  return { ruling, detail };
}

export interface ReportSectionData {
  heading: string;
  body: string;
}

export interface ParsedReport {
  /** Numbered, collapsible sections in document order. */
  sections: ReportSectionData[];
  /** Pulled out and rendered as distinct callouts (not numbered sections). */
  craftDirectives: ReportSectionData | null;
  whereToBegin: ReportSectionData | null;
  actionPlan: ReportSectionData | null;
}

/**
 * Split the report markdown into sections on `## HEADING`, lifting the three
 * action-oriented sections out into their own callouts. Anchors are stripped
 * here so the report view reads cleanly (the anchored view keeps them, §18).
 */
export function parseReport(reportRaw: string): ParsedReport {
  const text = stripAnchors(reportRaw);

  const sections: ReportSectionData[] = [];
  let craftDirectives: ReportSectionData | null = null;
  let whereToBegin: ReportSectionData | null = null;
  let actionPlan: ReportSectionData | null = null;

  const place = (sec: ReportSectionData): void => {
    const h = sec.heading.toUpperCase();
    if (h.includes('CRAFT DIRECTIVE') || h.includes('WHAT TO FIX')) {
      craftDirectives = sec;
    } else if (h.includes('WHERE TO BEGIN') || h.includes('NEXT STEP') || h.includes('WHERE TO START')) {
      whereToBegin = sec;
    } else if (h.includes('ACTION PLAN') || h.includes('REVISION PLAN') || h.includes('STEP-BY-STEP') || h.includes('NEXT STEPS')) {
      actionPlan = sec;
    } else {
      sections.push(sec);
    }
  };

  let cur: ReportSectionData | null = null;
  for (const line of text.split('\n')) {
    const hm = line.match(/^##\s+(.+)/);
    if (hm) {
      if (cur) place(cur);
      cur = { heading: (hm[1] ?? '').trim(), body: '' };
    } else if (/^---+$/.test(line) || /^DRAFT/.test(line)) {
      // horizontal rules / draft markers — skip
    } else if (cur) {
      cur.body += line + '\n';
    }
  }
  if (cur) place(cur);

  return { sections, craftDirectives, whereToBegin, actionPlan };
}
