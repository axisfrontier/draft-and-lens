# Code Prompt — Scores Dashboard: replace numbers with qualitative labels + show tradition

> Sonnet / Medium. Additive/targeted only — ScoresDashboard component and its label logic. One commit. tsc before committing.

## The problem
The scores dashboard shows 1–10 numbers which read as a grading rubric, contradicting D&L's "not a grade" positioning. Users shouldn't be asked to trust an unexplained scoring system.

## Two changes

### 1 — Replace numeric scores with qualitative descriptors
Map the existing 1–10 values to labels. Keep the underlying number for the visual bar/indicator but display the label instead:

| Score | Display label |
|-------|--------------|
| 9–10 | Fully earned |
| 7–8 | Landing well |
| 5–6 | Developing |
| 3–4 | Needs attention |
| 1–2 | Not yet serving the work |

- Remove the number from the visible UI entirely.
- Keep the visual bar/indicator — it can still reflect magnitude.
- The label sits where the number currently sits.

### 2 — Show the identified tradition in the dashboard header
Change the dashboard subheading from the current generic text to:
*"A read, not a grade — how each element is serving [tradition]"*

Where [tradition] is dynamically populated from the diagnostic output (the tradition Brain 1 identified — already available in the report data). If tradition is unavailable for any reason, fall back to: *"A read, not a grade — how each element is serving this work's tradition."*

## Rules
- ScoresDashboard component only. No other components.
- Do not change the underlying score values or how they're generated — display layer only.
- One commit. tsc clean. Confirm render shows labels not numbers.
