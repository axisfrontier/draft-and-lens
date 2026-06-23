/**
 * GLOSSARY — §19. Client-safe, NOT IP (craft definitions, ported verbatim from
 * DraftAndLens.html). `gloss` = the short hover/tap tooltip; `full` = the longer
 * definition for the glossary page; `aliases` = alternate forms the report
 * scanner should also underline and map to this entry. The glossary IS the
 * detection set — adding a term here makes it legible everywhere in a reading.
 */
export interface GlossaryEntry {
  gloss: string;
  full: string;
  aliases?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  tradition: {
    gloss: 'The kind of work a piece is — the lineage whose standards apply to it.',
    full: 'The kind of work a piece is — mythic allegory, minimalist realism, gothic, chamber drama, and so on. Draft & Lens identifies this first, because the standards that apply depend on it. A note that would be fair to one tradition can be unfair to another.',
  },
  lens: {
    gloss: 'A reading of your work through the cognitive frame of a master practitioner.',
    full: "A reading of your work through the cognitive frame of a master practitioner — a way of seeing, not a score. Each lens applies one craftsperson's priorities and blind spots to your pages.",
  },
  verdict: {
    gloss: "The overall assessment, read within the work's own tradition.",
    full: 'The overall assessment — recommend, consider with revisions, or pass — always read within the tradition the work has set for itself, never against a single fixed rulebook.',
  },
  register: {
    gloss: 'The tonal level and texture of the writing — formal, plain, mythic, comic.',
    full: 'The tonal level and texture of the writing — formal or plain, mythic or comic, cool or heated. A consistent register holds the reader; an unmotivated shift in register is felt as a fracture.',
  },
  Campbellian: {
    gloss: 'Following Joseph Campbell’s "hero’s journey" — the mythic departure-trial-return arc.',
    full: 'Following the mythic structure Joseph Campbell described in The Hero with a Thousand Faces — the "monomyth" of a hero who leaves the ordinary world, undergoes trials, and returns transformed. A Campbellian structure leans on call-to-adventure, threshold, ordeal, and return beats.',
    aliases: ["Campbell's monomyth", 'monomyth', "hero's journey"],
  },
  'inciting incident': {
    gloss: 'The event that sets the story in motion and disturbs the status quo.',
    full: "The event that sets the story in motion — the disturbance to the protagonist's normal world that creates the central problem and starts the engine of the plot.",
  },
  midpoint: {
    gloss: "The central turn where the story's direction or meaning shifts.",
    full: 'The structural turn at roughly the middle of a work where the ground shifts — a revelation, reversal, or escalation that recolours everything before it and drives the second half.',
  },
  protagonist: {
    gloss: 'The character whose want and change drive the story.',
    full: 'The character whose pursuit of a want, against rising cost, drives the story — and whose internal change (or failure to change) is its spine.',
  },
  antagonist: {
    gloss: "The force or character opposing the protagonist's want.",
    full: "The force opposing the protagonist — often a person, but it can be a system, the self, or circumstance. The strength of a story's antagonist sets the ceiling on its tension.",
  },
  arc: {
    gloss: 'The trajectory of change a character or story travels from start to end.',
    full: 'The trajectory of change — who a character is at the start, what alters them, and who they are by the end. A legible arc lets the reader measure transformation.',
  },
  spine: {
    gloss: 'The single through-line of want and cost that holds a story together.',
    full: "The single load-bearing line of a story: who wants what, against what cost, pursued to a resolution. If the spine isn't legible, the work reads as episodes rather than a story.",
  },
  'through-line': {
    gloss: "The continuous thread that connects a story's parts into one movement.",
    full: "The continuous thread — of want, question, or theme — that connects a story's parts so they accumulate into one movement rather than a sequence of separate incidents.",
  },
  subtext: {
    gloss: 'Meaning carried beneath the literal words — what is meant but not said.',
    full: 'What is meant but not said — the meaning running beneath the literal dialogue or action. Strong scenes often turn on subtext: characters speaking around the real subject.',
  },
  exposition: {
    gloss: 'Information the audience needs, delivered within the story.',
    full: 'The information the audience needs to follow the story — backstory, world rules, relationships. The craft challenge is delivering it without stalling the drama; the best exposition also reveals character.',
  },
  iceberg: {
    gloss: "Hemingway's principle: most of the meaning sits below the surface, unstated.",
    full: "Hemingway's principle that a story shows only its surface while most of its weight sits unstated below, felt rather than told. What is omitted, if the writer knows it, strengthens what remains.",
    aliases: ['iceberg theory', 'iceberg rule'],
  },
  'in medias res': {
    gloss: 'Opening in the middle of the action rather than at the beginning.',
    full: 'Latin for "into the middle of things" — opening a story already in motion, in the midst of action or crisis, rather than at a chronological beginning, with context filled in later.',
  },
  'non-linear': {
    gloss: 'A story told out of chronological order.',
    full: 'A structure that tells events out of chronological sequence — through flashback, flash-forward, or fractured timelines — usually to control revelation or juxtapose moments for meaning.',
    aliases: ['nonlinear'],
  },
  'frame narrative': {
    gloss: 'A story told inside another story that brackets it.',
    full: 'A story enclosed within another — an outer "frame" (a narrator recounting, a found document) that brackets the inner tale and shapes how it’s read.',
  },
  'unreliable narrator': {
    gloss: "A narrator whose account the reader can't fully trust.",
    full: 'A narrator whose telling cannot be taken at face value — through bias, limited knowledge, self-deception, or design — so the reader must read against the account to find the truth.',
  },
  denouement: {
    gloss: 'The final unwinding after the climax, where threads resolve.',
    full: 'The unwinding after the climax — the section where consequences settle and loose threads resolve. Its length and tone set the feeling the reader leaves with.',
  },
  climax: {
    gloss: "The peak of the story's central tension, where it is decided.",
    full: "The point of highest tension where the central dramatic question is answered — the protagonist's want is won or lost, and the story's pressure is released.",
  },
  stakes: {
    gloss: 'What stands to be gained or lost — why the outcome matters.',
    full: "What the protagonist stands to gain or lose, and why it matters. Stakes that escalate keep tension rising; stakes the audience doesn't feel make events flat regardless of plot.",
  },
  motivation: {
    gloss: 'The want or need that explains why a character acts.',
    full: "The internal want or need that drives a character's choices. Legible, specific motivation makes behaviour feel inevitable rather than authorial.",
  },
  foreshadowing: {
    gloss: 'An early hint that prepares a later development.',
    full: 'An early detail that quietly prepares a later turn, so the payoff feels earned rather than arbitrary when it arrives.',
  },
  "Chekhov's gun": {
    gloss: 'The principle that a planted detail must later pay off.',
    full: "Chekhov's principle that a conspicuous detail — the rifle on the wall — must later be used; nothing should be promised to the audience and then left unfired.",
    aliases: ['Chekhovian'],
  },
  "show, don't tell": {
    gloss: 'Convey through action and image rather than direct statement.',
    full: 'The principle of conveying emotion and meaning through action, behaviour, and image rather than stating it directly — letting the reader infer rather than being told.',
    aliases: ["show don't tell", 'telling not showing', "tell, don't show"],
  },
  allegory: {
    gloss: 'A story whose surface stands for a deeper symbolic meaning.',
    full: 'A narrative whose literal surface systematically stands for something else — moral, political, spiritual — so the story is read on two levels at once.',
    aliases: ['allegorical'],
  },
  naturalism: {
    gloss: 'Unidealised realism observing life closely, often at eye level.',
    full: 'A mode of close, unidealised observation of ordinary life — behaviour rendered at eye level, meaning left implicit, drama drawn from the everyday rather than heightened event.',
    aliases: ['naturalistic'],
  },
  'kitchen-sink': {
    gloss: 'British social realism of ordinary domestic working-class life.',
    full: 'A British social-realist tradition depicting ordinary, often working-class domestic life with unglamorous honesty — the drama of the everyday rather than the exceptional.',
    aliases: ['kitchen sink'],
  },
  'three-act structure': {
    gloss: 'The setup–confrontation–resolution shape of most mainstream drama.',
    full: 'The dominant dramatic shape: Act 1 sets up world and want, Act 2 escalates conflict to a low point, Act 3 resolves. A framework, not a law — many traditions work against it deliberately.',
    aliases: ['three act structure', 'three-act'],
  },
  beat: {
    gloss: 'The smallest unit of dramatic change within a scene.',
    full: 'The smallest unit of dramatic action — a single exchange or shift where something changes. Scenes are built from beats; tracking them reveals where a scene stalls or turns.',
  },
  'set piece': {
    gloss: 'A large, self-contained sequence built for impact.',
    full: 'A large, elaborately staged sequence — an action sequence, a confrontation, a musical number — built as a high point and often the scenes a work is remembered by.',
    aliases: ['set-piece'],
  },
  voice: {
    gloss: 'The distinctive personality and texture of the writing or a character.',
    full: "The distinctive texture and personality of the prose or of a character's speech — word choice, rhythm, attitude. A consistent voice is one of the hardest things to sustain and the easiest for a reader to feel.",
  },
  'tonal consistency': {
    gloss: 'Holding one coherent emotional register across a work.',
    full: 'Maintaining a coherent emotional register across a work, so shifts feel motivated rather than accidental. Tonal whiplash — unearned swings between, say, comedy and horror — breaks immersion.',
  },
  'world-building': {
    gloss: "Constructing the rules, texture, and logic of a story's world.",
    full: "The construction of a story's world — its rules, history, texture, and internal logic — established so that it feels coherent and lived-in rather than convenient to the plot.",
    aliases: ['worldbuilding', 'world building'],
  },
  theme: {
    gloss: 'The underlying idea or question a work explores.',
    full: 'The underlying idea or question a work explores beneath its events — what it is finally about. Strong theme emerges from story rather than being stated over it.',
  },
  pacing: {
    gloss: 'The rate at which story information and tension are released.',
    full: 'The rate at which a story releases information and tension — where it lingers, where it accelerates. Pacing problems are usually proportion problems: weight spent in the wrong places.',
  },
  juxtaposition: {
    gloss: 'Placing two things side by side so their contrast creates meaning.',
    full: 'Placing two elements side by side so their contrast generates meaning — past against present, mythic against mundane. The craft lies in the specificity of each side, not merely the fact of the contrast.',
  },
  motif: {
    gloss: 'A recurring image or element that accrues meaning through repetition.',
    full: 'A recurring image, object, phrase, or situation that accrues meaning through repetition, binding a work together and deepening its theme.',
  },
  catharsis: {
    gloss: "The emotional release the audience feels at a story's resolution.",
    full: "The emotional release — pity, fear, relief — an audience feels as a story's tension resolves. Aristotle's term for the purpose of tragedy's climax.",
  },
  'deus ex machina': {
    gloss: 'An unearned, convenient resolution imposed from outside the story.',
    full: "A contrived resolution where an external force arrives to solve the problem the characters could not — felt as a cheat because it isn't earned by what came before.",
  },
  McGuffin: {
    gloss: 'An object that drives the plot but whose nature barely matters.',
    full: 'A goal or object that motivates the characters and drives the plot while its specific nature is almost irrelevant to the audience — the briefcase everyone is chasing.',
    aliases: ['MacGuffin', 'macguffin'],
  },
  'dramatic irony': {
    gloss: 'When the audience knows something a character does not.',
    full: 'When the audience knows something a character does not, charging ordinary moments with tension or poignancy because we see the gap between what is known and what is acted on.',
  },
  minimalism: {
    gloss: 'A spare style that strips away to essentials and trusts the reader.',
    full: 'A spare aesthetic that strips prose and incident to essentials, trusting the reader to supply what is withheld. Associated with Carver; compression is its core instrument.',
    aliases: ['minimalist'],
  },
};

/** Flat detection index: every term + alias → canonical key, longest phrase first
 *  (so "hero's journey" matches before shorter fragments). */
export function glossaryIndex(): Array<{ phrase: string; key: string }> {
  const entries: Array<{ phrase: string; key: string }> = [];
  for (const key of Object.keys(GLOSSARY)) {
    entries.push({ phrase: key, key });
    for (const alias of GLOSSARY[key]?.aliases ?? []) entries.push({ phrase: alias, key });
  }
  entries.sort((a, b) => b.phrase.length - a.phrase.length);
  return entries;
}
