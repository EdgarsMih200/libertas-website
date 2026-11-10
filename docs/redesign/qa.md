# Redesign QA — 2026-11-10

Branch `redesign/new-style`, compared with tag `pre-redesign-backup`. Tested with headless Edge (reduced motion) through a same-origin iframe harness on a local static server. `/api/*` is not running, so pages show the guest state.

| # | Area | Result |
|---|---|---|
| 1 | Content preservation | **PASS** |
| 2 | Functionality / hooks | **PASS** |
| 3 | Accessibility | **PASS** (notes) |
| 4 | Responsive | **PASS** |
| 5 | Performance | **PASS** (unused assets still deployed → Open) |
| 6 | Consistency | **PASS** after cleanup commit `c93ce99` |
| 7 | Housekeeping | **PASS** |

## 1. Content preservation
A script parsed the old and new HTML of all 8 original pages: text nodes, `href`, `id`, `data-*`, form, input and button tags, plus `alt`, `aria-label`, `title` and `placeholder`. It counted every item that disappeared. Text that inline markup now splits across nodes still counts as present. There were 45 hits, and each one is an approved change:
- "Par mums" link + `index.html#par-mums` (8 pages): nav link commented out, as approved.
- `© 2026 Libertas. Visas tiesības aizsargātas. ·`: the text is still there. Only the trailing `·` moved into the layout.
- index: "REĢISTRĒTIES / Pievienojies mūsu valodu kopienai / KURSI / Atklāj savu nākamo piedzīvojumu" are the old hero CTA labels, replaced by the new hero copy and CTA labels. `#zvana-zelts` was the old gold bell gradient. No JS or CSS references it, and the bells are now the flat `#zvana-forma`.
- kursi: `7 nedēļas | …` became `7 nedēļas · …` (the `|` → `·` change).
- Lessons: "← Visi materiāli", "▶ Klausīties visu dialogu", "🖨️ Drukāt" and "💬" now use SVG icons and keep the same text. The intro "Spied 🔊" now uses an inline svg with `aria-label`. materiali: cover emoji ⛄🎄 removed (UI-chrome emoji → icons).
- konts/admin "Ielādē…" became "*Momentito…* Ielādējam tavus kursus." / "*Un momento…* Ielādē." (loading state).
- All prices, schedules, course `data-course` ids, `data-es/en`, `data-atbilde`, `data-valoda`, forms and anchors are present.

## 2. Functionality
- A script checked every `querySelector/All`, `closest`, `matches` and `getElementById` selector in all 8 JS files against the pages that load each file. All of them exist. The only items not in static HTML (`.mat-filtrs`, `.empa-*`) are created by the same JS.
- `node --check` passes for all 8 site JS files and `worker/index.js`. `worker/` is unchanged since the backup.
- `wrangler.jsonc` parses. The only change is `"not_found_handling": "404-page"`. Wrangler is not installed, so `wrangler dev` was skipped.
- JS flow diff: the only behaviour change is the approved removal of the `#exploreBtn` guest redirect. API calls and sessionStorage handling are unchanged.

## 3. Accessibility
- **Token contrast (WCAG 2.1):** ink/bg 14.2, muted/bg 6.5 (sunk 5.9), brand/bg 10.3, white on CTA 5.1 (hover 6.9), accent-strong link 6.2, sage-ink/sage 6.9, footer text 11.2 / muted 7.0, semantic success 5.4 / error 5.9 / warn 5.8 / info 6.2, line-strong UI 3.4, focus ring ink 14.2 / dark ring on forest 8.2. All pass.
- **Text over the illustrations:** measured on rendered pixels with the text made transparent, using the 5th-percentile ratio across glyph boxes.
  - Day hero: h1 9.4, subtitle 12.8, pill 8.5.
  - Winter hero (`?sveiciens=1`) at 1440/1024/768/390: h1 7.4–8.9, subtitle 5.5–8.4, pill 7.6, greeting 5.5.
  - Inner strips, day and winter, on kursi, materiali, lesson, noteikumi, konts and 404 at 1440/390: all ≥ 4.5. Breadcrumb 6.2, lesson intro 6.0.
  - The only pixels below 4.5 are single static snow dots in the winter scene, under 0.4 % of the glyph area.
