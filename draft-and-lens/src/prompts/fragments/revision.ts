import 'server-only';

/**
 * Revision-context directive (CHANGE 3). Prepended to Brain 2's user prompt when
 * a resubmission is a genuine revision of a work the writer had read before.
 * Carries magnitude + rough location ONLY — never prompt IP. The reading is a
 * fresh full assessment that simply *acknowledges* the revision in its framing.
 */
export function buildRevisionDirective(changeSummary: string): string {
  return (
    'REVISION CONTEXT — IMPORTANT FOR YOUR FRAMING:\n' +
    'This is a REVISED version of a work you have read before. ' +
    changeSummary +
    ' Read and judge the WHOLE piece afresh as a new overall assessment — do not diff or patch, ' +
    'and never assume the writer has seen any previous notes. But DO acknowledge in your framing ' +
    'that you are responding to a revision: name what the writer appears to have reworked and how ' +
    'the whole now reads.\n\n'
  );
}
