# Jidoka Marketing Team OS

An agency marketing operating system that creates **client-specific writing agents** and connects the marketing stack in one place. Each agent can learn a client's voice, knowledge, offers, content history, and channel data, then help generate, schedule, review, and measure marketing work.

This is **Phase 1**: one end-to-end vertical slice.

> Sign up → create a client → create a writing agent → upload assets → run Voice Intelligence Analysis → generate content with retrieval of the creator's own scripts → QC scoring with automatic rewrite below 90.

## What works today

- **Auth** — Supabase email/password, RLS-scoped per user.
- **Clients & Agents** — full CRUD plus a 3-step agent creation wizard.
- **Asset ingestion** — upload PDF / DOCX / TXT / CSV / Markdown, paste text, or fetch a URL; text is extracted and stored.
- **Voice DNA Engine** — Claude extracts six profiles in parallel: Voice DNA, Beliefs, Hook library, Story frameworks, Phrase memory, and a Knowledge graph.
- **Script embedding search** — uploaded content is chunked and embedded (OpenAI `text-embedding-3-small`) into pgvector for retrieval.
- **Content generation** — retrieves the 20 closest scripts, generates a primary piece + alternate hooks/CTAs + short/long/organic/sales variants in the creator's voice.
- **Quality Control Engine** — Claude-as-judge scores ten authenticity dimensions; if the overall score is below 90 the system rewrites once and keeps the better attempt.

## Phase 2 — agency operations

- **Brand Brain** (per agent) — editable business facts (offers, pricing, CTAs, links, FAQs, tone) that augment the auto-extracted Knowledge Graph and feed every generation.
- **Smart Scheduler** — upload a video/carousel, set a title, and it **auto-matches the generated voice content by TITLE** to fill the caption/script, then schedules it. Generated content now carries an explicit `title` for this.
- **Calendar** — month view of scheduled posts, color-coded by status.
- **Analytics** — Recharts dashboards (reach/engagement over time, breakdown, best posting hours) reading `platform_analytics`.
- **Social integration** — per-agent OAuth connections (`social_accounts`), Meta (Instagram/Facebook) publisher via Graph API, insights fetcher, and Vercel Cron (`/api/cron/publish`, `/api/cron/analytics`). Env-gated: configure the Meta app + `TOKEN_ENCRYPTION_KEY` + `CRON_SECRET` to go live. Production posting requires Meta App Review.

Apply `supabase/migrations/0008_scheduler_social.sql` for these features.

## Deferred to later phases (UI shows "coming soon")

- Revision Learning (the schema exists; the learning loop is not wired yet)
- Multi-writer blending
- YouTube / X / TikTok / LinkedIn publishing depth varies by API approval; Meta, YouTube, X, and Mailchimp connection routes exist.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · ShadCN UI · Supabase (Postgres + pgvector + Auth + Storage + RLS) · Claude (`@anthropic-ai/sdk`) · OpenAI embeddings · zod.

## Architecture

```
app/
  (auth)/                  login, signup, auth actions
  (dashboard)/             sidebar shell + all pages
    agents/[id]/           agent detail: Assets · Voice DNA · Generate · History
    generated/[id]/        generated piece + QC scores
  api/
    assets/upload/         file/url/paste → extract → store
    agents/[id]/analyze/   6-engine analysis + embeddings
    agents/[id]/generate/  retrieval → generation → QC → persist
lib/
  supabase/                client / server / admin / proxy helpers + Database type
  ai/                      anthropic, embeddings, analysis, generate
  schemas/                 zod + JSON Schema for every structured output
  extract/                 pdf / docx / txt / csv / url text extraction
supabase/migrations/       0001–0007 SQL (schema, RLS, functions, storage)
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Connect Supabase

Use a dedicated Supabase project when possible. The existing `brkfree_` tables remain for compatibility while the parallel `marketing_os_` tables are introduced.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from the new project's Settings → API
- `ANTHROPIC_API_KEY` — Claude (analysis, generation, QC)
- `OPENAI_API_KEY` — embeddings

### 4. Apply the database schema

Apply the migrations in order (0001 → 0007). The simplest path is the project's **SQL editor**: paste the contents of each file in `supabase/migrations/` in numeric order and run.

If you use the Supabase CLI, run `supabase init` once (it keeps the existing `supabase/migrations/`), then `supabase link --project-ref <ref>` and `supabase db push`.

Either way this enables `pgvector`, creates all tables, RLS policies, the `match_scripts` retrieval function, and the private `assets` storage bucket.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000, sign up, and walk the flow.

## Verification checklist

- `npm run build` and `npm run lint` are clean.
- Sign up → create a client → create an agent.
- Upload a sample script (or paste one) → it shows as `extracted`.
- Run Voice Intelligence Analysis → agent becomes `ready`, the Voice DNA tab populates.
- Generate content → redirected to the piece with an authenticity score; retrieval used the uploaded scripts.
- A second user cannot see the first user's agents or content (RLS).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build + typecheck |
| `npm run lint` | ESLint |
