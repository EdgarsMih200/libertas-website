# Libertas website — project context

Short reference so work can start without re-reading every file.
**Keep this file up to date** whenever pages, classes, courses or config change.

## What it is
- Static marketing site for **Libertas**, a language school (Latvian UI, `lang="lv"`).
- Tagline: "Runā, saproti, ceļo, audz!"
- Plain HTML/CSS/JS. No build step, no framework, no npm dependencies.
- Repo: `github.com/EdgarsMih200/libertas-website`, branch `main`.
- Hosting: Cloudflare Workers static assets (`wrangler.jsonc`, `assets.directory: "."`).
  Pushing to `main` deploys the site automatically.

## Files
| File | Purpose |
|---|---|
| `index.html` | Home (redesign chunk 2): hidden `svg.ainavas-defs` (scene layers `#sc-sun/-clouds/-birds/-far/-lake/-mid/-near/-path/-front`, `#pine`, `#haze`; colours from `--sc-*`) → `section.hero-section` (`.container.hero-container`: `.hero-text` with `p.svetku-sveiciens`, pill `.hero-zime`, the only `h1` "Runā, saproti, ceļo, *audz!*", `.hero-subtitle`; `.hero-cta-box`: `a#exploreBtn.btn-cta.btn-hero` "Izvēlies kursu" → `kursi.html` + `.btn-secondary.btn-hero` "Noderīgi materiāli" → `materiali.html`; Christmas `.cta-bantite`, `.zvana-defs`, `.zvanu-zars-k/-l` kept for snow.js/zvani.js), then (after the text in DOM = tab order) `.hero-ainava > .hero-ainava-kadrs` (always 1440:900 = viewBox `0 -100 1440 900`, so overlays are % of scene coords: `svg.hero-ainava-svg` with parallax groups `.ainava-slanis--debesis/--talu/--vidus/--prieksa`, chips `.hero-orientieris--es/--en` (1200–1599px only), mascot slot `div.hero-empa[data-empa-hero]` at x 430 / y 772). ≥1024 text over the scene; <1024 text on sky + scene band (tablet crop x120–1320, phone 270px band x100–820). Then `.hero-prieksrocibas` (`ul.prieksrocibas-saraksts > li.prieksrociba` + `.prieksrociba-ikona`), `section.kursu-taka` (`.sadalas-galva`/`.sadalas-zime`/`.sadalas-virsraksts`/`.sadalas-ievads`; `.takas > article.taka` = `.taka-vaks` scene cover (`.sc-rits` for English) + `.taka-saturs`: `h3`, `ol.taka-limeni`, `.taka-cena`, `.taka-info`, `a.btn-secondary.taka-poga` → `kursi.html`; **prices/schedules duplicate `kursi.html`**), materials teaser `section#materiali.bento-sadala` (same markup/hooks as before: `.bento-galva` (`.bento-zime`, `h2.bento-virsraksts`, `.bento-ievads`), `.bento` (`.gaida/.redzams`), `article.bento-hub` (`.bento-hub-galva`, `.bento-hub-etikete`, `.bento-hub-saturs`), `a.bento-flize--galvena` (cover `.bento-skats.sc-ziema` with `svg.bento-ainava` winter scene + flat cards `.stikls--prieksa/--aizmugure`, `.bento-skaitli`), `.bento-hub-riki` (rail in `::before`) with `a.bento-flize--riks` `--izruna` (`.stikls--atskanotajs`, `.vilni`) / `--uzdevumi` (`.stikls--uzdevums`, `.progresa-aplis --p`), `--druka` (`.lapa`), `--visi` (forest tile, pines bg); `--mx/--my` spotlight = soft paper glow). No "Par mums" section. Footer |
| `kursi.html` | "Kursi" (menu): `section#kursi.courses-section` with `h1.section-title`, `.sakums-ievads`, course cards. Enrollment via `script.js` (`data-course`) |
| `noteikumi.html` | Terms of service + GDPR privacy policy + cookies (LV law). Reuses `.register-card` + `.legal-card`. Company details are `span.placeholder` (yellow) until filled in |
| `materiali.html` | "Noderīgi materiāli" (in menu), styled like the home bento: `section.mat-saraksta-lapa` (light, no dark block; local tokens `--m-*`) → editorial header `.mat-galva` (pill `.mat-zime` + `.tags-punkts`, `h1` with italic `em`, `.mat-galva-ievads`) → toolbar `.mat-rikjosla` (segmented filter `.mat-filtri` with sliding pill `.mat-filtri-slids` + per-button count `.mat-filtrs-sk`; live total `.mat-skaits`) → grid `.mat-rezgis` of glass `article.mat-karte` (theme via `--k1/--k2`; `.mat-karte--en` = blue; cover `.mat-vaks` with `.mat-vaks-sveiciens`, `.mat-vaks-valoda`, emoji in glass `.mat-vaks-disks`; body `.mat-karte-virs` (`.mat-karte-limenis` + `.mat-karte-tema`), `h2`, `p`, `.mat-karte-ieklauts`, `dl.mat-karte-dati` (3 stats), `.mat-karte-apaksa` + diagonal-arrow `.mat-karte-bulta`; gradient border on hover; whole card clickable via `.mat-karte-saite::after`) + striped `.mat-karte--drizuma` placeholder. Cards carry `data-valoda` / `data-valoda-nosaukums`; filters appear once 2+ languages exist. Note: `.mat-hero`, `.mat-vaks--ziemassvetki(-en)`, `.mat-limenis`, `.mat-valoda` are now used only by the lesson pages. **Adding a material** = new page `materiali-<valoda>-<tēma>.html` (copy the Christmas one) + copy one card |
| `materiali-spanu-ziemassvetki.html` | Material **Spāņu A1 — Ziemassvētki**: hero with stats, sticky side TOC `.mat-saturs` (active link highlighted), sections `.mat-sadala` with `.mat-nr`: flip vocab cards (`.vardu-rezgis` > `.vards` > `button.vards-karte`), phrases list, grammar tiles (`.artikulu-rezgis`, `.likumu-rezgis`, `.locijumi`), chat dialogue (`.cats` > `.replika--a/--p`, translation toggle, "listen to whole dialogue"), timeline `.laika-josla`, self-checking exercises (`.uzdevums-bloks`, inputs `.uzd-lauks[data-atbilde]`, `|` = alternative answers; check ignores case/accents/punctuation), CTA `.mat-cta` |
| `materiali-anglu-ziemassvetki.html` | Material **Angļu A1 — Ziemassvētki**: same structure/classes as the Spanish one (reuses `.vards-es`, `.es`, `.art-el` = *a*, `.art-la` = *an*), but speech attrs are `data-en`, `body[data-uzslava="Well done!"]`; grammar: a/an, plurals, *want/wants*; traditions = UK |
| `materiali.js` | Shared by material pages: 🔊 buttons on every `[data-es]` (es-ES) or `[data-en]` (en-GB) via Web Speech (placed in `[data-runa-vieta]` if present); all-correct message from `body[data-uzslava]` (default ¡Muy bien!); answer check also ignores apostrophes; flip cards, dialogue playback/translation, exercise checking, TOC highlighting, card filters (sliding pill position via `--x/--w`, counts, Latvian plural for total, `.paradas` fade-in on filter) |
| `script.js` | Shared JS (see below) |
| `snow.js` | Home page only: falling, rotating six-armed snowflakes canvas (`.snow-canvas`) in Nov/Dec/Jan/Feb; skipped with `prefers-reduced-motion`; force with `?sniegs=1`. Adds `html.ziemassvetki` (Christmas decor) **only in December** (test `?ziemassvetki=1`) and `html.svetku-dienas` (shows "Priecīgus Ziemassvētkus!") **only 22–26 Dec** (test `?sveiciens=1`) |
| `zvani.js` | Home page only (December): golden bells `.zvans` on the hero pine branches swing (`.zvana`) and ring on hover/tap. Sound synthesized with Web Audio (pitch in `data-nots`); browsers allow sound only after the visitor's first click/tap/key |
| `empanadillo.js` | Mascot **Empanadillo the traveller** (approved sprites from `docs/redesign/mascot-final`: letter grids + `KRASAS`, poses `miera/vicina/lasa/rada/apjucis/ielade` + site pose `sveicina` (rest arm + both wave frames), small `MAZAIS` set, hats `CEPURES`/`MAZAS_CEPURES`; exposes `window.EMPANADILLO.svg(poza, {mazais, frame, animate, hat, shadow, label, scale})` for 404/loading later). Loaded on all public pages (index, kursi, materiali + lessons, noteikumi, konts; not admin). Corner helper `div.empanadillo.empa.empa--mazs` (small ×3 96px / ×2 64px ≤768px) fixed bottom-right; on the home page the large traveller `div.empa.empa--liels` (×4 208px / ×3 ≤1023 / ×2 ≤767) goes into `[data-empa-hero]` and the corner helper stays hidden while he is on screen (IntersectionObserver) → one mascot per screen. Greets once per session (sessionStorage `empaSveiciens`): on the hero traveller at ≥900px, otherwise by the corner helper when it appears. Click = filling first (`PILDIJUMI`, by hash of `LIB.me.user.id`, guests random in localStorage `empaPildijums`), then `frazes`; hover/focus = wave (`.maj`), Esc closes the bubble, auto-hide 9 s. Santa hat under `html.ziemassvetki` (home only, set by snow.js), party hat on 5 Dec / `?ballite=1` instead. Reduced motion = static. Load after `snow.js` on the home page |
| `style.css` | Shared styles (see sections below) |
| `assets/` | `libertas.png` (logo, bordo), `libertas-light.svg` (vector trace of the logo in paper `#F6F1E8`, for dark backgrounds: footer), `ilustracijas/kajene-mezs.svg` (footer silhouette: pines + skatu tornis, 1440×240, bottom band = `--c-forest`), `ziemassvetki/` (Christmas decorations: `zars.svg` pine branch, `ilekss.svg` holly, `bumba.svg` bauble), `kursi/*.svg` (course cover illustrations, 600×320, drawn in SVG: `spanu-a1`, `spanu-a2`, `spanu-b1-1`, `spanu-b1-2`, `anglu-a1`, `anglu-a2`); old `spain-a1.png`, `english-a1.jpg` no longer used |
| `konts.html` + `konts.js` | "Mani kursi": own profile (phone editable), own enrollments, cancel while `pieteicies` |
| `admin.html` + `admin.js` | Admin panel (users: data, last login/visit; enrollments: status, paid, notes, add/delete). noindex |
| `worker/index.js` | Cloudflare Worker: Google OAuth, sessions, JSON API (runs first for `/api/*`, `/auth/*`) |
| `migrations/` | D1 schema (`0001_init.sql`: users, sessions, courses, enrollments; `0002_more_courses.sql`: A2/B1 courses) |
| `wrangler.jsonc` | Cloudflare config: worker `main`, assets, D1 `DB` (`libertas-db`), vars `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID` |
| `.assetsignore` | Files NOT published to the live site (add any new non-site files here) |
| `context.md`, `CLAUDE.md` | Dev notes for Claude; listed in `.assetsignore` |

