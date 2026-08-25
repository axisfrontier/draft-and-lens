import 'server-only';

import type { LensId } from './types';

/**
 * What a lens says when it is handed its own work.
 *
 * THE MOMENT THIS EXISTS FOR. A writer can reach the lens grid with published
 * prose — the provenance gate asks rather than refuses, so someone who
 * answered "it's mine" gets a reading, and can then ask Carver to read Carver.
 * The generic hold is wrong there twice over: it breaks the voice the writer
 * came for, and it says "I think I've read this before" when the honest thing
 * is "I wrote it".
 *
 * EVERY LINE DOES THE SAME THREE THINGS, in that voice's own register:
 * acknowledges the work as its own, declines to read it, and asks for the
 * writer's instead. The last part matters most — the moment must return the
 * writer to their own work rather than end in a refusal, which is the same
 * instinct behind the fragment redirect.
 *
 * They are short on purpose. A lens performing at length about its own
 * authorship is a party trick, and the writer came here for a reading.
 *
 * NO SHARED CLOSING FORMULA. Until 2026-08-25, seventeen of these thirty-five
 * closed on the identical sentence "Show me yours." Each read well alone;
 * together they were a template, and it showed in the one place it must not —
 * a writer trying several lenses in a session met the same sign-off from
 * several supposedly distinct minds, which is the opposite of what /about
 * promises them. Every closing now comes from that voice's own preoccupation.
 * Two tests in tests/prompts/lens-self-recognition.test.ts guard the aggregate,
 * because every per-line test passed while the template was in place.
 *
 * APPROVAL STATUS, precisely:
 *   • the CLOSING of 21 lines — approved by Nenad, 2026-08-25, as written.
 *   • the ACKNOWLEDGEMENT half of those 21 — reviewed and deliberately left
 *     unchanged, but never separately approved. Two are known-weak and were
 *     raised with him: king's "warts and all" is a worn idiom, and roth's "I
 *     have lived in it long enough" would sit under a dozen other names. He
 *     saw alternatives for both and chose to keep these. Do not "fix" them.
 *   • the 14 lines untouched on 2026-08-25 — still unapproved copy, live.
 *     Inventory in SESSION_LOG.md.
 */
export const LENS_SELF_RECOGNITION: Record<LensId, string> = {
  hemingway: "This one is mine. It was true when I wrote it. Give me a true one of yours.",
  carver: "That's mine. I cut it to the bone years ago. I'd rather see what you haven't cut yet.",
  chekhov: "You have handed me my own pages. Bring me something of yours — that is the one I should like to read.",
  oconnor: "This is my own, and I know precisely where the violence lands. Bring me yours — I don't yet know where it lands.",
  bukowski: "This one's mine. I know what it cost me. Go on — give me something you wrote.",
  nabokov: "I recognise the sentence; I made it, and rather carefully. Bring me one of yours and I shall attend to it properly.",
  coppola: "This is mine. I have argued with it for years. Let me see yours.",
  wenders: "I know this road. I made it. Show me where yours goes.",
  spielberg: "This one's mine — I know every beat before it lands. I'd much rather see what you've made.",
  coens: "That's ours. We know how it ends, and it isn't well. Bring us yours.",
  villeneuve: "This is mine. I already know its silences. Let me hear yours.",
  scott: "I built this world. Take me into yours — that's the one I haven't seen.",
  welles: "You have handed me my own work. Flattering. Now yours — and I shall decide how much of it to believe.",
  jeunet: "This is mine — I remember every small object in it. Bring me yours.",
  tarantino: "That's mine. I wrote every word of it and I could talk about it all day, which is exactly why you should hand me yours and let me talk about that instead.",
  wachowski: "This is ours. We already know what it's asking. Show us yours.",
  sorkin: "That's mine. I know what everyone says next and I know why. Let's look at yours.",
  puzo: "This is mine. I know what it cost the family. Show me what you've written.",
  roth: "This is mine. I have lived in it long enough. Send me yours — tell me what it can't quite say.",
  bruckheimer: "That's mine — I know what it opened to. Give me your first ten minutes.",
  feige: "That one's ours. I know exactly where it fits. Yours now — I don't know yet what it sets up.",
  lucas: "This is mine. The shape of it is already settled. Send me yours, while its shape can still move.",
  king: "This is mine — I'd know it anywhere, warts and all. Now yours — who's in it?",
  fey: "That's mine. I'd know that joke anywhere; I've apologised for it. Now yours — I haven't regretted that one yet.",
  miyazaki: "This is my own. Let me see yours instead, with the quiet parts left in.",
  kaufman: "This is mine, which is a strange thing to be handed by someone else. Give me yours instead — I haven't failed at that one yet.",
  simon: "That's mine. I know which institution eats him. Yours now — tell me what it's up against.",
  chandler: "This is mine. I'd know the smell of it in the dark. Bring me yours.",
  leonard: "That's mine. Put yours down in front of me — I'll tell you if it moves.",
  highsmith: "This is mine. I know exactly what he does next, and I don't forgive him for it. Find me someone new to not forgive.",
  leguin: "These are my own words. Bring me yours; that is the better book to be reading.",
  christie: "This is mine, and I know who did it. Yours next — I do enjoy not knowing.",
  morrison: "This is my own. I would rather hear you.",
  ferrante: "This is mine. Now yours — I want to hear how you say it.",
  blume: "This one's mine. I'd much rather read yours — tell me what you're working on.",
};
