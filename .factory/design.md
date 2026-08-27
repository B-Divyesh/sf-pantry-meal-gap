# Pantry Meal Gap — visual thesis

## Direction: kitchen cartography

Pantry Meal Gap treats dinner as a short route through known terrain. The pantry is the surveyed ground, each meal is a destination, and missing ingredients are the last contour to cross. The interface borrows the useful language of topographic maps—paper, fine contour lines, coordinate labels, bearings, route markers—without becoming costume. A single vermilion marker always indicates the actionable gap.

This direction fits the product because it makes imperfection legible. A meal at 82% is not a failed recipe; it is a nearby destination with a short, concrete route.

## Palette

Light is the primary, deliberately tactile treatment.

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F3EEDF` | App background, map stock |
| Raised paper | `#FFFDF5` | Sheets and controls |
| Deep ink | `#17251F` | Primary text |
| Muted ink | `#56625B` | Supporting text (7:1 on paper) |
| Evergreen | `#174B3B` | Primary actions and surveyed/on-hand state |
| Vermilion | `#B83D22` | Missing-item marker, warnings, focus accent |
| Ochre | `#A66A19` | Partial quantity / nearby state |
| Contour | `#C9C1AA` | Dividers and topographic linework |
| Danger | `#9C2F2A` | Destructive actions |

Dark treatment uses night-navigation colors: `#111814` ground, `#18231D` surface, `#F5F0E1` text, `#B8C3BB` muted, `#78C2A5` evergreen, `#FF8A64` marker, and `#536158` contour. Both treatments meet WCAG AA for body text and controls.

## Type

- **Field titles:** Georgia, Cambria, Times New Roman, serif. Its broad, bookish forms make destinations feel annotated rather than marketed.
- **Instruments and body:** Inter-compatible system sans stack (`ui-sans-serif`, system fonts). Labels, quantities, and scores use tabular figures.
- Scale: 12px bearings, 14px metadata, 16px minimum body/control text, 20px section title, 30–50px display. Body line-height is 1.55 and readable measures stop near 68 characters.

No runtime font files or third-party requests are needed; the native stacks are fast, private, and familiar on every device.

## Spacing and geometry

- 4px base unit; common steps are 8, 12, 16, 24, 32, 48, and 64px.
- Layout uses a 12-column desktop survey grid and a single-column 390px field sheet.
- Corners are restrained (8–18px), like clipped map cases rather than soft SaaS bubbles.
- Controls and touch targets are at least 44px. Dashed route lines and inset coordinate ticks establish grouping before cards do.

## Interaction grammar

- **Survey:** pantry items are entered quickly into an always-visible field; quantity and unit can be refined but are not required.
- **Plot:** meal templates are destinations. Each row reports exact coverage, substitutions used, and the smallest missing list.
- **Route:** selecting a meal opens a route sheet; one action adds its gaps to the consolidated shopping list.
- **Correct:** destructive actions are confirmed when broad, or immediately reversible with an Undo toast when narrow.
- Search, sort, theme, export, and import are utilities, never competing destinations.

## Motion policy

Useful motion lasts 160–240ms: route sheets rise from the selected meal, changed scores fade/translate by 4px, and toasts enter from the lower edge. No animation loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and changes use instant state plus text/live-region feedback.

## Original asset plan and prompt sheet

The hero is a painterly, top-down pantry map: bowls and staple ingredients arranged as terrain, fine elevation rings traveling around them, and one empty vermilion waypoint. It explains the premise—nearby meal, one small gap—without pretending to scan a real pantry. Hand-authored SVG app icons use the same contour/waypoint grammar.

**Generation prompt (hero):**

> Use case: stylized-concept. Asset type: responsive PWA hero illustration. Primary request: an editorial top-down still life that turns a modest home pantry into a topographic field map. Scene: warm cream paper map on a worn kitchen table, small ceramic bowls of rice, beans, tomatoes, herbs and an onion arranged like islands; precise hand-drawn elevation contour rings flow around the ingredients; one clearly empty circular waypoint in restrained vermilion suggests the single missing ingredient. Style: tactile gouache and colored-pencil editorial illustration, sophisticated, calm, practical, lightly imperfect print texture. Composition: landscape 3:2, subject mass mainly left and center, some calm paper negative space, no interface mockup. Lighting: soft northern-window daylight. Palette: parchment, deep evergreen, muted sage, ochre, tomato vermilion, charcoal ink. Constraints: foods remain recognizable, contour lines coherent, no people, no text, no letters, no numbers, no logos, no packaging, no watermark. Avoid: photoreal stock photography, glossy 3D, generic gradient, fantasy landscape, excessive clutter, distorted food, brand marks.

**Provenance:** generated specifically for Pantry Meal Gap with the factory image model (`factory-image`) on 2026-08-27 using `/opt/fleet/lib/gen-image.sh`. The optimized WebP and PNG-derived source are original project assets. The interface footer discloses AI-assisted illustration. No third-party visual assets are used.

## Responsive intent

On phones, the pantry survey and meal destinations stack; the illustration becomes a short masthead crop, dense score rings simplify, and actions remain inline with their result. On wide screens, pantry is a left field panel and meal routes occupy the larger right plot. Legal and data controls remain reachable in the footer/settings area rather than a persistent mobile bar.
