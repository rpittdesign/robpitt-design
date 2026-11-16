# Changes and verification — November 16, 2026

## Changes

- Preserved Astro static generation, cream/orange palette, existing typography, conversational voice, wooden boot story, projects and all four case studies.
- Integrated Epomon Intro v4 as a scoped Astro component, rather than an iframe or standalone page. Retained the illustrations, responsive portrait/wide compositions, ticker-tape physics, optional synthesised printer sound and replay.
- Added keyboard-operable pause/resume, reduced-motion final pose, preference-change handling, background-tab suspension and animation shutdown after completion. Fixed simulation timing so dropped fractional frames do not slow the sequence. Included a no-JavaScript illustrated fallback.
- Added the verified Defendify reporting accomplishment (approximately 20 reports/two weeks → more than 240 reports/approximately five minutes per cycle). Retained live dashboards and the reported 238% engagement increase; removed the unrelated INC 5000 claim from that entry.
- Removed Cursor and dismissive Figma hiring language. Emphasised Claude Code, OpenClaw, Lovable, working prototypes, collaboration and shipped software.
- Linked the published first Epomon comic. Added “What My Rookie-Level Digimon Taught Me About AI Agents,” verified from the supplied link's public LinkedIn metadata. Preserved existing writings.
- Fixed case-study header navigation to homepage anchors; added a skip link, named navigation landmarks, canonical/social metadata, real case-study subheadings, visible focus styles and darker small text.
- Converted referenced still case-study images to lossless WebP (3,825,823 fewer image bytes), added explicit dimensions, retained lazy loading and originals. Added reduced-motion stills and a pause control for animated case-study GIFs.
- Updated Astro from the archive's version 5 dependency to 7.4.12 to resolve reported dependency vulnerabilities. Preserved Netlify static deployment, with Node 24 explicitly configured. No tracking or analytics added. No live domain or hosting changes made.

## Verification performed

- Installed dependencies and successfully built all five static pages using Node 26.12.1.
- `npm audit`: zero vulnerabilities after the dependency update.
- Checked generated internal routes, anchors and asset references on all five pages: zero failures.
- Visually previewed the homepage at desktop (including 1440px), tablet (820px) and mobile (390px) widths.
- Visually previewed all four case-study headers at desktop and mobile widths. Checked TD Bank's initial image layout and CashStar/Nordstrom/Covetrus representative imagery; this was not an exhaustive pixel-by-pixel review of every scroll position.
- Exercised intro replay, pause/resume and sound on/off controls in the browser, including keyboard activation. Verified case-study navigation back to the homepage and the GIF pause control switching to a still image.
- Executed the intro in a mocked DOM/canvas harness for normal and reduced-motion branches: confirmed final reveal, animation-loop termination, replay/pause, and no animation loop with reduced motion. Reduced motion was not separately emulated in a real browser.
- New comic URL returned HTTP 200 and its metadata identifies Tales of Epomon — Episode 1: “Workshop Digimon.” The new writing URL returned HTTP 200; its metadata confirms the title above.
- Existing project sites, LinkedIn profile and ADPList returned HTTP 200. 1bitkindle redirects to HTTPS; the site link now uses HTTPS directly.

## Limits and content to confirm

- Etsy, Medium and three older LinkedIn article URLs returned HTTP 403 to automated requests. Their original links remain; a 403 does not establish that they are broken.
- The writing shortlink resolves through LinkedIn sharing URLs, rather than a stable direct article URL. Kept the exact supplied shortlink; verified the article title from public metadata.
- Employment titles are retained from the original site and are not independently verified. In particular, confirm “Principal Product Designer” at Defendify and “Product Design Lead” at Covetrus against formal employment records. “Head of design” at TD Bank now describes leading design under the existing Senior UX Design Manager title. Nordstrom's “Lead Designer” wording now describes leading the work under the existing CashStar Principal UX Designer title. No promotion was invented.
- Existing historical metrics, awards and business claims were preserved from the supplied site, except the Defendify wording requested above. They were not independently substantiated. The Defendify reporting numbers are user-verified; the 238% figure is explicitly described as reported.
- Actual audible output, screen-reader behaviour, no-JavaScript rendering and physical-device behaviour were not independently tested. Browser controls and the reduced-motion execution path were tested as described, without claiming full accessibility certification.
- Node 24 deployment configuration is provided; the build was actually run on the available Node 26.12.1. No production deployment was requested or performed.

## Follow-up: alternating backgrounds

- Header and Epomon animation now share the light beige background. Homepage sections alternate from there: Now uses orange cream; Shipped beige; How I work orange cream; Writings beige; Contact orange cream. Scoped the alternating section rule so the nested animation does not create its own colour band.

## Follow-up: heading band and navigation motion

- Placed the large “I make things” heading in an orange-cream band while retaining the light-beige animation and the existing section alternation.
- Added native smooth scrolling for anchor navigation when reduced motion is not requested. Reduced-motion users retain immediate navigation.

- Corrected L.L.Bean’s location to Freeport, Maine.

- Added Cardboard Fieldnotes to “What I’m making now,” beside the Etsy shop, using the user-supplied site content.
