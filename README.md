# Pantry Meal Gap

Pantry Meal Gap helps home cooks choose dinner from what they already have. It shows the missing items for each meal and builds a shopping list.

Live product: <https://pantry-meal-gap.sociobot.in>

## Try the demo

Open <https://pantry-meal-gap.sociobot.in/demo/> or choose **Try it with sample data** on the landing page. The demo starts with a realistic pantry, ready meals, and a populated shopping list. It uses a separate local database, so it never changes real pantry data.

## Who it is for

Use it when you have some ingredients and need to decide dinner. It is not a recipe catalog, pantry scanner, nutrition calculator, or allergy checker.

## What it does

- Includes 20 editable starter meals.
- Matches partial quantities and compatible units.
- Uses substitutions you choose.
- Shows the missing items for a selected meal.
- Copies the shopping list and exports it as CSV.
- Exports a JSON backup and rejects invalid backup files before replacing data.
- Saves changes in this browser and works offline after the first visit.
- Keeps entries in this browser. No account is needed for the sample.

Read [the privacy policy](https://pantry-meal-gap.sociobot.in/privacy/) and [the terms](https://pantry-meal-gap.sociobot.in/terms/).

## Run locally

Prerequisites: Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Vite prints the local address. Build and preview the production files with:

```sh
npm run build
npm run preview
```

The build writes `dist/`, with `dist/index.html` at its root.

## Test

Run every unit, build, and browser check with:

```sh
npm test
```

Run one public-claim check from a clean setup with:

```sh
npm run test:claims -- --grep @claim:offline-reload
```

The full claim inventory and its commands are in [`.factory/claims.json`](.factory/claims.json). The demo storage design is in [`.factory/demo.md`](.factory/demo.md).

## Deploy

Deploy the contents of `dist/` to static HTTPS hosting. The static configuration supplies cache and security headers, the `/demo` rewrite, and the designed 404 response. No server-side service or environment variables are needed.

## Visual assets

The kitchen-cartography system and image provenance are in [`.factory/design.md`](.factory/design.md).

## License

MIT — see [LICENSE](LICENSE).
