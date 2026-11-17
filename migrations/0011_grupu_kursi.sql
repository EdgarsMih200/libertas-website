-- Grupu kursu telpas (kā Moodle): Google Meet saite, nodarbības ar PDF/HTML prezentācijām, tīmekļa saturu,
-- uzdevumiem un pasniedzēja materiāliem. Faili un nodarbību saturs glabājas KV (GK_FAILI), šeit tikai metadati.

-- Loma: 'students' (noklusējums) vai 'pasniedzejs' (var rediģēt kursu telpas). Administrators vienmēr ir arī pasniedzējs.
ALTER TABLE users ADD COLUMN loma TEXT DEFAULT 'students';

CREATE TABLE gk_kursi (
  course_id TEXT PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  meet_url TEXT,
  ievads TEXT,
  izveidots_at TEXT,
  atjaunots_at TEXT
);

CREATE TABLE gk_nodarbibas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL REFERENCES gk_kursi(course_id) ON DELETE CASCADE,
  nr INTEGER NOT NULL,
  nosaukums TEXT NOT NULL,
  apraksts TEXT,
  temas TEXT,            -- JSON masīvs
  datums TEXT,           -- neobligāts YYYY-MM-DD (citādi no grupas grafika)
  redzama INTEGER DEFAULT 1,
  ir_saturs INTEGER DEFAULT 0,   -- vai KV ir tīmekļa saturs saturs/<kurss>/<nr>
  uzdevumi INTEGER DEFAULT 0,    -- uzdevumu skaits saturā
  atjaunots_at TEXT,
  UNIQUE(course_id, nr)
);

-- tips: 'pdf' / 'html' = nodarbības prezentācija (lejupielāde), 'fails' / 'saite' = pasniedzēja papildmateriāls
CREATE TABLE gk_materiali (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL REFERENCES gk_kursi(course_id) ON DELETE CASCADE,
  nr INTEGER NOT NULL,
  tips TEXT NOT NULL,
  nosaukums TEXT NOT NULL,
  url TEXT,
  kv_atslega TEXT,
  mime TEXT,
  izmers INTEGER,
  pievienoja INTEGER REFERENCES users(id) ON DELETE SET NULL,
  at TEXT
);
CREATE INDEX idx_gk_materiali ON gk_materiali(course_id, nr);

-- Izpildītie uzdevumi (pasniedzējs redz grupas progresu)
CREATE TABLE gk_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  nr INTEGER NOT NULL,
  uzdevums TEXT NOT NULL,
  rezultats INTEGER,
  at TEXT,
  PRIMARY KEY (user_id, course_id, nr, uzdevums)
);
