-- Jauni kursi un vienoti nosaukumi (2026-11-10)
UPDATE courses SET name = 'Spāņu valodas pamati A1' WHERE id = 'spain-a1';
UPDATE courses SET name = 'Angļu valodas pamati A1' WHERE id = 'english-a1';

INSERT OR IGNORE INTO courses (id, name, price_eur, schedule, active) VALUES
  ('spain-a2', 'Spāņu valodas pamati A2', 280, 'Grafiks tiks precizēts', 1),
  ('english-a2', 'Angļu valodas pamati A2', 280, 'Grafiks tiks precizēts', 1),
  ('spain-b1-1', 'Spāņu valoda B1.1', 420, 'Grafiks tiks precizēts', 1),
  ('spain-b1-2', 'Spāņu valoda B1.2', 420, 'Grafiks tiks precizēts', 1);
