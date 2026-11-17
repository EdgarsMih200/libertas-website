-- Grupu kursu mājasdarbi: students raksta un iesniedz kursa telpā, pasniedzējs novērtē un komentē.
-- statuss: melnraksts → iesniegts → novertets | jalabo (atgriezts labošanai; students var iesniegt vēlreiz)
CREATE TABLE gk_majasdarbi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  nr INTEGER NOT NULL,
  teksts TEXT NOT NULL DEFAULT '',
  parbaudes TEXT,          -- JSON {id: [izpildīts 0/1, vērtība]} iesniegšanas brīdī
  statuss TEXT NOT NULL DEFAULT 'melnraksts',
  reizes INTEGER DEFAULT 0, -- cik reizes iesniegts
  vertejums TEXT,
  komentars TEXT,
  iesniegts_at TEXT,
  novertets_at TEXT,
  atjaunots_at TEXT,
  UNIQUE(user_id, course_id, nr)
);
CREATE INDEX idx_gk_majasdarbi_kurss ON gk_majasdarbi(course_id, statuss);
