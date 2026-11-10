# Empanadillo: mascot options (Step 3)

## A. Essential identity (must survive any redesign)

1. **Half-moon empanada body**: wide dome, about 1.5 : 1 width to height, rounded top arc, broad flat bottom.
2. **Crimped edge (repulgue)** along the top arc. This is the one detail that says "empanada"; never drop it.
3. **Golden-brown dough**: light face (`#F0BE62`, highlight `#FBE3A0`), darker baked underside (`#D9963F` → `#A8652A`), dark warm-brown edge/feet (`#8A5020` / `#4A2810`). Never black.
4. **Face**: two big round white eyes with dark pupils and a catch-light, set wide apart; short brows; pink blush on both cheeks; small open smile with a pink tongue.
5. **Two stubby feet** under the body.
6. **One waving arm** on his right side (viewer's right). Waving is his signature gesture.
7. **Seasonal hats**: Santa hat in December (`html.ziemassvetki`), party cone on 5 Dec (`?ballite=1`).
8. **Voice**: a cheerful, slightly cheeky bilingual guide (Spanish greeting + Latvian), food puns, a personal "filling", speech bubble.

## B. Options (see `index.html`)

| | Option | Idea | Best for |
|---|---|---|---|
| A | Minimal evolution | The same character as soft flat vector with a warm-brown outline. Same silhouette, side "ear", crimp, feet and arm. | A site-wide helper (corner button, 404, loading) and small sizes |
| B | The traveller | He walks the path with you: leather backpack + bedroll, walking stick, an open route map when reading. No outline, only a tonal crust rim like the landscape layers. | Home hero, course/lesson illustrations, campaigns |
| C | Bold geometry | A clean half-oval, the crimp as round scallops (pie-crust edge), a two-tone body with a straight baked base, round eyes, bar brows. No outline. | Icons, favicon, merch/stickers, social avatars |

Each option has: large + 64/40 px, desktop hero (scaled + 1:1 crop), 360 px phone, poses (idle, waving, reading, pointing to CTA, confused/404, loading), Santa + party hats, and winter/birthday scene crops.
The client chooses. Nothing here is wired into the site yet.

## C. Files

- `index.html`: self-contained comparison page (scene library reused from `../preview/style-board.html`, original sprite rendered from `empanadillo.js`).
- `mascot-a.svg`, `mascot-b.svg`, `mascot-c.svg`: standalone waving pose per option.

## D. Reuse notes

- Each pose is one SVG group in the page's hidden `<defs>` (`A-wave`, `B-read`, `C-sad`, `A-idle-santa`, …). Turn it into a `<symbol>` and place it with `<use>`.
- Character space: body x 18–176, feet to y 154. viewBox `-12 24 226 140` (with hat `-14 -32 228 196`).
- Colours are CSS variables with hex fallbacks: `--e-dough`, `--e-hi`, `--e-mid`, `--e-crust`, `--e-foot`, `--e-line`, `--e-blush`, `--e-mouth`, `--e-tongue`, `--e-hat`, `--e-fur`, `--e-p1..p3`, `--e-pack`, …
- The waving arm is a `.e-arm` group (rotates around the shoulder), so the wave is CSS-only and turns off under `prefers-reduced-motion`.
- Scene placement: desktop safe zone ≈ feet at (372, 788) in the 1440 hero, scale 0.9 (B stands on the path at x 478). Mobile: feet at (628, 788), scale ~1.0. The hero viewBox ends at y 800, so keep the feet above ~790.
