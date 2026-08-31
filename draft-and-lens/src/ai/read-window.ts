import 'server-only';

/**
 * What a brain is shown when a submission is longer than its read window.
 *
 * WHY THIS IS SHARED. Two paths cut a writer's submission before a model forms
 * a judgement about the writing: Brain 1, and the lens reading. Both had the
 * same defect — text cut with nothing saying so — and both need the same
 * property, so the shape lives in one place. The WINDOW does not: each caller
 * passes its own, because the brains do different jobs at different tiers and
 * their budgets should stay free to move apart.
 *
 * THE PROPERTY, which is the whole point: the text is either whole or declared
 * cut. Never silently cut, at any length, for any window.
 *
 * That is why the budget is ONE number rather than a slice size plus a separate
 * threshold. With two numbers there is always a band between them where the
 * text is cut and nothing says so — Brain 1 had exactly that band at
 * 3,000–6,000 characters, and it cost a writer a numbered instruction to repair
 * a sentence that was whole in their own draft. Raising a slice size only moves
 * such a band; taking the second number away removes it.
 *
 * The header names the cuts as cuts. A slice boundary lands mid-sentence, and a
 * position label alone ("[CLOSING OF WORK]") leaves a model free to read that
 * ragged edge as the writer's own — the same fabricated-defect failure, one
 * band up.
 */
export function excerptForReading(text: string, windowChars: number): string {
  if (text.length <= windowChars) return text;
  const half = Math.floor(windowChars / 2);
  const omitted = text.length - half * 2;
  return [
    `[TWO EXTRACTS FROM A LONGER WORK — NOT THE WHOLE WORK. ${omitted.toLocaleString()} characters have been removed from the middle. Both extracts begin and end at an arbitrary character cut made by this system, not at a sentence the writer wrote, so either may start or stop mid-sentence. Never read a cut edge as a flaw in the writing.]`,
    `[OPENING OF WORK]\n${text.slice(0, half)}`,
    `[CLOSING OF WORK]\n${text.slice(-half)}`,
  ].join('\n\n');
}
