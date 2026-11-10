# Libertas site audit (pre-redesign)

Date: 2026-11-10. Scope: static HTML/CSS/JS in repo root. `context.md` is the source of truth for structure; this file adds a visual/UX view for the redesign.
`docs/` is already listed in `.assetsignore`, so it won't be published.

## 1. Sitemap and page types

**Public**
- `index.html` (home): header → hero (seasonal greeting pill, h1, subtitle, CTA box with gift bow) → `#materiali` bento section (editorial header, lesson hub with main tile + 2 tool tiles, "print" tile, "all materials" CTA tile) → footer. Extras: snow canvas, bells, Empanadillo mascot.
- `kursi.html` (courses): header → `#kursi` h1 + intro → 6 course cards → footer. Uses `body.mat-lapa`.
- `materiali.html` (materials list): header → editorial header (pill, h1 with italic `em`, intro) → toolbar (language filter, count) → card grid (2 lessons + "coming soon") → footer.
- `materiali-spanu-ziemassvetki.html` / `materiali-anglu-ziemassvetki.html` (lesson pages): header → colored hero (back link, level/lang tags, h1, text, stats, "Sākt nodarbību" + print) → sticky side TOC + `main` with 6 numbered sections (Vārdi, Frāzes, Gramatika, Dialogs, Tradīcijas, Uzdevumi) → course CTA aside → footer.
- `noteikumi.html` (legal): header → one long `.register-card.legal-card` (h1, TOC, 4 h2 parts with h3 sub-clauses, yellow placeholders) → footer.

**Account / admin (noindex)**
- `konts.html` ("Mani kursi"): header → `#konts` card, rendered by `konts.js` (profile, phone edit, enrollments, cancel).
- `admin.html`: header → `#admin`, rendered by `admin.js` (tabs: users / enrollments, filters, search, table, add/delete, status/paid/notes).

**Server**: `/auth/google*`, `/api/*` (Cloudflare Worker + D1). No `#par-mums`, no FAQ, no contact page.

## 2. Content inventory

**Shared header** (copied into all 8 HTML files): logo `assets/libertas.png` (72px high) → `index.html`; nav pills "Kursi", "Noderīgi materiāli", "Par mums" (`#par-mums` on home, `index.html#par-mums` elsewhere: a dead anchor). `script.js` injects `.auth-box`: "Ienākt ar Google" or user chip + menu (Mani kursi / Administrācija / Iziet).
**Shared footer**: "© 2026 Libertas. Visas tiesības aizsargātas. · Noteikumi un privātuma politika" (bordo band).

**Home**
- Seasonal pill: "Priecīgus Ziemassvētkus!" (only 22–26 Dec).
- H1: **"Runā, saproti, ceļo, audz!"**
- Subtitle: **"Libertas palīdz atvērt durvis uz pasauli caur valodu spēku."**
- CTA 1 (`#exploreBtn`, bordo): **"REĢISTRĒTIES"** / "Pievienojies mūsu valodu kopienai" → `kursi.html` (guests are sent to Google sign-in with return `/kursi.html`; a consent note "Ienākot ar Google, jūs piekrītat noteikumiem un privātuma politikai." is appended).
- CTA 2 (beige): **"KURSI"** / "Atklāj savu nākamo piedzīvojumu" → `kursi.html`.
- Bento: pill "Bezmaksas · mācies savā tempā", h2 "Noderīgi *materiāli*", intro "Interaktīvas nodarbības valodu apguvei mājās — ar izrunu, uzdevumiem un tūlītēju pašpārbaudi." Hub label "Jaunākā nodarbība". Tiles: "Ziemassvētki spāņu valodā" (→ lesson), "Klausies un atkārto" (→ `#vardi`), "Pārbaudi sevi" (→ `#uzdevumi`), "Drukājami materiāli" (→ `materiali.html`), "Visi materiāli" (→ `materiali.html`).
- Note: the home page has no course section, no About, no testimonials, no contact info.

**Kursi**: h1 "Kursu piedāvājums", intro "Mazas grupas, dzīvas nodarbības un praktiska valoda jau no pirmās dienas." 6 cards (SVG cover, h3 name, price, schedule, button "Pieteikties kursam" with `data-course`). Enrollment uses `/api/enroll` with busy/done states and a toast.

**Materiāli**: pill "Bezmaksas · Drukājami · Ar izrunu", h1 "Noderīgi *materiāli*", cards with "Sākt nodarbību" footers. The filter is JS-built (shown once 2+ languages exist).

