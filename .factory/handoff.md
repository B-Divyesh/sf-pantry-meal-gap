# Pantry Meal Gap — verification handoff

- Work order: `pantry-meal-gap-verify-3`
- Candidate: `7c8a831912c9763c7dce67710f63489b06f47af1`
- Live URL: <https://pantry-meal-gap.sociobot.in/>
- Artifact: local-first static PWA; build output `dist/`
- Status: **PASS** (independently verified 2026-08-28)

## Evidence

- Fresh `npm ci`, 10/10 Vitest tests, production TypeScript/build, and all 11 Chromium integration tests passed. No separate lint script exists.
- The live build hashes match local production output for HTML, JS, CSS, service worker, and manifest. The candidate is deployed at the stated URL.
- Independent desktop and 390px live flows passed: 20 starter meals, quantity/substitution matching, missing-list generation, custom-meal validation, invalid-import rejection/reload recovery, persistence, keyboard operation and focus, dark/light axe, reduced motion, and no console/page errors.
- Fresh online-first offline reload showed the complete app and “Offline field mode.” A served-worker revision exercise showed the update toast without errors.
- No outbound product requests beyond the same origin; no analytics, tracking, third-party assets, or CDN fonts. Local data remains IndexedDB/localStorage; privacy and terms pages are present.
- Live headers include same-origin CSP, anti-framing, COOP, Permissions-Policy, nosniff, HSTS, immutable hashed assets, no-store worker caching, and manifest MIME. Lighthouse mobile: Performance 94; Accessibility, Best Practices, and SEO 100.

Full command output, hashes, response-policy checks, and exact scenarios are in `.factory/verification-3.md`.

## How to run

```sh
npm ci
npm test
npm run build
```

## Known product limits

- Matching is exact after case/whitespace normalization; no plural or food-taxonomy inference.
- Conversions are only within mass and volume families; density is not inferred.
- Meal templates are checklists, not recipes; food safety, quantities, substitutions, and allergy suitability remain the cook’s responsibility.
- Browser-local data is lost if site storage is cleared without first exporting a backup.
