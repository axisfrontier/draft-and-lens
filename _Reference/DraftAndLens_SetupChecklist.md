# Draft & Lens — Setup Checklist (Vercel · Clerk · API Key)
### Plain-English, click-by-click. No prior dev experience assumed.

> Do these **after** your build tool has produced a working Next.js app (the Cursor prompt's Stage 5 or so). The order matters: get the code into GitHub first, then Vercel, then Clerk, then the keys. Take it one section at a time. When a screen doesn't match these words exactly, the tool has changed its layout slightly — the concepts are the same; look for the nearest equivalent.

> **Pairs with Architecture v6 and Cursor Prompt v6.** This checklist is tool-agnostic for the hosting/auth/keys part — it applies whether the app was built with Cursor or with another builder (e.g. Base44). If you use a builder that hosts for you, some Vercel steps may be handled inside that platform instead; the key-security rules (Part B and the golden rules) still apply identically. The one non-negotiable, whatever the tool: the browser security check below must pass before anyone sees the app.

---

## Before you start — accounts you'll create (all have free tiers)

- **GitHub** — stores your code. (github.com)
- **Vercel** — hosts the live site. (vercel.com)
- **Clerk** — handles logins. (clerk.com)
- **Anthropic** — the AI; you likely already have an account and an API key. (console.anthropic.com)
- **Supabase** — the database, if/when you add saved work. (supabase.com)

Use the same email for all of them to keep life simple. Where offered, sign up with your GitHub account — it links things automatically.

---

## Part A — Get your code onto GitHub

Cursor can do most of this for you; ask it: *"Initialise a git repository, create a .gitignore that excludes .env.local, and push this to a new private GitHub repo."* If you'd rather click:

1. Create a free GitHub account.
2. In Cursor, open the Source Control panel (the branch icon in the left bar).
3. Click **Publish Branch** / **Publish to GitHub**. Choose **Private** repository. Name it `draft-and-lens`.
4. **Critical:** before publishing, confirm there is a file called `.gitignore` that contains the line `.env.local`. This stops your secret keys being uploaded. If you're unsure, ask Cursor: *"Confirm .env.local is in .gitignore and will not be pushed to GitHub."*

✅ **Done when:** your code is visible in a private repo on github.com, and `.env.local` is **not** among the files shown there.

---

## Part B — Put the API key in the right place (the secure way)

Your Anthropic API key is like a credit card — anyone who has it can spend your money. It must live in **environment variables**, never in the code.

**Locally (on your Mac, for testing):**
1. In your project folder there should be a file `.env.local.example`. Make a copy of it and rename the copy to `.env.local`.
2. Open `.env.local`. Find the line `ANTHROPIC_API_KEY=`.
3. Paste your real key after the `=`, no quotes, no spaces. Save.
4. That file is already excluded from GitHub by `.gitignore`, so it stays on your machine only.

**Get your Anthropic key** (if you need it): console.anthropic.com → log in → **API Keys** → **Create Key** → copy it immediately (you can't see it again). Make sure your Anthropic account has billing set up, or calls will fail.

✅ **Done when:** `.env.local` on your Mac contains your real key, and you've confirmed that file is not on GitHub.

---

## Part C — Deploy to Vercel

1. Create a free Vercel account — **sign up with GitHub** when asked, so it can see your repos.
2. On the Vercel dashboard, click **Add New… → Project**.
3. Find `draft-and-lens` in the list of your GitHub repos and click **Import**.
4. Vercel auto-detects Next.js — leave the build settings as they are.
5. **Before clicking Deploy**, expand **Environment Variables**. This is where the live site gets its keys (it can't see your local `.env.local`). Add each one:
   - Name: `ANTHROPIC_API_KEY` → Value: your real key.
   - (Add the Clerk and Supabase keys here too once you have them — see Parts D and E. You can add them now or come back and add them, then redeploy.)
6. Click **Deploy**. Wait a minute or two.
7. Vercel gives you a live URL like `draft-and-lens.vercel.app`. Open it.

If the build fails, copy the red error text from Vercel's log and paste it to Cursor: *"My Vercel deploy failed with this error — fix it."*

✅ **Done when:** your site loads at its `.vercel.app` URL.

**Tip:** every time you push new code to GitHub, Vercel redeploys automatically. If you add or change an environment variable, you must **redeploy** for it to take effect (Vercel → your project → Deployments → ⋯ → Redeploy).

---

## Part D — Add logins with Clerk

1. Create a free Clerk account.
2. Click **Create Application**. Name it `Draft & Lens`. Choose the sign-in options you want (Email is enough to start; Google is a nice add).
3. Clerk shows you two keys: a **Publishable Key** (starts `pk_`) and a **Secret Key** (starts `sk_`). Keep this tab open.
4. Add both to your environment variables, in **two places**:
   - In your local `.env.local` (the names will match what Cursor put in `.env.local.example` — typically `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`).
   - In Vercel → your project → **Settings → Environment Variables** (same names, same values). Then redeploy.
5. The publishable key (`pk_`) is safe to be public — that's why its name starts with `NEXT_PUBLIC`. The secret key (`sk_`) is private — never put it in a `NEXT_PUBLIC` variable.
6. Test: open your site, try to access the app — Clerk should now show a sign-in screen.

**Inviting your beta testers:** in the Clerk dashboard there's a **Users** section. You can invite specific people by email there, or let them sign up and then you approve/assign them. Because access goes through Clerk, you can **remove anyone instantly** by deleting their user — which is exactly the control you wanted for a private beta.

✅ **Done when:** visiting your live site asks you to sign in, and you can sign in successfully.

---

## Part E — Add the database (Supabase) — only when you add saved work

You can run an early beta *without* saved history. When you're ready for it:

1. Create a free Supabase account → **New Project**. Pick a name and a strong database password (save it).
2. In the project, open the **SQL Editor**, paste the schema from §08 of the architecture doc, and run it. (Ask Cursor to confirm the SQL matches the architecture doc first.)
3. Supabase → **Project Settings → API** shows your **Project URL** and **anon key** and **service role key**.
4. Add these to `.env.local` and to Vercel (matching the names in `.env.local.example`), then redeploy.
5. The **service role key is highly privileged** — it goes in a normal (non-`NEXT_PUBLIC`) variable, server-side only. Never expose it.

✅ **Done when:** a signed-in user can run an analysis and see it saved when they return.

---

## The golden rules for keys (read once, remember always)

- Anything named `NEXT_PUBLIC_…` is visible to the browser — only put non-secret values there (like the Clerk publishable `pk_` key).
- Everything else (Anthropic key, Clerk `sk_`, Supabase service role) is **server-only** — never in a `NEXT_PUBLIC_` variable, never hardcoded, never committed to GitHub.
- If you ever accidentally commit a key to GitHub, treat it as compromised: delete/rotate it in the relevant dashboard and create a new one. (For Anthropic: console → API Keys → revoke → create new.)
- Local `.env.local` and Vercel's Environment Variables are two separate places. A key in one is not automatically in the other. Keep them in sync.

---

## Recommended order, end to end

1. Your build tool produces the app (server-side prompts confirmed via the browser security check — search the browser sources for a phrase from a mode prompt **including the Treatment prompt**, for a lens voice, and for the `⟦` anchor character; none may appear. The glossary definitions and the anchor *resolver* code are allowed to appear — they are not IP). ← the hard part
2. Push to a **private** GitHub repo (`.env.local` excluded).
3. Deploy to Vercel; add `ANTHROPIC_API_KEY` as an environment variable.
4. Add Clerk; put its keys in both `.env.local` and Vercel; redeploy.
5. Confirm sign-in works and prompts are not visible in the browser.
6. Invite 5–15 testers in Clerk, each under the beta agreement.
7. (Later) Add Supabase for saved work; add Stripe for billing.

---

*Draft & Lens — Setup Checklist v1.1 · June 2026 · pairs with Architecture v6*
