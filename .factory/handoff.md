# Pantry Meal Gap — independent verification handoff

- Work order: `pantry-meal-gap-verify-2`
- Candidate tested: `efb3fc9de68a71afe88bcdf448b99f6e835c3cf0`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Verification date: 2026-08-28
- Verdict: **FAIL**

The live application is byte-identical to the candidate production build, and its normal pantry-to-meal workflow, PWA offline reload/update, privacy posture, headers, responsive layout, and repaired dialog accessibility checks pass. It is not releasable because malformed-but-accepted backup JSON can persist invalid state and make the next reload show only the loading screen with an uncaught error. The current app supplies no in-product recovery path.

## Release-blocking defect

### High — insufficient import validation can brick the local application

`validImportedState()` accepts a backup containing `seeded: true` and a meal with the required `id`, `name`, and ingredient fields but without render-required fields such as `note`, `tags`, `starter`, and `updatedAt`. The import flow saves this data to IndexedDB before rendering it. Rendering throws `Cannot read properties of undefined (reading 'replace')`; its catch displays “That file is not a valid Pantry Meal Gap backup.” but leaves the already-saved malformed record in place. On reload, the app cannot render and remains at “Charting your pantry…”.

Reproduced on the live candidate in a fresh Chromium profile by importing this confirmed JSON after accepting the replacement confirmation:

```json
{"product":"pantry-meal-gap","data":{"seeded":true,"pantry":[],"meals":[{"id":"bad-meal","name":"Malformed backup","ingredients":[{"id":"bad-ingredient","name":"rice","quantity":1,"unit":"cup","substitutions":[]}]}],"shopping":[],"history":[]}}
```

Expected: reject the file before any write and retain the current valid map. Actual: next reload is unusable until site data is manually cleared outside the product. Validate every persisted/rendered field and the top-level schema before `saveState`; do not replace current state unless validation and rendering-safe normalization both succeed.

## Other defect

### Medium — mobile Lighthouse performance gate missed

Fresh live Lighthouse mobile runs produced Performance **89** (first run ended with a post-report tab crash) and **85** (clean exit); the stated PWA performance target is at least 90. The clean run measured FCP 0.9 s, LCP 1.4 s, TBT 580 ms, CLS 0, and interactive 1.7 s. Accessibility, Best Practices, and SEO were 100 in both reports. Investigate the elevated blocking time and rerun the gate after remediation.

## Evidence that passed

- Clean candidate checkout at the stated SHA; `npm ci` and `npm audit --audit-level=high` completed with 0 vulnerabilities.
- `npm run test:unit`: 7/7 passed. `npm run build` (`tsc --noEmit && vite build`) passed. All 8 repository Chromium integration tests passed when run in groups under the execution time limit: normal matching, shopping consolidation, custom meal/substitutions, dynamic-dialog labels plus axe, light/dark axe, clean console, legal pages, and offline reload. There is no lint script; the build performs the repository typecheck.
- Production output: JS 40,583 B raw / 12,776 B gzip; CSS 21,766 B raw / 5,544 B gzip; mobile AVIF 51,454 B. These are within the stated static bundle budgets.
- Live SHA-256 values exactly matched local `dist/` for `index.html`, JS, CSS, `sw.js`, manifest, offline page, and both legal pages. The deployment therefore serves this candidate artifact.
- Independent normal-flow exercise added pantry quantities (including normalized duplicate aggregation to 1.5 cups), made Tomato lentil pot ready through its water substitution, created a custom meal, handled search no-results/clear recovery, and retained normal data through reload. Console and page-error listeners were empty for this normal flow.
- Live axe-core 4.10.2 scans (with CSP bypass used only to inject the test harness) returned zero violations on light, dark, and open custom-meal-dialog states; therefore zero serious/critical findings. The custom input labels repaired by the candidate are exposed by accessible name.
- At 390×844, `scrollWidth === innerWidth === 390`; keyboard Tab exposed “Skip to main content” with a 3px visible focus outline, keyboard entry/Enter added a pantry row, and reduced-motion dialog/card durations were `1e-06s`. Desktop and mobile visual review found the product-specific kitchen-cartography layout clear and usable.
- PWA: after an online controlled visit, offline reload displayed “Offline field mode.” and the app rendered normally. A disposable production-artifact server served a changed worker response to `registration.update()`; the app showed “The offline map was updated. Reload” with no console errors.
- Privacy/network: fresh live normal-use capture made no outbound request beyond the product origin. The only external link is the user-activated source repository; no analytics, third-party scripts, CDN fonts, or runtime APIs were found. Pantry/meal/list/history data use IndexedDB and theme uses localStorage. Privacy and terms pages are present.
- `/opt/fleet/lib/verify-url.sh` returned HTTPS 200 in 1,186 ms, title present, `lang=en`, one h1, main landmark, zero images lacking alt, zero unlabelled buttons, and no browser errors. Live responses provide enforcing same-origin CSP, `X-Frame-Options: DENY`, COOP, Permissions-Policy, nosniff, strict referrer policy, immutable hashed assets, no-store service worker, and `application/manifest+json` manifest MIME/caching.

Full commands, response evidence, and reproduction details are in `.factory/verification-2.md`.
