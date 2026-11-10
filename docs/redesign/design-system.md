# Libertas design system (Step 2: style synthesis)

Date: 2026-11-10 · Branch `redesign/new-style` · Visual board: `docs/redesign/preview/style-board.html` · References: `docs/redesign/references.md`

## 1. Concept

> **"Ceļš uz pasauli"**: from a quiet Baltic pine shore, a path winds across a still lake toward distant Spanish sierras and English chalk cliffs under a peach dawn. Learning a language is a calm journey, and the two birds from the Libertas logo lead the way.

The logo already draws a mountain line and two birds, so the landscape continues the brand mark rather than decorating around it.
The tagline maps onto the scene: **Runā** (the shore, where you start), **saproti** (the path), **ceļo** (the far horizons), **audz!** (the young pines in the foreground).

**Mood keywords:** calm · spacious · warm dawn · nostalgic but clear · grown-up cozy · Baltic quiet · "a window to elsewhere"

**Not:** SaaS glass, neon gradients, flag colors, emoji illustration, pixel scenery, photo-realism, busy pattern backgrounds.

## 2. Color

### 2.1 Core palette

| Token | Hex | Role |
|---|---|---|
| `--c-bg` | `#F6F1E8` | Page background (warm paper) |
| `--c-surface` | `#FFFDF8` | Cards, inputs, menus |
| `--c-sunk` | `#EDE5D8` | Sunken areas, secondary button, table stripes |
| `--c-line` | `#D9CFC0` | Hairlines, dividers (decorative) |
| `--c-line-strong` | `#8C8273` | Input borders, control outlines (non-text 3:1) |
| `--c-ink` | `#24211E` | Body text, H2–H4, focus ring on light |
| `--c-muted` | `#5C554D` | Secondary text, captions, meta |
| `--c-brand` | `#6B1D1D` | **Brand bordo**: logo, H1/display, eyebrow dots, quotes, brand marks |
| `--c-brand-strong` | `#521515` | Old hover bordo, kept for brand-only hovers |
| `--c-accent` | `#B4502A` | **Ember**: the ONE call-to-action color (primary buttons, active states, key icons) |
| `--c-accent-strong` | `#963F20` | Accent hover/pressed, accent *text* (links) |
| `--c-accent-soft` | `#F6E1D5` | Accent tint: chip-selected, highlight backgrounds |
| `--c-sage` | `#DDE5DA` | Calm tint: chips, tags, info panels |
| `--c-sage-ink` | `#34503F` | Text on sage |
| `--c-forest` | `#1E2E29` | Footer, darkest scenery layer |
| `--c-forest-2` | `#2B4038` | Footer raised panels |
| `--c-on-forest` | `#E9E4D8` | Text on forest |
| `--c-on-forest-muted` | `#AFB9B0` | Secondary text on forest |
| `--c-focus-dark` | `#F0B999` | Focus ring on forest/dusk |

