# Draft & Lens — Project Folder Index
## Read me first if you're lost. Last updated June 2026 (handover v9 era).

> **Start every session here, then open `DraftAndLens_HANDOVER_v10.md`.** The handover is the spine — it holds the current state and the next action.

---

## ⚑ The 30-second version
- **Where the build is:** the production Next.js app. Migration done; **Stage E (full report UI) closed and verified.**
- **What's next:** decide the sequencing call in the handover (§11), then run a Code prompt.
- **The single source of truth for prompt IP:** `DraftAndLens.html`.

---

## 📁 What each file is, grouped by purpose

### ① READ FIRST — the spine
- **`DraftAndLens_HANDOVER_v10.md`** — current state, decisions, next action. Open this every session.

### ② THE LAW / GOVERNING DOCS (Claude Code reads these for context — does NOT act on them)
- **`DraftAndLens_Architecture_v6.md`** — the build law (§21 amended: editor/mentor as one voice, two registers).
- **`DraftAndLens_LearnedCorpus_v2.5.md`** — editorial principles (includes Principle 10 — Editor/Mentor as Register, and the v2.5 "Teaching the move" taster clause).
- **`ThinkingDiscipline.md`** — the working method.
- **`DraftAndLens.html`** — the prototype; SOURCE OF TRUTH for all prompt IP and product behaviour.

### ③ BUILD INSTRUCTIONS (what Claude Code actually acts on — the "do" docs)
- **`DraftAndLens_CodePrompt_RevisionAwareness.md`** — the production build: moderation gate, revision-awareness, persistence (Supabase + Clerk), user-data functions, data protection, open-sections.
- **`DraftAndLens_CodePrompt_MentorRegister_Addendum.md`** — attaches to the above: mentor disposition on every read + memory framing on revision.
- **`DraftAndLens_CodePrompt_RevisionAwareness_MVP.md`** — same behaviour for the single-file HTML, session-scoped. ONLY if updating the prototype; otherwise ignore.
- **`DraftAndLens_CodePrompt_TeachTheMove_Tasters.md`** — note-quality build: dedup notes, account for the set, teach-the-move tasters. Do AFTER CHANGE 4 + security re-check.

### ④ FUTURE SPECS (roadmap, not now)
- **`DraftAndLens_ExpertMode_Spec.md`** — Expert View (same reading, less translated). Post-Stage-E; now unblocked but optional.

### ⑤ YOUR RECORDS — legal/compliance (NOT for Claude Code)
- **`DraftAndLens_Legal_Document_Drafts.md`** — first drafts of Privacy Policy, Terms, AUP, AI-disclosure. FOR YOUR SOLICITOR. Not legal advice.
- **`DraftAndLens_Legal_Policy_Starter.md`** — what's law vs code; DPAs; your policy decisions.
- **`DraftAndLens_GoLive_Compliance_Checklist.md`** — the go-live steps (documents, ICO fee, DPAs, build verification).

---

## 🗑 ARCHIVE / DELETE (stale — move out of this folder so nothing reads the wrong version)
- **`DraftAndLens_LearnedCorpus.md`** (no version suffix) — the OLD v2.3. **Delete it** — v2.5 replaces it. Same for any **v2.4** copy. *(Most important to remove — Code could read the wrong corpus.)*
- **`DraftAndLens_CursorPrompt_v6.md`** — Cursor-era conversion prompt. Migration's done; reference only. Archive.
- **`DraftAndLens_ClaudeCode_StarterScript.md`** — day-one migration running order. Spent (migration complete). Archive.

---

## 🧭 Which files go INTO Claude Code's folder
Groups ② and ③ (the law docs + the build instruction you're running). Plus the handover for context. Nothing from ⑤ — Code can't and shouldn't act on legal docs.

## 🧭 The two readers of this project
- **Claude Code** needs: the law docs + the active build prompt.
- **A fresh thinking-session (or future-you)** needs: the handover, and the records in ⑤ for the legal track.

---

*If this index and the handover ever disagree, the handover wins — it's updated more often.*
