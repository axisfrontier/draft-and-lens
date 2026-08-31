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

/**
 * The verdict line, however the model chose to dress it: bare (what the
 * structure prompts actually ask for), as a `##` heading, or bolded. All three
 * have been seen in production output, on ordinary readings as much as any
 * other kind — the format is the model's whim, not a signal, so the parser
 * accepts all of them rather than the report being at the mercy of one.
 */
const VERDICT_LINE = /^[ \t]*(?:#{1,6}[ \t]*)?\*{0,2}VERDICT:/i;

/**
 * The ruling, then the paragraph under it.
 *
 * THE DETAIL USED TO BE CAPPED AT 400 CHARACTERS and that cap silently deleted
 * the verdict from essentially every reading. VERDICT is the last thing in the
 * report, so nothing after it satisfies the `\n##` or `\n---` terminator and
 * `$` sits at the end of a paragraph the prompts ask to be "one honest
 * paragraph" — measured at 839-911 characters on three consecutive real
 * reports. Past 400 the lookahead could not be reached, the whole match failed,
 * and `extractVerdict` returned null. `ReportView` renders a permanent
 * "Verdict" sidebar link, so the writer got a link that scrolled to an empty
 * div, while the verdict text either became a duplicate section or was absorbed
 * into the end of WHERE TO GROW NEXT.
 *
 * The detail now runs to the next heading, the next rule, or the end of the
 * report, whichever comes first. No `m` flag: `$` here must mean end of report,
 * not end of line, so the line anchor is written as `(?:^|\n)` instead.
 */
const VERDICT_RE =
  /(?:^|\n)[ \t]*(?:#{1,6}[ \t]*)?\*{0,2}VERDICT:[ \t]*\[?([^\]\n[]{3,60}?)\]?\*{0,2}[ \t]*(?:\n|$)([\s\S]*?)(?=\n[ \t]*#{1,6}[ \t]|\n---|$)/i;

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
  /** New unified revision list (WHAT TO REVISE, Corpus P26). Null on legacy
   *  stored reports, which still populate the three fields below instead. */
  revisionList: ReportSectionData | null;
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
  let revisionList: ReportSectionData | null = null;
  let craftDirectives: ReportSectionData | null = null;
  let whereToBegin: ReportSectionData | null = null;
  let actionPlan: ReportSectionData | null = null;

  const place = (sec: ReportSectionData): void => {
    const h = sec.heading.toUpperCase();
    if (h.includes('WHAT TO REVISE') || h.includes('REVISION PRIORITIES')) {
      revisionList = sec;
    } else if (h.includes('CRAFT DIRECTIVE') || h.includes('WHAT TO FIX')) {
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
    // The verdict has its own band and its own sidebar link. Whatever shape it
    // arrives in, it closes the open section and never becomes one itself —
    // otherwise a `## VERDICT` run duplicates it into the Analysis group while
    // a bare or bolded one is silently swallowed by WHERE TO GROW NEXT, and
    // which of those the writer gets depends on nothing but the model's mood.
    if (VERDICT_LINE.test(line)) {
      if (cur) place(cur);
      cur = null;
      continue;
    }
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

  return { sections, revisionList, craftDirectives, whereToBegin, actionPlan };
}
