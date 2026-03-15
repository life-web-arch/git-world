cat << 'EOF'
# GIT WORLD — CONFIGURATION REFERENCE

All environment variables and external service configurations required to run this project.
This file is safe to commit — it contains no actual secret values, only where to find them.

---

## ENVIRONMENT VARIABLES

Set these in two places:
1. **Local:** `.env.local` (git-ignored, never commit)
2. **Production:** Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Where to get it | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role secret | ❌ Server only |
| `GITHUB_ID` | GitHub → Settings → Developer settings → OAuth Apps → Client ID | ❌ Server only |
| `GITHUB_SECRET` | GitHub → Settings → Developer settings → OAuth Apps → Client Secret | ❌ Server only |
| `GITHUB_PAT` | GitHub → Settings → Developer settings → Personal access tokens | ❌ Server only |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` | ❌ Server only |
| `NEXTAUTH_URL` | Your live URL: `https://git-world-sigma.vercel.app` | ❌ Server only |

---

## SUPABASE CONFIGURATION

### Project Settings
| Setting | Value |
|---|---|
| Project URL | From Supabase Dashboard → Project Settings → API |
| Region | Choose closest to your users |

### Authentication
Not used — auth is handled entirely by NextAuth + GitHub OAuth.
Supabase is used only for database and Realtime.

### Database
| Setting | Notes |
|---|---|
| Schema | Run `supabase/schema.sql` top-to-bottom in SQL Editor to fully reproduce |
| RLS | Enabled on developers table — public SELECT, no anon INSERT/UPDATE/DELETE |
| Realtime | Enabled on developers table via `supabase_realtime` publication |

### Realtime
| Setting | Notes |
|---|---|
| Channel: `presence` | Used for broadcasting player movement events |
| Channel: `chat-room` | Used for broadcasting chat messages |
| Channel: `developers-updates` | Listens for Postgres changes on developers table |
| Table replication | Enabled via: `ALTER PUBLICATION supabase_realtime ADD TABLE public.developers` |

---

## GITHUB OAUTH CONFIGURATION

| Setting | Value |
|---|---|
| OAuth App | GitHub → Settings → Developer settings → OAuth Apps → New OAuth App |
| Homepage URL | `https://git-world-sigma.vercel.app` |
| Callback URL | `https://git-world-sigma.vercel.app/api/auth/callback/github` |
| Local callback | `http://localhost:3000/api/auth/callback/github` |

**Important:** Add both production and localhost callback URLs in the OAuth App settings.

### GitHub PAT (Personal Access Token)
Used as fallback when no user access token is available for fetching public stats.

| Setting | Value |
|---|---|
| Token type | Classic PAT |
| Required scopes | `read:user`, `repo` (read-only) |
| Where to create | GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) |

---

## NEXTAUTH CONFIGURATION

| Setting | Value |
|---|---|
| Provider | GitHub OAuth only |
| Session strategy | JWT (default) |
| Callback: signIn | Triggers `syncUserStats()` with user's own access token |
| Callback: session | Adds `username` field to session from token |
| Secret | Random 32-byte base64 string — run: `openssl rand -base64 32` |

---

## VERCEL CONFIGURATION

| Setting | Value |
|---|---|
| Framework | Next.js (auto-detected) |
| Root directory | `.` (project root) |
| Build command | `next build --webpack` |
| Output directory | `.next` (auto-detected) |
| Deploy trigger | Every push to main branch |
| Node version | 18.x or later |
| Live URL | `https://git-world-sigma.vercel.app` |

### Environment Variable Scoping in Vercel
| Rule | Detail |
|---|---|
| `NEXT_PUBLIC_` vars | Set for Production + Preview + Development |
| All server-only vars | Set for Production only |
| Never expose to Preview | `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_SECRET`, `GITHUB_PAT`, `NEXTAUTH_SECRET` |

---

## GITHUB ACTIONS — KEEP ALIVE

### keep-alive.yml
Pings Supabase every 3 days to prevent free tier pause due to inactivity.

| Secret | Where to add |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above |

Schedule: every 3 days at 10:00 UTC (`0 10 */3 * *`)

Manual trigger: GitHub → Actions → Keep Supabase Alive → Run workflow

---

## DATABASE WORKFLOW

All SQL migrations live in `supabase/schema.sql` (tracked in git).

**To add a new column:**

1. Write and test SQL in Supabase SQL Editor
2. Append to repo:

        cat << 'SQLEOF' >> supabase/schema.sql
        -- Migration: describe change here
        ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS new_col TYPE DEFAULT val;
        SQLEOF

3. Commit:

        git add supabase/schema.sql && git commit -m "chore: add new_col to developers" && git push

**To recreate DB from scratch:**

1. Open Supabase SQL Editor
2. Paste full contents of `supabase/schema.sql`
3. Click Run

---

## TO REPRODUCE THIS PROJECT FROM SCRATCH

1. Create a new Supabase project
2. Run `supabase/schema.sql` top-to-bottom in the SQL Editor
3. Create a GitHub OAuth App with the correct callback URL
4. Generate a NextAuth secret: `openssl rand -base64 32`
5. Create a GitHub PAT with `read:user` and `repo` scopes
6. Create a new Vercel project linked to the GitHub repo
7. Add all environment variables in Vercel Dashboard
8. Add GitHub Actions secrets for the keep-alive workflow
9. Push to main — Vercel builds and deploys automatically
10. Visit the live URL and sign in with GitHub to verify

---

## SECURITY CHECKLIST (verify before going live)

- [ ] `.env.local` is in `.gitignore` — run `git status` to confirm
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `GITHUB_SECRET` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `GITHUB_PAT` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `supabase-server.ts` is never imported in any client component
- [ ] `/api/city` strips `github_access_token` before sending to browser
- [ ] RLS is enabled on developers table
- [ ] No secrets appear in git history — run: `git log --all --full-history -- .env*`

---

## IMPORTANT

This file must be kept up to date. Whenever a new environment variable, external service,
third-party integration, or manual configuration step is added to the project — update this
file immediately and commit it. Any developer or AI agent picking up this project
depends on this file to get the project running from scratch correctly.
