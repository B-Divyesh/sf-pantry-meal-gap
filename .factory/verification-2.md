# Independent verification — FAIL

- Work order: `pantry-meal-gap-verify-2`
- Candidate commit: `efb3fc9de68a71afe88bcdf448b99f6e835c3cf0`
- Candidate branch: `main`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Date: 2026-08-28
- Verdict: **FAIL**

This was a fresh independent verification of the requested candidate. The checkout started clean at the stated SHA. No product code was modified. The live artifact hashes match the local production build, so live findings apply to this candidate.

## Release-blocking defects

### High — malformed backup passes validation, is persisted, and bricks reload

The brief requires a local-first utility with explicit import/export, and the interface promises that import replaces data only after validation. `src/main.ts` accepts a structurally incomplete state because `validImportedState()` does not validate every field subsequently used by rendering. In particular, a meal can omit `note`, `tags`, `starter`, and `updatedAt` while passing its current checks.

Fresh live reproduction:

1. Clear `pantry-meal-gap` IndexedDB and load the live app.
2. Select this JSON with **Import backup** and accept the replacement confirmation:

   ```json
   {"product":"pantry-meal-gap","data":{"seeded":true,"pantry":[],"meals":[{"id":"bad-meal","name":"Malformed backup","ingredients":[{"id":"bad-ingredient","name":"rice","quantity":1,"unit":"cup","substitutions":[]}]}],"shopping":[],"history":[]}}
   ```

3. The import path writes the data, then rendering throws `Cannot read properties of undefined (reading 'replace')`. Its catch presents “That file is not a valid Pantry Meal Gap backup.”
4. Reload. Because `seeded` is true, startup loads the malformed record. `h1` disappears and `#app` remains the initial “LOCAL FIELD NOTES / Charting your pantry…” loader. The same uncaught error is recorded.

This turns invalid user input into persistent unusable local state, with recovery requiring browser storage clearing rather than a product control. Reject complete invalid schemas before calling `saveState`, preserve the prior state on any import/render failure, and recover from an invalid stored record on startup. Add an end-to-end regression for this payload.

### Medium — mobile Lighthouse performance target was not met

The product performance skill sets a mobile Lighthouse target of at least 90. Against the live candidate:

| Run | Process | Performance | A11y | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | tab crashed after writing JSON | 89 | 100 | 100 | 100 | 1.2 s | 1.6 s | 440 ms | 0 |
| 2 | clean exit | 85 | 100 | 100 | 100 | 0.9 s | 1.4 s | 580 ms | 0 |

The second run used Lighthouse with the installed Playwright Chromium, `--no-sandbox --disable-dev-shm-usage --disable-gpu`, and completed normally. The elevated total blocking time needs remediation and a clean ≥90 repeat before release.

## Local install, test, typecheck, and build

Commands run from the clean checkout:

```sh
npm ci
npm audit --audit-level=high
npm run test:unit
npm run build
npx playwright test tests/e2e/app.spec.ts -g 'adds a custom meal|labels every dynamically|has no serious|loads without'
npx playwright test tests/e2e/app.spec.ts -g 'legal pages|reloads the complete'
npx playwright test tests/e2e/app.spec.ts -g 'maps pantry amounts|builds a consolidated'
```

- `npm ci` passed; high-severity audit result: **0 vulnerabilities**.
- `npm run test:unit`: **2 files / 7 tests passed**.
- `npm run build` passed (`tsc --noEmit && vite build`), producing `dist/`.
- All repository e2e tests passed: **8/8**. They were split only because the verifier execution channel cuts commands at 30 seconds; together they are the exact Playwright suite run by `npm test`.
- No lint script exists in `package.json`; the production build includes TypeScript checking.
- Built output budgets: `main-CE-wIgn4.js` 40,583 B raw / 12,776 B gzip; `main-CnYzW7j2.css` 21,766 B raw / 5,544 B gzip; 768px AVIF 51,454 B. Initial JS, CSS, font (none), and mobile hero asset are within the stated budgets.

## End-to-end functional evidence