### 2.2 Why ember + bordo, and why no gold
- **Bordo stays the brand ink, not the button color.** It is a deep, low-energy red. It reads as "signature" (logo, headline), but it sinks on a muted landscape and looks the same at rest and on hover. Using it for both brand and action is the root of today's monotony.
- **Ember `#B4502A`** sits next to bordo on the hue wheel (bordo ≈ 0°, ember ≈ 17°), so they belong to the same family: bordo is the dark, quiet sibling and ember the lit one. Ember echoes the dawn in the sky (ref. 4's single orange) and the coral CTA of ref. 1. It is the only saturated color on the page, so the eye goes straight to the action.
- **Separation rule:** bordo is never a button and ember is never a heading. They don't touch at large sizes. Bordo is used for text and marks; ember for filled controls.
- **Gold is dropped** as a standing color. Three warm hues (bordo, ember, gold) on a peach sky would turn the calm into a sunset. Gold survives only as `--c-season-glow #F2C46A` (window lights, lanterns, candles) in seasonal scenes.

### 2.3 Semantic colors

| Token | Text / icon | Background | Use |
|---|---|---|---|
| `--c-success` | `#2E6A47` | `#E3EFE5` | Correct answer (`.pareizi`), enrolled, saved toast |
| `--c-error` | `#A4282A` | `#F8E3E1` | Wrong answer (`.nepareizi`), form errors, `.toast-error` |
| `--c-warn` | `#7F5300` | `#FAEED3` | Pending payment, "vietas beidzas" |
| `--c-info` | `#2F5878` | `#E2EBF2` | Notes, tips, `badge` neutral |

Error red differs from bordo by lightness and context (always with an icon and a message, never alone).

### 2.4 Landscape palette (illustration only, never for text)

| Layer | Hex | Notes |
|---|---|---|
| Sky top | `#F6F1E8` | Merges into page bg (no hard hero edge) |
| Sky horizon | `#F2D3B8` | Peach dawn glow |
| Sun disc | `#F7C9A3` | Soft, 70% opacity, blurred halo |
| L1 far horizons | `#C9C5D6` → `#B9B6CC` | Dusty lavender, sierras (ES) + chalk cliffs (EN) |
| L2 mid hills / lake | `#8FA3A6`, lake `#D7DEDA` | Slate-teal, haze over the top |
| L3 near hills | `#5F7C6D` | Sage pine slopes, the path `#E9D9C2` |
| L4 foreground | `#2F4A40` → `#1E2E29` | Dark pines, flows into the footer |

### 2.5 Computed contrast (WCAG 2.x, script: `scratchpad/contrast.js`)

| Pair | Ratio | Result |
|---|---|---|
| ink `#24211E` on bg `#F6F1E8` | 14.23 | AAA |
| ink on surface `#FFFDF8` | 15.75 | AAA |
| ink on sky horizon `#F2DCC6` | 12.07 | AAA |
| muted `#5C554D` on bg | 6.52 | AA (AAA ≥18px) |
| muted on surface / sunk / sky | 7.22 / 5.87 / 5.53 | AA |
| brand `#6B1D1D` on bg / surface / sky | 10.26 / 11.36 / 8.70 | AAA |
| white on accent `#B4502A` (primary button) | 5.10 | AA |
| white on accent-strong `#963F20` (hover) | 6.93 | AA |
| accent-strong `#963F20` on bg / surface (links) | 6.16 / 6.82 | AA |
| accent `#B4502A` on bg / surface | 4.53 / 5.01 | AA, but use accent-strong for small text |
| accent-strong on accent-soft `#F6E1D5` (selected chip) | 5.50 | AA |
| sage-ink `#34503F` on sage `#DDE5DA` | 6.89 | AA |
| on-forest `#E9E4D8` on forest `#1E2E29` | 11.20 | AAA |
| on-forest-muted `#AFB9B0` on forest / forest-2 | 7.03 / 5.49 | AA |
| focus-dark `#F0B999` on forest | 8.19 | ≥3:1 non-text |
| success / error / warn / info on own bg | 5.43 / 5.85 / 5.81 / 6.24 | AA |
| line-strong `#8C8273` on surface (input border) | 3.72 | ≥3:1 non-text |
| ink focus ring on bg | 14.23 | ≥3:1 non-text |

Banned pair: accent `#B4502A` as text on the sky gradient (3.84). Disabled text `#8F877B` on sunk (2.84) is exempt under WCAG 1.4.3, but it always comes with `cursor:not-allowed` and `aria-disabled`.

## 3. Typography

| Role | Font | Latvian check | Fallback stack |
|---|---|---|---|
| Display / headings | **Lora** (variable wght 400–700 + italic) | Google `latin-ext` subset `U+0100-02BA` covers ā č ē ģ ī ķ ļ ņ š ū ž, **and** the macrons/cedillas were checked in a real render (Chromium, 54px). | `"Iowan Old Style", Georgia, "Times New Roman", serif` |
| Body / UI | **Source Sans 3** (400, 600, 700) | Same `latin-ext` range (verified) | `system-ui, "Segoe UI", Roboto, Arial, sans-serif` |

Load: `https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..600&family=Source+Sans+3:wght@400;600;700&display=swap` plus `preconnect` to fonts.gstatic.com.

**Diacritics check (important):** having a latin-ext subset is not enough. In a rendering test, **Fraunces** and **Newsreader** (Google variable builds) drew the macron of ā ē ī ū detached to the right ("Runa¯"), and **Literata** misplaced macrons on capitals. Lora, Source Serif 4, Playfair Display and Cormorant Garamond rendered correctly. Lora was chosen: a warm, calligraphic book serif that fits the cozy, nostalgic mood, with a lovely italic for the `em` accent. Backup: Source Serif 4 (more formal). Re-check any future font with `Runā Ā Ē Ī Ū ģ ķ ļ ņ` at display size.

### 3.1 Fluid scale (360 → 1440px)

| Token | Value | Font / weight | Line-height | Use |
|---|---|---|---|---|
| `--fs-display` | `clamp(2.5rem, 1.6rem + 4vw, 4.75rem)` | Lora 600, -0.015em | 1.04 | Home hero H1 only |
| `--fs-h1` | `clamp(2rem, 1.5rem + 2.2vw, 3.25rem)` | Lora 600 | 1.1 | Page titles (bordo) |
| `--fs-h2` | `clamp(1.625rem, 1.3rem + 1.4vw, 2.375rem)` | Lora 500 | 1.15 | Section titles (ink); italic `em` accent in bordo |
| `--fs-h3` | `clamp(1.25rem, 1.12rem + 0.55vw, 1.5rem)` | Lora 600 | 1.25 | Card titles, course names |
| `--fs-lead` | `clamp(1.125rem, 1.05rem + 0.35vw, 1.3125rem)` | Source Sans 3 400 | 1.55 | Hero subline, intros |
| `--fs-body` | `1.0625rem` (17px) | Source Sans 3 400 | 1.6 | Body |
| `--fs-sm` | `0.9375rem` (15px) | Source Sans 3 400/600 | 1.5 | Meta, card details, form help |
| `--fs-xs` | `0.8125rem` (13px), uppercase, +0.1em | Source Sans 3 600 | 1.3 | Eyebrows, small-caps nav labels, chips |

**Rules:** max 2 families and 5 weights in total. Measure 60–72ch. Never set body text below 15px or eyebrows below 13px. Headings use `text-wrap: balance`, paragraphs `text-wrap: pretty`. Numbers in prices use `font-variant-numeric: tabular-nums` (Source Sans). Only one italic `em` accent per heading. Don't use uppercase in Lora; uppercase is only for Source Sans eyebrow/nav labels.

## 4. Illustration system

**Language:** flat layered vector, soft vertical gradients inside each layer, aerial perspective (far layers lighter, cooler, lower contrast), subtle film grain. One light source: a low dawn sun, upper right of center.

| Rule | Spec |
|---|---|
| Layers | 4 depth layers + sky (see §2.4). Each layer is one closed SVG path with a 2-stop vertical gradient (top lighter by ~6% L). |
| Grain | One shared SVG `feTurbulence` (baseFrequency 0.9, 2 octaves), `mix-blend-mode: multiply`, opacity 0.06–0.08, over the whole scene, never over text panels. |
| Detail level | Far: silhouettes only (a sierra ridge with a tiny windmill; chalk cliffs with a lighthouse). Mid: 1–2 shapes of tonal variation. Near: individual pine silhouettes (3 sizes, reused). Foreground: pines + path. No outlines, no textures other than grain, no hard shadows. |
| Life | 2 birds from the logo (bordo, 0.8 opacity) in the sky, 1–2 slow cloud wisps, a lake glint. Nothing else moves. |
| Lines | No strokes, except the path edge (1.5px, 30% white) and birds. |
| Format | Inline SVG or `assets/scene/*.svg`, each ≤ 60 KB, total scene ≤ 150 KB. No PNG/JPG scenery. |
| Course covers | Same language as vignettes: 15:8 crops of the scene ("Spāņu A1" = sierra + windmill at dawn, "Angļu A1" = cliffs + lighthouse). Same 4-layer depth and palette; level shown by time of day (A1 dawn, A2 morning, B1 noon). |

### 4.1 Scene per context

| Context | Composition | Height |
|---|---|---|
| **Home hero** | Full landscape: sky + L1–L4, text centered in the upper calm sky (ref. 1/2/4). Path starts bottom-left at the shore and climbs toward the far horizons. **Mascot safe zone**: on the shore, at the start of the path, bottom-left ~12–30% x, bottom 8–24% y, about 140×140px desktop. Keep it empty of detail; Step 3 places Empanadillo there. | `min(92vh, 860px)`, min 560px |
| **Inner pages** (kursi, materiāli, lessons, noteikumi, konts) | **Horizon strip**: sky + L1 + L2 (+ the top edge of L3). Title, breadcrumb and intro sit on the left over a paper-mist gradient (`--c-bg` → transparent at ~60%), and the landscape opens to the right (sun + lighthouse). | 220–300px |
| **Footer** | **Silhouette transition**: L3 → L4 pines rise out of `--c-bg` (no hard edge), the darkest layer becomes the footer background `--c-forest`. One landmark (a small birdwatching tower, Latvian *skatu tornis*) sits on the ridge, a nod to ref. 5. | Silhouette 120–180px, then footer |
| **Mobile (<640px)** | Recompose, don't just scale: crop to the center-left (shore + path), lift the horizon to 55% height, show only one far landmark (alternating by page language: windmill for ES, lighthouse for EN), drop clouds. Text sits above the scene on the sky, CTAs stacked full-width, mascot zone moves to bottom-right of the scene (80×80px). | Hero `auto` (text) + scene 240px |

### 4.2 Seasonal variants (rules only, artwork later)

| Variant | When | Rules |
|---|---|---|
| **Winter evening** ("Ziemas vakars") | `html.ziemassvetki` (December) | Swap the sky to dusk (`#2A3550 → #6E5A73 → #D88A6A` horizon), darken L1–L3 by 1 step, add snow caps (`#F4F1EA`, 20–30% of each layer's top edge), warm window lights `--c-season-glow #F2C46A` in 2–4 tiny cabins on L3, slow snow (existing canvas, max 40 flakes). **The ember accent and UI stay unchanged**; only the scene changes. Bells/branches/bow are redrawn as flat layered vector props attached to the scene, not to UI boxes. |
| **Christmas days** | `html.svetku-dienas` (22–26 Dec) | Winter evening + a lit pine on the shore + string of lanterns along the path. Greeting pill uses `--c-accent-soft`. |
| **Birthday** | 5 Dec / `?ballite=1` | Day scene (or winter evening in December) + **bunting** across the path (triangles in accent, sage, lavender, cream), 3 paper lanterns. No confetti storms; max 1 animation (gentle sway). |
| Rules for all | — | Seasonal art only *adds* props; never changes layout, type or accent. Total extra weight ≤ 40 KB. Everything respects reduced motion. |

## 5. Components

Common states: **hover** (raise or darken one step, 150ms), **focus-visible** (2px ring `--c-ink` with 3px offset on light, `--c-focus-dark` on forest; never removed), **active** (pressed: translateY(1px), darker shade), **disabled** (`--c-sunk` background, `#8F877B` text, no shadow, `cursor:not-allowed`).

| Component | Default | Hover | Active | Disabled / other |
|---|---|---|---|---|
| **Button primary** (`.btn-cta`) | Pill, `--c-accent`, white 600 text 16px, padding 14×28, shadow-cta | `--c-accent-strong`, lift -1px | darker + no lift | as common; `.btn-busy` = spinner + label "Piesaka…", `.btn-done` = success bg + check |
| **Button secondary** | Pill, `--c-surface`, 1.5px `--c-line-strong` border, ink text | border + text `--c-accent-strong` | `--c-sunk` bg | as common |
| **Button ghost** | Text only, ink, underline offset 4px on hover | `--c-accent-strong` text, arrow moves 3px | — | on forest: `--c-on-forest` |
| **Nav (desktop)** | Logo left (56px high), links center/right in Source Sans 600 15px; sticky, transparent over sky, `--c-bg` @ 92% + 1px line after scrolling 8px | ink → accent-strong, 2px underline grows from center | — | Current: `aria-current="page"` = 2px **bordo** underline (brand mark, not action); auth chip right |
| **Nav (mobile ≤768px)** | Logo + 44×44 menu button (`aria-expanded`, `aria-controls`) | — | — | Opens a full-width sheet sliding down from the header: links 22px Lora, 56px rows, auth at bottom, scene mini-strip at sheet bottom; focus trap, Esc closes, body scroll lock |
| **Card** (course/material) | `--c-surface`, radius 20, 1px `--c-line`, shadow-1, 15:8 vignette cover | lift -3px, shadow-3, cover zooms 1.03 | — | Whole card clickable through the title link (`::after` overlay); price in Source Sans 700 tabular |
| **Chip / tag** | Pill, `--c-sage` + `--c-sage-ink`, 13px 600 uppercase | (filter chips) border `--c-line-strong` | — | Selected (`aria-pressed=true`): `--c-accent-soft` + `--c-accent-strong` + check; level chips use `--c-sunk` |
| **Input / select / textarea** | `--c-surface`, 1.5px `--c-line-strong`, radius 12, 48px tall, label above (15px 600) | border ink | — | Focus: border ink + ring; error: border + message `--c-error` with icon, `aria-invalid`; success: `--c-success` border; disabled as common |
| **Footer** | `--c-forest`, 4 columns (Libertas + short line + social; Kursi; Materiāli; Kontakti), 15px, `--c-on-forest`, headings 13px uppercase muted | links underline | — | Bottom bar `--c-forest-2`: © line + "Noteikumi un privātuma politika" |
| **Icons** | 24px grid, 1.75px stroke, round caps/joins (Lucide-like), `currentColor` | follows text | — | Icons never stand alone without a label or `aria-label`. No emoji as illustration. |
| **Toast** | Surface card, left 4px stripe by semantic color, shadow-3, bottom-center on mobile | — | — | `role="status"`; `.toast-error` uses `--c-error` stripe |

## 6. Spacing, radius, elevation, motion

| Spacing | `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48 · `--sp-8` 64 · `--sp-9` 96 · `--sp-10` 128 |
|---|---|
| Section rhythm | `--sp-section: clamp(64px, 6vw + 40px, 128px)`; container `min(1180px, 100% - 2×clamp(16px, 4vw, 40px))`; text column 68ch |
| Radius | `--r-xs` 6 (badges) · `--r-sm` 12 (inputs) · `--r-md` 20 (cards) · `--r-lg` 28 (hero panels, sheets) · `--r-pill` 999 (buttons, chips) |
| Shadows (warm, low) | `--shadow-1: 0 1px 2px rgb(36 33 30/.06), 0 2px 8px -2px rgb(36 33 30/.08)` · `--shadow-2: 0 2px 4px rgb(36 33 30/.05), 0 12px 32px -12px rgb(36 33 30/.18)` · `--shadow-3: 0 4px 8px rgb(36 33 30/.05), 0 28px 56px -24px rgb(30 46 41/.32)` · `--shadow-cta: 0 8px 20px -8px rgb(180 80 42/.55)` |
| Motion | `--ease: cubic-bezier(.2,.7,.2,1)`; `--dur-1` 150ms (hover) · `--dur-2` 250ms (menus) · `--dur-3` 450ms (reveals) · `--dur-4` 800ms (hero intro) |
| Parallax | Hero only, on scroll: L1 0.04×, L2 0.08×, L3 0.14×, L4 0.2× (max 40px), done with `transform` in rAF or CSS `animation-timeline: scroll()` with a fallback. Never on inner strips. |
| Fades | Sections: opacity 0 → 1 + translateY 12px, staggered 60ms, once. Hero intro: sky then layers rise 8px in sequence. |
| Ambient | Clouds drift 90s loop; birds glide 20s; nothing blinks. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)`: no parallax, no drift, reveals become instant, snow canvas off; keep only opacity transitions ≤150ms. |

## 7. Borrowed from

| Ref | Idea we take | Why |
|---|---|---|
| 1 Quiet Place | Calm centered hero, single coral-like CTA, mascot living *in* the scene, 3 small feature blocks | Matches "calm school" mood, gives Empanadillo a home instead of a fixed corner |
| 2 Fantasy Valley | Layered depth + atmospheric haze, pill-shaped controls | Depth = "distance to travel", the core of the concept |
| 3 Not Nahid | Warm cream paper, elegant serif, objects as metaphor, small floating label chips | Continues today's paper + serif identity; chips label scene landmarks (e.g. "Spāņu valoda" on the sierra) |
| 4 Heritage Architecture | Peach dawn sky, teal-slate silhouettes, ONE warm orange accent, refined serif title, small-caps nav | Sets the palette logic (muted world + one ember) and the type hierarchy |
| 5 TrafficBot footer | Dark forest silhouette with lookout tower flowing into a multi-column footer | Gives every page a quiet "landing" and a Baltic landmark (*skatu tornis*) |

## 8. CSS custom properties (proposed)

```css
:root {
  /* color: base */
  --c-bg: #F6F1E8;  --c-surface: #FFFDF8;  --c-sunk: #EDE5D8;
  --c-line: #D9CFC0;  --c-line-strong: #8C8273;
  --c-ink: #24211E;  --c-muted: #5C554D;  --c-disabled: #8F877B;
  /* brand + action */
  --c-brand: #6B1D1D;  --c-brand-strong: #521515;
  --c-accent: #B4502A;  --c-accent-strong: #963F20;  --c-accent-soft: #F6E1D5;  --c-on-accent: #FFFFFF;
  --c-sage: #DDE5DA;  --c-sage-ink: #34503F;
  --c-forest: #1E2E29;  --c-forest-2: #2B4038;  --c-on-forest: #E9E4D8;  --c-on-forest-muted: #AFB9B0;
  --c-focus: var(--c-ink);  --c-focus-dark: #F0B999;
  /* semantic */
  --c-success: #2E6A47;  --c-success-bg: #E3EFE5;
  --c-error: #A4282A;  --c-error-bg: #F8E3E1;
  --c-warn: #7F5300;  --c-warn-bg: #FAEED3;
  --c-info: #2F5878;  --c-info-bg: #E2EBF2;
  /* scene */
  --scene-sky-top: #F6F1E8;  --scene-sky-horizon: #F2D3B8;  --scene-sun: #F7C9A3;
  --scene-far: #C9C5D6;  --scene-far-2: #B9B6CC;  --scene-mid: #8FA3A6;  --scene-lake: #D7DEDA;
  --scene-near: #5F7C6D;  --scene-path: #E9D9C2;  --scene-front: #2F4A40;  --scene-deep: #1E2E29;
  --c-season-glow: #F2C46A;  --c-season-snow: #F4F1EA;
  /* type */
  --ff-display: "Lora", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --ff-body: "Source Sans 3", system-ui, "Segoe UI", Roboto, Arial, sans-serif;
  --fs-display: clamp(2.5rem, 1.6rem + 4vw, 4.75rem);
  --fs-h1: clamp(2rem, 1.5rem + 2.2vw, 3.25rem);
  --fs-h2: clamp(1.625rem, 1.3rem + 1.4vw, 2.375rem);
  --fs-h3: clamp(1.25rem, 1.12rem + .55vw, 1.5rem);
  --fs-lead: clamp(1.125rem, 1.05rem + .35vw, 1.3125rem);
  --fs-body: 1.0625rem;  --fs-sm: .9375rem;  --fs-xs: .8125rem;
  /* space, shape, depth, motion */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px;
  --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px; --sp-10: 128px;
  --sp-section: clamp(64px, 6vw + 40px, 128px);
  --r-xs: 6px; --r-sm: 12px; --r-md: 20px; --r-lg: 28px; --r-pill: 999px;
  --shadow-1: 0 1px 2px rgb(36 33 30 / .06), 0 2px 8px -2px rgb(36 33 30 / .08);
  --shadow-2: 0 2px 4px rgb(36 33 30 / .05), 0 12px 32px -12px rgb(36 33 30 / .18);
  --shadow-3: 0 4px 8px rgb(36 33 30 / .05), 0 28px 56px -24px rgb(30 46 41 / .32);
  --shadow-cta: 0 8px 20px -8px rgb(180 80 42 / .55);
  --ease: cubic-bezier(.2, .7, .2, 1);
  --dur-1: 150ms; --dur-2: 250ms; --dur-3: 450ms; --dur-4: 800ms;

  /* legacy aliases: keep until every rule is migrated (JS/CSS keep working) */
  --primary-bordo: var(--c-brand);
  --primary-bordo-hover: var(--c-brand-strong);
  --bg-warm-light: var(--c-bg);
  --bg-card: var(--c-surface);
  --text-dark: var(--c-ink);
  --border-light: var(--c-line);
  --accent-green: var(--c-success);
  --accent-gold: var(--c-season-glow);   /* seasonal only from now on */
  --accent-blue: var(--c-info);
  --font-heading: var(--ff-display);
  --font-body: var(--ff-body);
  --b-ena: var(--shadow-1);  --b-ena-hover: var(--shadow-3);  --b-ease: var(--ease);
  --m-ena: var(--shadow-1);  --m-ena-hover: var(--shadow-3);  --m-ease: var(--ease);
  --xmas-gold: var(--c-season-glow);
}
```

**Migration note:** the aliases keep every existing rule rendering. But `.btn-cta`, `.btn-secondary` and the nav-active pill currently *use* `--primary-bordo` for actions. In Step 4 those rules must be repointed to `--c-accent` (not by changing the alias, or the logo-adjacent bordo headings would turn orange). `--xmas-red/green/blue` stay scoped to the seasonal stylesheet until the winter scene replaces them.

## 9. Evening variant ("Vakars")

An optional `[data-theme="vakars"]` / `prefers-color-scheme: dark` theme that reuses the winter-evening scene without snow:

| Token | Day | Evening | Contrast (evening) |
|---|---|---|---|
| `--c-bg` | `#F6F1E8` | `#1A2230` | — |
| `--c-surface` | `#FFFDF8` | `#232D3D` | — |
| `--c-ink` | `#24211E` | `#ECE6DA` | 12.85 on bg / 11.16 on surface |
| `--c-muted` | `#5C554D` | `#B3AC9F` | 7.08 / 6.15 |
| `--c-brand` (headings) | `#6B1D1D` | `#E8A598` (rose-bordo) | 7.80 |
| `--c-accent` | `#B4502A` | `#E07A4E` | 4.66 on surface as non-text; button text `#1A2230` on it = 5.37 |
| Scene | dawn | dusk sky `#2A3550 → #6E5A73 → #D88A6A`, layers navy-slate, warm windows `#F2C46A` | — |

The logo PNG is bordo on transparent, which disappears on `#1A2230`. The evening theme needs a light logo variant (cream `#ECE6DA` recolor, ideally an SVG). **Flag for Step 3/4.** Recommendation: ship day-only first; evening only for the December scene, where the header stays light.
