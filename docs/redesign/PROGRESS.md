# Redesign progress

## Done
- Step 1 audit (2026-11-10): `docs/redesign/audit.md`; client confirmed, gave full freedom.
- Step 5.5 backup done early (2026-11-10): original = `a4d5ade`, tags `pre-redesign-backup` + `backup-2026-11-10-pre-redesign` (pushed), work branch `redesign/new-style` (pushed). `main` untouched until Step 7.

## In progress
- Step 2: done, waiting for client confirmation (style board reviewed in browser)

## Decisions
- `docs/` in `.assetsignore` (not published).
- Bordo #6B1D1D stays as brand/ink; CTAs get one new warm accent; gold only seasonal.
- Christmas + 5 Dec birthday decor: redraw in new style (client request).
- Workflow: brief overrides CLAUDE.md "push each stage to main" during redesign; main only at Step 7.

## Open questions
- Hero copy in style board is NEW (subtitle, 3 feature blocks, CTA labels "Izvēlies kursu" / "Noderīgi materiāli") — needs client approval vs original "REĢISTRĒTIES" / "KURSI".
- Light logo version (SVG) needed for dark footer/evening.
- Delete unused `assets/anglu_a1_saturs.png` (2.8 MB)? (propose at Step 6)

## Rollback
- `git checkout main && git reset --hard pre-redesign-backup` (only with confirmation)
- single file: `git checkout pre-redesign-backup -- path/to/file`
