# Independent verification — PASS

- Work order: `pantry-meal-gap-verify-3`
- Candidate commit: `7c8a831912c9763c7dce67710f63489b06f47af1`
- Candidate branch: `main`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Verified: 2026-08-28
- Verdict: **PASS**

The live deployment is byte-for-byte the production build of the requested candidate. The earlier deployment-only concern was retested from a fresh browser profile and is not present.

## Defects

No release-blocking, high, medium, or low defects found in this verification.

## Local install, tests, and build

The checkout began clean at the requested SHA.

- `npm ci` completed successfully; `npm audit --audit-level=high` reported **0 vulnerabilities**.
- `npm run test:unit` passed: **3 files, 10 tests**.
- `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`.
- All repository Chromium integration tests passed from the production build: **11/11**. They were run in four groups to keep terminal execution observable: 2 pantry/shopping tests, 3 custom-meal/axe tests, 3 console/import/corruption-recovery tests, and 3 mobile/legal/offline tests. This is the same test set called by `npm test`.
- There is no separate lint command; TypeScript checking is part of the production build.

Built initial assets meet the static-PWA budgets: JS **42.29 kB raw / 13.54 kB gzip** (under 200 kB), CSS **21.76 kB raw / 5.54 kB gzip** (under 50 kB), no webfont payload, and mobile AVIF hero **51.45 kB** (under 300 kB).

## Independent functional evidence

Fresh live Chromium, desktop 1440×1000:

- Initial state had the expected title, `lang=en`, one `h1`, a `main` landmark, **20** starter meals, and an active service-worker controller.
- Adding red lentils (1 cup), tomatoes (1 can), onion (1 item), garlic (2 cloves), and water (2 cups) made **Tomato lentil pot** 100% covered through its allowed water substitution. Marking it chosen created Recent routes.
- A no-result search showed its clear-search recovery action and returned to the grid.
- A zero pantry amount failed native form validity without adding a row. The custom-meal editor prevented removal of its final ingredient row and explained the recovery.
- An incomplete backup was rejected with “That file is not a valid Pantry Meal Gap backup.” Reload retained the five valid pantry rows. This directly retests the prior malformed-import failure.
- Console and page-error listeners remained empty throughout normal, invalid, persistence, offline, mobile, and PWA-update testing.

## Accessibility, responsive behavior, and motion

- `/opt/fleet/lib/verify-url.sh` against live returned HTTP 200, title, `lang=en`, one `h1`, main landmark, zero images without alt text, zero unlabeled buttons, and no browser errors.
- Direct axe-core 4.10.2 scans (with CSP bypass only for audit injection) found **zero serious or critical violations** on light mode, dark mode, and the open custom-meal dialog.
- At 390×844, document and body widths both equaled the 390px viewport (no horizontal overflow). Keyboard-only entry and Enter added “Keyboard Beans.” The first Tab reached Skip to main content with a visible `3px solid rgb(217, 77, 44)` focus ring.
- Under `prefers-reduced-motion: reduce`, dialog animation/transition and meal-card transition durations were `1e-06s`.

## PWA, privacy, policies, and live identity

- On a fresh live profile, service-worker control was established at `/sw.js`; after first load, an offline reload rendered the normal heading and “Offline field mode.”
- The update path was exercised on a disposable local server serving the exact `dist/` artifact: changing only the served worker bytes, then calling `registration.update()`, produced “The offline map was updated.” with no errors.
- Fresh live request capture showed product-origin requests only. Source and runtime checks found no analytics, trackers, third-party scripts/fonts, CDN assets, or product API calls. Pantry data is local IndexedDB and theme is localStorage; the privacy and terms pages accurately disclose this.
- Live SHA-256 matched local `dist/` exactly for `index.html` (`7475eaf7…`), JS (`43d240e6…`), CSS (`92ad0d8a…`), `sw.js` (`23e5b967…`), and manifest (`c91b2296…`). The URL therefore serves the requested candidate build.
- Live responses were HTTPS 200 with enforcing same-origin CSP, `X-Frame-Options: DENY`, COOP, Permissions-Policy, `nosniff`, strict referrer policy, HSTS, immutable one-year cache for hashed JS, no-store worker caching, no-cache manifest caching, and `application/manifest+json` manifest MIME.

## Performance

Lighthouse 13.4.1 mobile against the live URL, using the installed Playwright Chromium, completed normally: **Performance 94, Accessibility 100, Best Practices 100, SEO 100**; FCP **0.9 s**, LCP **1.2 s**, TBT **280 ms**, CLS **0**. This meets the configured release thresholds.

## How to repeat

```sh
npm ci
npm test
npm run build
```

For live smoke coverage, use the site URL above with a fresh Chromium profile; first load online before testing offline reload.
