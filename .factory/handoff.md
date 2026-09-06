# Pantry Meal Gap — repair handoff

- Work order: `pantry-meal-gap-repair-3`
- Implementation commit: `daa0976adc4acbc6ccecd89916205c478b050526`
- Documentation commit: recorded by the handoff-only commit following this file
- Candidate artifact: static local-first PWA, `dist/`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Status: **candidate verified locally; live deployment blocked externally**
- Reviewed: 2026-09-06

## What changed

- Added the one-click `/demo/` sandbox and `?demo=1` entry point. It begins with ten practical pantry items, ready meal matches, three shopping items, and a recent choice.
- Isolated demo state in IndexedDB database `demo:pantry-meal-gap`; real data remains in `pantry-meal-gap`. Reset affects only sample data. Start for real deletes the demo namespace before opening the real workspace.
- Rewrote the first screen in plain words: the job is finding the smallest missing shopping list, for home cooks choosing dinner, with sample data as the primary action and privacy/offline/free facts.
- Added `.factory/claims.json` with 13 public claims and exactly one tagged, outcome-based Playwright check per claim. Added the demo and copy-audit documents.
- Added `/demo` route metadata, canonical/Open Graph/Twitter tags, Apple touch icon, 1200×630 original social preview, sitemap entry, designed `404.html`, and Static Web Apps’ real 404 response override.
- Made visible links and buttons at least 44×44 px and added a browser regression check for that outcome.
- Strengthened the service worker to precache the hashed Vite JS/CSS files so a first successful visit can reload offline in the demo.

## Prior finding disposition

| Finding | Disposition in candidate |
| --- | --- |
| No isolated one-click sample | Fixed: `/demo/`, persistent demo label, Reset demo, Start for real, separate IndexedDB namespace |
| No claims inventory/tests | Fixed: 13 documented claim commands each pass from the demo sandbox |
| Metaphor-first entry copy | Fixed: plain-language job, audience, primary sample action, and facts; audited in `.factory/copy-audit.md` |
| No real 404 or complete metadata | Fixed in `404.html`, `staticwebapp.config.json`, static route pages, metadata, and sitemap |
| Under-44 px links | Fixed and browser-checked |
| Earlier import corruption/recovery, dialog labels, policy headers, manifest MIME, nested landmark, and performance concerns | Still covered by unit/browser checks and the existing static configuration |

## Local verification

From a clean dependency install:

```sh
npm ci
npm test
npm audit --audit-level=high
```

- `npm test`: **10 Vitest tests**, production build, and **26 Playwright tests** passed.
- `npm audit --audit-level=high`: **0 vulnerabilities**.
- Every command declared in `.factory/claims.json` was run individually after the final candidate build; all 13 passed.
- `npm run build` produces `dist/` with 45.42 kB raw / 14.36 kB gzip JS and 23.91 kB raw / 5.92 kB gzip CSS. The 768px AVIF hero is 51.45 kB.
- Direct Playwright axe checks found zero serious/critical violations on the main light/dark pages, meal dialog, demo, and 404 page. The standalone `@axe-core/cli` command was attempted but its Selenium Chrome session exits in this worker; the direct browser integration is the successful accessibility evidence.
- `/opt/fleet/lib/verify-url.sh` passed against the local candidate: title, `lang`, one h1, main landmark, image alt text, labelled buttons, and no browser console errors.
- Local Lighthouse mobile: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP **1.1 s**, LCP **1.4 s**, TBT **0 ms**, CLS **0**.
- Fresh local desktop and 390px phone screenshots were reviewed. The first screen identifies the job, audience, and first action before scrolling; the phone layout had no horizontal overflow.

## Deployment and live check

`daa0976` was pushed to `origin/main`. The static deployment CLI was then attempted twice with the exact product app name and `dist/`; each authenticated but timed out while checking the product’s Azure settings, before reporting an upload. The CLI created a temporary local credential file, which was removed without being read or committed.

At handoff, HTTPS still serves the old August artifact, not this implementation:

- Root title: `Pantry Meal Gap — the shortest route to dinner`
- `/demo/`: old root title rather than `Demo — Pantry Meal Gap`
- `/404`: old root response rather than the designed 404

Fresh desktop and 390px phone browser contexts both loaded that old live artifact without console errors or horizontal overflow. They cannot verify this candidate’s new demo, claims, route metadata, or 404 behavior until the factory’s static deployment configuration completes the publish.

## Product scope and dependencies

The free core remains complete. There is no paid offer, account system, backend, billing registration, external API, image recognition, recipe scraping, grocery delivery, or AI feature. No billing metadata file is needed for this researched free product.

## Next step

Publish the already-pushed `daa0976` static artifact with the product’s durable deployment configuration, then repeat the HTTPS candidate checks for `/`, `/demo/`, `/privacy/`, `/terms/`, and a missing route.