- **Focus:** a global `:focus-visible` 2px ring is defined, with a dark variant in the footer and the winter hero. The 2 `outline:none` rules each have a replacement (`.uzd-lauks:focus-visible`, `.mat-karte:has(:focus-visible)`).
- **Keyboard** (tested with scripted events):
  - Mobile menu: opens, focus goes to the first link, Tab/Shift+Tab wrap, Esc closes and returns focus, scroll lock is released, rows are 60px.
  - Mascot button: labelled, Enter opens the bubble, Esc closes it.
  - Flip cards: `<button>` with `aria-pressed` toggling.
  - Filters: `aria-pressed` and filtering work.
  - No visible control has `tabindex=-1`.
- **Names:** logo link has `aria-label`, all images have alt (`""` for decorative), and the hero, strip, footer scenes and bells are `aria-hidden`. No unlabelled visible svg and no empty links or buttons on any page.
- **Headings:** one h1 per page and no skipped levels on all 9 pages. `lang="lv"` on all.
- **Reduced motion:** a global rule removes animation and transition. With `?sveiciens=1&sniegs=1` under reduced motion there are 0 running animations and no snow canvas. Parallax, bento reveal, mascot and snow JS check `prefers-reduced-motion`.

## 4. Responsive
- Checked all 9 pages at 1440, 1024, 768, 390 and 360: `scrollWidth == clientWidth` everywhere, and no unclipped element overflows.
- Touch targets ≥44px: menu button, menu rows (60), header sign-in, all CTAs (48) and the mascot.
  - Under 44px but acceptable: logo link 93×40 on phones (above the 24px AA minimum), desktop footer links 36px tall (44px rows ≤640px), and filters 40px on fine pointers (44px under `pointer: coarse`).
- Screenshots at 360/768/1024 show the scenes recomposing: phone scene band under the text, strips cropped to the lighthouse, course covers 12:5.

## 5. Performance
- Uncompressed weight per page (HTML + CSS + JS + local images/SVG, before gzip; Google Fonts not counted): about 250–306 KB.
  - Largest files: `style.css` 114 KB, `libertas.png` 32 KB, `kajene-sniegs.svg` 24 KB, `empanadillo.js` 20 KB.
- Fonts: `preconnect` ×2 and `display=swap` on all pages.
- Layout shift (CLS): 0.004–0.08 on public pages, coming from font swap and auth-box injection. konts at 390 is 0.11, because the loading card is replaced and the sticky footer moves (local run, API missing). All `<img>` have width and height, and scenes use `aspect-ratio`.
- Deployed but unreferenced (not in `.assetsignore`): `assets/anglu_a1_saturs.png` 2.75 MB, `assets/english-a1.jpg` 124 KB, `assets/spain-a1.png` 98 KB. Not deleted → Open.

## 6. Consistency
- No `#6B1D1D` outside tokens (the only other use is the mascot sprite palette). No `#D4A537`. No Georgia. No hard-coded `font-family`. No inline colours in HTML.
- Hard-coded hex values left: 2 paper tints in the bento `.lapa--2/--3` illustration and 2 inside `@media print`. These are acceptable.
- **Fixed in `c93ce99`:** removed the dead `.btn-large/.btn-title/.btn-sub` (old hero buttons) and migrated the last 2 `var(--text-dark)` uses to `--c-ink`. The old alias tokens stay defined for safety.

## 7. Housekeeping
- `context.md` is accurate after the POGAS line update. `docs/`, `context.md`, `CLAUDE.md`, `worker` and `migrations` are in `.assetsignore`.
- Secret scan: no keys or secrets. `GOOGLE_CLIENT_SECRET` is only read from env, and no `.env` or `.dev.vars` is tracked.

## Open (need client decision)
1. Delete the unused deployed images (`anglu_a1_saturs.png` 2.75 MB, `english-a1.jpg`, `spain-a1.png`), or add them to `.assetsignore`.
2. On phones (≤390) the mascot's first-visit greeting bubble covers part of the first course card CTA on kursi.html for up to 9 s (once per session, closable). Options: keep it, delay it, or greet only on the home page.
3. Optional: reserve height for the konts loading card to remove the small footer shift (CLS 0.11 on phones).
4. Known gaps carried over from context.md: favicon, meta description/OG, contacts, Par mums/BJU content, noteikumi placeholders.
