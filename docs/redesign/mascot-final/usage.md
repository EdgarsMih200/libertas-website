# Empanadillo the traveller: usage (Step 3, final)

Files: `sprites.js` (letter grids + palette + `svg()` helper), `index.html` (visual sheet), this file.
Nothing is wired into the site yet. Step 6 moves the data into `empanadillo.js`.

## 1. Identity

- **Who:** Empanadillo, the Libertas mascot. A small golden empanada who walks the language path with you.
  Option B "Traveller", drawn in the **same pixel-art technique** as today: letter grids → SVG `<rect>`s,
  `shape-rendering="crispEdges"`, `image-rendering: pixelated`.
- **Kept pixel for pixel from `empanadillo.js`:** `KERMENIS` (body, crimp, side "ear", face, feet), `ACIS`, `ROKA_A`, `ROKA_B`, `CEPURE`, `BALLITES_CEPURE` (shapes).
  The body stays at the same coordinates (0,0), so every original offset still works.
- **New:** leather backpack with a sage bedroll behind his left side (`MUGURSOMA`), a strap over the crimp (`SIKSNA`),
  a thin walking stick (`NUJA`) held by a short diagonal left arm (`ROKA_K`), a map (`KARTE`), extra eyes, brows, mouth and arm variants,
  and a separate small sprite for ≤64 px (`MAZAIS_*`).
- **Voice:** unchanged. A cheerful bilingual guide, "¡Hola!" + Latvian, food puns, a personal filling (`PILDIJUMI`).

## 2. Palette (13 base colours + 5 for props)

| Key | Hex | Use |
|---|---|---|
| O | `#4A2810` | outline (warm brown, never black) |
| F | `#8A5020` | feet, pack flap |
| D | `#A8652A` | baked crust, stick |
| S | `#B8742E` | brows, spots |
| M / L / H | `#D9963F` / `#F0BE62` / `#FBE3A0` | dough mid / dough / highlight |
| W | `#FFFDF8` | eye whites, map paper (= `--c-surface`) |
| K | `#2A1A10` | pupils |
| P | `#E8796B` | blush + tongue (old `T` merged) |
| R | `#6B1D1D` | mouth, map route, "?" (= brand bordo; was `#7A1A14`) |
| A | `#6E3F27` | leather pack + strap (darker, cooler than ember `#B4502A`, so they never compete) |
| V | `#A9BFA8` | sage: bedroll, stick ribbon, map land (from the landscape) |
| Z, X, B, G, Y | `#A9C9DA`, `#B23A2A`, `#7E2620`, `#D9CFC0`, `#F2C46A` | sweat drop, Santa red / shade, fur shade (= `--c-line`), party yellow (= `--c-season-glow`). The party hat stripes reuse Y + P + V. |

## 3. Sprites and poses

Two canvases, both with the ground line at the bottom edge:

| Set | viewBox | Body | Scales |
|---|---|---|---|
| Large (`POZAS`) | `-11 -10 52 35` | 34×22 (original) | ×2 = 104 px, ×3 = 156, ×4 = 208 |
| Small (`MAZAIS`) | `-2 -8 32 27` | 30×19 | ×1 = 32 px, ×2 = 64, ×3 = 96 |

Poses (`EMPA_SPRITES.svg(pose, { mazais, frame, animate, hat, shadow, label })`):

| Pose | Frames | Notes |
|---|---|---|
| `miera` idle | 1 | stick planted, right paw hanging; blink + 1 px bob |
| `vicina` wave | 2 | `ROKA_A` ↔ `ROKA_B`, as today. Small set has its own `MAZA_ROKA_A/B` |
| `lasa` reading | 1 | eyes down, open map in both paws, stick put away |
| `rada` pointing | 1 | arm out to the right, eyes right. Place him left of the CTA |
| `apjucis` confused / 404 | 1 | raised brows, "o" mouth, sweat drop, bordo "?" |
| `ielade` loading | 2 | walking on the spot: feet alternate, stick lifts with the left step |

Layer order (back → front): MUGURSOMA → NUJA → ROKA_K → right arm → KERMENIS → SIKSNA → ACIS → face patches → KARTE/paws → hat.
`animate: true` puts all frames into `<g class="empa-kadrs empa-kadrs-N">`; CSS toggles them with `steps(1)`.

## 4. Where he appears

| Place | Pose | Size (integer scale only) |
|---|---|---|
| **Home hero**, on the shore at the start of the path (desktop safe zone ≈ feet at x 430, y 772 of the 1440 hero) | `vicina` on arrival, then `miera`; `rada` is allowed if the CTA sits to his right | ≥1024 px: large ×4 · 640–1023: ×3 · <640: ×2, bottom-right of the mobile scene (feet ≈ 73 % / 97 %) |
| **Site-wide corner helper** (fixed bottom-right, as today) | small `vicina` (frame 0 at rest) | ≥769 px: small ×3 (96 px, today 88) · ≤768: small ×2 (64 px) |
| **404 / empty states** (no results, empty cart, no lessons yet) | `apjucis` | large ×4 desktop, ×3 mobile, centred above the message |
| **Loading** (lesson/material loading, payment wait) | `ielade` | large ×2 (or ×3 in a full-page loader) |
| **Materials pages** (optional, horizon strip, right side) | `lasa` | large ×2 |
| 40 px slots (header avatar, chat, toasts) | small, frame 0 | small ×1 (32 px) centred in a 40 px box. Not interactive at this size (hit area < 44 px) |

