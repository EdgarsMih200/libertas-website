-- Rēķini (admin izveido, nosūta klientam, atzīmē apmaksu pa maksājumiem) + iestatījumi (rekvizīti)
-- rindas = JSON [{a: apraksts, d: 'YYYY-MM-DD' termiņš, s: summa EUR, p: 'YYYY-MM-DD' apmaksāts | null}]
CREATE TABLE IF NOT EXISTS rekini (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nr TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
  m_vards TEXT,
  m_talrunis TEXT,
  m_epasts TEXT,
  kurss TEXT,
  kurss_info TEXT,
  datums TEXT NOT NULL,
  rindas TEXT NOT NULL DEFAULT '[]',
  piezime TEXT,
  summa REAL NOT NULL DEFAULT 0,
  apmaksats REAL NOT NULL DEFAULT 0,
  apmaksats_at TEXT,
  nosutits_at TEXT,
  nosutits_uz TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rekini_enr ON rekini(enrollment_id);

-- Atslēga/vērtība (JSON). 'rekviziti' = {vards, talrunis, epasts, adrese, banka, konts, piezime, pirmais_nr}
-- Rekvizīti NAV repozitorijā (tas ir publisks): tos ievada administrācijā «Rēķini → Rekvizīti».
CREATE TABLE IF NOT EXISTS iestatijumi (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