**Lesson**: flip vocab cards, phrases, grammar tiles, chat dialogue (translation toggle `#radit-tulkojumu`, play all `#klausities-dialogu`), timeline, self-check exercises, print button (`window.print()`, print stylesheet), CTA "Gribi runāt spāniski droši?" → "Apskatīt kursu" (`kursi.html`).

**Integrations**
- Google OAuth (Worker), session cookie, JSON API (`window.LIB.api`).
- Web Speech API (es-ES / en-GB) on `[data-es]` / `[data-en]` (lesson pages).
- `snow.js`: canvas snowflakes Nov–Feb (home only), adds `html.ziemassvetki` (December) / `html.svetku-dienas` (22–26 Dec).
- `zvani.js`: Web Audio bells on hero pine branches (December).
- `empanadillo.js`: mascot (home only); sessionStorage/localStorage.

## 3. Current visual language

- **Palette (`:root`)**: bordo `#6B1D1D` (hover `#521515`), warm paper bg `#F9F5F0`, card `#FFFFFF`, text `#2C2C2C`, border `#E8E2D9`, green `#2F5D3A`, gold `#D4A537`, blue `#1F5FA8`.
- **Hard-coded colors that show up a lot**: beige buttons `#EFE8DF`/`#E2D7C8`, nav hover `#F3EAE0`, greys `#666/#888/#555`, bordo-tinted radial blobs on `body` (fixed background), shadows tinted `rgba(44,20,20)` / `rgba(107,29,29)`. Xmas set: `--xmas-green #2E6B45`, `--xmas-green-dark #1F5A38`, `--xmas-red #B3261E`, `--xmas-blue #2F5D9E`, plus bell gold gradient `#9C7418→#F6D879→#8A6512` and bow reds `#B3261E/#8E1C17/#C8352B`. Course SVGs bring their own warm oranges (`#C8401F`, `#E8A23A`, `#F2B233`), reds (`#C8202A`) and blues. In total about 90 `rgba()` and 41 `color-mix()` uses.
- **Fonts**: headings Georgia (system serif, 24 uses); body is the system sans stack. No webfonts. Italic serif `em` accents in bento/materials headers.
- **Radius**: mixed. Pills 999px (20 uses), 50%, 8 / 10 / 12 / 16 / 22 / 28px. Buttons 12px, cards 16px, bento 22–28px, mascot bubble 4px.
- **Shadows**: soft layered (`--b-ena`, `--m-ena`), lift + bordo glow on hover, hard pixel shadow on the mascot bubble.
- **Illustration styles in use (6 coexist)**:
  1. Flat geometric SVG course covers (600×320, gradients, tile patterns, suns, speech bubbles, Georgia text).
  2. Semi-realistic Christmas decor (pine branch `zars.svg` 16 KB, holly, bauble, gradient gold bells, red ribbon bow, header light string, snow-capped footer).
  3. Pixel-art mascot (crisp-edge SVG rects).
  4. Glassmorphism "UI mock" bento tiles (frosted panels, sound waves, progress ring, paper stack, dark grid-lined tile).
  5. Emoji as illustration (🎄 ⛄ 💬 🔊 🖨️) on material cards and lessons.
  6. Canvas snowflakes.
- The result: the bento/materials pages feel like a modern SaaS look; hero/kursi feel like a classic warm template; December adds a third, festive layer.

## 4. Mascot: Empanadillo (must survive the redesign)

