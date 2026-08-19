import 'server-only';

/**
 * Revision-context directive (CHANGE 3). Prepended to Brain 2's user prompt when
 * a resubmission is a genuine revision of a work the writer had read before.
 * Carries magnitude + rough location ONLY — never prompt IP. The reading is a
 * fresh full assessment that simply *acknowledges* the revision in its framing.
 */
export function buildRevisionDirective(changeSummary: string, priorNotes?: string | null): string {
  const base =
    'REVISION CONTEXT — IMPORTANT FOR YOUR FRAMING:\n' +
    'This is a REVISED version of a work you have read before. ' +
    changeSummary +
    ' Read and judge the WHOLE piece afresh as a new overall assessment — do not diff or patch, ' +
    'and never assume the writer has seen any previous notes. But DO acknowledge in your framing ' +
    'that you are responding to a revision: name what the writer appears to have reworked and how ' +
    'the whole now reads.\n\n';

  if (!priorNotes) return base;

  // Mentor addendum, Part B. Reached ONLY with real stored notes in hand —
  // the caller passes null rather than a placeholder when there are none, so
  // there is no path on which this text invites an invented past.
  return (
    base +
    'WHAT THE EARLIER READING ASKED FOR — these are the revision notes from the ' +
    'previous version of this work, stored verbatim. They are real; you are not ' +
    'imagining them:\n' +
    priorNotes +
    '\n\nUse them ONLY to observe what has moved. Where the new draft has answered one of ' +
    'them, say so plainly and briefly — that is the most useful thing you can tell a ' +
    'returning writer. Where the same weakness is still present, name it again without ' +
    'reproach: a writer who did not act on a note may never have seen it, and may have ' +
    'chosen against it, which is their right.\n' +
    'Across several revisions you may name a RECURRING tendency, but only one you can ' +
    'point to in the text in front of you now.\n' +
    'Hard limits: do not grade the revision, do not score it against the old list, do not ' +
    'reproduce the old notes back to the writer, and do not let the earlier reading lead. ' +
    'The draft in front of you is the subject; the earlier notes are context. If the new ' +
    'text and the old note disagree, the text wins.\n\n'
  );
}
