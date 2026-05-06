# Deploy this folder to Netlify

**Drag THIS folder (`site/`) — not the parent `autom8-web` folder — onto Netlify.**

The parent folder contains a separate Next.js project that was confusing Netlify. This `site/` folder is a clean, self-contained static site with nothing else.

## What's in here (8 files only)

```
site/
├── index.html      ← the page
├── styles.css
├── script.js
├── netlify.toml    ← config (no build step)
├── _redirects
├── robots.txt
├── sitemap.xml
└── DEPLOY.md       ← (this file)
```

## Steps

### Drag & drop (30 seconds)

1. Open https://app.netlify.com/drop
2. Drag this **`site/`** folder onto the page
3. Done — you'll get a live URL like `https://something-cool.netlify.app`

### Or via Git

If you push the repo, point Netlify at the `site/` subfolder:
- Base directory: `autom8-web/site`
- Publish directory: `.`
- Build command: *(leave empty)*

### Custom domain (autom8ig.io)

Netlify → Domain settings → Add custom domain → `autom8ig.io` → follow the DNS instructions.

## See it locally first

Just **double-click `index.html`** inside this folder — it opens straight in your browser.

## Mobile / iPad

Tested breakpoints: 360, 560, 820, 1024, 1180px. iPhone notch & home-indicator safe areas. iOS auto-zoom prevention. Hamburger menu under 820px.
