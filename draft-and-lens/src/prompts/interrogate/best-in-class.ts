import 'server-only';

import type { LensId } from '../lenses/types';

/**
 * §21c best-in-class standards — one per lens, the canonical copy.
 *
 * THIS MODULE IS THE SOURCE, not the markdown. `DraftAndLens_BestInClass_Research.md`
 * at the repo root is the human-readable research it was written from and stays
 * as documentation; it cannot be the runtime source, because it sits a level
 * above the Next app and is never traced into the deployment — reading it with
 * `fs` would work locally and fail in production. Prompt IP also belongs under
 * `src/` behind `server-only`, where the bundle grep can prove it never reaches
 * a browser. Nenad's ruling, 2026-08-26.
 *
 * The two are kept in step by tests/prompts/best-in-class-research.test.ts,
 * which checks module, markdown and LENS_IDS against each other. Edit the
 * module first; the markdown follows.
 *
 * WHAT THESE ARE FOR. Push harder promises a writer the standard their own
 * tradition sets for itself. These are tradition-specific observations — never
 * a rubric, never a score. The research states three constraints and all three
 * are enforced in directive.ts rather than trusted to the model:
 *   1. the tradition is known before any standard is applied (Brain 1 matches
 *      the lens; the analyst is never asked to choose its own);
 *   2. the standard is SUPPRESSED on excerpts — it is a whole-work standard,
 *      and a passage held against a finished book is not a fair reading;
 *   3. it frames questions, never verdicts.
 */

