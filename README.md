# Autom8

AI-powered Instagram & Facebook comment responder for creators, coaches, agencies, and beauty brands. Auto-replies in your brand voice. Review before send or go fully automated.

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Stripe · Vercel

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your values
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in each value. The app runs on mock data without real credentials, but auth, billing, and social connection require live keys.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_STARTER_PRICE_ID` | Stripe Dashboard → Products |
| `STRIPE_GROWTH_PRICE_ID` | Stripe Dashboard → Products |
| `STRIPE_SCALE_PRICE_ID` | Stripe Dashboard → Products |
| `META_APP_ID` | Meta for Developers → App Dashboard |
| `META_APP_SECRET` | Meta for Developers → App Dashboard |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your Vercel URL in prod |

---

## Scripts

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build + type-check
npm run start    # Start production server (after build)
npm run lint     # ESLint
```

---

## Deploy to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual

```bash
# Install Vercel CLI
npm i -g vercel

# Link and deploy
vercel --prod
```

Set all variables from `.env.example` in **Vercel → Project → Settings → Environment Variables** before deploying.

### Stripe webhook

After deploying, register a webhook in the Stripe Dashboard pointing to:

```
https://your-app.vercel.app/api/billing/webhook
```

Events to enable: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/schema.sql` via the SQL editor.
3. Enable Email auth in **Authentication → Providers**.
4. Add your Vercel URL to **Authentication → URL Configuration → Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## Meta (Instagram/Facebook) setup

> Instagram connection is a placeholder in v1 — Meta App Review is required before live use.

1. Create an app at [developers.facebook.com](https://developers.facebook.com).
2. Add **Instagram Basic Display** and **Pages** products.
3. Request permissions: `instagram_basic`, `instagram_manage_comments`, `pages_read_engagement`.
4. Set OAuth redirect URI to: `https://your-app.vercel.app/api/social/callback`

---

## Project structure

```
app/
  (dashboard)/          # Authenticated app shell
    dashboard/          # Overview + metrics
    inbox/              # AI reply review queue
    settings/           # Brand Brain config
    billing/            # Plans + Stripe checkout
    onboarding/         # 4-step setup wizard
    analytics/          # Usage charts
  api/                  # Route handlers (Supabase + Stripe + Meta)
  auth/callback/        # Supabase OAuth redirect handler
  login/ signup/        # Auth pages
components/
  ui/                   # Design system components
  layout/               # Sidebar, TopNav, MobileBottomNav
lib/
  actions/              # Server actions (brand, inbox, usage)
  mock-data.ts          # Dev/demo data
  supabase/             # Supabase client helpers
  types/                # TypeScript types + database schema types
supabase/
  schema.sql            # Database schema
```