- **What he is**: a small pixel-art Argentine/Spanish *empanada*, Libertas's mascot. He appears on `index.html` only, fixed bottom-right (`right:20px; bottom:16px`, z-index 1001). Button width 88px (64px under 768px). Built in JS from letter-grid sprites into SVG `<rect>`s (`viewBox="0 -6 39 31"`, `shape-rendering="crispEdges"`).
- **Silhouette and proportions**: the body grid is 34 px wide × 22 px tall (rows 3–24). It is a wide half-moon/dome: a rounded top arc and a broad flat bottom, about 1.5:1 width to height. The top-left arc has a diagonal light/dark stripe band (H/L/D), which reads as the braided crimp (*repulgue*). The lower third is darker (baked underside). Two stubby feet stick out under the body (`F` rows 22–24, two 5–6 px blocks). The whole body has a 1 px dark-brown outline.
- **Palette (`KRASAS`)**: outline `O #4A2810`; dough tones from dark to light `F #8A5020` (feet), `D #A8652A`, `S #B8742E` (bake spots and eyebrows), `M #D9963F`, `L #F0BE62` (main face), `H #FBE3A0` (highlight); eyes `W #FFFFFF` + `K #2A1A10`; cheeks `P #E8796B`; mouth `R #7A1A14` + tongue `T #E0605A`. Hats: `X #B3261E`, `B #8E1C17`, `G #D6D6D6`, `Y #F2C230`, `N #E85A8C`, `U #3B6FB6`.
- **Face**: two large round eyes (4×5 px each, white with 2×2 dark pupils and a light catch-light pixel), set wide apart (`ACIS` grid 14×5 at x10,y11). Short tan eyebrows (`S`) sit above them. Pink blush cheeks on both sides at mouth level. A small open, smiling mouth (dark red with a pink tongue) sits slightly right of center. He blinks every 4.5 s (scaleY).
- **Arms**: one arm only, on the right side, raised up and out (as if waving or saying hi). Two frames: `ROKA_A` (7 rows, compact) and `ROKA_B` (longer, more extended). They alternate with `steps(1)` for a pixel-style wave (4 × 0.36 s).
- **Hats**: Santa hat (`CEPURE`, red cone flopping to the right, white fur brim with grey shading, white pom-pom) shown only under `html.ziemassvetki` (December). On 5 Dec (the owner's birthday, `?ballite=1`) he wears a party cone (`BALLITES_CEPURE`) instead: yellow/pink/blue diagonal stripes with a yellow pom-pom.
- **Behaviors**: he slides up from below 0.8 s after load (springy overshoot). He greets once per session (`sessionStorage.empaSveiciens`) 0.7 s later in a speech bubble. Idle bob of 3 px (1.6 s, stepped). Hover or greeting = wave. First click = his "filling" (`PILDIJUMI`, 8 options: carne, pollo, jamón y queso, espinaca, humita, atún, champiñones, dulce de leche). The filling is stable per user (hash of `LIB.me.user.id`) or random per guest (`localStorage.empaPildijums`). Later clicks cycle the phrases. The bubble auto-hides after 9 s and has a × close button. Respects `prefers-reduced-motion`.
- **Speech bubble style**: white, 3px solid bordo border, 4px radius, hard offset shadow `4px 4px 0 rgba(107,29,29,.25)` (pixel/retro look), max 240px, `role="status" aria-live="polite"`.
- **Example phrases**:
  - "¡Hola! Es esmu **Empanadillo**. Laipni lūdzam Libertas!" (December: "¡Feliz Navidad! …")
  - "Vai zināji? Spāniski *empanar* nozīmē „ietīt mīklā”. Tāds esmu es!"
  - "Gribi zināt, kas man iekšā? Tev es esmu **empanada de carne**: sulīga liellopu gaļa ar sīpoliem un olīvām!"
  - "¡Hasta luego! Uz tikšanos nodarbībās!"
- **Stale copy**: "Apskati mūsu kursus zemāk: spāņu un angļu valoda A1!" No courses appear below on the home page anymore, and A2/B1 courses now exist.
- **Personality**: friendly, bilingual (Spanish greeting + Latvian), food pun, a bit cheeky. A warm golden-brown character on a bordo-accented UI.

## 5. Strengths / weaknesses / UX

**Keep**
- A clear, memorable tagline and a warm paper + bordo + serif identity.
- High-quality interactive lessons (speech, flip cards, self-check, print CSS).
- The mascot: a unique, charming character with per-user personalization.
- Reduced-motion handling on most animations; `aria-live` on mascot and counts; `lang="es"` spans for foreign text.
- No build step, light JS, SVG covers about 2 KB each.

**Weaknesses**
- Six illustration languages compete with each other (see §3), and the home hero is visually thin: no image, just text + CTA box on a blob background. `.hero-overlay` is an empty div with no CSS.
- The home page doesn't explain the school: no About, teachers, method, prices, contact or courses preview.
- Two hero CTAs both go to `kursi.html`. "REĢISTRĒTIES" really means "sign in with Google", which is confusing.
- The radius/shadow scale is inconsistent; many hard-coded hex values despite the "use variables" rule.

**UX / accessibility issues (checked in code)**
1. **No mobile navigation**: `.main-nav { display:none }` under 768px with no replacement. Phones can only reach pages via logo/hero/bento links.
2. **Dead "Par mums" link** on every page (`#par-mums` doesn't exist).
3. **Missing focus styles**: `:focus-visible` is defined only for nav links, bento tiles, material filters/cards, lesson buttons and the mascot. None for `.btn-cta`, `.btn-secondary`, course buttons, `.user-chip`, user menu items, footer link or the hero CTAs.
4. **Heading order**: `kursi.html` goes h1 → h3 (course names), no h2. No `<main>` landmark on index/kursi/materiali/konts/admin/noteikumi (only the lesson pages have one).
5. **Contrast**: `#888` text on white/light (lesson TOC label `.mat-saturs-virsraksts`, chat speaker `.replika-burbulis strong`, close ×) is about 3.5:1 at 12px, which fails AA. Gold `#D4A537` used as a text color (style.css l.1304) is low on light backgrounds. `.btn-sub` is 12px at 0.9 opacity.
6. **Alt text**: the logo link has `aria-label` plus img alt "LIBERTAS Logo" (redundant, so "Logo" is announced). Course covers are OK ("Spāņu valoda A1"). Emoji covers are `aria-hidden`, which is good.
7. The mascot sits fixed bottom-right over content on phones (64px + bubble 200px). It may cover footer links/CTAs.
8. Admin/account content is fully JS-rendered ("Ielādē…" until `/api/me`), with no no-JS fallback (acceptable for noindex).
9. No favicon, meta description or Open Graph tags on any page.

**Performance**
- Unused published assets: `assets/anglu_a1_saturs.png` (**2.8 MB**), `spain-a1.png` (100 KB), `english-a1.jpg` (127 KB). They aren't referenced but aren't in `.assetsignore`, so they're deployed.
- `style.css` is 3,601 lines and one file for all pages (includes admin, lessons, Xmas). OK uncached, but a lot of dead weight per page.
- The fixed `background-attachment` with radial gradients and many `backdrop-filter` glass panels can be janky on low-end mobile. The canvas snow runs four months a year.
- System fonts mean no font loading cost (a new webfont serif will add some).
- Logo PNG is 500×216, 32 KB, shown at 72px high. Fine, but an SVG would be sharper.

## 6. Must-stay list

**Brand**
- Logo `assets/libertas.png` (500×216 RGBA PNG, wordmark "LIBERTAS" per alt text). Colors not verified here; check the image before choosing the palette.
- Bordo `#6B1D1D` is currently the primary color everywhere: h1/section titles, nav active pill, all `.btn-cta` buttons, footer band, mascot bubble border and focus ring, bento hover glow, material card theme `--k1`.
- Tagline "Runā, saproti, ceļo, audz!", Georgia-style serif headings, warm paper background, the mascot.

**JS hooks (don't rename or remove)**
- `script.js`: `.nav-wrapper` (auth box injected here), `a.btn-cta[data-course]` + states `.btn-busy` / `.btn-done`, `#exploreBtn`, `.consent-note`, `.toast` / `.toast-error` / `.toast-hide`, `.auth-box`, `.btn-signin`, `.user-chip`, `.user-avatar(-ph)`, `.user-name`, `.user-menu` (uses `hidden`), `.bento` + `.gaida` / `.redzams`, `.bento-flize` + CSS vars `--mx/--my`; `window.LIB`, event `lib:me`; sessionStorage `pendingCourse`.
- `materiali.js`: `[data-es]`, `[data-en]`, `[data-runa-vieta]`, `.runat-poga`, `body[data-uzslava]`, `.vards-karte` (`.apgriezta`), `.cats`, `.replika`, `.replika--p`, `.runa`, `#radit-tulkojumu`, `#klausities-dialogu`, `.rada-tulkojumu`, `.uzdevums-bloks`, `.uzd-lauks[data-atbilde]` (`.pareizi` / `.nepareizi`), `.uzd-parbaudit`, `.uzd-rezultats`, `.visi-pareizi`, `.mat-saturs a` (`.aktivs`), `.mat-sadala[id]`, `.mat-karte[data-valoda][data-valoda-nosaukums]`, `.mat-filtri`, `.mat-filtrs[aria-pressed]`, `.mat-filtri-slids` (`--x/--w`), `.mat-filtrs-sk`, `.mat-skaits`, `.paradas`, `.bez-anim`.
- `konts.js`: `#konts`. Generated classes: `account-profile`, `account-form`, `enroll-row`, `enroll-right`, `badge`, `badge-<status>`, `badge-paid`, `btn-small`, `btn-danger`, `btn-link`, `muted`, `register-intro`, `user-avatar-lg`.
- `admin.js`: `#admin`, `input[type=search]`. Generated: `admin-tabs`, `admin-tab`, `admin-filters`, `admin-summary`, `summary-card`, `summary-chips`, `admin-table`, `table-wrap`, `admin-add`, `badge*`.
- `empanadillo.js`: `.empanadillo` (+ `.ieradies`, `.maj`), `.empa-poga`, `.empa-burbulis` (uses `hidden`), `.empa-teksts`, `.empa-aizvert`, `.empa-roka(-a/-b)`, `.empa-acis`, `.empa-cepure`, `.empa-ballite`; reads `html.ziemassvetki`, `window.LIB.me`. Must load after `snow.js` (it reads the class at load).
- `snow.js`: creates `.snow-canvas`; sets `html.ziemassvetki`, `html.svetku-dienas`; URL flags `?sniegs=1`, `?ziemassvetki=1`, `?sveiciens=1`.
- `zvani.js`: `.zvans[data-nots]` (+ `.zvana`), `#zvana-forma` symbol, `#zvana-zelts` gradient, needs `html.ziemassvetki`.
- CSS-only state hooks the markup relies on: `aria-current="page"` in the nav, `.svetku-sveiciens`, `.cta-bantite` / `.cilpa-k` / `.cilpa-l`, `.zvanu-zars-k/-l`, `--b-kav` reveal delays, `--p` on `.progresa-aplis`, `--k1/--k2` card themes.
- Backend contract: `data-course` values must match D1 course ids (`spain-a1`, `spain-a2`, `english-a1`, `english-a2`, `spain-b1-1`, `spain-b1-2`).

## 7. Redesign risks (target: layered illustrated landscapes, muted atmospheric palette, one warm accent, elegant serif)

- **Bordo vs. the single warm accent**: bordo is both the brand color and the CTA color. If the new accent is amber/terracotta, there are two warm reds/oranges competing. Decide whether bordo *becomes* the accent (desaturated landscape plus bordo CTAs) or is kept only for the logo/footer. Gold `#D4A537` (hover rails, Xmas) would become a third warm color.
- **Pixel-art mascot vs. flat-vector landscapes**: crisp 1-px sprites will look foreign inside soft, layered vector scenes. Options: keep him deliberately as a "pixel sticker" UI layer (bubble already retro), or redraw him in vector while keeping silhouette, crimp stripes, eyes, blush, one raised arm, hats and palette. Either way his golden-brown palette must still read against muted backgrounds, and the bordo bubble ties him to the brand.
- **Seasonal December decor**: the Christmas layer (light string, branches, bells, bow, baubles, holly, snowy footer, snow canvas, Santa hat) is a separate, saturated, semi-realistic style hard-wired to hero/header/footer/course-card selectors. A new hero landscape will break the absolute positioning of `.zvanu-zars-*` and the bow. It needs either a redesign as a "winter variant" of the landscape or removal. The live date is 10 Nov, so snow already runs and December decor activates in 3 weeks.
- **Duplicated header/footer in 8 HTML files**: any nav change (mobile menu, new links, About) must be made 8 times. There's a high risk of drift; consider a JS-injected or build-free include before restyling.
- **Glass bento / SaaS UI mocks**: the frosted panels and gradient borders on home/materials pages clash with an atmospheric illustrated style. Those pages were just redesigned (last 3 commits), so there's sunk cost and the owner may want them kept.
- **Course SVG covers**: 6 flat geometric covers with saturated flag-like colors will clash with the muted palette. They need redrawing as a matching vignette series (same `assets/kursi/*.svg` paths and 15:8 ratio keep markup intact).
- **Elegant serif webfont**: replacing Georgia affects 24 heading rules plus inline SVG `<text font-family="Georgia">` in course covers. Latvian diacritics (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž) must be supported by the chosen font (latin-ext subset).
- **Large illustrations vs. performance**: layered landscapes as PNG/JPG could repeat the 2.8 MB asset problem. Prefer SVG/WebP under about 200 KB (project convention).
- **Single 3.6k-line stylesheet** with section-scoped tokens (`--b-*`, `--m-*`, `--xmas-*`) means a global token swap won't reach hard-coded hexes. Expect manual cleanup.
