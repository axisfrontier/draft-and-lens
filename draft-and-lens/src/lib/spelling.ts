/**
 * Conservative spell-check — shared, no IP, importable by client and server.
 *
 * DESIGN: this matches against a curated list of KNOWN MISSPELLINGS, not a
 * dictionary. The distinction is the whole feature.
 *
 * A dictionary flags every word it does not contain, which in a novel means
 * every invented name, every place, every rendering of dialect — the writer is
 * handed a wall of false positives about their own vocabulary. A known-
 * misspelling list inverts that: a word is only ever flagged when it can be
 * positively identified as wrong, and anything unfamiliar is silently ignored.
 *
 * INVARIANT, and the reason this is safe: every key in MISSPELLINGS is a
 * NON-WORD in English. No valid word can ever be flagged. When adding entries
 * that property must hold — if a candidate is a real word in any register
 * (British, American, archaic, dialect), it does not belong here. Choosing
 * between two real words is grammar, and grammar-check is explicitly out of
 * scope (handover item 3, 2026-08-02).
 *
 * Consistent with "a reading, not a rewrite": this reports and suggests. It
 * never edits the writer's text.
 */

export interface SpellingFlag {
  /** The misspelling exactly as it appears in the text, original case. */
  readonly found: string;
  /** The correction, case-matched to `found`. */
  readonly suggestion: string;
  /** Character offset into the submitted text — lets the UI locate it. */
  readonly index: number;
  /** A short surrounding span so the writer can recognise the sentence. */
  readonly context: string;
}

/**
 * Known misspellings → correction. Lower-case keys; matching is
 * case-insensitive and the suggestion is re-cased to match what was found.
 *
 * Deliberately not exhaustive. Precision beats coverage: a missed typo is a
 * small disappointment, a false flag on a writer's invented word is a reason
 * to distrust the whole reading.
 *
 * DELIBERATELY EXCLUDED, and why — each of these is a real word, so flagging
 * it would break the invariant above:
 *   judgment / judgement  both correct (US / UK house style)
 *   strait / straight     "strait" is a narrow channel, not a typo
 *   breath / breathe      both real; choosing between them is grammar
 *   agin                  dialect ("agin the law"), not a misspelling of "again"
 *   discreet / discrete   both real, different meanings
 *   its / it's            grammar, and out of scope
 */
export const MISSPELLINGS: Readonly<Record<string, string>> = {
  // High-frequency transpositions
  teh: 'the', adn: 'and', taht: 'that', tihs: 'this', hte: 'the',
  wiht: 'with', woudl: 'would', coudl: 'could', shoudl: 'should',
  yuo: 'you', yoru: 'your', thier: 'their', freind: 'friend',
  beleive: 'believe', recieve: 'receive', percieve: 'perceive',
  acheive: 'achieve', decieve: 'deceive', wierd: 'weird',

  // Doubled / undoubled consonants
  occured: 'occurred', occuring: 'occurring', occurence: 'occurrence',
  begining: 'beginning', comming: 'coming', runing: 'running',
  stoped: 'stopped', dissapear: 'disappear', dissapeared: 'disappeared',
  dissapoint: 'disappoint', embarass: 'embarrass', embarassed: 'embarrassed',
  harrass: 'harass', harrassed: 'harassed', accomodate: 'accommodate',
  reccomend: 'recommend', neccessary: 'necessary', necesary: 'necessary',
  proffesional: 'professional', tommorow: 'tomorrow', tommorrow: 'tomorrow',

  // -ance / -ence / -ant / -ent
  definately: 'definitely', definatly: 'definitely',
  seperate: 'separate', seperated: 'separated', seperately: 'separately',
  independant: 'independent', persistant: 'persistent', existance: 'existence',
  occurance: 'occurrence', apparant: 'apparent', relevent: 'relevant',
  consistant: 'consistent', resistence: 'resistance', diffrent: 'different',
  differnt: 'different', enviroment: 'environment', goverment: 'government',
  arguement: 'argument',

  // Commonly mangled everyday words
  alot: 'a lot', untill: 'until', becuase: 'because', becasue: 'because',
  thruogh: 'through', thorugh: 'through', suprise: 'surprise',
  suprised: 'surprised', supprise: 'surprise', rememeber: 'remember',
  remeber: 'remember', probaly: 'probably', probally: 'probably',
  basicly: 'basically', basicaly: 'basically', finaly: 'finally',
  realy: 'really', usualy: 'usually', actualy: 'actually',
  origional: 'original', similiar: 'similar', familar: 'familiar',
  unfortunatly: 'unfortunately', immediatly: 'immediately',
  completly: 'completely', absolutly: 'absolutely', extremly: 'extremely',
  strenght: 'strength', lenght: 'length', heigth: 'height',
  breif: 'brief', cheif: 'chief', peice: 'piece',
  wheras: 'whereas', wheather: 'whether', aparently: 'apparently',
  charater: 'character', charecter: 'character', langauge: 'language',
  knowlege: 'knowledge', knowlegde: 'knowledge', succesful: 'successful',
  succesfully: 'successfully', sucess: 'success', bussiness: 'business',
  buisness: 'business', calender: 'calendar', cemetary: 'cemetery',
  concious: 'conscious', conciousness: 'consciousness', curiousity: 'curiosity',
  desparate: 'desperate', dilemna: 'dilemma', exagerate: 'exaggerate',
  exagerated: 'exaggerated', gaurd: 'guard', grammer: 'grammar',
  hipocrite: 'hypocrite', ignorence: 'ignorance', liesure: 'leisure',
  maintainance: 'maintenance', maintenence: 'maintenance',
  mischevious: 'mischievous', noticable: 'noticeable', paralell: 'parallel',
  posession: 'possession', prefered: 'preferred', priviledge: 'privilege',
  pronounciation: 'pronunciation', questionaire: 'questionnaire',
  rythm: 'rhythm', rhythem: 'rhythm', saftey: 'safety', scilence: 'silence',
  sieze: 'seize', succesion: 'succession', temperture: 'temperature',
  threshhold: 'threshold', tounge: 'tongue', truely: 'truly',
  vaccum: 'vacuum', vehical: 'vehicle', visable: 'visible',
  wellcome: 'welcome', wispered: 'whispered', wisper: 'whisper',
  sholder: 'shoulder', stomache: 'stomach', straght: 'straight',
  anual: 'annual', apreciate: 'appreciate', athiest: 'atheist',
  awkard: 'awkward', carefull: 'careful', collegue: 'colleague',
  comparision: 'comparison', conciderate: 'considerate',
};

