# Verify the smallest missing shopping list — verification 4

- Work order: `pantry-meal-gap-verify-4`
- Implementation candidate: `daa0976adc4acbc6ccecd89916205c478b050526`
- Documentation candidate: `6cb3112f80bb2befa8fb71c8bc2b83be981daf4e`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Verified: 2026-09-06
- Verdict: **FAIL**
- Finding count: **1**
- Untested claim count: **7**

The product helps a home cook compare an imperfect pantry with saved meals and find the smallest missing shopping list. The audience is a home cook choosing dinner from what is already on hand. Before scrolling on fresh desktop and 390 px phone browsers, the first action is **Try it with sample data**, followed by what it will show.

The repaired implementation is now live and works through the checked user paths. It cannot pass the factory contract because the public-claim inventory and tagged tests remain incomplete. All 13 declared commands pass, but several can pass without proving the words visitors are asked to rely on.

## Finding

### High — seven public claims are unlisted or not proven by their tagged tests

The claims contract requires every public promise to have one clean-demo, outcome-based tagged test. Manual verification can establish that the current runtime works, but it does not replace the required repeatable claim coverage.

| Public promise | Coverage gap |
| --- | --- |
| Sample data stays separate and Reset restores only the sample | `@claim:demo-isolation` starts with no real data, resets an unchanged sample, and checks only a pantry row count. It can pass without preserving existing real data or restoring changed meal and shopping state. |
| “Check them off, even offline” and “Your pantry and list still work” offline | `@claim:offline-reload` reloads and counts seeded rows. It never changes pantry or shopping state while offline or proves that the change persists. |
| “Uses substitutions you choose” | `@claim:substitutions` observes the shipped Water substitution. It never creates or edits a chosen substitution and then proves that matching uses it. |
| “Items combine by ingredient and unit” and from several meals | No `.factory/claims.json` entry or tagged test adds gaps from two meals and asserts the merged quantities, units, and row count. |
| Import a valid JSON backup | The public Import action and “Import replaces local data only after validation” copy have only an invalid-file rejection test. No tagged test imports a valid backup, replaces data, reloads, and observes the imported state. |
| Export user-created meal templates as part of the user's data | Terms say meal templates can be exported. `@claim:backup-export` does not create a custom meal or assert exported meals or history. |
| Add a selected meal's smallest missing list | `@claim:missing-list` opens a demo already seeded with the exact Pasta, Chilli Flakes, and Parsley rows, then checks that those names still exist. It can pass if **Add gaps to list** does nothing and does not assert quantities, sources, or duplicate handling. |

Required repair: add or strengthen tagged demo tests so each promise is proved from a state that would fail if the behavior were broken. Update `.factory/claims.json` so the positive import and multi-meal consolidation promises are listed explicitly.

## Declared claim commands

Every command below was run separately from clean checkout `/work/pantry-meal-gap-verify4-clean-BXyxU5` at documentation SHA `6cb3112` (product files equal implementation SHA `daa0976`). All exited zero. “Incomplete” means the command passed but does not prove all corresponding public copy.

| Claim id | Command result | Coverage assessment |
| --- | --- | --- |
| `demo-isolation` | PASS | Incomplete |
| `free-sample` | PASS | Complete |
| `offline-reload` | PASS | Incomplete for advertised offline changes |
| `local-persistence` | PASS | Complete |
| `private-data` | PASS | Complete; captured requests were same-origin |
| `starter-meals` | PASS | Complete |
| `quantity-conversion` | PASS | Complete |
| `substitutions` | PASS | Incomplete |
| `csv-export` | PASS | Complete |
| `copy-list` | PASS | Complete |
| `backup-export` | PASS | Incomplete for meal-template export |
| `missing-list` | PASS | Incomplete |
| `validated-import` | PASS | Complete for rejection; positive import remains unlisted |

The exact command for each row was the command declared in `.factory/claims.json`: `npm run test:claims -- --grep @claim:<id>`. Summary: **13/13 commands passed; 7 public claims remain untested or incompletely tested.**

## Live candidate identity and deployment

The deployment blocker recorded in the prior handoff resolved during this verification. At 00:52 UTC, live root, demo, and missing-route bodies matched the local production build byte for byte:

| Document | Local/live SHA-256 |
| --- | --- |
| `/` | `1a68907df52f111e28eb92116a72dc48e122706c9d6fef4d7f7401b54059f4bf` |
| `/demo/` | `0d373fe647b27379941e8f52f6a24a30bf09ec5023610611b05ac30df2377011` |
| missing route / `404.html` | `d8d016a84bd44719b71e5e0a6c67db90dfa244b7dc3eafe05c2ce96c63bc3c93` |

Live asset names also match the candidate: `main-IHH100vS.js` and `main-B2_rxy0g.css`. The missing route deliberately returns HTTP 404 and renders the designed page; that expected 404 is not a defect.

## Live desktop and phone evidence

