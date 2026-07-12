# CarHire — Setup

Multi-tenant car-rental admin. One user can own many isolated organizations;
every record is scoped by `org_id` and enforced with Supabase RLS.

Stack: **Next.js 16** (App Router, React Compiler, JavaScript) · **Supabase**
(auth + Postgres + Storage) · **Tailwind v4 + shadcn/ui** · deploy on **Vercel**.

> Next 16 note: the old `middleware.js` is now **`proxy.js`** (see
> [`src/proxy.js`](src/proxy.js)). Keep an eye on [AGENTS.md](AGENTS.md).

---

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick a region close
   to your users; save the database password.
2. When it finishes provisioning, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (under "Project API keys", reveal it) →
     `SUPABASE_SERVICE_ROLE_KEY` — **server-only, never commit**.

## 2. Load the schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.
3. Open **Table Editor** and confirm every table shows **RLS: Enabled** (green).

(Optional, if you use the Supabase CLI instead: `supabase db push`.)

## 3. Auth settings (MVP)

In the dashboard: **Authentication → Providers → Email**.
- For a smoother MVP, turn **"Confirm email" OFF** so signup returns a session
  immediately (create account → straight into the app). The forms already
  handle the confirmation-ON case too (they show "check your email" instead).
- **Authentication → URL Configuration**: set **Site URL** to
  `http://localhost:3000` (and add your Vercel URL later). Add
  `http://localhost:3000/auth/callback` under **Redirect URLs** — the
  password-reset and confirmation links redirect there.

## 4. Local env

```bash
cp .env.example .env.local   # then paste your real keys into .env.local
npm install
npm run dev                  # http://localhost:3000
```

`.env.local` is git-ignored. `/` routes visitors to `/auth` (login) when signed
out; wiring the forms to Supabase is the next increment.

---

## 5. Deploy to Vercel

Two options — **pick one** so you don't deploy twice.

### Option A — Vercel native Git integration (simplest)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project → Import** the repo.
3. Add the three env vars (Settings → Environment Variables) for **Production**
   *and* **Preview**.
4. Delete [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — Vercel
   handles deploys itself. Keep `ci.yml`.

### Option B — GitHub Actions deploy ([`deploy.yml`](.github/workflows/deploy.yml))

Add these **repo secrets** (GitHub → Settings → Secrets and variables → Actions):

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | run `vercel link` locally, then read `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | same `.vercel/project.json` |

Set the Supabase env vars inside the Vercel project itself (the CLI pulls them at
build time). Every PR gets a preview URL; merges to `main` deploy to production.

---

## 6. GitHub workflows

- **[`ci.yml`](.github/workflows/ci.yml)** — runs `npm run lint` + `npm run build`
  on every PR and push to `main`, with placeholder Supabase env so builds don't
  need real secrets. Blocks broken merges.
- **[`deploy.yml`](.github/workflows/deploy.yml)** — Option B above.

Recommended: protect `main` (Settings → Branches) and require the **Lint & Build**
check to pass before merging.

---

## Roadmap

Build order and phase details live in [CLAUDE.md](CLAUDE.md). Current status:
**Foundation done** (schema + RLS, Supabase clients, proxy/auth guard, entry
router, CI/CD). **Next: Phase 1 — Auth + Org onboarding** (`/login`, `/signup`,
`/onboarding`, `/workspace/[orgId]` shell).
