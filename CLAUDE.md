# CLAUDE.md

Lazy Habbit App (product id `habit-app`): a habit tracker built on "structural freedom". Weekly quotas instead of daily schedules, a tier system (0-10) and a 3-week buffer. Angular 21 PWA + Supabase (Postgres, Auth, RLS), deployed on Vercel. Phase 1 target: 2 users.

Full spec (schema SQL, Supabase query patterns, scope, checklist): `docs/PROJECT_SPEC.md`. Supabase operations guide: `supabase/migrations/CLAUDE.md`. Product docs and the original planning doc live outside this repo in `D:/Projects/Habbit app/`.

## Commands (the repo contract, see nextjedi/platform docs/CONTRACTS.md)
| Command | What it does |
|---|---|
| `make setup` | `npm ci`, writes placeholder `src/environments/environment*.ts` if missing, installs lefthook git hooks |
| `make dev` | `ng serve` on http://localhost:4200 |
| `make verify` | lint + prettier check + typecheck + unit tests (Vitest, coverage) + production build. **Must pass before you finish; CI runs exactly this.** |
| `make e2e` | no e2e suite yet (no-op) |
| `npm run lint` / `lint:fix` | angular-eslint (see baseline note below) |
| `npm run format` / `format:check` | Prettier (config in `package.json`) |
| `npm run typecheck` | `tsc` for app and spec configs |
| `npm run test:ci` | `ng test --watch=false --coverage` |

Node 22 (`.nvmrc`). Single package at the repo root (no workspace).

## Layout
```
src/app/core/{services,guards,models}   Supabase, Auth, User, Plan, Logging, Score, Logger, Sentry setup
src/app/features/{auth,dashboard,planning,review,profile,legal}
src/app/shared                          pipes (Duration, Percentage), reusable components
src/environments/                       environment.example.ts is tracked; environment.ts / environment.prod.ts are git-ignored
supabase/migrations/                    SQL migrations (applied to the remote project; do not edit applied ones)
scripts/ensure-env.mjs                  creates placeholder environment files for CI and fresh clones
.github/workflows/                      ci, commitlint, release, claude-review/mention (gated), Vercel deploy-preview/production
```

## Rules
- **Never read, print or commit** `src/environments/environment.ts` or `environment.prod.ts` (Supabase keys). Add new config names to `environment.example.ts` and `.env.example`.
- Never use the Supabase `service_role` key client-side. RLS (`auth.uid()`) isolates data; the anon key is safe to expose.
- Do not touch the Supabase remote project or data; new schema changes go in a new migration file.
- Standalone components, strict TypeScript, SCSS, Angular Material. Use `Logger` (`core/services/logger.ts`), never bare `console.*`, in app code.
- Conventional commits (`feat:`, `fix:`, `chore:`); PR body has `Fixes NEX-123`. release-please builds releases from commits on `master`.
- Error tracking: Sentry initialises only when `environment.sentryDsn` is non-empty; with it empty everything is a no-op. `Logger.error` forwards to Sentry.
- Lint baseline: existing code violates a few rules (mostly `no-explicit-any`, `no-unused-vars`); they are `warn` in `eslint.config.mjs`. Do not add new ones; fix when you touch a file, then raise the rule to `error`. Prettier ignores `src/` (see `.prettierignore`) until a dedicated formatting PR.

## Product rules to preserve
- Weekly Score = (hours completed / hours scheduled + tasks completed / tasks scheduled) / 2. Empty categories are excluded.
- Tiers 0-10. Promotion track: score >= 80% and every category >= 50%. Stable: 60-79% or one category < 50%. Demotion: < 60% or two or more categories < 50%. Three consecutive weeks on the same track changes the tier.
- Week runs Monday to Sunday; 4 break weeks per year pause the clock. One active plan per user; a plan is required before the dashboard.
- UX: one-tap logging (no modals, no duration input), undo only within the same day, no mid-week plan edits, "Repeat last week" is one tap.
- Six default categories: Health, Learning, Creative, Leisure, Project, Career.

## Status (Dec 2025)
Done: project setup, Supabase client, core services, models, category CRUD, planning component, pipes, 78 tests. In progress: auth UI, dashboard, review, profile. Pending: Material theme, PWA icons/manifest, production hardening.

## Deploy
Vercel: `deploy-preview.yml` per PR, `deploy-production.yml` on push to `master`. Secrets by name: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. See `.github/SETUP.md`.

## Agents and skills
`.claude/agents/angular-expert.md`, `.claude/skills/{angular-component,angular-service,supabase-integration}`. The nextjedi plugins (core, web) are enabled in `.claude/settings.json`.
