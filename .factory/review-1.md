# Calculate the smallest missing shopping list — review 1

- Work order: `pantry-meal-gap-review-1`
- Reviewed implementation commit: `d311e597e06ebe4192bdceae454cb11e6a1ce7dc`
- Documentation commit: `39d5b3eb918658662017af6e4374b0c9fb863b08`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Reviewed: 2026-09-05
- Verdict: **FAIL**
- Findings: **5**
- Untested public claims: **9**

The product's job is to help a home cook choose a meal from imperfect on-hand ingredients and make the smallest missing shopping list. Its audience is a home cook deciding dinner. The live first action is **Map my pantry**; it asks for manual entry and is not a sample try-out.

The release cannot pass because the required isolated one-click sample is absent and every public claim lacks the required claims manifest and tagged sandbox test. The calculator itself worked in the checked live paths.

## Findings

### High — no one-click sample sandbox exists

The first live screen has **Map my pantry** and **See closest meals**, but no **Try it with sample data** action. A fresh profile loaded at both `/demo` and `/?demo=1` showed the ordinary empty application: no sample pantry, no populated shopping result, no “Demo — sample data, nothing is saved” label, no **Reset demo**, and no **Start for real**. `/demo` also keeps the normal product title.

This fails the demo-sandbox contract. A visitor cannot see a realistic populated result without manually entering data, and there is no separate demo storage namespace to prove that a try-out cannot change real data. `.factory/demo.md` is also absent.

### High — public claims have no required claim inventory or sandbox tests

`.factory/claims.json` does not exist. There are no `@claim:` tests. The repository tests useful behavior, but they do not satisfy the contract that every visitor-relevant claim appears in the inventory with exactly one tagged demo-sandbox test.

I counted these nine discrete public claims as untested under that contract:

1. Works offline after a successful first visit.
2. Changes save automatically and persist locally.
3. Pantry, meals, shopping, and history stay in this browser.
4. There are no accounts, analytics, trackers, CDN scripts, or network APIs.
5. The app provides 20 editable starter meal templates.
6. Matching handles quantities and compatible-unit conversion.
7. Matching accepts user-defined substitutions.
8. The shopping list exports as CSV.
9. JSON backup/import validates data before replacing local data.

These statements appear in the live UI, Privacy page, and/or README. The missing inventory makes the claimed privacy, offline, export, and matching outcomes formally untested from a clean demo entry point.

### Medium — the first screen does not use the required plain words

The heading **“Find the shortest route to dinner.”** and surrounding labels such as “Kitchen survey,” “Map my pantry,” “Every meal is a destination,” and “red waypoint” use a map/travel metaphor rather than naming the task. The first screen does not name its audience (a home cook deciding dinner from what is on hand), and it does not state the useful result as a small missing shopping list in the concise audience sentence required by the plain-words contract. It also lacks the three short privacy/offline/price facts.

`.factory/copy-audit.md` is absent, so there is no required sentence count, banned-word, or terminology audit.

### Medium — invalid routes do not have a real 404 page, and required route metadata is incomplete

`GET /404` returns HTTP 200 and the normal application with the normal title and heading. It provides neither a 404 explanation nor a way back. `staticwebapp.config.json` has a blanket navigation fallback but no 404 response override or designed `404.html`.

The live root also lacks a canonical link, Open Graph/Twitter metadata and a 1200×630 social image, and an Apple touch icon. `/demo` is a real advertised verification route but has neither its required `Demo — Pantry Meal Gap` title nor a sitemap entry. These are site-structure contract failures.

### Low — several visible link targets are still under 44×44 CSS pixels

At the live 1440px desktop viewport, the footer links are 44px high but only 43px (**Privacy**), 35px (**Terms**), and 41px (**Source**) wide. The home wordmark is 184×38px. The earlier review's 20px-high footer-link problem is therefore improved, but the 44×44 touch-target requirement is still not met.

## Checks that passed

### Clean setup and declared commands

The checkout was clean before reporting. `npm ci` completed; `npm audit --audit-level=high` reported zero vulnerabilities. The declared `npm test` command passed: 10 Vitest tests, production TypeScript/Vite build, and 11 Chromium tests. `npm run build` produced `dist/`.

