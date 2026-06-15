import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

/** Genre-specific craft notes appended to mode system prompts. */
export const SCRIPT_GENRE_NOTES = {
  "Auto-detect": "Detect the genre and tonal register from the material. Apply the criteria most relevant to what this script is attempting to be.",
  "Feature Drama": "Prestige drama lives and dies on emotional truth. Every scene must deepen the protagonist's central wound. Exposition must also be character revelation.",
  "Feature Thriller": "Pace is information management. Tension is the gap between what we know and what the character doesn't. Every scene must raise stakes or detonate a planted charge.",
  "Feature Comedy": "Comic timing is structural, not tonal. The funniest version of any situation comes from the maximum collision between character logic and circumstance — Wilder's standard.",
  "Feature Sci-Fi": "World-building must be argument. Every piece of world information must do double duty as character or thematic work. Villeneuve's water glass is the standard.",
  "Feature Horror": "Dread is architectural. Atmosphere precedes threat. O'Bannon withheld the creature for 45 minutes. Evaluate every silence before a threat — is it doing work?",
  "TV Drama Pilot": "Four jobs: establish world, establish protagonist want vs need, plant the season engine, make a standalone dramatic argument for the show.",
  "TV Comedy Pilot": "The pilot must establish its tone so completely that every future episode is already contained inside it.",
  "Short Film": "A short film is a single idea, expressed with complete economy. Unity of effect. What is the one thing this film needs the audience to feel?"
} as const;

export const STORY_GENRE_NOTES = {
  "Auto-detect": "Detect the story's form, tradition, and tonal register. Apply the standards most appropriate to what this story is attempting to be.",
  "Literary Fiction": "Voice must be singular. Apply maximum scrutiny to compression. Every sentence must carry its weight. Poe's unity of effect applies.",
  "Genre Fiction": "Must satisfy genre expectations while surprising within them. The ending the reader didn't predict but immediately recognises as the only right one.",
  "Noir": "The protagonist is implicated in the corruption they're investigating. The question is not whether they will be destroyed but whether they know it.",
  "Magical Realism": "The magic must emerge from the real with the same logic as a dream. Does the magic grow from the specific world of this story, or has it been imported?",
  "Horror": "Establish what is normal and valuable before destroying it. The threat must be specific. Vague dread is weak dread.",
  "Satire": "A clearly identifiable target, a precise instrument of attack, and accuracy of aim. Does the comedy deepen or deflect from the satirical argument?",
  "Coming of Age": "The protagonist ends understanding something they could not have at the beginning — and that understanding has cost them something real."
} as const;

export const PLAY_GENRE_NOTES = {
  "Auto-detect": "Detect the dramatic form and tradition. Apply Aristotelian unities where relevant; assess the play against its own formal ambitions.",
  "Drama": "The stage is a concentrated space — every word must earn its place in spoken performance. Silence and pause are dramatic instruments as powerful as speech.",
  "Comedy": "Stage comedy lives in timing and misdirection. The audience must be surprised even when they know what is coming.",
  "Tragicomedy": "The tonal balance is everything. Where the comedy tips into grief and the grief finds absurdity — that precision is the craft.",
  "Political": "The political argument must be embodied in character, not stated. The play makes its case through what happens, not what is said about what happens.",
  "Absurdist": "The logic of the absurd must be internally consistent. Kafka is not random. Beckett is not random. The meaninglessness must be precise.",
  "Musical": "When does a character sing rather than speak? The song must emerge from the moment the spoken word is insufficient to contain the emotion."
} as const;

export const TREATMENT_GENRE_NOTES = {
  "Auto-detect": "Detect the tradition and tonal register of the film this treatment describes. A treatment is a blueprint — read it in the tradition the eventual film would occupy, and apply the structural questions that tradition demands.",
  "Feature Drama": "A drama treatment lives on the protagonist's want and need and the wound beneath them. The question is whether the spine — the want pursued against rising cost — is legible from the prose, not whether individual scenes are written. Does each beat deepen the central wound?",
  "Feature Thriller": "A thriller treatment must make its engine visible: the central question, the escalation of stakes, the information the audience holds against the protagonist's ignorance. Can you feel the tension ratchet from beat to beat, or is the prose merely reporting events?",
  "Feature Comedy": "A comedy treatment must show the comic engine structurally — the collision between a character's logic and their circumstance. Is the premise generative (does it produce escalating situations) or static (a single joke described at length)?",
  "Feature Sci-Fi": "A sci-fi treatment must establish that the world is argument, not decoration — the central conceit doing double duty as theme. Is the speculative premise load-bearing for the story, or could the same plot run without it?",
  "Feature Horror": "A horror treatment must show the architecture of dread: what is normal and valued before it is threatened, and how the threat escalates. Is the source of fear specific, and does the treatment withhold and reveal with discipline?",
  "TV Drama Pilot": "A pilot treatment must do four things visibly: establish world, establish protagonist want vs need, plant the season engine, and make a standalone dramatic argument for the show. Is the series engine — the thing that generates future episodes — legible from the prose?",
  "Limited Series": "A limited-series treatment must show a complete arc across its episodes — a beginning, middle and end with the shape of a long novel, not an open-ended premise. Is the through-line sustained across the span, and does each episode turn move it forward?",
  "Short Film": "A short-film treatment is a single idea pursued with complete economy — unity of effect. What is the one thing the film needs the audience to feel, and does every beat in the treatment serve it?"
} as const;

export const SCRIPT_GENRES = ["Auto-detect","Feature Drama","Feature Thriller","Feature Comedy","Feature Sci-Fi","Feature Horror","TV Drama Pilot","TV Comedy Pilot","Short Film"] as const;
export const STORY_GENRES = [0] as const;
export const PLAY_GENRES = [0] as const;
export const TREATMENT_GENRES = ["Auto-detect","Feature Drama","Feature Thriller","Feature Comedy","Feature Sci-Fi","Feature Horror","TV Drama Pilot","Limited Series","Short Film"] as const;

export type ScriptGenre = (typeof SCRIPT_GENRES)[number];
export type StoryGenre = (typeof STORY_GENRES)[number];
export type PlayGenre = (typeof PLAY_GENRES)[number];
export type TreatmentGenre = (typeof TREATMENT_GENRES)[number];
