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
| `index.html` | Home: header/nav, hero with CTA box, course grid (`#kursi`), footer |
| `script.js` | Shared JS (see below) |
| `style.css` | Shared styles (see sections below) |
| `assets/` | `libertas.png` (logo), `spain-a1.png`, `english-a1.jpg` (course images) |
| `wrangler.jsonc` | Cloudflare deploy config |
| `.assetsignore` | Files NOT published to the live site (add any new non-site files here) |
| `context.md`, `CLAUDE.md` | Dev notes for Claude; listed in `.assetsignore` |

## Shared page skeleton (both pages)
`header.site-header > .container.nav-wrapper` → `a.logo` (img), `nav.main-nav` (Kursi, Par mums); the logo links to `index.html` (no separate "Sākums" item),
(no register button in the header). Then `<section>`s, then `footer > .container > p` (© 2026 Libertas).
Header/footer are duplicated in each HTML file: **change both pages** when editing them.

Nav anchor `#par-mums` does **not exist yet** (planned section). BJU (`#faq`) was removed from the menu.

## Courses
| id | Name | Price | Schedule | Image |
|---|---|---|---|---|
| `spain-a1` | Spāņu valodas pamati (A1) | 280,00 EUR | 7 nedēļas, otrdienās un ceturtdienās | `assets/spain-a1.png` |
| `english-a1` | Angļu valodas pamati (A1) | 280,00 EUR | 7 nedēļas, pirmdienās un trešdienās | `assets/english-a1.jpg` |

Adding/changing a course means editing `index.html`: `article.course-card` in `.courses-grid`.
Registration was removed on 2026-11-10 (restore point: tag `backup-2026-11-10-remove-registration`).
The hero "REĢISTRĒTIES" and course "Pieteikties kursam" buttons now have `href="#"` and show a "coming soon" alert.

## script.js
- Any `a.btn-cta` whose href is `#`/empty shows a "coming soon" alert instead of navigating.

## style.css (by section, line numbers approx.)
- `:root` variables (l.2): `--primary-bordo #6B1D1D`, `--primary-bordo-hover #521515`, `--bg-warm-light #F9F5F0`,
  `--bg-card #FFF`, `--text-dark #2C2C2C`, `--border-light #E8E2D9`, `--font-heading Georgia`, `--font-body` system stack
- NAVIGĀCIJA (l.37): `.site-header` (sticky), `.nav-wrapper`, `.logo img` (100px high), `.main-nav a`
- POGAS (l.79): `.btn-cta` (bordo), `.btn-large`, `.btn-secondary` (beige), `.btn-title`, `.btn-sub`
- HERO SADAĻA (l.136): `.hero-section`, `.hero-container`, `.hero-text h1`, `.hero-subtitle`, `.hero-cta-box`
- KURSU IZKĀRTOJUMS (l.175): `.courses-section`, `.section-title`, `.courses-grid`, `.course-card`, `.course-body`,
  `.course-price`, `.course-info`, `.btn-card`
- SATURA KARTĪTE (l.239): `.register-section`, `.register-card`, `.register-intro` (centered card)
- KĀJENE: `footer`
- RESPONSĪVAIS DIZAINS: `@media (max-width: 768px)`: hero stacks, `.main-nav` hidden (no mobile menu yet)

## Conventions
- UI text and code comments are in Latvian. Section comments in CSS are UPPERCASE Latvian (`/* KĀJENE */`).
- Reuse the CSS variables. Don't hard-code new colors.
- Images go in `assets/`. Prefer compressed `.jpg`/`.webp` (under ~200 KB).

## Known gaps / TODO
- No sign-up/registration page (buttons show a "coming soon" alert).
- `#par-mums` (About) and `#faq` (BJU) sections missing.
- No mobile navigation (nav is hidden under 768px).
- No favicon, meta description or Open Graph tags.
