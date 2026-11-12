-- Adventes kalendārs: atvērtās durvis (viena rinda = lietotājs atvēra dienu), balvas izloze, atlaides kods pieteikumā
CREATE TABLE IF NOT EXISTS advente_atverts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gads INTEGER NOT NULL,
  diena INTEGER NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (user_id, gads, diena)
);

CREATE TABLE IF NOT EXISTS advente_izloze (
  gads INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  dalibnieki INTEGER NOT NULL,
  at TEXT NOT NULL
);

ALTER TABLE enrollments ADD COLUMN atlaides_kods TEXT;
ALTER TABLE enrollments ADD COLUMN atlaide_proc INTEGER;
