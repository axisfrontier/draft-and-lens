# Codebase Audit — Best-In-Class Senior Developer Review

> This prompt is for Claude Code. The codebase is already in your context.
> Model: Opus / High (this is a full audit — don't cut corners).
> Read every file. Do not summarise or skip. Report findings before fixing anything.
> Output format: plain English throughout. No jargon without explanation.

---

## YOUR ROLE
You are a Principal Engineer preparing this codebase for a production launch serving real users. You have no tolerance for shortcuts. You are looking for anything that would embarrass a senior team, break for a user, leak data, or make maintenance harder than it needs to be.

---

## PART 1 — EXECUTIVE SUMMARY
Before the detailed findings, give me:
- One paragraph: overall health of the codebase
- Is it ready to launch? Yes / No / With conditions
- The three most critical issues to fix first, in order

---

## PART 2 — CRITICAL ISSUES (fix before launch)

For each issue:
- **Problem:** what is wrong, in plain English
- **Where:** file and line number
- **Why it matters:** what breaks or who gets hurt if this isn't fixed
- **Fix:** exactly what to do

Check for:

### Security
- API keys, passwords, or secrets hardcoded in any file (should be in environment variables)
- User input that isn't validated before being processed or stored
- Routes or pages that should require login but don't
- Authentication that can be bypassed or faked
- Any data sent to the browser that should stay on the server

### Data integrity
- Forms that submit but don't actually save data anywhere
- API calls pointing to wrong or non-existent endpoints
- State that gets updated in one place but not another, causing the UI to show stale data
- Any operation that could silently fail without telling the user

### Breaking bugs
- Any code path that would throw an uncaught error and crash the app
- Missing error handling on network requests (what happens if the internet drops?)
- Any component that tries to read a property of something that might be null or undefined

---

## PART 3 — HIGH PRIORITY (fix before users arrive)

Same format as Part 2.

Check for:

### Performance
- Images not optimised for web (over 200kb for UI images)
- The same data being fetched multiple times unnecessarily
- Code running on every render that only needs to run once
- Animations likely to stutter on older phones

### User experience
- Loading states missing — user sees nothing while waiting
- Error messages that say "Something went wrong" with no further help
- Buttons that can be clicked twice, causing duplicate actions
- Forms that clear the user's input on error, forcing them to retype everything
- Any dead end — a button, link, or action that goes nowhere

### Mobile
- Does it work at 375px width? (iPhone SE — the smallest common screen)
- Are tap targets at least 44×44px? (Thumbs are bigger than mouse cursors)
- Is text readable without zooming?

---

## PART 4 — LOW PRIORITY (fix when you have time)

Same format. Check for:

- Commented-out code that should be deleted
- Console.log statements left in production code
- TODO comments that should be tracked properly
- Unused imports, variables, or functions (dead code)
- Files over 400 lines that could reasonably be split
- Duplicated logic that appears in more than two places
- Inconsistent naming (camelCase in one place, snake_case in another for the same thing)
- Missing alt text on images
- Heading structure out of order (H3 before H2, etc.)

---

## PART 5 — WHAT'S ALREADY GOOD
List what you checked that is already done correctly. Be specific — not "security looks good" but "API keys are correctly stored in environment variables and not referenced anywhere in client-side code."

---

## PART 6 — READINESS SCORE

| Category | Score (1–10) | One-line note |
|---|---|---|
| Does it work end-to-end? | | |
| Security | | |
| Performance | | |
| User experience | | |
| Code quality and cleanliness | | |
| Mobile responsiveness | | |
| Error handling | | |
| Documentation | | |

**Overall: [X]/10**

If below 7: explain in one paragraph what's holding it back and what the fastest path to 7+ looks like.

---

## PART 7 — RECOMMENDATIONS
What would make this codebase genuinely best-in-class? Not what's broken — what's missing that a senior team would add before handing this to 100,000 users? Be specific.

---

## D&L-SPECIFIC CHECKS (add this section when auditing Draft & Lens)

These are project-specific requirements that the generic checks above won't catch. Run these every time you audit the D&L codebase.

### IP Boundary (most critical D&L check)
- Run a bundle grep: search `.next/static` for any of the following strings: "TRADITION_IDENTIFICATION", "LEARNED_CORPUS", "lens_voice", "brain_prompt", "analyst_system", "frantumaglia", "hooptedoodle"
- All must return exit:1 (not found in client bundle)
- If any are found: this is a critical IP leak. Stop everything. Fix before any other audit item.

### Brain pipeline integrity
- Confirm all 5 brains are wiring correctly in sequence (Brain 1 → Brain 1b → Brain 2 → Brains 3/4/5 → Narrator correction)
- Confirm Brain 2 is loading the current LearnedCorpus (v2.8 or latest)
- Confirm token cap is 16,000 across all tiers — not lower

### Sidebar
- After any ReportView change: confirm sidebar shows exactly the correct number of links (currently 26 — will be higher after lens expansion)
- Confirm all sidebar links scroll to the correct section

### Clerk
- Confirm Clerk is in Development mode (flag this — must switch to Production before paid launch)
- Confirm sign-up and sign-in flows are working end-to-end
- Confirm the sign-in gate overlay appears for logged-out users on the homepage

### Legal and compliance
- Confirm /privacy, /terms, and /acceptable-use pages are live and contain no placeholder text
- Confirm hello@draftandlens.com is the contact address throughout (not an old placeholder)
- Confirm the beta password gate is active (site is password-protected)
- Flag if the beta password is hardcoded rather than in an environment variable (it should be env-var driven)

### Data handling
- Confirm no user-submitted writing is logged to any analytics service
- Confirm no user-submitted writing appears in any client-side state that would be visible in browser dev tools beyond the current session
- Confirm Supabase storage is configured for EU/UK region

---

## INSTRUCTION
Start the audit now. Read every file before reporting. Do not fix anything until the full report is written and I have confirmed which items to action.