The built initial assets remain within the stated budgets: JavaScript 42.29 kB raw / 13.54 kB gzip; CSS 21.76 kB raw / 5.54 kB gzip; no webfont payload; mobile AVIF 51.45 kB.

### Live deployment identity

The current live `index.html`, hashed JavaScript and CSS, `sw.js`, manifest, and legal HTML have the same SHA-256 values as the local `dist/` built from this checkout. The last implementation change is `d311e597`; every later commit through documentation SHA `39d5b3e` changes only `.factory/handoff.md` and/or a prior verification report. The live runtime therefore represents the reviewed implementation.

### Live product paths

Fresh desktop and 390×844 phone profiles loaded without console or page errors. The first screen had one `h1`, a `main` landmark, `lang="en"`, no horizontal overflow at 390px, and a visible 3px focus outline on the first Tab stop (Skip to main content).

In a fresh live profile, 20 starter meals appeared. Adding red lentils, tomatoes, onion, garlic, and water made **Tomato lentil pot** 100% covered through its accepted water substitution. A no-result search displayed **Clear search** and recovered. A zero amount did not add a pantry row. Five valid pantry rows persisted after reload. The full local suite also passes the prior malformed-import rejection and damaged-IndexedDB recovery cases.

After a successful live first load, a fresh profile reloaded while offline and rendered the normal heading plus **Offline field mode.** Live request capture during the normal flow observed only `https://pantry-meal-gap.sociobot.in`; no third-party runtime request or console error appeared.

`/opt/fleet/lib/verify-url.sh` passed against the live root when given the installed local Playwright modules. Direct live axe-core 4.10.2 scans of light mode, dark mode, and the open custom-meal dialog returned zero violations. The standalone `npx @axe-core/cli` process could not create Chrome in this container; the direct browser integration is the successful accessibility evidence. Lighthouse 13.4.1 completed normally against live: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, TBT 130 ms, CLS 0.

The live privacy and terms pages load with their own correct titles and one `h1`. Manifest MIME, enforcing same-origin CSP, anti-framing, HSTS, referrer policy, immutable hashed assets, and no-store service-worker caching were present.

## Earlier finding disposition

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| Unlabelled custom-meal dialog controls | Fixed | Current local dialog-label test passes; direct live axe dialog scan has zero violations. |
| Non-immutable assets, incomplete security headers, manifest MIME | Fixed | Current live headers provide immutable `/assets/*`, same-origin CSP, X-Frame-Options, COOP, Permissions-Policy, and `application/manifest+json`. |
| Nested-aside axe issue | Fixed | Current direct light/dark scans have zero axe violations. |
| Footer legal links were 20px tall | Partially fixed; residual low finding | They are now 44px high, but Privacy, Terms, and Source remain under 44px wide. |
| Malformed backup persisted and bricked reload | Fixed | The full current test suite passes explicit malformed-import rejection and corrupted-IndexedDB recovery tests; the live deployment matches that build. |
| Mobile Lighthouse score below 90 | Fixed | Current live Lighthouse Performance score is 99. |

## Backend and non-applicable checks

This is a static local-first PWA. There is no product backend, tenant, health endpoint, rate limit, or 429/Retry-After behavior to test. No API key, account, payment, or external product service is involved.

## Required repair and retest

1. Implement `/demo` (and `?demo=1` if retained) with realistic seeded pantry/meal/list output, a visible persistent demo label, Reset demo and Start for real controls, and a separate demo storage namespace. Add `.factory/demo.md`.
2. Add `.factory/claims.json`; list every public claim and give each exactly one `@claim:<id>` clean-demo sandbox test. Remove any claim that cannot be tested.
3. Rewrite the first screen in plain words: name the home-cook audience, say that it finds the smallest missing shopping list, make the sample action primary, and show three short privacy/offline/free facts. Add `.factory/copy-audit.md`.
4. Add a designed 404 page and response override, complete the route-specific titles/sitemap, and add canonical, Open Graph/Twitter, social-image, and Apple-touch metadata.
5. Make all visible links and the wordmark at least 44×44 CSS pixels, then rerun the live touch-target check.
