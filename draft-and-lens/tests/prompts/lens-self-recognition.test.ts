import { describe, expect, it } from 'vitest';

import { LENS_SELF_RECOGNITION } from '../../src/prompts/lenses/self-recognition';
import { LENS_IDS } from '../../src/prompts/lenses/types';

/**
 * The line a lens says when handed its own work. What is pinned here is
 * coverage and shape — the voice itself is Nenad's to judge — plus the one
 * property that makes the moment work rather than merely refuse.
 */
describe('lens self-recognition lines', () => {
  it('covers every lens, with none left over', () => {
    // A missing line would fall through to `undefined` and stream an empty
    // reply, which reads as the lens having nothing to say about its own work.
    const covered = Object.keys(LENS_SELF_RECOGNITION).sort();
    expect(covered).toEqual([...LENS_IDS].sort());
  });

  it('stays short — a lens performing about its own authorship is a party trick', () => {
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      expect(line.length, id).toBeGreaterThan(20);
      expect(line.length, id).toBeLessThan(220);
    }
  });

  it('hands the moment back to the writer rather than ending on a refusal', () => {
    // Every line must ask for the writer's own work. This is the same instinct
    // as the fragment redirect: declining is only half of it, and the half
    // that matters is returning the writer to their own writing.
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      // Morrison's is the shortest form of the same move — "I would rather
      // hear you" hands back to the writer's voice rather than their pages,
      // which is exactly her register. The alternation covers it explicitly
      // rather than being loosened to any second-person pronoun, which would
      // stop testing anything.
      //
      // Three forms were added on 2026-08-25 when the closings were rewritten,
      // each named rather than folded into a looser pattern:
      //   • `yours?` now covers the singular — Bruckheimer asks for "your
      //     first ten minutes", which is the writer's work by any reading.
      //   • Carver's "what you haven't cut yet" is the ask stated as the
      //     writer's own unfinished cutting.
      //   • Highsmith's "find me someone new to not forgive" is the one line
      //     that makes the ask WITHOUT addressing the writer at all. It is an
      //     imperative for a character only they can supply, so it satisfies
      //     the rule — it returns them to their work — while matching nothing
      //     second-person. Enumerated explicitly rather than weakening the
      //     pattern to accept any imperative, which would stop testing.
      expect(line.toLowerCase(), id).toMatch(
        /\byours?\b|\byou'?re working on\b|\byou have made\b|\byou wrote\b|\byou've (written|made)\b|what you have made|rather hear you|you haven'?t cut|find me someone new/
      );
    }
  });

  it('claims the work in the first person', () => {
    // "I wrote it" is the whole point — the generic hold said "I think I've
    // read this before", which is the wrong sentence when the truth is known.
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      expect(line.toLowerCase(), id).toMatch(/\bmine\b|\bmy own\b|\bours\b|\bi wrote\b|\bi made\b|\bi built\b/);
    }
  });
  /**
   * THE TEMPLATE GUARD, added 2026-08-25.
   *
   * Before that date 17 of the 35 lines closed on the identical sentence
   * "Show me yours." Each was fine alone; together they were a template, and
   * it showed exactly where it must not — a writer trying several lenses in
   * one session met the same sign-off from several supposedly distinct minds,
   * which is the opposite of what /about promises them ("each one a distinct
   * way of seeing, not a tone setting on the same engine").
   *
   * Nothing caught it, because every per-line test passed. These two catch the
   * aggregate. The thresholds sit just above today's real distribution, so
   * they fail on drift rather than on the current set: 34 distinct closings,
   * one duplicate pair, and a maximum of four lines sharing an opening.
   */
  const closingOf = (line: string): string => {
    const parts = line.trim().split(/(?<=[.?])\s+/).filter(Boolean);
    return parts[parts.length - 1] ?? line;
  };

  it('never lets one closing sentence become the house style', () => {
    const counts = new Map<string, string[]>();
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      const c = closingOf(line).toLowerCase();
      counts.set(c, [...(counts.get(c) ?? []), id]);
    }
    for (const [closing, ids] of counts) {
      // Two lenses may land on the same short ask by coincidence. Three is a
      // formula, and the writer will notice it before we do.
      expect(ids.length, `"${closing}" used by ${ids.join(', ')}`).toBeLessThanOrEqual(2);
    }
  });

  it('never lets one closing OPENING become the house style either', () => {
    // The subtler failure, and the one the first draft of the 2026-08-25
    // rewrite actually made: "Show me yours" was replaced with "Bring me
    // yours" ten times over, which is the same template wearing a new phrase.
    const counts = new Map<string, string[]>();
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      const opening = closingOf(line).toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      counts.set(opening, [...(counts.get(opening) ?? []), id]);
    }
    for (const [opening, ids] of counts) {
      expect(ids.length, `"${opening}…" used by ${ids.join(', ')}`).toBeLessThanOrEqual(4);
    }
  });
});