Fresh Chromium exercises against the live deployment passed for normal and boundary behavior:

- Added red lentils, tomatoes, onion, garlic, and water; Tomato lentil pot showed 100% coverage and used the acceptable water substitution. Marking it chosen recorded route history.
- Adding `red lentils` followed by whitespace/case-varied `RED LENTILS` aggregated the normalised duplicate to 1.5 cups.
- A no-results search showed its recovery message and **Clear search** restored the grid.
- Zero amount was rejected by the numeric input’s native `min=0.01` validity constraint; it did not mutate pantry state.
- Custom-meal editor held its minimum of one ingredient with “A meal needs at least one ingredient.” A valid one-ingredient custom meal saved and appeared in search.
- Invalid JSON parse was rejected without changing a valid pantry. The separate structurally incomplete JSON above is the release-blocking validation failure.
- Existing e2e coverage independently passed partial quantities, compatible unit conversion, substitutions, and no double allocation.
- Normal flow, invalid numeric attempt, search recovery, custom editing, offline reload, and update checks produced no console errors or page errors. The malformed-import reproduction is the exception documented above.

## Accessibility, responsive, keyboard, and motion evidence

- `/opt/fleet/lib/verify-url.sh https://pantry-meal-gap.sociobot.in/ <temp-evidence-dir>` passed: HTTPS 200 in 1,186 ms; title present; `lang=en`; exactly one h1; a main landmark; zero images missing `alt`; zero unlabelled buttons; no browser errors.
- Direct axe-core 4.10.2 scans of live light mode, dark mode, and `#meal-dialog` each returned **zero violations**. CSP bypass was used only in the isolated audit context so axe could be injected; it was not used for normal functional or network checks.
- At 390×844, document and body widths were both 390 with no horizontal overflow. Visual review at 390px and 1440px found the map/survey/meal/list hierarchy readable and product-specific.
- Keyboard Tab reached **Skip to main content**, whose computed focus outline was `rgb(217, 77, 44) solid 3px`; keyboard typing plus Enter added a pantry ingredient.
- With `prefers-reduced-motion: reduce`, dialog animation and meal-card transition durations computed to `1e-06s`.

## PWA, deployment identity, privacy, and policies

- First live visit received a service-worker controller at `/sw.js`; an offline reload in the same fresh context rendered the h1 and **Offline field mode.**
- Update path: a disposable static server served the exact production artifact, then changed only its served service-worker bytes. `registration.update()` produced **The offline map was updated. Reload** with no console/page error.
- SHA-256 local/live comparisons matched for `index.html`, `assets/main-CE-wIgn4.js`, `assets/main-CnYzW7j2.css`, `sw.js`, `manifest.webmanifest`, `offline.html`, `privacy/index.html`, and `terms/index.html`.
- A fresh live normal-use capture made no outbound request other than the product origin. Source inspection and runtime capture found no analytics, tracking, third-party fonts/scripts, or runtime APIs. The only external URL is the user-activated repository source link.
- Local data uses IndexedDB; theme uses localStorage; privacy and terms pages exist and accurately describe local storage. The import-validation defect remains the exception to safe data recovery.
- Root, JS, service-worker, and manifest live response checks confirmed HTTPS 200, CSP (`default-src 'self'`, no frame embedding, same-origin script/connect), `X-Frame-Options: DENY`, COOP, Permissions-Policy, nosniff, strict referrer policy, immutable one-year hashed asset cache, no-store service worker cache, no-cache manifest cache, and `application/manifest+json` manifest MIME.

## Retest criteria

1. Implement strict schema validation/normalization for all persisted and render-used fields, before writing imported data.
2. Ensure failed imports never replace current state, and make startup recover to a safe state if corrupted IndexedDB data is encountered.
3. Add a regression test importing the exact incomplete JSON above, then reloading and asserting the app remains usable with no console/page errors.
4. Reduce mobile Lighthouse blocking time and provide a clean Lighthouse run with Performance ≥90.
5. Re-run the complete clean install/build/unit/e2e/live/PWA verification.