## Shared page skeleton (all pages)
- `<head>`: Google Fonts (preconnect + Lora 400–700/italic + Source Sans 3 400/600/700, `display=swap`) before `style.css`.
- `header.site-header > .container.nav-wrapper` → `a.logo` (img 500×216, 52px tall / 40px ≤768px),
  `button.izvelnes-poga` (44×44, `aria-expanded`, `aria-controls="galvena-izvelne"`, `aria-label` "Atvērt izvēlni"/"Aizvērt izvēlni", icons `.ikona-atvert`/`.ikona-aizvert`),
  `nav.main-nav#galvena-izvelne` (Kursi → `kursi.html`, Noderīgi materiāli → `materiali.html`; current page `aria-current="page"`).
  `script.js` appends `.auth-box` at the end of `.nav-wrapper`.
- **"Par mums" is hidden** (HTML comment in the nav of every page) until `#par-mums` content exists. BJU (`#faq`) also not in menu.
- `footer.site-footer` → `img.kajene-ainava` (silhouette SVG) → `.kajene-saturs` (forest): `.container.kajene-kolonnas` with
  `.kajene-zimols` (`a.kajene-logo` light SVG, `.kajene-sauklis`, `.kajene-apraksts`) + 3 `nav.kajene-kolonna` (`h2.kajene-virsraksts`):
  Kursi (kursi.html, konts.html), Materiāli (materiali + both lessons), Libertas (noteikumi.html, `#sikdatnes`); then `.kajene-josla`
  (© 2026 Libertas + legal link). No contacts / Par mums in the footer (comment marks where they go).
