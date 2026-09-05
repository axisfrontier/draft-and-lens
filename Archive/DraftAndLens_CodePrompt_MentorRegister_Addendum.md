# Code Prompt — Addendum: Mentor Disposition (every read) + Memory Framing (on revision)

> Attach to `DraftAndLens_CodePrompt_RevisionAwareness.md`. This is mostly a **prompt/voice change**, not new app plumbing — most of it lives in the analyst (Brain 2) prompt, which is server-side IP. Two parts: (A) a register that's always on; (B) hooking the existing revision/changed-path to the memory framing. Keep the IP boundary intact; the analyst prompt stays server-side; re-run the bundle grep if you touch any client surface.

> Read the principle first: `DraftAndLens_Amendment_EditorMentorRegister.md`. The one-line law: **editor and mentor are one voice in two registers; the mentor DISPOSITION is free and present on every read; MEMORY is the revision/persistence-gated part. Developmental, never directive.**

---

## PART A — Mentor disposition on EVERY read (first read included)

This needs no storage and no revision. It's a quality of the reading itself.

1. **Thread throughout (analyst/Brain 2 prompt):** ensure the analyst's framing instruction carries the developmental register on every note — "here is what I see, why it matters in your tradition, what it could reach toward," never "this is wrong, change it." If the prompt already does this for tone, make it explicit and consistent across the whole reading so no note lands cold. This is a prompt edit, not code.

2. **Closing developmental note (report UI + analyst output):** add a distinct closing element to the reading — a short "Where to grow next": ONE clear forward direction the writer can act on, drawn from the reading, framed as growth on the writer's own terms. 
   - If the analyst output already contains the material (it likely does — Where To Begin / Action Plan), this may be a *presentation* of existing output, not a new generation. **Audit the analyst output first** — reveal vs regenerate, same discipline as Expert View. Do NOT add a second pipeline or a second model call if the content is already there.
   - It is developmental ("you could take this toward…"), never prescriptive ("you should do X to make this good").

3. **The line (enforce in the prompt):** the disposition is about the writer's *capacity*, never instruction about the work's *correct form*. Warmth must not become a softer generic rubric. The closing note points toward growth on the work's own terms; it never prescribes a correct version and never rewrites.

---

## PART B — Memory framing on a genuine revision (hooks the existing changed-path)

This reuses the revision-awareness build already specced — no new infrastructure. When the **changed path** fires (diff above threshold, a genuine revision of a stored work):

1. The what-changed summary (magnitude + location) is already passed into the reading. **Also pass a memory-framing flag** so the analyst's developmental register can do what it cannot on a first read:
   - Acknowledge the change ("you've reworked the ending…").
   - Where prior-version material is available, name whether the revision addressed what the earlier reading raised, and — across multiple revisions — note a recurring tendency.
2. On a revision, the memory register naturally carries more of the reading's weight (tone and analysis both respond to the change); **the editor still leads on the new material.**
3. **No-fabrication law:** the analyst must never simulate a past it does not have. On a first read there is no prior — it reads developmentally but invents no history. Only pass real prior-version material; never fabricate a "last time."

---

## What this is NOT
- NOT a new "mentor mode" toggle. The disposition is always on; there's no switch.
- NOT a paid gate on the mentor. Free gets the full reading WITH the disposition. Paid gets **memory** (persistence across sessions, tendency tracking) — which is the revision-awareness/persistence build itself.
- NOT a second pipeline or second model pass. Reveal existing analyst output where possible; one reading, two registers.

## Verify
- A FIRST read (no prior stored) shows the developmental thread AND a closing "Where to grow next" — with no invented history.
- A genuine revision (changed path) produces a reading that acknowledges the change and, where prior material exists, speaks to whether it addressed earlier notes.
- An unchanged resubmit still returns the stored reading verbatim (Part B does not fire).
- No new client-bound IP; bundle grep still PASS if any client surface changed.
