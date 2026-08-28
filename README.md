# Pantry Meal Gap

Pantry Meal Gap is an offline-first dinner utility for home cooks working from an imperfect pantry. It ranks familiar meal templates by what is actually on hand, accepts explicit substitutions and partial quantities, and turns the remaining gap into a small, consolidated shopping list.

Live product: <https://pantry-meal-gap.sociobot.in>

## Who it is for

This is for the moment before dinner when recipe search is too broad: you have some ingredients, a few meals you know how to make, and want to know which meal needs the least shopping. It is not a recipe catalog, pantry scanner, nutrition calculator, or allergy checker.

## What ships in v1

- A fast local pantry list with editable quantities and units.
- 20 original, editable starter meal checklists.
- Quantity-aware coverage scores, including compatible weight/volume conversions.
- User-defined acceptable substitutions on every meal ingredient.
- Exact missing quantities and a deduplicated shopping list across meals.
- Custom meal creation/editing, meal search, and closest-first sorting.
- Shopping-list checkoff, clipboard copy, and CSV export.
- Full JSON backup/import so the user owns their data.
- Route history for recent dinner choices.
- Installable PWA with an offline app shell and local IndexedDB persistence.
- Light and dark topographic-cartography themes, keyboard support, and reduced-motion behavior.

All pantry, meal, shopping, and history data stays in IndexedDB in the current browser. There are no accounts, analytics, trackers, CDN scripts, or network APIs.

## Run locally

Prerequisites: Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Vite prints the local development URL. Production preview:

```sh
npm run build
npm run preview
```

The static deployment artifact is written to `dist/`, with `dist/index.html` at its root. The factory build command is exactly:

```sh
npm run build
```

## Test

```sh
npm test
```

That command runs the calculation unit tests, creates a fresh production build, and runs Chromium end-to-end tests. Browser coverage includes the complete pantry-to-meal-to-list path, custom meals, persistence, offline reload, legal pages, a clean console, and an axe serious/critical audit. Playwright is pinned to the factory-provided `1.58.2` browser version.

Individual gates:

```sh
npm run test:unit
npm run build
npm run test:e2e
```

## Matching model

Ingredient names are normalized for case and whitespace, then matched exactly against the required name or the meal’s accepted substitutions. Compatible units are converted within weight (`g`, `kg`) and volume (`ml`, `l`, `tsp`, `tbsp`, `cup`). Quantities are allocated only once within a meal. The score is the mean coverage across required ingredients; the shopping list preserves the missing amount in the meal’s chosen unit.

The tool intentionally does not infer food density, singular/plural relationships, freshness, allergen safety, or whether a substitution is appropriate. Those decisions remain with the cook.

## PWA and deployment

`public/sw.js` precaches the app shell, uses network-first navigation, and cache-first local assets. A successful first visit is required before offline use. User data is not put in the service-worker cache; it remains in IndexedDB.

Deploy the contents of `dist/` to any static host with HTTPS. No server-side routing or environment variables are required. `/privacy/` and `/terms/` are emitted as real static entry points. Azure Static Web Apps reads the emitted `staticwebapp.config.json` to enforce the app's CSP, frame/permissions policies, manifest MIME type, and immutable caching for `/assets/*`; equivalent headers should be configured when using another host.

## Visual assets

The kitchen-cartography system and image provenance are documented in [`.factory/design.md`](.factory/design.md). The pantry hero was generated specifically for this product with the factory image model, reviewed for artifacts, and shipped as responsive AVIF/WebP/JPEG files. No third-party visual assets or fonts are used.

## License

MIT — see [LICENSE](LICENSE).
