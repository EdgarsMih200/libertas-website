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
| `index.html` | Home: header/nav, hero (with seasonal `p.svetku-sveiciens`) with CTA box, course grid (`#kursi`), footer |
| `noteikumi.html` | Terms of service + GDPR privacy policy + cookies (LV law). Reuses `.register-card` + `.legal-card`. Company details are `span.placeholder` (yellow) until filled in |
| `materiali.html` | "Noderīgi materiāli" (in menu): hero band `.mat-hero` + card grid `.mat-rezgis` of `article.mat-karte` (cover `.mat-karte-vaks` + theme class e.g. `.mat-vaks--ziemassvetki`, `.mat-limenis`, `.mat-valoda`, emoji, `.mat-karte-meta` chips; whole card clickable via `.mat-karte-saite::after`) + dashed `.mat-karte--drizuma` placeholder. Cards carry `data-valoda` / `data-valoda-nosaukums`; language filter chips (`.mat-filtri`) appear automatically once 2+ languages exist. **Adding a material** = new page `materiali-<valoda>-<tēma>.html` (copy the Christmas one) + copy one card |
| `materiali-spanu-ziemassvetki.html` | Material **Spāņu A1 — Ziemassvētki**: hero with stats, sticky side TOC `.mat-saturs` (active link highlighted), sections `.mat-sadala` with `.mat-nr`: flip vocab cards (`.vardu-rezgis` > `.vards` > `button.vards-karte`), phrases list, grammar tiles (`.artikulu-rezgis`, `.likumu-rezgis`, `.locijumi`), chat dialogue (`.cats` > `.replika--a/--p`, translation toggle, "listen to whole dialogue"), timeline `.laika-josla`, self-checking exercises (`.uzdevums-bloks`, inputs `.uzd-lauks[data-atbilde]`, `|` = alternative answers; check ignores case/accents/punctuation), CTA `.mat-cta` |
| `materiali.js` | Shared by material pages: 🔊 buttons on every `[data-es]` (Web Speech es-ES; placed in `[data-runa-vieta]` if present), flip cards, dialogue playback/translation, exercise checking, TOC highlighting, card filters |
| `script.js` | Shared JS (see below) |
| `snow.js` | Home page only: falling, rotating six-armed snowflakes canvas (`.snow-canvas`) in Nov/Dec/Jan/Feb; skipped with `prefers-reduced-motion`; force with `?sniegs=1`. In Nov/Dec (or with `?sniegs=1`) it also adds `html.ziemassvetki` (turns on the Christmas styling) |
| `zvani.js` | Home page only (Nov/Dec): golden bells `.zvans` on the hero pine branches swing (`.zvana`) and ring on hover/tap. Sound synthesized with Web Audio (pitch in `data-nots`); browsers allow sound only after the visitor's first click/tap/key |
| `empanadillo.js` | Home page: mascot **Empanadillo** (pixel-art empanada: letter-grid sprites `KERMENIS`, `ACIS`, `ROKA_A/B`, `CEPURE` + palette `KRASAS`, turned into SVG rects in JS; 88px, 64px on mobile) fixed bottom-right. Slides in, greets once per session (sessionStorage `empaSveiciens`) in a speech bubble; click = first his filling (`PILDIJUMI`: per signed-in user by hash of `LIB.me.user.id`, for guests random and kept in localStorage `empaPildijums`), then the other phrases (`frazes`), hover = waves (two arm frames `.empa-roka-a/-b`). Wears a Santa hat under `html.ziemassvetki`, but on 5 December (owner's birthday) a pixel party hat `BALLITES_CEPURE` instead (test with `?ballite=1`). Load after `snow.js` |
| `style.css` | Shared styles (see sections below) |
| `assets/` | `libertas.png` (logo), `ziemassvetki/` (Christmas decorations: `zars.svg` pine branch, `ilekss.svg` holly, `bumba.svg` bauble), `spain-a1.png`, `english-a1.jpg` (course images) |
| `konts.html` + `konts.js` | "Mani kursi": own profile (phone editable), own enrollments, cancel while `pieteicies` |
| `admin.html` + `admin.js` | Admin panel (users: data, last login/visit; enrollments: status, paid, notes, add/delete). noindex |
| `worker/index.js` | Cloudflare Worker: Google OAuth, sessions, JSON API (runs first for `/api/*`, `/auth/*`) |
| `migrations/` | D1 schema (`0001_init.sql`: users, sessions, courses, enrollments) |
| `wrangler.jsonc` | Cloudflare config: worker `main`, assets, D1 `DB` (`libertas-db`), vars `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID` |
| `.assetsignore` | Files NOT published to the live site (add any new non-site files here) |
| `context.md`, `CLAUDE.md` | Dev notes for Claude; listed in `.assetsignore` |

## Shared page skeleton (all pages)
`header.site-header > .container.nav-wrapper` → `a.logo` (img), `nav.main-nav` (Kursi, Noderīgi materiāli, Par mums); the logo links to `index.html` (no separate "Sākums" item),
(no register button in the header). Then `<section>`s, then `footer > .container > p` (© 2026 Libertas).
Footer also links to `noteikumi.html`.
Header/footer are duplicated in each HTML file: **change every page** when editing them.

Nav anchor `#par-mums` does **not exist yet** (planned section). BJU (`#faq`) was removed from the menu.

## Courses
| id | Name | Price | Schedule | Image |
|---|---|---|---|---|
| `spain-a1` | Spāņu valodas pamati (A1) | 280,00 EUR | 7 nedēļas, otrdienās un ceturtdienās | `assets/spain-a1.png` |
| `english-a1` | Angļu valodas pamati (A1) | 280,00 EUR | 7 nedēļas, pirmdienās un trešdienās | `assets/english-a1.jpg` |

Adding/changing a course means editing `index.html` (`article.course-card` with `data-course="<id>"` on its button)
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
- Calls `/api/me`, injects sign-in button or user chip/menu (Mani kursi, Administrācija, Iziet) into `.nav-wrapper`.
- Exposes `window.LIB` (`api`, `el`, `toast`, `signInUrl`, `STATUSI`, `me`) and fires `lib:me`; used by `konts.js`/`admin.js`.
- Course buttons (`data-course`): enroll, or sign in first (pending course kept in sessionStorage).

## style.css (by section, line numbers approx.)
- `:root` variables (l.2): `--primary-bordo #6B1D1D`, `--primary-bordo-hover #521515`, `--bg-warm-light #F9F5F0`,
  `--bg-card #FFF`, `--text-dark #2C2C2C`, `--border-light #E8E2D9`, `--accent-green #2F5D3A`, `--accent-gold #D4A537`, `--accent-blue #1F5FA8`, `--font-heading Georgia`, `--font-body` system stack
- NAVIGĀCIJA (l.37): `.site-header` (sticky), `.nav-wrapper`, `.logo img` (100px high), `.main-nav a`
- POGAS (l.79): `.btn-cta` (bordo), `.btn-large`, `.btn-secondary` (beige), `.btn-title`, `.btn-sub`
- HERO SADAĻA (l.136): `.hero-section`, `.hero-container`, `.hero-text h1`, `.hero-subtitle`, `.hero-cta-box`
- KURSU IZKĀRTOJUMS (l.175): `.courses-section`, `.section-title`, `.courses-grid`, `.course-card`, `.course-body`,
  `.course-price`, `.course-info`, `.btn-card`
- SATURA KARTĪTE (l.239): `.register-section`, `.register-card`, `.register-intro` (centered card, reused by `noteikumi.html`)
- JURIDISKĀ LAPA: `.legal-card`, `.legal-toc`, `.legal-table`, `.placeholder`
- MATERIĀLU LAPAS (`mat-*` prefix, before KĀJENE): see `materiali*.html` rows above; own responsive rules (900px / 640px), reduced-motion and `@media print` (print shows both flip-card sides and translations, hides UI)
- KĀJENE: `footer`
- SNIEGS (end of file): `.snow-canvas` (fixed, `pointer-events: none`, z-index 1000)
- EMPANADILLO (end of file): `.empanadillo`, `.empa-poga`, `.empa-burbulis`, `.empa-aizvert`, `.empa-roka`, `.empa-acis`, `.empa-cepure`
- ZIEMASSVĒTKU NOFORMĒJUMS (end of file): all rules under `html.ziemassvetki` (Nov/Dec, home page only). Vars `--xmas-green`, `--xmas-green-dark`, `--xmas-gold`, `--xmas-red`, `--xmas-blue`. Header light string (`.site-header::before/::after`, twinkle), pine branches in hero corners with golden bells (`.zvanu-zars-k`/`-l` containers sized like the branch, bell SVG `<symbol id="zvana-forma">` in `index.html`), `.svetku-sveiciens` greeting pill above the hero `h1` (hidden outside season), CTA box as a gift with an inline-SVG bow `span.cta-bantite` in `index.html` (loops `.cilpa-k`/`.cilpa-l` flap on hover), baubles beside `.section-title`, gold top + holly on `.course-card`, snow-capped `footer`
- RESPONSĪVAIS DIZAINS: `@media (max-width: 768px)`: hero stacks, `.main-nav` hidden (no mobile menu yet)

## Conventions
- UI text and code comments are in Latvian. Section comments in CSS are UPPERCASE Latvian (`/* KĀJENE */`).
- Reuse the CSS variables. Don't hard-code new colors.
- Images go in `assets/`. Prefer compressed `.jpg`/`.webp` (under ~200 KB).

## Known gaps / TODO
- `noteikumi.html` has yellow `[placeholders]` (company name, reg. no., address, email, payment days, refund %, effective date).
- Google OAuth client must be created and `GOOGLE_CLIENT_ID` / secret set before sign-in works live.
- No email notifications on new enrollments; no online payment (admin marks paid manually).
- `#par-mums` (About) and `#faq` (BJU) sections missing.
- No mobile navigation (nav is hidden under 768px).
- No favicon, meta description or Open Graph tags.
