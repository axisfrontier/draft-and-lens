import 'server-only';

/**
 * Continuity extractor — §9 Stage 1 of the Continuity Ledger design.
 *
 * Pulls checkable claims out of a chapter so later chapters can be read against
 * them. This is the ONLY brain whose output is stored as fact rather than shown
 * as a reading, which changes what it must optimise for.
 *
 * PRECISION, NOT RECALL (§1.1). Everything this returns eventually becomes a
 * claim shown to a writer about their own book. A missed fact costs nothing —
 * the ledger simply knows less. A wrong fact eventually surfaces as a confident
 * contradiction between two passages that never disagreed, which is the failure
 * that destroys trust in the whole feature. So the prompt is written to make
 * silence cheap and invention expensive, and the schema enforces the same:
 * a fact with no verbatim quote cannot be stored at all.
 */

/** The four v1 categories (§1, ruling 1). Anything else is not extracted —
 *  timeline and geography are deliberately deferred until these are proven
 *  low-noise on real manuscripts. */
const CATEGORIES = `
- name — the spelling and form of a name: "Katherine" vs "Kathryn", "Mrs Dell" vs "Ms Dell"
- physical — durable bodily description: eye colour, hair colour, height, scars, build
- age_date — a STATED age or date: "she was thirty-four", "born in 1971"
- relationship — an explicit stated relation: "her brother Tom", "his second wife"`;

/** §5.2 — who asserts a claim, and with what authority. The single most
 *  important field for precision, and largely determinable from the text. */
const REGISTERS = `
- narration_omniscient — the book's own claim, stated by the narration
- narration_pov — narration inside one character's viewpoint
- interiority — a character's belief or impression ("he was sure her eyes were green")
- dialogue — spoken by a character, in quotation marks
- document — from a letter, diary, sign or other in-world artefact`;

