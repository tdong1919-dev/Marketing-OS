<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Jidoka Marketing Team OS — project notes

- **Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, ShadCN (base-nova, built on Base UI — use the `render` prop, not `asChild`; for button-styled links use `ButtonLink` from `components/ui/button`). Supabase (Postgres + pgvector + Auth + Storage + RLS). Claude via `@anthropic-ai/sdk`; OpenAI embeddings.
- **Phase 1 scope:** auth → clients/agents → asset upload+extraction → Voice DNA analysis (6 engines) → embedding retrieval → generation + QC. Performance Intelligence, Revision Learning, and multi-writer blending are deferred ("coming soon" pages).
- **AI layer:** `lib/ai/*`. Structured outputs use `output_config.format` with hand-written JSON Schemas in `lib/schemas/*`, validated by zod after parse. Default model `claude-opus-4-8` (`ANTHROPIC_MODEL` overrides).
- **DB:** schema lives in `supabase/migrations/0001–0007`. `lib/supabase/types.ts` is hand-written and lacks FK relationship metadata — regenerate from the live DB and drop the `as unknown as` embed casts. Profile jsonb columns are typed loosely; cast to the `lib/schemas/profiles` types when rendering.
- Every table is owner-scoped by RLS; API routes use the user-scoped client. `lib/supabase/admin.ts` (service role, bypasses RLS) exists but is unused so far — enforce ownership in code if you use it.
