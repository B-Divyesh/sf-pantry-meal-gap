# Pantry Meal Gap — repair handoff

- Work order: `pantry-meal-gap-repair-1`
- Repair base: verifier report commit `68ecfef71a44f1daffe0351fc1dcafcdb24871e2`, candidate `06a179381f0e6f42eb98fc45b7fcc5ef506633d3`
- Artifact: static, local-first PWA; build artifact: `dist/`
- Status: ready for static deployment and post-deploy identity/response-policy verification

## Repair completed

- Corrected the release-blocking custom-meal accessibility defect at its renderer: every ingredient, amount, unit, and acceptable-swap control now receives a unique generated `id` and a matching visible `<label for>`. The initial three rows and every subsequently added row are covered.
- Added a Playwright regression that opens the dialog, asserts the accessible names for all initial controls and a newly added fourth row, then runs axe against the open dialog. The dialog now has **zero axe violations**, including zero serious/critical findings.
- Fixed the verifier's initial-screen landmark finding by changing the nested data-panel `aside` to a labelled section; no complementary landmark remains nested inside the shopping section.
- Made the three footer legal/source links 44px-high touch targets.
- Added `public/staticwebapp.config.json`, which Vite copies into `dist/`, for Azure Static Web Apps. It adds enforcing CSP (`default-src 'self'`, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, COOP, Permissions-Policy, nosniff, strict referrer policy, correct `application/manifest+json` MIME type, immutable one-year `/assets/*` caching, and explicit no-cache service-worker/manifest policy. The source config is covered by a Vitest regression.

## Local verification (2026-08-28)

- Clean install: `npm ci` — completed; `npm audit --audit-level=high` — **0 vulnerabilities**.
- Unit/config: `npm run test:unit` — **2 files, 7 tests passed** (the seventh test verifies the static-host policy config).
- Typecheck/build: `npm run build` — **passed**; emitted `dist/index.html`, legal pages, PWA assets, and `dist/staticwebapp.config.json`. Initial JS is **40,583 B** (12,920 B gzip); CSS is **21,766 B** (5,540 B gzip); mobile AVIF is **51,454 B**.
- Browser integration: `npm run test:e2e` — **8/8 Chromium tests passed**, including core pantry-to-ready-meal workflow, shopping consolidation, custom meals, persistence, legal pages, clean console/runtime, initial light/dark axe, open-dialog axe, and offline reload.
- Direct desktop/mobile browser smoke: at 1440×1000 the open custom-meal dialog returned **0 axe violations** and every initial control exposed its expected accessible name. At 390×844 `scrollWidth === innerWidth === 390`; no console/page errors occurred.
- Keyboard: Tab reached “Skip to main content” with a 3px outline; keyboard entry and Enter added “Keyboard Beans”.
- Offline: `npx playwright test tests/e2e/app.spec.ts -g 'reloads the complete app while offline'` — **1/1 passed** after a first service-worker-controlled visit.

## Deployment and live evidence

The static deploy, live identity comparison, response headers, service-worker update path, and final URL audit are performed after this repair commit is pushed. Append those exact results here after the deployment; no application behavior beyond the documented accessibility/semantic/touch-policy repairs has changed.

## How to run

```sh
npm ci
npm test
npm run build
```

No accounts, analytics, third-party scripts, remote fonts, or runtime APIs are introduced. Pantry, meal, shopping, and history data remain in IndexedDB; theme preference remains local storage; export/import remain available.

## Known product limits

- Matching stays exact after case/whitespace normalization; it does not infer plurals or food taxonomy.
- Unit conversion is within mass and volume families only; it does not guess density.
- Meal templates are ingredient checklists, not cooking instructions. Food safety, quantities, substitutions, and allergy suitability stay with the cook.
- Data is device/browser local. Clearing browser storage removes it unless the user exported a backup.
