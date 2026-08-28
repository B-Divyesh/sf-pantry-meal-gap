# Independent verification — FAIL

- Work order: `pantry-meal-gap-verify-1`
- Candidate tested: `06a179381f0e6f42eb98fc45b7fcc5ef506633d3`
- Live URL: `https://pantry-meal-gap.sociobot.in/`
- Date: 2026-08-27
- Verdict: **FAIL** — the custom-meal dialog has axe **critical** accessibility violations. This fails the non-negotiable accessibility acceptance gate despite the core product working.

## Release-blocking defect

### Critical — custom-meal fields have no accessible names

Opening **Add your meal** and scanning the open dialog with axe-core 4.10.2 on the live deployment reported:

| Rule | Impact | Affected controls |
| --- | --- | --- |
| `label` | critical | 6 inputs (Ingredient, Amount, Accept instead in the initial rows) |
| `select-name` | critical | 3 Unit selects in the initial rows |

The visible `<label>` elements in [src/main.ts](/work/repo/src/main.ts:436) are siblings, not associated labels (no `for`/matching `id`, and they do not wrap their controls). A screen-reader user therefore cannot reliably identify the ingredient rows in the product's custom-meal creation flow. The existing axe test only scans the initial page and misses this opened dialog.

## Other findings

| Severity | Finding | Evidence / impact |
| --- | --- | --- |
| Moderate | Static PWA deployment cache policy is not immutable. | Live hashed JS/CSS and `sw.js` return `Cache-Control: public, must-revalidate, max-age=30`; no `immutable`. This does not break the tested offline shell, but misses the stated long-lived immutable asset-caching policy and causes avoidable revalidation. |
| Moderate | Browser security response policies are incomplete. | Main response has HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and deprecated `X-XSS-Protection`; it has no enforcing `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy`, or COOP. Lighthouse flagged the absent enforcing CSP as high severity. |
| Low | Manifest is served as `application/octet-stream`. | `/manifest.webmanifest` is otherwise valid and the service worker registered in Chromium, but `application/manifest+json` is the appropriate response type. |
| Low | One non-blocking axe issue on the initial screen. | `landmark-complementary-is-top-level` (moderate): the data `<aside>` is nested in a section. |
| Low | Footer legal/source links measure 20px tall on desktop. | Privacy, Terms, and Source links are below the 44px touch-target policy, though all primary controls measured at least 44px in the checked viewport. |

## What passed

### Clean local checkout and build

The worktree started at exactly the candidate commit and clean. `npm ci` completed with 0 audit vulnerabilities. There is no lint script in `package.json`.

- `npm run test:unit`: **6/6 passed**.
- Exact production build, `npm run build` (`tsc --noEmit && vite build`): **passed**.
- All repository Playwright tests: **7/7 passed**, run in three commands because the execution harness limits a single command's visible runtime:
  - core meal/pantry/custom-meal scenarios: 3/3;
  - initial-page axe, console/runtime, and legal pages: 3/3;
  - offline reload: 1/1.
- `npm audit --audit-level=high`: **0 vulnerabilities**.

Production output is 40,383 bytes JS (12,880 gzip), 21,711 bytes CSS (5,540 gzip), no runtime font payload, and the mobile AVIF is 51,454 bytes — all within the stated static asset budgets.

### Core job-to-be-done, validation, recovery, and privacy

Independent live Chromium exercise on a fresh profile passed:

- The initial app presented 20 starter meals, one `<h1>`, one `<main>`, `lang="en"`, and the expected title.
- Adding red lentils, tomatoes, onion, garlic, and water produced a 100% **Tomato lentil pot** using the accepted water substitution; marking it chosen created route history.
- Search no-results displayed its recovery action and keyboard activation cleared the search.
- A forced invalid zero amount displayed “Enter an ingredient and an amount greater than zero.” without corrupting the pantry.
- Five saved pantry rows survived a reload. Repository unit tests independently cover partial quantities, compatible-unit conversion, substitutions, normalization, and no double allocation.
- Live network capture observed **no automatic outbound requests**. The only external URL in the bundle is the user-activated Source link to the repository. No CDN fonts/scripts or analytics were observed. App data remained in IndexedDB/localStorage as documented; legal pages load and state the local-data policy.
- Console and page-error listeners stayed empty during normal, invalid, persistence, offline, keyboard, and service-worker-update exercises.

### PWA, offline, update, mobile, keyboard, motion

- On the live deployment, `navigator.serviceWorker.controller` became `https://pantry-meal-gap.sociobot.in/sw.js`. After an online first visit, offline reload showed **“Offline field mode.”** and retained all five saved rows.
- An update-path test served the unchanged built app from a disposable local server while changing only the served service-worker bytes between registrations (no repository/product change). `registration.update()` activated the replacement worker and displayed **“The offline map was updated. Reload”** with no console errors.
- At 390×844 there was no horizontal overflow (`scrollWidth === innerWidth === 390`). Visual inspection of this layout and a 1440×1000 desktop layout found the map/survey/meal hierarchy readable and responsive.
- Keyboard-only test: Tab reached the skip link and pantry ingredient input; both had a `3px solid rgb(217, 77, 44)` focus ring. Keyboard typing, unit selection, Tab, and Enter added “Keyboard Beans.”
- With reduced motion emulated, dialog animation and meal-card transition durations were `1e-06s` and there was no console error.
- The initial page's light/dark axe scan from the repository passed serious/critical checks. The independently opened dialog scan is the blocker documented above.

### Live identity, headers, and performance

Live SHA-256 comparison matched the candidate build byte-for-byte for `index.html`, bundled JS/CSS, `sw.js`, manifest, offline page, and both legal pages. The release at the specified URL is therefore this candidate, not an older deployment.

Live responses were HTTPS 200 with HSTS, nosniff, and strict-origin referrer policy. Header shortcomings are listed above.

Lighthouse 13.4.1 mobile report against the live URL produced Performance **92**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.3 s, CLS 0, TBT 350 ms, interactive 1.6 s. Its headless tab crashed during final screenshot/BFCache collection after writing the complete JSON report, so this score should be treated as an indicative production measurement, not a clean Lighthouse process exit. It also cannot detect the unopened dialog's labels; the direct axe dialog scan is authoritative for that state.

## Retest criteria

1. Associate every custom-meal input and select with a unique visible or screen-reader label, then add an automated axe test with the dialog open.
2. Re-run the full clean install/build/test suite and live dialog scan.
3. Configure the deployment's immutable caching and security headers, then recheck the response policies.