export const BEST_IN_CLASS: Record<LensId, string> = {
  hemingway: `WHAT THE STRONGEST WORK DOES: The dignity of movement beneath the surface is felt, not explained. The best Hemingway-tradition work trusts the reader completely — nothing is signposted, nothing is protected. Competent work omits explanation. Best-in-class omits explanation AND earns the omission through the precision of what remains. The concrete details carry the entire emotional weight.

THE STANDARD: Every object, every gesture, every line of dialogue earns its place by doing double duty — surface meaning and something deeper, simultaneously.`,

  carver: `WHAT THE STRONGEST WORK DOES: The compression is load-bearing, not decorative. Every omission creates pressure — the reader feels what isn't said more acutely than what is. The strongest Carver-tradition work achieves what Carver called "menace" — a sense that something terrible is close, never named. Competent work in this tradition is merely sparse. Best-in-class is sparse and pressurised.

THE STANDARD: The white space does work. Silence is a character. The ending doesn't resolve — it lands, which is different.`,

  chekhov: `WHAT THE STRONGEST WORK DOES: The character's self-understanding is limited in specific, revealing ways. The gap between what the character believes about themselves and what the reader sees is the engine of the story. Competent work shows characters being wrong. Best-in-class shows characters being wrong in ways that illuminate something true about how people protect themselves from their own lives.

THE STANDARD: The story earns its ending by making it inevitable in retrospect and surprising in the moment. The gun on the mantelpiece fires, but not the way anyone expected.`,

  oconnor: `WHAT THE STRONGEST WORK DOES: The violence or grotesquerie is spiritually purposeful — it breaks through surfaces that need breaking. O'Connor's own phrase: "to the hard of hearing you shout, and for the almost-blind you draw large and startling figures." Competent work in this tradition is shocking. Best-in-class is shocking AND illuminating — the moment of violence or revelation carries genuine grace.

THE STANDARD: The grotesque detail is not there for atmosphere. It is there because it is the only way to say what the story needs to say.`,

  bukowski: `WHAT THE STRONGEST WORK DOES: The flatness of the tone is doing moral work. The best work in this tradition refuses sentimentality so completely that emotion, when it arrives, is devastating. Competent work is tough and unsentimental. Best-in-class is tough, unsentimental, AND has a moment of unguarded feeling that the tone makes unbearable.

THE STANDARD: The poem or story earns one moment of openness by surrounding it with total refusal.`,

  nabokov: `WHAT THE STRONGEST WORK DOES: The prose style is itself a form of moral argument. The beauty of the language implicates the reader in ways that plain prose could not. Competent work in this tradition is beautiful and unreliable. Best-in-class is beautiful AND the beauty is morally complex — the reader's pleasure in the prose is part of what the work is about.

THE STANDARD: The style is not decoration. It is the subject.`,

  coppola: `WHAT THE STRONGEST WORK DOES: The personal and the institutional are inseparable — the family IS the institution, and the corruption of one is the corruption of the other. Competent work in this tradition is powerful and operatic. Best-in-class makes the operatic scale feel intimate.

THE STANDARD: The most important moment in the film is a small, private one.`,

  wenders: `WHAT THE STRONGEST WORK DOES: The physical journey externalises an internal state — the landscape becomes the character's emotional condition. Competent work in this tradition is atmospheric and wandering. Best-in-class makes you feel the specific quality of loneliness or longing it is about.

THE STANDARD: The journey is not metaphor. It is the thing itself.`,

  spielberg: `WHAT THE STRONGEST WORK DOES: The emotional manipulation is transparent AND effective — the viewer knows exactly what is being done to them and feels it anyway. Competent work in this tradition is emotionally affecting. Best-in-class is emotionally affecting in a way that the viewer cannot quite defend against, even knowing the mechanics.

THE STANDARD: The craft is so precise that knowledge of the craft does not protect you from it.`,

  coens: `WHAT THE STRONGEST WORK DOES: The cosmic indifference is funny AND terrifying in the same moment. Competent work in this tradition is darkly comic. Best-in-class makes you laugh at something that, a beat later, reveals itself as genuinely bleak.

THE STANDARD: The joke and the tragedy are the same thing.`,

  villeneuve: `WHAT THE STRONGEST WORK DOES: The pacing creates a physical sensation — the viewer feels the weight of what is coming before it arrives. Competent work in this tradition is slow and atmospheric. Best-in-class is slow, atmospheric, AND the slowness is doing specific emotional work — building a particular quality of dread or wonder that faster pacing could not achieve.

THE STANDARD: The silence is not absence. It is presence of a specific kind.`,

  scott: `WHAT THE STRONGEST WORK DOES: The world feels inhabited — there is texture and history to every corner of the frame, and the human story is made larger by the scale rather than dwarfed by it. Competent work in this tradition builds impressive worlds. Best-in-class builds worlds in which the human drama is clarified rather than overwhelmed.

THE STANDARD: The scale is in service of the story, not the other way around.`,

  welles: `WHAT THE STRONGEST WORK DOES: Every formal choice — framing, shadow, composition — carries thematic weight. Competent work in this tradition is visually striking. Best-in-class is visually striking AND every striking choice means something beyond its visual effect.

THE STANDARD: The style is not showing off. The style is argument.`,

  jeunet: `WHAT THE STRONGEST WORK DOES: The stylisation has an emotional logic — the heightened world reflects how the protagonist experiences reality, not just how the director wants it to look. Competent work in this tradition is charming and inventive. Best-in-class is charming, inventive, AND the charm is the character's defence mechanism — which the story eventually dismantles.

THE STANDARD: The whimsy is not decoration. It is characterisation.`,

  tarantino: `WHAT THE STRONGEST WORK DOES: The genre awareness is so complete that the work transcends the genres it references — it is not pastiche but something new made from familiar materials. Competent work in this tradition is knowing and referential. Best-in-class is knowing, referential, AND arrives somewhere that the references alone could not predict.

THE STANDARD: The ending earns its emotion despite — or because of — the ironic frame.`,

  wachowski: `WHAT THE STRONGEST WORK DOES: The philosophical concept is dramatised, not explained — the audience understands the idea through what happens to the characters, not through dialogue about it. Competent work in this tradition is ideas-driven. Best-in-class makes the ideas physical.

THE STANDARD: The concept and the emotion are the same thing.`,

  sorkin: `WHAT THE STRONGEST WORK DOES: The speed and wit of the dialogue is not just style — it dramatises characters thinking at their best, under pressure, in real time. The best Sorkin-tradition work makes intelligence itself the source of drama: characters win or lose based on how well they argue, not just what they do. Competent work in this tradition has fast, smart dialogue. Best-in-class makes the speed of the dialogue feel like the character's mind racing to solve a real problem live, in front of the reader.

THE STANDARD: The walking-and-talking isn't decoration. The talking is the plot.`,

  puzo: `WHAT THE STRONGEST WORK DOES: The moral logic of the criminal world is internally coherent and almost persuasive — the reader understands, even as they recoil, why these characters believe what they believe. Competent work in this tradition depicts organised crime. Best-in-class makes the code of loyalty and honour within that world feel like a real, complete value system, not a corruption of a "normal" one.

THE STANDARD: The family's logic makes sense from the inside. That is what makes it frightening.`,

  roth: `WHAT THE STRONGEST WORK DOES: The protagonist's intellectual self-justification is rendered in full — and then undercut, not by the narrator but by events. The best work in this tradition lets the character be brilliant and wrong simultaneously. Competent work gives us a smart, conflicted protagonist. Best-in-class gives us a smart, conflicted protagonist whose intelligence is part of what makes him impossible.

THE STANDARD: The prose is so alive with the character's mind that the reader almost agrees with him — and then doesn't.`,

  bruckheimer: `WHAT THE STRONGEST WORK DOES: The spectacle serves a genuine emotional throughline — the action sequences advance character, not just plot. Competent work in this tradition is exciting. Best-in-class is exciting AND you care who wins.

THE STANDARD: The stakes are personal before they are global.`,

  feige: `WHAT THE STRONGEST WORK DOES: The individual story works completely on its own terms AND earns its place in the larger architecture. Competent work in this tradition services the franchise. Best-in-class services the franchise while telling a story that would stand alone.

THE STANDARD: The film can be watched by someone who has seen nothing else and still lands.`,

  lucas: `WHAT THE STRONGEST WORK DOES: The archetypal structure is inhabited rather than illustrated — the hero's journey is felt as lived experience, not recognised as a pattern. Competent work in this tradition follows the structure. Best-in-class makes you forget it is a structure at all.

THE STANDARD: The myth feels personal. The universal feels specific.`,

  king: `WHAT THE STRONGEST WORK DOES: The horror is earned by the normalcy that precedes it — the reader is embedded in a world so recognisable that the intrusion of the monstrous is genuinely disturbing. Competent work in this tradition is frightening. Best-in-class makes the familiar terrifying by revealing what was always wrong with it.

THE STANDARD: The monster is not the worst thing in the book. The worst thing is what the monster reveals about the people.`,

  fey: `WHAT THE STRONGEST WORK DOES: The comic persona is specific enough to be surprising but recognisable enough to be true. Best-in-class Fey-tradition work makes you laugh and then slightly embarrasses you by how accurately it named something you'd rather not have named.

THE STANDARD: The joke is also an observation. The observation is also a confession.`,

  miyazaki: `WHAT THE STRONGEST WORK DOES: The fantasy world operates by its own consistent logic, and within that logic, the emotional stakes are completely real. Competent work in this tradition is beautiful and imaginative. Best-in-class is beautiful, imaginative, AND the imagination is in service of something emotionally true that the real world could not contain.

THE STANDARD: The child character is never talked down to. The world treats them as capable of genuine moral seriousness.`,

  kaufman: `WHAT THE STRONGEST WORK DOES: The structural self-consciousness is emotionally purposeful — the form breaking is not cleverness but necessity. Competent work in this tradition is formally inventive. Best-in-class is formally inventive AND the formal invention is the only way to say what the script is about.

THE STANDARD: The structure is not a container for the story. The structure IS the story.`,

  simon: `WHAT THE STRONGEST WORK DOES: The jokes reveal character — each punchline tells you something true about who is speaking. Competent work is funny. Best-in-class is funny AND the humour is the character thinking out loud in their most characteristic way.

THE STANDARD: You could identify who said each line without a name attached.`,

  chandler: `WHAT THE STRONGEST WORK DOES: The detective's moral clarity is the only fixed point in a corrupt world — and the plot is a test of whether that clarity can survive contact with how things actually are. Competent work in this tradition is atmospheric and hard-boiled. Best-in-class makes the atmosphere a moral condition, not just a visual one.

THE STANDARD: The city is a character. The detective's relationship with it is the love story.`,

  leonard: `WHAT THE STRONGEST WORK DOES: The dialogue carries the plot, the character, and the theme simultaneously — and sounds like nothing but itself. Competent work in this tradition has good dialogue. Best-in-class has dialogue so precisely voiced that a character's speech pattern IS their character — you know who they are by how they talk before you know anything else about them.

THE STANDARD: Every character sounds like nobody else. The plot happens in the talk.`,

  highsmith: `WHAT THE STRONGEST WORK DOES: The reader's identification with a character who should not be sympathetic is not a trick — it is the moral argument. The best Highsmith-tradition work makes the reader complicit in ways they cannot quite account for. Competent work creates unease. Best-in-class creates unease AND implication.

THE STANDARD: By the end, the reader has wanted something they should not have wanted. The story made them want it honestly.`,

  leguin: `WHAT THE STRONGEST WORK DOES: The invented world or society is used to genuinely defamiliarise something about how we actually live — not as allegory with the serial numbers filed off, but as a real thought experiment that could only be run this way. Competent work in this tradition builds an interesting alternative world. Best-in-class builds a world whose internal logic forces a real reconsideration of something taken for granted.

THE STANDARD: The speculative element is not a costume on a familiar story. It is the only way to ask the question the story is asking.`,

  christie: `WHAT THE STRONGEST WORK DOES: The puzzle is fair — every clue is present, the reader could have solved it — and also genuinely surprising. The best Christie-tradition work gives the reader the satisfaction of having been fooled by something that was in plain sight. Competent work hides the solution. Best-in-class hides it in full view.

THE STANDARD: The reveal reframes everything that came before without contradicting it. The clues were all there. They meant something different.`,

  morrison: `WHAT THE STRONGEST WORK DOES: The weight of history is present in the prose itself — sentence rhythm, structure, and voice carry the past into the present tense of the story, rather than the past being explained or summarised. Competent work in this tradition addresses historical trauma. Best-in-class makes the reader feel the historical trauma as a live pressure on the present moment of the narrative, not as backstory.

THE STANDARD: The past is not behind the story. It is inside every sentence of it.`,

  ferrante: `WHAT THE STRONGEST WORK DOES: The narrator's self-knowledge is radically honest about its own limits. The best Ferrante-tradition work holds the narrator simultaneously sympathetic and culpable — the reader sees what the narrator cannot or will not see, without the narrator becoming a villain. Competent work is confessional. Best-in-class is confessional AND structurally honest about confession's limits.

THE STANDARD: The narrator is right about how she feels and wrong about what it means. The gap is the story.`,

  blume: `WHAT THE STRONGEST WORK DOES: The interior life of the young protagonist is taken completely seriously — no adult condescension, no winking over the child's head at the reader. The best Blume-tradition work treats the confusions and fears of adolescence as genuinely significant, not as something to be outgrown and laughed at later. Competent work in this tradition is age-appropriate and honest. Best-in-class is honest about things adults prefer not to say plainly to young readers, and trusts the reader to handle that honesty.

THE STANDARD: Nothing is softened for the reader's comfort. It is softened, if at all, for the reader's understanding.`,
};