- Header/footer are duplicated static HTML in each of the 8 files: **change every page** when editing them.
## Courses
| id | Name | Price | Schedule | Image |
|---|---|---|---|---|
| `spain-a1` | Spāņu valodas pamati A1 | 280,00 EUR | 7 nedēļas, otrdienās un ceturtdienās | `assets/kursi/spanu-a1.svg` |
| `spain-a2` | Spāņu valodas pamati A2 | 280,00 EUR | Grafiks tiks precizēts | `assets/kursi/spanu-a2.svg` |
| `english-a1` | Angļu valodas pamati A1 | 280,00 EUR | 7 nedēļas, pirmdienās un trešdienās | `assets/kursi/anglu-a1.svg` |
| `english-a2` | Angļu valodas pamati A2 | 280,00 EUR | Grafiks tiks precizēts | `assets/kursi/anglu-a2.svg` |
| `spain-b1-1` | Spāņu valoda B1.1 | 420,00 EUR | Grafiks tiks precizēts | `assets/kursi/spanu-b1-1.svg` |
| `spain-b1-2` | Spāņu valoda B1.2 | 420,00 EUR | Grafiks tiks precizēts | `assets/kursi/spanu-b1-2.svg` |

Course rows live in D1 via `migrations/0001_init.sql` + `0002_more_courses.sql` (adds the 4 new courses, renames A1s).
Adding/changing a course means editing `kursi.html` (`article.course-card` with `data-course="<id>"` on its button)
**and** inserting a row in the D1 `courses` table (new migration file).