- Fresh 1440×1000 desktop and 390×844 phone contexts showed the job, audience, primary sample action, action result, and privacy/offline/free facts before scrolling. The phone document width was exactly 390 px.
- The one-click sample showed 10 pantry items, 20 meal cards, Pasta/Chilli Flakes/Parsley in the shopping list, and a recent Garlic pantry pasta choice. The persistent label read “Demo — sample data, nothing is saved to your real pantry.”
- A real-only pantry item was created before entering demo. It did not appear in demo. A demo-only edit persisted across demo reload, Reset removed it and restored 10 pantry/3 shopping rows, and Start for real returned to the untouched real item. IndexedDB then contained only `pantry-meal-gap`, not the demo database.
- Screenshots: `/work/.evidence/verification-4/live-desktop-first-screen.png`, `/work/.evidence/verification-4/live-desktop-demo.png`, `/work/.evidence/verification-4/live-phone-first-screen.png`, and `/work/.evidence/verification-4/live-phone-demo.png`.
- At 200% page zoom in a 1280 px viewport, the document had no horizontal overflow and the headline, sample action, and pantry input remained present.

## Normal, invalid, boundary, and recovery paths

- A no-result meal search explained the state; **Clear search** restored all 20 meals.
- A zero pantry quantity remained natively invalid and added no row.
- The custom-meal dialog focused its name field, kept one required ingredient row, announced “A meal needs at least one ingredient,” closed with Escape, and returned focus to its opener. Native modal behavior kept background controls out of the tab order.
- The earlier verifier's incomplete JSON payload was rejected before confirmation. Reload retained a usable app and all 20 meals.
- The full suite also covered ready-meal matching, partial quantities, compatible units, chosen history, custom meal creation, corrupted IndexedDB recovery, CSV/copy/backup output, and persistence.

## Accessibility, privacy, PWA, routes, and performance

- `/opt/fleet/lib/verify-url.sh` passed live: title, `lang="en"`, one h1, main landmark, image alt text, labelled buttons, and no normal-load console errors. Evidence is in `/work/.evidence/verification-4/verify-url/`.
- Direct axe-core 4.10.2 scans returned zero violations on root light, root dark, demo, open meal dialog, Privacy, Terms, and 404 states.
- Keyboard-only pantry entry worked on the live 390 px layout. The first Tab focused the skip link with a visible `3px solid rgb(217, 77, 44)` outline. All visible links and buttons on the populated demo measured at least 44×44 CSS px.
- With reduced motion enabled, dialog animation/transition and meal-card transition durations were `1e-06s`.
- Live requests during the real-to-demo edit/reset flow used only `https://pantry-meal-gap.sociobot.in`. No analytics, trackers, third-party scripts, fonts, or runtime APIs were observed.
- A fresh `/demo/` profile acquired service-worker control, reloaded offline with the demo label, 10 pantry rows, three shopping rows, and the offline banner. A disposable local candidate server changed only the served worker bytes; the app displayed **The offline app was updated** with a **Reload** action and no errors.
- Root, Demo, Privacy, and Terms return 200 with route-specific titles, one h1, main, `lang`, and canonical links. The designed missing route returns 404 with “This page is not here” and a home link. Every internal link returned 200; the labelled external GitHub source link returned 200.
- Live security and caching headers include enforcing same-origin CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, COOP, Permissions-Policy, nosniff, strict referrer policy, immutable hashed assets, no-store service worker, and correct manifest MIME.
- Lighthouse 13.0.1 mobile completed normally: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP **0.9 s**, LCP **1.2 s**, TBT **50 ms**, CLS **0**. Evidence: `/work/.evidence/verification-4/lighthouse-live.json`.
- Production output: JS 45.42 kB raw / 14.36 kB gzip; CSS 23.91 kB raw / 5.92 kB gzip; no webfont; 768 px AVIF 51.45 kB.

This is a static local-first PWA. Backend tenant isolation, restart persistence, health, and 429/Retry-After checks do not apply. The brief explicitly excludes meal-plan AI, and no missed AI feature is a finding.

## Clean-checkout quality gates

- `npm ci`: PASS; Playwright is pinned to 1.58.2.
- `npm audit --audit-level=high`: PASS, zero vulnerabilities.
- `npm test`: PASS — 10/10 unit tests, production build, and 26/26 Chromium tests.
- `npm run build`: PASS and produced `dist/index.html`.
- All 13 declared claim commands: exited zero, with the coverage defects above.

No product code was modified during verification.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Custom-meal controls lacked accessible names | Fixed; dialog labels and axe scan pass. |
| Asset caching, security headers, manifest MIME, nested landmark | Fixed live. |
| Footer/source targets were under 44 px | Fixed; live populated demo has no undersized visible link/button. |
| Malformed backup persisted and broke startup | Fixed; exact payload is rejected and recovery tests pass. |
| Mobile Lighthouse was below 90 | Fixed; live score is 100. |
| No one-click isolated sample | Runtime fixed; live isolation/reset/start-real paths pass. Claim coverage remains incomplete as reported. |
| Metaphor-first entry copy | Fixed; job, audience, action, outcome, and facts are plain and visible. |
| Missing real 404 and route metadata | Fixed live. |
| No claims inventory or tagged commands | Partially fixed; 13 entries/commands exist and pass, but seven public promises remain unlisted or inadequately proved. |

## Retest criteria

Add the missing outcome-based claim coverage without weakening the public copy, run every declared command from a clean checkout, and repeat the live claim cross-check. PASS requires zero findings and zero untested claims.
