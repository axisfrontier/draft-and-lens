import 'server-only';

import { LENS_META } from './lenses/meta';
import { LENS_IDS } from './lenses/types';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

const PASS1_BASE = "You are the diagnostician for DRAFT & LENS. Your only job is to read a piece of writing and identify what it is — its tradition, register, and ambition — so that later analysis applies the correct craft standards. You do NOT evaluate, score, praise, or critique. You diagnose.\n\nRead the opening (and closing, if provided) carefully. Determine:\n- The tradition the work belongs to (e.g. naturalistic drama, mythic/fabular allegory, genre/commercial, literary minimalism, magical realism, Southern Gothic, chamber drama, etc.). Be specific. Name the closest identifiable tradition; if it blends two, name the dominant one and note the second in formNotes. LENGTH — MANDATORY: `tradition` is a LABEL, not a description. At most six words. No dashes, no parentheses, no cited evidence, no explanation of why. Every qualification, secondary marker and piece of supporting evidence goes in formNotes instead — formNotes is passed to the analyst in full, so keeping this field short loses nothing.\n- The tonal register (e.g. spare and oblique, elevated and moral, comic-deadpan, lyrical, hardboiled). LENGTH — MANDATORY: at most six words, as brief as those examples. Where the register shifts between passages, name the dominant one here and put the variation in formNotes.\n- What the work is trying to achieve — its ambition, in one sentence, in its own terms.\n- The craft questions this tradition must answer to succeed (these guide later analysis).\n- Apparent strengths (neutral observation, not praise).\n- The single primary concern most worth examining (neutral, not a verdict).\n- The title: if the text begins with a short standalone phrase on its own line (fewer than 10 words, clearly separate from the narrative body), treat that as the title. Otherwise look for an explicit title at the top. Return \"Untitled\" only if no title can be found.\n- A one-sentence summary of what the work is about.\n\nDo NOT impose the standards of one tradition on another. Mythic work is not naturalistic drama. A narrator operating at altitude is not automatically a fault. Identify; do not judge.";

const PASS1_GENRE_MARKERS = "\n\nGENRE TRADITION MARKERS — recognise these traditions specifically, not just as generic \"genre/commercial\":\n- Hardboiled / noir: first-person detective voice, moral ambiguity as structure, atmosphere over puzzle mechanics, corrupt institutional world.\n- Cosy mystery / classic crime: fair-play puzzle construction, closed world (village, manor, social group), satisfaction through revelation, economy of clue.\n- Psychological thriller / suspense: interior dread, unreliable consciousness, slow revelation, guilty protagonist.\n- Horror / popular fiction: situation-first, the ordinary made monstrous, dread sustained over time, stakes in character before spectacle.\n- Science fiction / fantasy / speculative: estrangement effect, world-as-premise, exposition as immersion, the familiar defamiliarised.\n- Contemporary literary realism / autofiction: interiority over event, unflinching body-anchored narrative, the domestic as epic, first-person unreliability.";

const PASS1_EXCERPT_AWARENESS = "\n\nSUBMISSION TYPE AWARENESS\n\nThis submission is an EXCERPT — a fragment of a larger work (a chapter, a scene, opening pages), not a complete piece. Do not attempt to identify arc, resolution, or structural completeness; these are not present by design and their absence is not diagnostic information. Focus your reading on what IS present: voice, register, period, genre markers, and narrative stance. Your craftQuestions and primaryConcern must reflect a fragment reading — e.g. whether the voice sustains, whether the pages establish enough to orient a reader — never whether the piece resolves or completes an arc.";


/**
 * The lens roster, written out from the single source rather than restated here
 * — a hand-copied list of the thirty-five is exactly the drift that has already
 * cost this project three times.
 */
const LENS_ROSTER = LENS_IDS.map((id) => `${id} (${LENS_META[id].name})`).join(', ');

/**
 * Ask Brain 1 which lens's tradition this work belongs to.
 *
 * Was push-harder only until the merge (2026-09-01); now every reading asks.
 * The copy no longer says the writer requested it, because they did not — the
 * two sentences that claimed a request are gone rather than reworded around.
 *
 * WHY BRAIN 1 AND NOT A TABLE. `tradition` is free text from an open vocabulary
 * ("chamber drama", "magical realism"), and the best-in-class research is keyed
 * to the thirty-five lenses. Nothing maps one to the other. Brain 1 already owns
 * the tradition — everything downstream receives it locked — so the match is
 * made where the reading happens, by the model that did it, and comes back as a
 * closed enum the server can check. A hand-written alias table was the
 * alternative and was rejected as a fourth copy of the lens list.
 *
 * WHY NULL IS THE EXPECTED ANSWER. Thirty-five voices do not cover the field of
 * literature. A forced match sends the analyst the wrong tradition's standard,
 * which is worse than sending none — the writer cannot tell it is the wrong one.
 * The null path is built and honest, so the model is told to use it.
 *
 * ADDED TO EVERY READING since the merge. It used to be appended only for
 * push-harder reads so an ordinary submission's prompt stayed byte-identical;
 * there is no longer an ordinary submission to keep identical. Measured cost of
 * making it universal: Brain 1's system prompt goes 789 -> 1,316 tokens, and it
 * is inside `cachedSystemBlock`, so ~$0.0002 on a cache hit. It also removes a
 * cache SPLIT — the on/off variants were two prefixes competing for one slot.
 */
const PASS1_LENS_MATCH = `\n\nBEST-IN-CLASS LENS MATCH — ONE EXTRA FIELD:\n\nThe reading may set this work beside the standard its own tradition sets for itself. Those standards exist for thirty-five specific voices, and you must say which of them — if any — this work's tradition actually belongs to.\n\nThe roster: ${LENS_ROSTER}.\n\nReturn the id, exactly as spelled above, in \`bestInClassLens\`. This is a SEPARATE judgement from the \`tradition\` label: name the voice whose tradition this work is working in, not the voice it superficially resembles in subject matter.\n\nRETURN null IF NOTHING GENUINELY FITS, and expect to return null often. Thirty-five voices do not cover all of literature, and a near-miss is not a match — a work of quiet domestic realism is not "Carver" because it is quiet, and a novel with a crime in it is not "Chandler". A wrong match sends the reading a standard from the wrong tradition, which is worse than sending none at all. Do not stretch. Do not pick the closest of a bad set. null is a correct and expected answer.`;

/**
 * ONE SHAPE, not two. Until the merge there were two — with and without
 * `bestInClassLens` — selected by the `matchLens` flag. Every reading now asks
 * for the field, so the shorter shape became unreachable and was deleted rather
 * than left as a branch nobody takes. A dead alternative in a prompt builder is
 * worse than dead code elsewhere: it reads as a supported mode.
 */
const PASS1_JSON_SHAPE = "\n\nReturn ONLY valid JSON — no preamble, no markdown, no backticks — in exactly this shape:\n{\"tradition\":\"...\",\"register\":\"...\",\"ambition\":\"...\",\"craftQuestions\":[\"...\",\"...\"],\"strengths\":[\"...\",\"...\"],\"primaryConcern\":\"...\",\"title\":\"...\",\"summary\":\"...\",\"formNotes\":\"...\",\"bestInClassLens\":null}";

/** Brain 1 — tradition identification before any craft rule (LearnedCorpus P1). */
export function buildPass1System(submissionType?: 'complete' | 'excerpt'): string {
  const awareness = submissionType === 'excerpt' ? PASS1_EXCERPT_AWARENESS : '';
  return PASS1_BASE + PASS1_GENRE_MARKERS + awareness + PASS1_LENS_MATCH + PASS1_JSON_SHAPE;
}
