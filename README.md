# oh-my-claudecode Website

## Structure

```
├── index.html          # Main landing page (original 3D design)
├── css/                # Stylesheets for main site
├── js/                 # JavaScript for main site
├── data/               # Data files
├── docs/               # Legacy documentation (original docs.html)
├── vibetip/            # New Fumadocs documentation site
│   ├── content/docs/   # Documentation content
│   ├── src/            # Next.js app
│   └── package.json    # Dependencies
└── assets/             # Images and media
```

## Deployment

### Main Site (GitHub Pages)
The main site at root is a static HTML/CSS/JS site deployed to GitHub Pages.

### Docs Site (Vercel)
The vibetip docs are deployed separately to Vercel:

```bash
cd vibetip
npm install
npm run build
# Deploy ../docs-dist to Vercel
```

The vibetip docs are configured with `basePath: '/docs'` for subdirectory deployment.

## Navigation

- **Main site**: Links to `/docs/` for the vibetip documentation
- **Legacy docs**: Available at `/docs/index.html` (original documentation)

## Development

### Main Site
Just open `index.html` in a browser or serve with any static server.

### Vibetip Docs
```bash
cd vibetip
npm install
npm run dev
```

## GitHub Pages Deprecation Notice

GitHub Pages deployment of the docs is deprecated. Use the Vercel deployment instead.