Rules:
- Only integer scales. Set `width/height` = viewBox size × scale in CSS px. Never let `vw`, `%` or an SVG `viewBox` scale him.
  In the hero, place him as an HTML overlay positioned in % over the scene (as in `index.html`), not inside the scene SVG.
- One Empanadillo per screen. On the home page the hero traveller replaces the corner helper until the hero scrolls out of view.
- Keep the flat ground shadow (`ellipse`, forest `#1E2E29`, 16 % opacity, `shape-rendering: geometricPrecision`). It is the only non-pixel part and ties him to the vector landscape.
- Don't recolour him per page, don't mirror him (the pack and the waving arm have fixed sides), and don't rotate or tween him.

## 5. Animation

| What | How |
|---|---|
| Arrival | slide up from below (today's `translateY(140%)` → 0, 0.6 s), once per page |
| Wave | on greeting, `:hover` and `:focus-visible`: 2 frames, 0.36 s per cycle, 4 cycles (`steps(1)`) |
| Idle | blink every 4.5 s (`scaleY` on `.empa-acis`, origin `17px 13.5px` large / `15px 9.5px` small); 1 sprite-pixel bob every 1.6 s (`translateY(-1px)` on the inner `<g>`) |
| Loading | 2 frames, 0.3 s each, loop while loading |
| `prefers-reduced-motion: reduce` | **static**: no slide, no bob, no blink, no wave, frame 0 only. The speech bubble still appears (no animation) |

Pixel rule: movement only in whole sprite pixels and frame swaps (`steps(1)`). No easing, rotation or sub-pixel transforms on the sprite.

## 6. Speech bubble (new design system)

- `--c-surface` background, 1 px `--c-line` border, radius 14 px, shadow `0 10px 28px -12px rgb(36 33 30 / .35)`, padding 12 px 36 px 12 px 14 px.
- Text: Source Sans 3, 15 px, `--c-ink`. His name in **bold bordo** (`--c-brand`). Max width 260 px (200 px on mobile).
- A tail made from a 12 px square rotated 45° with the same border, pointing at his head.
- Close button: 24 px, `--c-muted`, hover `--c-sunk` background.
- It replaces today's 3 px bordo border and hard offset shadow. The pixel art stays in the sprite, and the UI stays soft.
- Auto-hide after 9 s, as today. Don't cover the primary CTA: on mobile the bubble opens above and to the left of him.

## 7. Accessibility

- Corner helper = a real `<button type="button">` with `aria-label="Empanadillo — Libertas talismans: parunāt"`.
  The SVG inside is `aria-hidden="true" focusable="false"`.
- The bubble is `role="status" aria-live="polite"`. Close button `aria-label="Aizvērt"`. `Esc` closes the bubble, and focus stays on the mascot button.
- Focus ring: `--c-ink` on light, `#F0B999` on sage/forest, 3 px, offset 4 px. Wave also plays on `:focus-visible`.
- Hit area ≥ 44×44 px (small ×2 = 64 px is fine).
- A decorative instance next to text (hero, loading, materials) gets `aria-hidden="true"`.
  A standalone one (404, empty state) gets `role="img"` and a Latvian label, e.g. `aria-label="Empanadillo — Libertas talismans, apjucis"`,
  plus the real message in text. Loading also needs a text/`aria-busy` state; the walking sprite is only decoration.
- Never put information only in the sprite (the "?" or the map).

## 8. Seasonal hats

- **December** (`html.ziemassvetki`): Santa hat (`hat: 'santa'`; small: `MAZA_CEPURE`).
- **5 December** (owner's birthday, test with `?ballite=1`): party hat (`hat: 'ballite'`; small: `MAZA_BALLITE`). It **replaces** the Santa hat on that day.
- Hats are the last layer and sit where they did before (large: Santa at 6,−6, party at 10,−10). The bedroll ends at x 4 and the brim starts at x 7,
  so a hat and the pack never overlap (checked by a script for every pose). The strap tucks under the brim.
- Hats work with every pose and both sizes. Nothing else changes seasonally on the mascot (no scarf or snow on him; the scene does that).

## 9. Notes for Step 6 (integration)

- Move `KRASAS`, the new grids and `POZAS`/`MAZAIS` into `empanadillo.js`. Keep the class names `.empa-roka-a/-b`, `.empa-acis`, `.empa-cepure`, `.empa-ballite` so the existing CSS logic still works.
  Corner button: viewBox `0 -6 39 31` → `-2 -8 32 27`, width 88 → 96 px (64 px ≤768).
- **Stale phrase:** `frazes[0]` = "Apskati mūsu kursus zemāk: spāņu un angļu valoda A1!" is out of date (the course levels now go beyond A1, and "zemāk" only fits the home page).
  Update it in Step 6, for example "Apskati mūsu kursus: spāņu un angļu valoda!", and check the levels in `kursi.html`.
- Update `context.md` (mascot section, CSS classes) in the same commit.
