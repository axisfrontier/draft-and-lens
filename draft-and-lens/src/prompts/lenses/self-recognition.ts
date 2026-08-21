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
 * PLACEHOLDER COPY in the sense every writer-facing string here is: written to
 * be in the right register so the shape can be judged, and Nenad's to approve.
 */
export const LENS_SELF_RECOGNITION: Record<LensId, string> = {
  hemingway: "This one is mine. It was true when I wrote it. Show me yours.",
  carver: "That's mine. I cut it to the bone years ago. I'd rather see yours.",
  chekhov: "You have handed me my own pages. Bring me something of yours — that is the more interesting proposition.",
  oconnor: "This is my own, and I know precisely where the violence lands. Show me yours instead.",
  bukowski: "This one's mine. I know what it cost me. Go on — give me something you wrote.",
  nabokov: "I recognise the sentence; I made it, and rather carefully. Bring me one of yours and I shall attend to it properly.",
  coppola: "This is mine. I have argued with it for years. Let me see yours.",
  wenders: "I know this road. I made it. Show me where yours goes.",
  spielberg: "This one's mine — I know every beat before it lands. I'd much rather see what you've made.",
  coens: "That's ours. We know how it ends, and it isn't well. Bring us yours.",
  villeneuve: "This is mine. I already know its silences. Show me yours.",
  scott: "I built this world. Show me yours — that's the one I haven't seen.",
  welles: "You have handed me my own work. Flattering. Now show me yours.",
  jeunet: "This is mine — I remember every small object in it. Bring me yours.",
  tarantino: "That's mine. I wrote every word of it and I could talk about it all day, which is exactly why you should show me yours instead.",
  wachowski: "This is ours. We already know what it's asking. Show us yours.",
  sorkin: "That's mine. I know what everyone says next and I know why. Let's look at yours.",
  puzo: "This is mine. I know what it cost the family. Show me what you've written.",
  roth: "This is mine. I have lived in it long enough. Let me see yours.",
  bruckheimer: "That's mine — I know what it opened to. Show me yours.",
  feige: "That one's ours. I know exactly where it fits. Show me yours.",
  lucas: "This is mine. The shape of it is already settled. Show me yours instead.",
  king: "This is mine — I'd know it anywhere, warts and all. Now show me yours.",
  fey: "That's mine. I'd know that joke anywhere; I've apologised for it. Show me yours.",
  miyazaki: "This is my own. I would rather see what you have made.",
  kaufman: "This is mine, which is a strange thing to be handed by someone else. Show me yours instead — that one I haven't already failed at.",
  simon: "That's mine. I know which institution eats him. Show me yours.",
  chandler: "This is mine. I'd know the smell of it in the dark. Bring me yours.",
  leonard: "That's mine. Show me yours — I'll tell you if it moves.",
  highsmith: "This is mine. I know exactly what he does next, and I don't forgive him for it. Show me yours.",
  leguin: "These are my own words. Bring me yours; that is the better book to be reading.",
  christie: "This is mine, and I know who did it. Show me yours — I do enjoy not knowing.",
  morrison: "This is my own. I would rather hear you.",
  ferrante: "This is mine. Show me yours — I want to hear how you say it.",
  blume: "This one's mine. I'd much rather read yours — tell me what you're working on.",
};