## Accounts, enrollment, admin (added 2026-11-10, restore point tag `backup-2026-11-10-before-google-auth`)
- Sign-in: Google OAuth via `/auth/google?return=…` → `/auth/google/callback`; session cookie `lsid` (30 d, token hashed in D1).
  `oauth_state` cookie during sign-in. Secret `GOOGLE_CLIENT_SECRET` set with `wrangler secret put` (not in repo).
  If the client id/secret isn't configured, `/auth/google` shows a "being set up" page.
- Admin = email in `ADMIN_EMAILS` var (`edza7112@gmail.com`).
- Enrollment status values: `pieteicies` → `uznemts` → `sacis` → `pabeidzis`, or `atteicies`; plus `paid`/`paid_at`/`notes`.
- `last_seen_at` ("last visit") is updated by `GET /api/me` (every page load, throttled to 5 min).
- API: `/api/me` (GET/PATCH), `/api/enroll`, `/api/enroll/cancel`, `/api/courses`, `/api/admin/users`,
  `/api/admin/enrollments` (GET/POST), `/api/admin/enrollments/:id` (PATCH/DELETE). Mutations reject foreign `Origin`.
- Local dev: `npx wrangler d1 migrations apply libertas-db --local`, then `npx wrangler dev`. Remote schema: `--remote`.

