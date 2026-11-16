# robpitt.design

Static Astro portfolio. Includes editable source and the generated `dist/` site.

## Run

Use Node 24 (see `.nvmrc`; Astro requires Node >=22.23.4).

```sh
npm ci
npm run dev
npm run build
npm run preview
```

On Netlify, the retained configuration builds with `npm run build` and publishes `dist`.
For another static host, upload the contents of `dist/`. No server, credentials, database, or analytics are needed.
The existing Google Fonts integration is retained, with the intro's Patrick Hand font added to the same request.
System fallback fonts remain available offline.

## Structure

- `src/components/EpomonIntro.astro`: native introduction markup and scoped styles.
- `src/scripts/epomon-intro.js`: original canvas physics and synthesised printer audio, with lifecycle/accessibility fixes.
- `src/pages/index.astro`: independent projects, professional work, writings and contact.
- `src/pages/shipped/`: four original case studies.
- `public/intro/`: seven original illustrated intro assets.
- `public/case-studies/`: original assets, lossless WebP alternatives and reduced-motion posters.

See CHANGELOG.md for changes, verification and remaining content checks.
