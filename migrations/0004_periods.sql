-- Grupas periods pieteikumam (2026-11-11): sākuma/beigu datums (YYYY-MM-DD) un nodarbību dienas ('pr-tr' / 'ot-ce').
-- NULL = "nākamā grupa, datumi tiks precizēti" (kursi bez grafika, vecie pieteikumi). Periodus aprēķina grafiks.js.
ALTER TABLE enrollments ADD COLUMN period_start TEXT;
ALTER TABLE enrollments ADD COLUMN period_end TEXT;
ALTER TABLE enrollments ADD COLUMN period_days TEXT;

UPDATE courses SET schedule = '7 nedēļas (14 nodarbības) · 18:00–21:00' WHERE id IN ('spain-a1', 'spain-a2', 'spain-b1-1', 'spain-b1-2');
UPDATE courses SET schedule = 'Grafiks tiks precizēts' WHERE id IN ('english-a1', 'english-a2');