## script.js
- Mobile menu (≤768px): `.izvelnes-poga` toggles `aria-expanded`/label, `.site-header.izvelne-atverta` (shows the sheet) and
  `body.izvelne-atverta` (scroll lock, hides `.empanadillo`); focus goes to the first link, Tab trapped (button + links), Esc closes and
  returns focus, link click closes, closes when the viewport grows past 768px.
- Calls `/api/me`, injects sign-in button or user chip/menu (Mani kursi, Administrācija, Iziet) into `.nav-wrapper`.
- Exposes `window.LIB` (`api`, `el`, `toast`, `signInUrl`, `STATUSI`, `me`) and fires `lib:me`; used by `konts.js`/`admin.js`.
- Course buttons (`data-course`): enroll, or sign in first (pending course kept in sessionStorage). `#exploreBtn` is a plain link to `kursi.html` (no guest sign-in redirect); for guests a `.consent-note` is inserted after `.courses-section .sakums-ievads` on `kursi.html`.
- Header sign-in button = `a.btn-secondary.btn-signin` (outline; the hero CTA is the one primary per screen).
- Home hero parallax: sets `--px/--py` on `.hero-ainava` on pointer move (only `(pointer: fine)`, no reduced motion, ≥1024px).
- Home bento: sets `--mx/--my` on `.bento-flize` for the cursor spotlight; reveal-on-scroll (`.bento.gaida` → `.redzams`) via IntersectionObserver.

