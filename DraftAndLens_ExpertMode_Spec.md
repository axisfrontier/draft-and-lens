# Draft & Lens — Expert View Specification
## A design spec for the "translated vs. untranslated" reading toggle
## Written June 2026 · pairs with Architecture v6 (§17, §19) and LearnedCorpus v2.3

> Status: DESIGN SPEC — not yet built. Post-Stage-E feature. This defines what Expert View is, why it exists, how it explains itself, and what it must never become. It does not specify implementation; it specifies behaviour and intent for a later build.

---

## 1 · THE CORE PRINCIPLE (the one idea everything serves)

**Expert View is the same reading, less translated — not a smarter, longer, or harsher one.**

The default reading teaches craft as it goes: it names a device, then explains it ("this is a *flashforward* — a scene out of chronological order — and here it…"). Expert View assumes the reader already holds the vocabulary, drops the explanation, and reinvests those words in *depth* — more precise tradition placement, finer craft distinctions, best-in-class anchoring, visible disagreement.

It is NOT:
- a deeper *analysis* (the underlying reading is identical — same brains, same pipeline, same judgement)
- a *harsher* reading (tone is unchanged; honesty is already the default's job)
- a *longer* reading (denser per note, braver in judgement — never more notes; see §6)
- a *better* reading (this framing is load-bearing — see §2)

The default is not the dumbed-down version. It is the *translated* version. Translation is a feature, not a concession. This distinction is the spec's spine.

---

## 2 · WHY IT MUST BE "TRANSLATED VS. UNTRANSLATED," NOT "BEGINNER VS. EXPERT"

A "beginner/expert" framing implies a hierarchy and sorts the writer into a tier. It makes an amateur feel small and makes the default feel lesser. Both are false to what is actually happening and both are bad for the writer.

The honest framing: **same intelligence, different amount of explanation.** This:
- lets an amateur who thinks at a high level (e.g. the founder) move freely between modes without being "demoted"
- reframes Expert View as *a place to grow into*, not a gate that locks people out
- keeps the default reading dignified — it is the full reading, simply with the craft terms explained

Everywhere this feature surfaces in copy, it uses the language of translation, not rank. Never "upgrade to expert." Always "the same reading, with the craft terms left untranslated."

---

## 3 · WHAT AN EXPERT WANTS, PER TRADITION (the substance of the depth)

Drawn from how professional readers/editors actually work (script coverage operates at story *architecture*, not line-nitpicking; the best notes are truthful not flattering; they pinpoint specific examples without drowning the reader). Expert View deepens along these axes, differently per tradition:

**Screenwriting**
- Structure named precisely: sequence method, set-piece logic, midpoint reversal, act-out beats, try/fail cycles — not "the middle sags."
- Scene analysis by objective and subtext; what each scene is *arguing about*.
- Comp/market literacy in register terms ("this sits in the Lanthimos register, not A24-quirk").
- No format hand-holding (assumes the writer knows sluglines, action density conventions).

**Prose fiction**
- Free indirect discourse, focalisation, psychic distance (the Gardner ladder), where the iceberg is *working* vs. merely withholding.
- Line-level: syntax, rhythm, sentence architecture — read as deliberate instruments.
- Tradition placed exactly, not by label (see §5 — the Carver example).

**Stage play**
- Dramatic action vs. activity; subtext as the primary instrument.
- What is *performable* vs. literary; the line as spoken, not read.
- The contract the play makes (naturalist / Brechtian / absurdist) and whether it keeps it.

**The constant across all three:** name the tradition with precision, judge against *that tradition's ceiling*, use the craft vocabulary without defining it, work at architecture not surface.

---

## 4 · THE CUTTING-EDGE / MENTORSHIP LAYER (what sets D&L apart)

Expert View is where D&L's editorial-mentor intelligence shows most. Four behaviours, all already anticipated in the Architecture roadmap (§21) and corpus:

1. **Best-in-class anchoring.** Name the specific practitioner whose ceiling the work reaches toward, and where it falls from it. "Your compression is doing Carver's work here; where it slackens it becomes Hemingway-imitative." (Ties to §5.4 best-in-class research — required before this ships.)

2. **The interrogation register (opt-in within Expert).** Expert readers can take the question the default holds back: *was this ambition worth attempting?* Shows best-in-class for the tradition, never an external rubric. (Ties to Interrogate mode, §5.3 — must NOT become rubric-imposition.)

3. **Visible disagreement.** Expert writers want to see where the editor's read is *contestable*, not a smoothed consensus. Surface the tension between the editor's reading and the lenses, and within the reading itself ("a more orthodox reader would fault X; I think it earns its place because Y").

4. **Diagnostic confidence.** Mark the reading's own certainty ("high confidence on tradition; the genre signal is mixed"). Experts trust a reader who marks uncertainty. This also serves the epistemic-honesty law — never conclude beyond what was read.

---

## 5 · THE "DISCUSSION + SAMPLER, NOT A VERDICT" BEHAVIOUR (the key user insight)

A writer does not want to be told two characters in a scene are *wrong*. They want to know *why* — the underlying structural problem — and to discuss the directions out of it, possibly restructuring to suit. This is the single most important behaviour Expert View deepens, and it is the editorial-mentorship mindset in practice.

**The behaviour:** when a note identifies a problem, it (a) explains the *underlying* cause (not just the symptom), and (b) where appropriate, offers a brief **illustrative sampler showing a direction** — per LearnedCorpus v2.3 "Illustrative Examples": an option, not a correction, never a full rewrite. The sampler shows *a way it could go*, opening a discussion, not closing one.

**Worked example — tradition precision + glossary depth (the Carver case):**
Surface note (Expert View, untranslated): *"This isn't minimalism in general — it's reaching for Carver-via-Lish, not later-Carver."*

What that means, and how D&L surfaces it: the named terms are **glossary-linked** (§19). One tap unfolds the elaboration:
- **Carver-via-Lish** — Carver's early, severe "minimalism" was substantially shaped by his editor Gordon Lish, who cut radically (sometimes ~50%), producing a hard, affectless surface with emotion almost fully withheld.
- **later-Carver** — after breaking with Lish (e.g. *Cathedral*), Carver's restraint kept its economy but admitted warmth and more visible feeling.
- The actionable note: "you're writing Lish-severe, but the ending wants later-Carver warmth" tells the writer exactly what to adjust — a direction, not a verdict.

This single example *is* the expert-mode thesis: **maximal precision on the surface, infinite depth one tap beneath, via the existing glossary.** It is also why the glossary-link mechanic is non-negotiable for this feature (§7).

---

## 6 · THE DISCIPLINE — WHAT EXPERT VIEW MUST NOT BECOME

Professional coverage is explicit that drowning a reader in every minor issue is *bad* feedback. Expert View must hold the line:

- **Denser and braver, NOT longer.** Same number of notes (or fewer), each sharper. Never "expert = more nitpicks."
- **Architecture over surface.** Line-level notes only where they carry weight; the centre of gravity stays on story/structure/voice.
- **Never an external rubric.** Judges against the work's own tradition and ceiling — never a universal "good writing" checklist. (The whole point of D&L.)
- **The reading underneath is identical.** Expert View must not silently run a different or "harder" analysis — it re-presents the same pipeline output with less translation and more surfaced depth. (Build consequence: this is a presentation/prompt-register layer over the same brains, NOT a separate analysis pass. To be confirmed at build: whether the depth deltas — best-in-class, confidence, surfaced disagreement — are already in the analyst output and merely revealed, or require a register parameter on the same reading. Either way, NOT a second, harsher pipeline.)

---

## 7 · HOW IT EXPLAINS ITSELF (the handholding — first-class, not a footnote)

The founder's own worry — an amateur feeling locked out of, or lost in, the advanced section — is designed *for*, not around. Three escalating layers, none of them blocking:

**Layer 1 — the toggle's own microcopy.** Beside the toggle, one honest line, not just a label:
> *"The same reading, with the craft terms left untranslated and the analysis taken deeper. Written for readers who already speak the language."*
This sentence alone does most of the work: it tells the writer exactly what they are opting into and why the default is not lesser.

**Layer 2 — a first-time intro panel.** The first time anyone flips it, a short, dismissible panel:
> *Expert View shows the same reading of your work — the same judgement, the same pipeline — but it leaves the craft vocabulary untranslated and takes the analysis deeper: tradition named precisely, best-in-class anchoring, where the reading is contestable. It is not a better reading. It is the same one, with less explaining.*
> *If a term is unfamiliar, every craft word links to the glossary. Expert View is a place to grow into, not a gate.*
The last line is the emotional core: it reframes the feature as an invitation.

**Layer 3 — live inline glossary links.** Every craft term in Expert output is a glossary link (§19 system already exists). So an amateur *can* read Expert View — they tap the terms they don't know. The handholding is ambient, on-demand, never interrupting the line. This is what makes "no dumbing down" and "no locking out" both true at once.

**The growth path this enables:** a writer (the founder included) might read in Expert View *with the glossary open* — learning the vocabulary by encountering it in real notes about their own work. Expert View thus becomes a teaching surface, not just a denser one. This is the editorial-mentorship mindset realised in the UI.

---

## 8 · OPEN QUESTIONS FOR BUILD (flagged, not resolved)

- Is Expert View a per-reading toggle, a persistent account preference, or both? (Lean: both — a session toggle that can be set as default.)
- Does the depth (best-in-class, confidence, disagreement) already exist in the analyst output and get *revealed* by Expert View, or does Expert View pass a register parameter to the analyst? (§6 — must not become a separate harsher pipeline either way. Resolve by auditing current analyst output first.)
- Tier placement: is Expert View free, or a paid capability? (Note the §07 pricing strategy and the "free tier never hobbled" principle — Expert View is arguably a presentation preference, not a capability gate, which argues for free. To decide.)
- Interaction with the §5.3 Interrogate mode and §5.2 Mentor taster — Expert View is the natural home for both, but they are independently gated. Confirm the layering.

---

## 9 · ONE-LINE SUMMARY

Expert View is the same honest reading with the craft terms left untranslated and the analysis taken deeper — framed as translation not rank, explained by honest microcopy + a first-time panel + live glossary links, deepened by best-in-class anchoring and visible disagreement, delivered as discussion-plus-sampler rather than verdict — and disciplined to be denser, never longer, never a rubric, never a second harsher pipeline.

---

*Draft & Lens — Expert View Spec · June 2026 · post-Stage-E feature · pairs with Architecture v6 (§17 lens subjectivity, §19 glossary), LearnedCorpus v2.3 (Illustrative Examples), and the §21 roadmap (Mentor/Interrogate/best-in-class).*
