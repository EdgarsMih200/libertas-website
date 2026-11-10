# Libertas: layout and UX (Step 4) + responsive (Step 5)

Date: 2026-11-10 · Branch `redesign/new-style` · Visual mockups: `pages.html` (toggle "Rādīt klases" to see class mapping).
Inputs: `../design-system.md` (tokens, components), `../preview/style-board.html` (scenes), `../mascot-final/usage.md` (mascot rules).
Rule kept: every existing link, form, JS hook (audit §6) and flow stays. Nothing below invents prices, teachers or testimonials.
`NEW` = new markup; every structural change has a one-line reason (→).

---

## 0. Shared shell (all pages)

### Header / nav (`header.site-header > .container.nav-wrapper`)
- Desktop: logo left (52 px tall) · `nav.main-nav` right (Kursi, Noderīgi materiāli, Par mums; uppercase Source Sans 600 13 px) · `.auth-box` (injected by `script.js`) at the far right.
- Home: header sits transparent over the hero sky; after 8 px scroll it gets `--c-bg` 92 % + 1 px line. Inner pages: solid paper + hairline. Sticky everywhere.
- Current page: `aria-current="page"` = 2 px **bordo** underline (brand mark). Hover = accent-strong underline growing from the centre.
- Reserve the auth slot (`min-width: 190px` on `.auth-box`) → no layout shift when `/api/me` answers.
- **Mobile ≤768 px** (`NEW` `button.izvelnes-poga[aria-expanded][aria-controls="galvena-izvelne"]`, 44×44):
  the same `nav.main-nav` (`id="galvena-izvelne"`) becomes a sheet below the header → no duplicated links, one source of truth.
  Sheet: 60 px rows, Lora 22 px, bordo marker on the current page, primary CTA "Izvēlies kursu", mini horizon strip at the bottom.
  Focus moves into the sheet, focus trap, `Esc` closes and returns focus to the button, body scroll lock, corner mascot hidden while open.
  `.auth-box` stays in the header bar as a 44 px icon (guest: user icon → sign-in; signed in: `.user-chip` avatar, `.user-menu` drops from it).
  → today the nav is simply `display:none` on phones (audit UX #1).

### Footer (`footer > .container`)
- Silhouette transition (pines + skatu tornis, 180 px desktop / 120 px phone) → forest `--c-forest` footer.
- Columns: brand (light logo, tagline "Runā, saproti, ceļo, audz!", "Spāņu un angļu valodas kursi") · **Kursi** (Kursu piedāvājums, Spāņu valoda A1–B1.2 → `kursi.html#spanu`, Angļu valoda A1–A2 → `kursi.html#anglu`, Mani kursi → `konts.html`) · **Materiāli** (Noderīgi materiāli + both lessons) · **Libertas** (Par mums ⚑, Noteikumi un privātuma politika, Sīkdatnes → `noteikumi.html#sikdatnes`, Kontakti → `noteikumi.html#kontakti`).
- Bottom bar `--c-forest-2`: existing "© 2026 Libertas. Visas tiesības aizsargātas." + "Noteikumi un privātuma politika" (link kept).
- → today's footer is one line; the new columns only point at pages/anchors that already exist.
- Phone: 2 columns, Libertas column full width, every link row ≥44 px, bar stacked.
- December: snow caps on the silhouette (scene tokens), no extra DOM.

### Corner mascot (`.empanadillo`, `.empa-poga`, `.empa-burbulis`)
- Site-wide helper bottom-right: small ×3 (96 px) ≥769 px, small ×2 (64 px) ≤768 px.
- Home: hidden while the hero traveller is on screen (IntersectionObserver on the hero) → one Empanadillo per screen.
- Phone: lifts by the footer bar height when the footer enters the viewport, and hides while the menu sheet is open → doesn't cover links (audit UX #7).
- Bubble opens above-left of him on phones; auto-hide 9 s; `Esc` closes.

---

## 1. Home (`index.html`)

| # | Section | Goal | Content → existing hooks | Change + reason |
|---|---|---|---|---|
| 1 | **Hero** (hook) | Make the visitor pick a course | `section.hero-section` > inline SVG scene; `.hero-text`: pill "Spāņu un angļu valoda · A1–B1", `h1` "Runā, saproti, ceļo, *audz!*", `.hero-subtitle` (existing line); `.hero-cta-box`: `a#exploreBtn` **"Izvēlies kursu"** → `kursi.html` (primary) + "Noderīgi materiāli" → `materiali.html` (secondary). Landmark chips "Spāņu valoda" (windmill) / "Angļu valoda" (lighthouse). `p.svetku-sveiciens` stays above the h1 (22–26 Dec). | Two CTAs to the same page → one to courses, one to materials (approved). `.btn-title/.btn-sub` two-line buttons → single-label pills (sub-lines dropped, they repeated the label). Empty `.hero-overlay` removed (no CSS, audit). |
| 2 | **Value strip** | Say why Libertas in 3 s | `NEW .hero-prieksrocibas`: "Mazas grupas" · "Dzīvas nodarbības" · "Praktiska valoda jau no pirmās dienas" (approved copy, same wording as `kursi.html` intro). | → hero alone said nothing about the method. |
| 3 | **Course path** (proof) | Show what is for sale + prices | `NEW section.kursu-taka`: h2 "Izvēlies savu *taku*"; 2 cards (Spāņu valoda: A1 → A2 → B1.1 → B1.2, "no 280,00 EUR · B1 — 420,00 EUR", "A1: 7 nedēļas, otrdienās un ceturtdienās"; Angļu valoda: A1 → A2, 280,00 EUR, "A1: 7 nedēļas, pirmdienās un trešdienās"); buttons → `kursi.html#spanu` / `#anglu`. | → home page never showed courses (audit §2). Data copied from `kursi.html`, so it's a 2nd place to update (flag 4). The "path" is the concept made literal: levels = steps on the road. |
| 4 | **Materials bento** (low-risk action) | Try a free lesson | Unchanged markup: `section#materiali.bento-sadala`, `.bento-galva` (`.bento-zime`, `h2.bento-virsraksts`, `.bento-ievads`), `.bento` (`.gaida/.redzams`), `article.bento-hub` (`.bento-hub-galva`, `.bento-hub-etikete`, `.bento-hub-saturs`), `a.bento-flize--galvena`, `.bento-hub-riki` (`--riks--izruna` `.vilni`, `--riks--uzdevumi` `.progresa-aplis --p`), `--druka` (`.lapa`), `--visi`. `--mx/--my` spotlight kept but softened to a paper glow. | Restyle only: glass/dark SaaS look → paper cards; main tile cover = winter-evening vignette (lesson theme) with a flat "phrase card"; tool tiles = sunk panel + flat player/progress; connector rail = dashed sage line, turns accent on hover (`:has`); `--visi` = forest tile with pines. Emoji/`.bento-zvaigzne` sparkle dropped (DS: no emoji as illustration). |
| 5 | **Par mums** | Trust (who teaches) | `NEW section#par-mums` — placeholder only until the client sends text. | → fixes the dead nav anchor; see flag 1. |
| 6 | Footer | Wayfinding | see §0 | — |

Mascot: traveller large ×4 on the shore at the start of the path (feet at 29.86 % / 96.9 % of the hero, HTML overlay, not inside the SVG); `vicina` on arrival → `miera`; greeting bubble to his upper right (desktop), hidden in the hero <900 px. December: Santa hat; 5 Dec: party hat + bunting in the scene.
Seasonal: bells/branches/bow (`.zvanu-zars-k/-l`, `.zvans[data-nots]`, `#zvana-forma`, `.cta-bantite`) are redrawn as flat props pinned to the **scene** (pine branches in the top corners of the hero, bow on the primary CTA's left edge); same classes, so `zvani.js` keeps working.

**`#exploreBtn` flow:** today `script.js` sends guests to Google sign-in on click and appends `.consent-note`. With the label "Izvēlies kursu" that's surprising, so recommend: keep the id, drop the guest redirect, and show the consent note on `kursi.html` next to enrollment (sign-in already happens on `data-course` click). Needs client OK (flag 2). Until then the mock keeps the hook and the note can render under the CTAs.

## 2. Kursi (`kursi.html`)

1. Horizon strip (hook): crumbs "Sākums / Kursi", `h1.section-title` "Kursu piedāvājums", `.sakums-ievads`. Scene opens on the right (lighthouse + sun).
2. `NEW` language groups `section.kursu-grupa#spanu` / `#anglu`, each with `h2` + meta "4 kursi · A1 → B1.2" → fixes h1 → h3 jump (audit UX #4) and gives footer/home anchors.
   Order: ES A1, A2, B1.1, B1.2, then EN A1, A2 → today's order mixes languages.
3. Cards (value + action): `article.course-card` > cover `img` (`assets/kursi/*.svg`, redrawn as vignettes: A1 dawn, A2 morning, B1 noon; same paths, 15:8) > `.course-body`: level chip, `h3`, `.course-price`, `.course-info` (calendar icon), `a.btn-cta.btn-card[data-course]` "Pieteikties kursam" (`.btn-busy` "Piesaka…", `.btn-done` "Pieteikts"). Button pinned to the card bottom so rows align.
4. `NEW aside.pieteiksanas-soli` in the free cells next to English: "Kā pieteikties" 1 Izvēlies kursu · 2 Ienāc ar Google · 3 Seko pieteikumam sadaļā "Mani kursi" (+ cancel while pending) and `p.consent-note`. → explains the existing flow; every step is something the code already does.
Mascot: none in the strip (cards are the focus); corner helper only.
Grid: 4 cols ≥1024, 2 cols 640–1023, 1 col <640.

## 3. Materiāli list (`materiali.html`)
1. Strip: `.mat-zime` pill, h1 "Noderīgi *materiāli*", `.mat-galva-ievads`; mascot `lasa` ×2 standing on the strip ground (decorative, `aria-hidden`), hidden <768 px.
2. Toolbar `.mat-rikjosla`: `.mat-filtri` segmented control (`.mat-filtrs[aria-pressed]`, sliding `.mat-filtri-slids --x/--w`, `.mat-filtrs-sk`) + `.mat-skaits` (live).
3. Grid `.mat-rezgis` (3 / 2 / 1 cols): `article.mat-karte[data-valoda][data-valoda-nosaukums]` — cover `.mat-vaks` = scene vignette (holiday theme → winter evening) with `.mat-vaks-sveiciens` + `.mat-vaks-valoda` on a bottom fade; `.mat-vaks-disks` emoji removed (DS). Body unchanged (`.mat-karte-virs`, h2 > `a.mat-karte-saite::after`, `.mat-karte-ieklauts`, `dl.mat-karte-dati`, `.mat-karte-apaksa` + `.mat-karte-bulta`). `--k1/--k2` now pick the vignette crop/time of day instead of gradients. `.mat-karte--drizuma` = dashed card.
4. Empty filter state (future, if a language has 0): mascot `lasa` + microcopy (§8).

## 4. Lesson page (`materiali-*-ziemassvetki.html`)
1. `section.mat-hero` → taller horizon strip (380 px desktop, 160 px scene band on phones): `.mat-atpakal` "← Visi materiāli", `.mat-birkas` (`.mat-limenis`, `.mat-valoda` chips), `h1` with `.mat-hero-es` as an italic bordo line above the title, `.mat-hero-teksts`, `ul.mat-statistika`, `.mat-hero-pogas`: "Sākt nodarbību" (primary) + "Drukāt" (secondary with printer icon; `onclick="window.print()"` kept).
   → colourful gradient hero (`.mat-vaks--ziemassvetki`) replaced by the shared scene language.
2. `.mat-izkartojums`: sticky TOC `nav.mat-saturs` (label `.mat-saturs-virsraksts` now `--c-muted` → fixes 3.5:1 contrast) with numbered 44 px links, `.aktivs` = accent-soft pill; `main.mat-galvenais` 68ch.
3. Sections `.mat-sadala[id]` with `.mat-nr` bordo discs. Flip cards `.vards-karte` (front: word in Lora + `.runat-poga`; back: sage). `.runat-poga` gets a CSS SVG speaker; the 🔊 text from JS stays as fallback.
   Emoji **stay inside lesson content** (vocab cards, timeline `.laika-emoji`) as memory aids; removed only from UI chrome (covers, buttons, CTA `.mat-cta-emoji`).
4. Dialogue `.cats/.replika` (speaker name `--c-muted`, fixes contrast), exercises `.uzdevums-bloks`, `.uzd-lauks` 48 px tall (`.pareizi` success / `.nepareizi` error + icon), `.mat-cta` aside → sage panel with "Apskatīt kursu".
5. Print CSS kept untouched.
Mascot: corner helper only; `ielade` if content is ever fetched.

## 5. Noteikumi (`noteikumi.html`)
Strip (compact 220 px, no mascot): h1 "Noteikumi un privātuma politika" + effective date line. Below: 2 columns ≥1024 — sticky `.legal-toc` left, `.register-card.legal-card` content right (68ch, h2/h3 rhythm, `.legal-table` striped with `--c-sunk`). `span.placeholder` = `--c-warn-bg` + dotted underline (still clearly unfinished). Phone: TOC as a horizontal chip row above the text. → long text needs a persistent TOC; nothing else changes.

## 6. Konts / admin (light-touch restyle only)
- `konts.html` / `admin.html`: compact strip (160 px, title only), then the existing JS-rendered card (`#konts`, `#admin`). Restyle generated classes only: `.badge-<status>` → semantic colours (pieteicies = info, uznemts = success, sacis = sage, pabeidzis = sunk, atteicies = error-bg), `.badge-paid` success, `.btn-small/.btn-danger/.btn-link` from the button set, `.admin-table` sticky head + stripes, `.summary-card` surface cards, inputs per DS (48 px). Focus rings on all controls (audit UX #3).
- Loading/empty/error states per §8. No structure change.

## 7. 404 (`NEW 404.html`)
Solid header → centred: mascot `apjucis` ×4 (`role="img"`, label "Empanadillo — Libertas talismans, apjucis"), eyebrow "Kļūda 404", h1, text, 3 buttons (Uz sākumlapu primary · Kursi · Noderīgi materiāli) → footer silhouette. `noindex`.
Needs `"not_found_handling": "404-page"` under `assets` in `wrangler.jsonc` (config change in Step 6).

## 8. Microcopy (LV; mascot voice = "tu" + Spanish exclamation; system notices keep today's "jūs")

| State | Where | Text |
|---|---|---|
| 404 | `404.html` | **¡Ay, caramba!** Šī taka ved nekurienē. / Lapa, ko meklē, nav atrasta — varbūt tā ir pārcelta vai adresē ieviesusies drukas kļūda. |
| Loading | `#konts` (replaces "Ielādē…") | *Momentito…* Ielādējam tavus kursus. (sprite `ielade`, `aria-busy="true"`) |
| Loading (generic) | admin, future fetches | *Un momento…* Ielādē. |
| Empty | Mani kursi | Jums vēl nav pieteikumu. *¡Vamos!* Pirmais solis — izvēlēties kursu. [Skatīt kursus] (existing text + one line) |
| Empty | materials filter | *¡Vaya!* Šajā valodā materiālu vēl nav. Jaunas nodarbības jau ceļā. [Rādīt visus] |
| Error | API / network | *¡Uy!* Neizdevās ielādēt. Pārbaudi interneta savienojumu un mēģini vēlreiz. [Mēģināt vēlreiz] |
| Error | no admin access | Nav piekļuves (existing) |
| Toasts | existing | "Paldies! Jūsu pieteikums ir saņemts." · "Jūs jau esat pieteicies šim kursam." · "Tālrunis saglabāts." · "Neizdevās pieteikties" |
| Exercises | existing | `body[data-uzslava]` "¡Muy bien!" / "Well done!" |
| Mascot phrase fix | `empanadillo.js` | "Apskati mūsu kursus: spāņu un angļu valoda!" (replaces stale "…zemāk: … A1!") |

---

## Step 5 — Responsive

### Breakpoints (mobile-first, `min-width`)
| Name | Range | Grid / container |
|---|---|---|
| **phone** | 360–767 | 1 col, gutter 16 px; mobile menu; stacked CTAs (full width) |
| **tablet** | 768–1023 | 2 cols; desktop nav from 768 if it fits, else menu until 900 (test with real auth chip) |
| **desktop** | 1024–1439 | 12-col, container `min(1180px, 100% - 2×clamp(16px,4vw,40px))` |
| **wide** | ≥1440 | container capped at 1180 (text) / 1320 (bento); scenes go full-bleed, extra width = more sky/lake, never stretched type |

### Scene recomposition
| Scene | ≥1440 / 1024–1439 | 768–1023 | 360–767 |
|---|---|---|---|
| **Home hero** | Full scene, `viewBox 0 -100 1440 900`, `xMidYMax slice`, height `clamp(600px, 56vw, 860px)`; text safe zone = centred column ≤940 px from 120 px to ~45 % height (above the far ridge); landmark chips on; mascot large ×4 at 29.86 % / 96.9 %; bubble right of him; parallax on. | Text block moves **above** the scene (sky gradient background), scene below at fixed `aspect-ratio: 1440/620`, crop `120 300 1100 560`; chips off; clouds kept; mascot ×3 on the shore; bubble hidden. | Text on sky, CTAs full width; scene band 270 px, crop `100 300 720 500` (shore + path, one far landmark per page language); clouds, sun halo and chips dropped; mascot ×2 bottom-right (72.9 % / 96 %), never under the buttons. |
| **Inner strip** | 280 px (lesson 380); title left on paper mist (`--c-bg` → transparent at 64 %); scene opens right; `lasa` mascot on materials. | 240 px, mist extends to 75 %; mascot off. | Title on plain paper above; 120 px scene band below it (crop right half: sun + lighthouse); lesson: 160 px, stats 2×2. |
| **Footer silhouette** | 180 px, full `0 0 1440 240`. | 150 px. | 120 px, crop `560 0 720 240` (tower kept, larger pines). |
| **Cards / covers** | 15:8 covers. | 15:8. | Covers cropped to 12:5 with `object-fit: cover` (shorter scroll). |

### Fluid type and spacing (360 → 1440)
`--fs-display clamp(2.5rem, 1.6rem + 4vw, 4.75rem)` (hero 40 → 68–76 px) · `--fs-h1 clamp(2rem, 1.5rem + 2.2vw, 3.25rem)` · `--fs-h2 clamp(1.625rem, 1.3rem + 1.4vw, 2.375rem)` · `--fs-h3 clamp(1.25rem, 1.12rem + .55vw, 1.5rem)` · `--fs-lead clamp(1.125rem, 1.05rem + .35vw, 1.3125rem)` · body 17 px fixed, never <15 px.
Spacing: `--sp-section clamp(64px, 6vw + 40px, 128px)` · gutter `clamp(16px, 4vw, 40px)` · card gap `clamp(14px, 1.6vw, 24px)` · hero copy top `clamp(16px, 8vw, 128px)` · strip height `clamp(140px, 20vw, 300px)` · footer silhouette `clamp(120px, 12.5vw, 180px)`.

### Touch targets (≥44 px)
Buttons 48 px; menu button, auth icon, TOC links, filter segments (`@media (pointer:coarse)` → 44 px), footer links (44 px rows on phone), flip-card 🔊 36 px visual + padding to 44 hit area, mascot bubble close 28 px visual + 44 px hit via `::before`, `.uzd-lauks` 48 px, sheet rows 60 px. Spacing between adjacent targets ≥8 px.

### Performance budget
| Item | Rule |
|---|---|
| Home hero scene | **Inline SVG** in `index.html` (LCP, themed by CSS vars, seasonal swap without extra requests). ≤35 KB raw / ~9 KB gzip. |
| Strips, footer, covers | One external sprite `assets/scene/ainava.svg` (`<g id>`s referenced by `<use href="assets/scene/ainava.svg#sc-far">`), cached across pages, ≤60 KB. Course covers stay `<img>` files (`loading="lazy" decoding="async" width/height`). |
| Grain | No per-scene `feTurbulence` (expensive paint). One pre-rendered 128 px noise tile (≤4 KB data-URI PNG) as a CSS overlay, opacity .06, `mix-blend-mode: multiply`, hero only. |
| Fonts | Lora (400–700 + italic) + Source Sans 3 (400/600/700), latin-ext, `display=swap`, preconnect; preload only Lora 600 woff2. ≤120 KB. |
| Mascot | JS-built SVG with fixed `width/height` attributes = no CLS; corner helper loads after `load`. |
| No layout shift | Fixed `aspect-ratio` / heights on hero, strips, covers, footer silhouette; reserved `.auth-box` width; fonts with metric-matched fallbacks (`size-adjust`). Target CLS < 0.05. |
| Lazy | Below-fold images lazy; lesson sections `content-visibility: auto` + `contain-intrinsic-size`; snow canvas max 40 flakes, paused on `visibilitychange`. |
| Motion | Parallax only on the home hero, only `(pointer: fine) and (prefers-reduced-motion: no-preference)` and ≥1024 px; `transform` on layer `<g>`s in rAF, max 40 px. Clouds/birds drift; reduced motion = static scene, static mascot frame 0, no snow. |
| Page totals | Home first load ≤350 KB (HTML ≤60, CSS ≤90 split into base + lesson + admin later, JS ≤30, fonts ≤120, scene). LCP < 2.0 s on 4G. Remove unused `assets/anglu_a1_saturs.png` (2.8 MB) etc. at Step 6. |

### Evening / dark variant (proposal)
- **Phase 1 (ship):** December "Ziemas vakars" = scene-only swap under `html.ziemassvetki` (dusk sky, snow caps, warm windows, Santa hat); UI stays light, accent unchanged. Hero text on the dusk sky uses `#F6F1E8` (≈9:1 on `#2A3550`).
- **Phase 2 (after the light SVG logo exists):** `[data-theme="vakars"]` + `prefers-color-scheme: dark` auto, manual toggle in the footer ("Diena / Vakars", saved in localStorage). Tokens from DS §9: bg `#1A2230`, surface `#232D3D`, ink `#ECE6DA` (12.9:1), headings rose-bordo `#E8A598` (7.8:1), accent `#E07A4E` with dark button text `#1A2230` (5.4:1), footer `#121A17`. Scene = `sc-dusk` (no snow). Course cover images need dusk versions or a 10 % darken filter.

---

## Flags / open questions (client)
1. **Par mums:** no content exists. Options: **A** client sends 3–5 facts + teacher name(s)/photo → real `#par-mums` section on home (recommended); **B** hide "Par mums" from nav/footer until then; **C** point it to the footer brand block. The mockup shows a clearly marked placeholder.
2. **`#exploreBtn`:** OK to stop redirecting guests to Google sign-in on "Izvēlies kursu" and move the consent note to `kursi.html`? (JS change in `script.js`, id kept.)
3. **Contacts:** no email/phone/address on the site yet (only yellow placeholders in `noteikumi.html`). Footer "Kontakti" links to `noteikumi.html#kontakti` for now; send real details to show them in the footer?
4. **Prices on home:** the course-path teaser repeats prices from `kursi.html` (two places to update). Keep prices, or show levels only?
5. **Header/footer duplicated in 8 files:** the new header (menu button) and 4-column footer are bigger. Keep copy-paste, or inject them from one partial with `script.js` (no build step, but needs a no-JS fallback)?
