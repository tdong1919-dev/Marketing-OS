# autom8ig — Netlify deploy guide

The static landing site lives at the root of this folder as plain HTML/CSS/JS — no build step required.

## Files that make up the site

```
index.html      ← the page (hero, features, live demo, pricing, FAQ, CTA, footer)
styles.css      ← all styling (mobile / iPad / desktop responsive)
script.js       ← interactive hero phone, live chat demo, billing toggle, lead form
netlify.toml    ← Netlify config (security headers + caching + publish dir)
_redirects      ← SPA-style fallback
robots.txt
sitemap.xml
```

> Note: the rest of the folder is a separate Next.js app (kept as-is). The static site is fully self-contained and overrides anything else when deployed via the included `netlify.toml`.

## See it locally

Just **double-click `index.html`** — opens straight in your browser.

Or run a local server:
```bash
cd "autom8-web"
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy to Netlify (30 seconds)

**Easiest — drag & drop:**
1. Go to https://app.netlify.com/drop
2. Drag the `autom8-web` folder onto the page
3. Done. You'll get a live URL instantly.

**Git + Netlify (recommended for updates):**
1. Push the folder to a Git repo
2. Netlify → "Add new site" → "Import from Git"
3. Pick the repo. Build settings auto-detected from `netlify.toml`. Publish directory `.`, no build command.

**Custom domain (autom8ig.io):**
Netlify → Domain settings → Add custom domain → `autom8ig.io` → follow DNS instructions.

## Mobile & iPad optimisation built in

- Mobile-first CSS with breakpoints at **360 / 560 / 820 / 1024 / 1180 px**
- Hamburger menu under 820px; safe-area insets for iPhone notch
- 16px input font-size to prevent iOS auto-zoom
- 1-col on phone, 2-col on iPad portrait, 3-col on iPad landscape & desktop
- `prefers-reduced-motion` respected

## What works in the demo

- Looping IG conversation in the hero phone (typing dots → message)
- **Live chatbot** in the "Live demo" section: tap a scenario chip, OR type a message — keywords (*ship, size, discount, book, refund*) trigger smart replies
- Pricing monthly ↔ yearly toggle (animated)
- Email-capture form with validation + success toast

## Quick edits

All copy lives in `index.html`. Change pricing via the `data-monthly` / `data-yearly` attributes. Change demo bot replies in the `SCENARIOS` object near the top of `script.js`.