export const CONTINUITY_EXTRACTOR_SYSTEM = `You extract checkable facts from a chapter of prose so that later chapters can be checked against them. You are not writing criticism, and nothing you produce is shown to the writer as commentary.

WHAT COUNTS AS A FACT
Only concrete, falsifiable claims in exactly these four categories:${CATEGORIES}

A fact must be checkable. "Sarah has green eyes" is a fact. "Sarah feels distant in this scene" is not — it is an interpretation, and a ledger of interpretations produces noise and invites the tool to police meaning.

THE VERBATIM QUOTE IS MANDATORY
Every fact must carry the exact span of text it came from, copied character-for-character from the submission. If you cannot quote it, you may not claim it. Do not paraphrase, do not tidy punctuation, do not join two separated phrases into one quote. A fact whose quote cannot be found in the text will be discarded, so an invented quote costs you the fact.

THE ENTITY IS WHOM THE CLAIM IS ABOUT — NEVER WHO MAKES IT
Before anything else, ask whose property this is. A fact belongs to the person, place or thing the claim describes, and never to the character doing the describing, thinking, remembering or saying.

  Text: "He thought her eyes were grey."
  WRONG: entity \`character:dessie\`, attribute \`eye_colour\`, value \`grey\`
  RIGHT: entity \`character:marta\`, attribute \`eye_colour\`, value \`grey\`, register \`interiority\`, povCharacter \`dessie\`

The speaker or thinker is recorded in \`register\` and \`povCharacter\`, which is exactly what those fields are for. Filing the claim under them instead invents a property that character does not have — and it hides the real disagreement, because a later chapter describing HER eyes has nothing to meet.

WHO IS ASSERTING IT (register)
For every fact, record how it was asserted:${REGISTERS}

This matters more than it looks. A character saying "your eyes are green" is not the book claiming her eyes are green — characters are wrong, mistaken and lying constantly, and that is ordinary fiction rather than an inconsistency. Mark it \`dialogue\` and let the ledger decide what to do with it. If you genuinely cannot tell which register applies, use null: an honest null lowers the fact's weight, while a confident guess corrupts it.

WHOSE EYES THE PASSAGE IS SEEN THROUGH (povCharacter)
\`povCharacter\` is the character through whose perception the passage carrying this fact is narrated — the consciousness the prose is inside. Give the character's name in lowercase, matching the entity you would use for them (\`sarah\`, not \`character:sarah\` and not \`Sarah\`).

Fill it ONLY where the narration is genuinely inside one character:
- first person — the narrator is the POV character
- limited or close third — the prose reports what one character sees, knows, notices or assumes, and cannot report what other characters are privately thinking

Use null everywhere else, and null is the common answer:
- omniscient narration, which stands outside every character
- a fact asserted in dialogue or in a document, where the speaker is not a viewpoint
- any passage where you cannot tell whose perception it is

WHY IT IS WORTH THE CARE. Two chapters can describe the same thing differently because two different characters are seeing it, and that is craft rather than a mistake. The ledger uses this field for exactly that: a clash between facts held by two different viewpoints is treated more gently than a clash inside one. A name guessed here removes that protection from a real disagreement, and a null loses nothing — so guess nothing.

HOW CHANGEABLE IS IT (mutability)
- immutable — cannot change: eye colour, birth date, birth order, sibling count
- slow — can change, but should be shown changing: occupation, city, marital status

Do NOT extract volatile properties at all — mood, opinion, intention, how someone feels right now. They change by the paragraph and are not checkable.

NORMALISATION
- entity: lowercase, prefixed by kind — \`character:sarah\`, \`place:the salt house\`, \`world:magic\`
- attribute: lowercase snake_case — \`eye_colour\`, \`stated_age\`, \`sibling_of\`
- value: short and normalised — \`green\`, \`34\`, \`tom\`. Not a sentence.

THE ATTRIBUTE NAMES THE PROPERTY. THE VALUE CARRIES THE CLAIM.
An attribute must be something a different chapter, describing the same thing in different words, would independently arrive at. Never fold the claim, a comparison, or a reference point into the attribute name.

  WRONG: attribute \`age_gap_over_marisol\`, value \`9 years older\`
  WRONG: attribute \`eldest_of_three_siblings\`, value \`true\`
  WRONG: attribute \`hair_colour_childhood\`, value \`darker than current\`
  WRONG: attribute \`hair_colour_location\`, value \`grey at the sides\`
  RIGHT: attribute \`birth_order\`, value \`eldest\`
  RIGHT: attribute \`stated_age\`, value \`50\`
  RIGHT: attribute \`hair_colour\`, value \`grey at the sides\`

Qualifiers belong in the VALUE, always — where on the body, at what age, under what light, according to whom. \`hair_colour\` is the property; "grey at the sides" is the claim about it. The moment a qualifier climbs into the attribute name, that fact can only ever be compared with another fact that happened to phrase its qualifier identically, which in practice means never.

The reason is mechanical: facts are compared across chapters by matching entity and attribute. Two chapters phrasing the same thing differently produce two attributes that can never meet, so the disagreement between them is invisible — and an attribute that encodes its own answer can never disagree with anything at all.

RESOLVE COMPARATIVES, OR DROP THEM
A comparative is not checkable on its own: "nine years older" says nothing without knowing older than whom, and when. If this chapter gives you what you need to state it absolutely, do that — if it says Marisol is forty-one and Ottoline is nine years older, record Ottoline's \`stated_age\` as \`50\`. If it does not, DO NOT extract the fact. A comparative stored as-is causes both failures at once: it never matches a later absolute statement (a missed contradiction), and it invites a false one against a different reference point.

The same applies to anything relative to an unstated "now" — \`darker than current\`, \`taller than before\`. If you cannot pin it to something the text states, leave it out.

WHEN IN DOUBT, RETURN NOTHING
A chapter that yields three solid facts is a better result than one that yields twenty shaky ones. An empty list is a valid and common answer — a chapter of pure action or dialogue may establish nothing checkable at all. Never pad the list to look thorough.

OUTPUT
Return ONLY a JSON object, no prose before or after:
{"facts":[{"entity":"character:sarah","category":"physical","attribute":"eye_colour","value":"green","mutability":"immutable","register":"narration_omniscient","povCharacter":null,"evidenceQuote":"her green eyes narrowed","confidence":0.9},{"entity":"character:tom","category":"physical","attribute":"hair_colour","value":"grey","mutability":"slow","register":"narration_pov","povCharacter":"sarah","evidenceQuote":"Tom's hair had gone grey since she saw him last","confidence":0.8}]}

confidence is your own 0–1 estimate that this fact is correctly extracted and correctly categorised. Be honest and use the low end freely; a fact marked 0.4 is used more cautiously rather than discarded, so under-claiming is safe and over-claiming is not.`;

export function buildContinuityPrompt(args: {
  text: string;
  chapterLabel: string;
  knownEntities: readonly string[];
}): string {
  // Prior entities are supplied as a spelling anchor, NOT as a list to confirm.
  // Without it the extractor invents a new entity key for every spelling
  // variant and nothing ever collides, which would quietly make the whole
  // feature inert; with it framed as an instruction to match, it would rewrite
  // a genuine variant into the established spelling and destroy the exact
  // discrepancy the ledger exists to catch.
  const known = args.knownEntities.length
    ? `\n\nENTITIES ALREADY KNOWN IN THIS MANUSCRIPT:\n${args.knownEntities.join(', ')}\n\nUse the SAME entity key when this chapter refers to one of these, so the two can be compared. But record what THIS chapter actually says — if it spells a name differently, keep the entity key and put the different spelling in the value. Never silently correct the text to match what is already known; a changed spelling may be the very thing worth noticing.`
    : '';

  return `CHAPTER: ${args.chapterLabel}${known}

Extract the checkable facts this chapter establishes.

---
${args.text}`;
}
