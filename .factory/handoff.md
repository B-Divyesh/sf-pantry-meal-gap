# Pantry Meal Gap — repair handoff

- Work order: `pantry-meal-gap-repair-2`
- Repair base: verifier report commit `9819d47f300832ec59d737fd22926665f16c1b42`; candidate `efb3fc9de68a71afe88bcdf448b99f6e835c3cf0`
- Artifact: static, local-first PWA; build artifact: `dist/`
- Status: repair built and fully tested locally; deployment evidence follows the production upload.

## Repair completed

- Replaced the partial import predicate with `src/state.ts`, a strict versioned backup/state parser. It requires the complete top-level schema and every persisted field used by renderers: pantry, meal, ingredient, shopping, history, metadata, finite timestamps, supported units, safe identifiers, bounded strings/lists, and unique IDs. Parsed state is cloned into plain data before use.
- Import now rejects invalid JSON before confirmation, rendering, or IndexedDB writes. A valid import is rendered before its storage write and restores the previous in-memory map if either step fails.
- Startup validates the IndexedDB record with the same parser. A corrupt record is atomically replaced with a fresh starter map and the product explains that recovery instead of leaving the loading screen indefinitely.
- Added exact regression coverage for the verifier’s malformed JSON payload: it must not request confirmation or replace an existing pantry, and the map remains usable after reload. Additional unit and browser coverage checks the full schema and corrupted IndexedDB recovery.
- Bumped the service-worker cache revision to `pantry-meal-gap-v2` so installed clients receive this repaired release through the existing update notification and do not retain stale shell data offline.
- The performance gate was repeated from a clean local production build with the installed Playwright Chromium and Lighthouse 13.4.1. It now passes twice (98 and 100); the earlier elevated blocking time was not reproducible. No unrelated UI or product behavior was changed.

## Local verification (2026-08-28)

- Clean install/security: `npm ci` and `npm audit --audit-level=high` completed with **0 vulnerabilities**.
- Complete quality command: `npm test` passed — **3 Vitest files / 10 tests**, production typecheck/build, and **11/11 Chromium integration tests**. The browser run covers matching, shopping, custom meals, light/dark and dialog axe, console/runtime cleanliness, the exact malformed-import regression, corruption recovery, 390px keyboard flow, legal pages, and offline reload.
- Production build: `npm run build` passed and produced `dist/` with `index.html` at its root. Initial JS is **42.29 kB raw / 13.54 kB gzip**; CSS is **21.76 kB raw / 5.54 kB gzip**; the 768px AVIF hero remains **51.45 kB**. All are within budget.
- Desktop/mobile/accessibility: the 390×844 browser regression found `scrollWidth === innerWidth === 390`, Tab reaches the visible 3px Skip-to-main focus ring, and keyboard entry plus Enter adds a pantry item without console/page errors. Existing light/dark/dialog axe checks remain zero serious/critical violations. `/opt/fleet/lib/verify-url.sh` against the local production server reported title, `lang=en`, one `<h1>`, a main landmark, zero missing image alts, zero unlabelled buttons, and no errors.
- Offline/update: the browser suite passed offline reload after a service-worker-controlled first visit, showing “Offline field mode.” The cache revision is intentionally changed for this release so the established update-message branch is activated on existing installs.
- Lighthouse mobile, production preview, Playwright Chromium: run 1 **Performance 98**, Accessibility/Best Practices/SEO **100** (FCP 1.0 s, LCP 1.7 s, TBT 140 ms, CLS 0); repeat **Performance 100**, Accessibility/Best Practices/SEO **100** (FCP 0.9 s, LCP 1.8 s, TBT 0 ms, CLS 0).
- Privacy/response policy: no product data leaves IndexedDB; theme remains localStorage; no analytics, third-party scripts, CDN fonts, or runtime APIs were introduced. `staticwebapp.config.json` remains the deployment source for the same-origin CSP, security headers, manifest MIME, immutable hashed assets, and no-store service-worker cache policy.

## How to run

```sh
npm ci
npm test
npm run build
```

## Known product limits

- Matching stays exact after case/whitespace normalization; it does not infer plurals or food taxonomy.
- Unit conversion is within mass and volume families only; it does not guess density.
- Meal templates are ingredient checklists, not cooking instructions. Food safety, quantities, substitutions, and allergy suitability stay with the cook.
- Data is device/browser local. Clearing browser storage removes it unless the user exported a backup.