## style.css (by section, line numbers approx.)
- DIZAINA SISTĒMA `:root` (top, see `docs/redesign/design-system.md` §8): colours `--c-bg #F6F1E8`, `--c-surface`, `--c-sunk`, `--c-line(-strong)`,
  `--c-ink #24211E`, `--c-muted`, `--c-disabled`, `--c-brand #6B1D1D` (logo/headings only), `--c-accent #B4502A` (the one CTA colour) + `-strong`/`-soft`,
  `--c-sage(-ink)`, `--c-forest(-2)`, `--c-on-forest(-muted)`, `--c-focus(-dark)`, semantic `--c-success/error/warn/info(-bg)`, scene `--scene-*`, `--c-season-glow/-snow`;
  type `--ff-display` (Lora), `--ff-body` (Source Sans 3), `--fs-display/h1/h2/h3/lead/body/sm/xs` (clamp); `--sp-1…10`, `--sp-section`, `--gutter`;
  `--r-xs/sm/md/lg/pill`; `--shadow-1/2/3/cta`; `--ease`, `--dur-1…4`.
  **Old names are aliases** (`--primary-bordo`→brand, `--bg-warm-light`→bg, `--bg-card`→surface, `--text-dark`→ink, `--border-light`→line,
  `--accent-green`→success, `--accent-gold`→season-glow, `--accent-blue`→info, `--font-heading/-body`); migrate rules to the new names over time.
  Scene tokens `--sc-*` (day; `.sc-rits` morning, `.sc-ziema` winter evening — defined before KURSU IZKĀRTOJUMS).
  Base: body 17px Source Sans, **flex column + `min-height: 100dvh`, `.site-footer` `margin-top: auto`** (sticky footer; `.container` has `width: 100%` so it doesn't shrink); `:where(h1–h4)` Lora + fluid sizes (no colour: inherit); global `:focus-visible` ink ring (forest: `--c-focus-dark`);
  global `prefers-reduced-motion` rule kills animations/transitions.
- NAVIGĀCIJA: `.site-header` (sticky paper 92% + blur, `--header-h` 76/64px), `.nav-wrapper` (flex), `.logo img` 52px, `.main-nav` uppercase 13px links,
  underline grows on hover (accent-strong), `aria-current`/`.active` = bordo underline; `.izvelnes-poga` (hidden >768px).
  ≤768px: order logo · `.auth-box` · menu button; `.main-nav` = absolute sheet under the header (60px Lora rows, bordo left marker on the current page,
  footer silhouette strip via `.main-nav::after`), shown with `.site-header.izvelne-atverta`
- POGAS: `.btn-cta` (terracotta pill, 48px, hover/active/focus/disabled), `.btn-large`, `.btn-secondary` (outlined pill), `.btn-title`, `.btn-sub`;
  `.chip` (sage; `[aria-pressed=true]` accent-soft + ✓; `.chip--limenis`) and `.lauks` (48px input, `aria-invalid`) helpers for new markup;
  shared input styles also cover `.account-form input`, `.admin-filters`, `.admin-add select`
- HERO SADAĻA: `.hero-section` (`--hero-h: clamp(600px,56vw,860px)`), `.hero-ainava`, `.hero-ainava-kadrs` (xMidYMax-slice emulation), `.hero-ainava-svg`, `.ainavas-defs`, `.ainava-slanis*` (`--d` depth), `.hero-orientieris*`, `.hero-empa`, `.hero-container`, `.hero-text`, `.hero-zime(-punkts)`, `.hero-subtitle`, `.hero-cta-box`, `.btn-hero`, `.btn-ikona`; breakpoints 1023px / 767px (+ chips 1200–1599px)
- `.sc-rits` / `.sc-ziema`, PRIEKŠROCĪBAS (`.hero-prieksrocibas`, `.prieksrocibas-saraksts`, `.prieksrociba(-ikona)`), SADAĻAS GALVA (`.sadalas-galva/-zime/-virsraksts/-ievads`, shared with `.bento-galva/-zime/-virsraksts/-ievads`), KURSU TAKA (`.kursu-taka`, `.takas`, `.taka`, `.taka-vaks`, `.taka-saturs`, `.taka-limeni`, `.taka-cena`, `.taka-info`, `.taka-poga`)
- KURSU IZKĀRTOJUMS (l.175): `.courses-section`, `.section-title`, `.courses-grid`, `.course-card`, `.course-body`,
  `.course-price`, `.course-info`, `.btn-card`
- SĀKUMLAPAS MATERIĀLI — BENTO: paper skin on the same `.bento-*`, `.stikls*`, `.tags`, `.vilni`, `.progresa-aplis`, `.lapa*` classes (only new tokens, no `--primary-bordo`; `.bento-ainava` cover; breakpoints 1024px / 767px; reduced-motion off). `.tags-punkts` is now a small bordo dot (also used by `materiali.html`). `.sakums-ievads` (intro under `.section-title`, used by `kursi.html`) sits just above it
- SATURA KARTĪTE: `.register-section`, `.register-card`, `.register-intro` (centered card, reused by `noteikumi.html`)
- JURIDISKĀ LAPA: `.legal-card`, `.legal-toc`, `.legal-table`, `.placeholder`
- MATERIĀLU LAPAS (`mat-*` prefix, before KĀJENE): see `materiali*.html` rows above; own responsive rules (900px / 640px), reduced-motion and `@media print` (print shows both flip-card sides and translations, hides UI). List page block `/* MATERIĀLU SARAKSTS (materiali.html) */` sits inside it, with its own 900px / 640px rules (filter count badges hidden on phones)
- KĀJENE: `.site-footer`, `.kajene-ainava` (height `clamp(120px,16.667vw,240px)`, `object-fit: cover`, tower kept at 76%), `.kajene-saturs`,
  `.kajene-kolonnas` (4 cols → 2 at ≤900px; ≤640px Libertas column full width, 44px link rows), `.kajene-zimols`, `.kajene-logo`, `.kajene-sauklis`,
  `.kajene-apraksts`, `.kajene-virsraksts`, `.kajene-kolonna`, `.kajene-josla`
- SNIEGS (end of file): `.snow-canvas` (fixed, `pointer-events: none`, z-index 1000)
- EMPANADILLO (end of file): `.empa`, `.empa--liels`, `.empa--mazs`, `.empanadillo` (+`.ieradies`), `.empa-poga`, `.empa-figura` (1px bob), `.empa-acis` (blink), `.empa-roka-a/-b/-miers` (`.maj` wave), `.empa-cepure` (Santa under `html.ziemassvetki`), `.empa-ballite`, `.empa-burbulis` (paper bubble + tail, `role=status`), `.empa-aizvert` (28px, 44px hit area)
- ZIEMASSVĒTKU NOFORMĒJUMS (end of file): all rules under `html.ziemassvetki` (December, home page only). Still the old look on top of the new hero (branches `z-index: 1` over the scene, gift-box frame around both CTAs, bow above them) until redesign chunk 4. Vars `--xmas-green`, `--xmas-green-dark`, `--xmas-gold`, `--xmas-red`, `--xmas-blue`. Header light string (`.site-header::before/::after`, twinkle), pine branches in hero corners with golden bells (`.zvanu-zars-k`/`-l` containers sized like the branch, bell SVG `<symbol id="zvana-forma">` in `index.html`), `.svetku-sveiciens` greeting pill above the hero `h1` (shown only under `html.svetku-dienas`), CTA box as a gift with an inline-SVG bow `span.cta-bantite` in `index.html` (loops `.cilpa-k`/`.cilpa-l` flap on hover), baubles beside `.section-title`, gold top + holly on `.course-card`, snow cap on `.kajene-saturs::before` (top of the forest band)
- RESPONSĪVAIS DIZAINS: `@media (max-width: 768px)`: `.register-card` padding (hero responsive rules live in HERO SADAĻA, mobile nav in NAVIGĀCIJA)
- LIETOTĀJA IZVĒLNE: `.auth-box`, `.btn-signin` (44px, outline `.btn-secondary`), `.user-chip` (44px, avatar-only ≤768px), `.user-menu`; `.badge-<status>` in semantic colours

## Conventions
- UI text and code comments are in Latvian. Section comments in CSS are UPPERCASE Latvian (`/* KĀJENE */`).
- Reuse the CSS variables (prefer the new `--c-*` / `--fs-*` / `--sp-*` names). Don't hard-code new colors. Bordo = brand marks/headings, terracotta = actions only.
- Images go in `assets/`. Prefer compressed `.jpg`/`.webp` (under ~200 KB).

## Known gaps / TODO
- Schedules for `spain-a2`, `english-a2`, `spain-b1-1`, `spain-b1-2` are "Grafiks tiks precizēts" (update `kursi.html` + D1).
- `noteikumi.html` has yellow `[placeholders]` (company name, reg. no., address, email, payment days, refund %, effective date).
- Google OAuth client must be created and `GOOGLE_CLIENT_ID` / secret set before sign-in works live.
- No email notifications on new enrollments; no online payment (admin marks paid manually).
- `#par-mums` (About) and `#faq` (BJU) sections missing; "Par mums" link hidden in nav (re-add on all 8 pages + footer Libertas column when content exists).
- No contact details in the footer yet (only in `noteikumi.html`).
- No favicon, meta description or Open Graph tags.
- Redesign in progress on branch `redesign/new-style`: chunk 1 (tokens, buttons, header/mobile menu, footer) and chunk 2 (home: hero scene, feature strip, course teaser, bento, traveller mascot) done. Inner pages (kursi, materials, lessons, noteikumi, konts/admin) still use the old look via aliases (chunk 3); seasonal restyle (winter-evening hero scene, flat bells/bow) is chunk 4.
- Home `section.kursu-taka` duplicates prices/schedules from `kursi.html` — update both when a course changes.
- `kursi.html` has no `#spanu` / `#anglu` anchors yet; the teaser buttons link plain `kursi.html`.