/** Match `suggestion`'s casing to how the misspelling actually appeared. */
function matchCase(found: string, suggestion: string): string {
  if (found === found.toUpperCase() && found.length > 1) return suggestion.toUpperCase();
  const first = found[0];
  if (first !== undefined && first === first.toUpperCase()) {
    return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
}

/** Cap on returned flags — a wall of corrections reads as a grading, not a reading. */
export const MAX_SPELLING_FLAGS = 40;

/** Characters of surrounding text kept either side, so the writer can locate it. */
const CONTEXT_RADIUS = 40;

function contextAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - CONTEXT_RADIUS);
  const end = Math.min(text.length, index + length + CONTEXT_RADIUS);
  const lead = start > 0 ? '…' : '';
  const tail = end < text.length ? '…' : '';
  return `${lead}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${tail}`;
}

/** True when the character at `index` opens the text or follows sentence-ending punctuation. */
function startsSentence(text: string, index: number): boolean {
  for (let i = index - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === undefined) return true;
    if (/\s/.test(ch)) continue;
    if (/["'“”‘’(\[]/.test(ch)) continue;
    return /[.!?…]/.test(ch);
  }
  return true;
}

/**
 * Find high-confidence misspellings in the writer's text.
 *
 * Two guards keep this quiet, both deliberately biased toward saying nothing:
 *
 * 1. Only words on the curated list are considered at all (see above).
 * 2. A capitalised occurrence that is NOT at the start of a sentence is
 *    skipped, because it is more likely a proper noun than a typo — a
 *    character named "Wisper" should never be corrected to "whisper", while
 *    "Wisper" opening a sentence is still caught.
 */
export function findMisspellings(text: string): SpellingFlag[] {
  const flags: SpellingFlag[] = [];
  if (!text) return flags;

  // Unicode-aware word matcher: letters and apostrophes only.
  const wordPattern = /[\p{L}][\p{L}']*/gu;
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(text)) !== null) {
    if (flags.length >= MAX_SPELLING_FLAGS) break;

    const found = match[0];
    const suggestion = MISSPELLINGS[found.toLowerCase()];
    if (suggestion === undefined) continue;

    const firstChar = found[0];
    const isCapitalised =
      firstChar !== undefined &&
      firstChar === firstChar.toUpperCase() &&
      firstChar !== firstChar.toLowerCase();

    if (isCapitalised && !startsSentence(text, match.index)) continue;

    flags.push({
      found,
      suggestion: matchCase(found, suggestion),
      index: match.index,
      context: contextAround(text, match.index, found.length),
    });
  }

  return flags;
}
