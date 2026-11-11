-- E-kursi (pašmācības kursi): kursa iestatījumi, piekļuve, saturs, progress, mēģinājumi, sertifikāti

-- Kursa veids un e-kursa iestatījumi (maina īpašnieks admin → E-kursi)
ALTER TABLE courses ADD COLUMN veids TEXT DEFAULT 'grupa';          -- 'grupa' | 'ekurss'
ALTER TABLE courses ADD COLUMN ek_dienas INTEGER;                  -- piekļuves ilgums dienās no apmaksas
ALTER TABLE courses ADD COLUMN ek_meginajumi INTEGER;              -- eksāmena mēģinājumi (un cik pievieno pēc papildu apmaksas)
ALTER TABLE courses ADD COLUMN ek_pauze_h INTEGER;                 -- pauze starp eksāmena mēģinājumiem
ALTER TABLE courses ADD COLUMN ek_papildu_cena REAL;               -- konsultācijas / papildu mēģinājumu cena

-- Dalībnieka piekļuve (pieteikums = pirkums)
ALTER TABLE enrollments ADD COLUMN ek_lidz TEXT;                   -- piekļuve līdz (ISO), uzliek pie apmaksas atzīmes
ALTER TABLE enrollments ADD COLUMN ek_eks_limits INTEGER;          -- atļautie eksāmena mēģinājumi (NULL = kursa noklusējums)
ALTER TABLE enrollments ADD COLUMN ek_pieprasijums TEXT;           -- 'konsultacija' | 'meginajumi' (gaida apmaksu)
ALTER TABLE enrollments ADD COLUMN ek_pieprasijums_at TEXT;

-- Kursa saturs (JSON no e-kursi-saturs/, augšupielādē riki/ek-augsupladet.mjs; gabalos pa ≤ 90 KB)
CREATE TABLE ek_saturs (
  kurss TEXT NOT NULL,
  fails TEXT NOT NULL,          -- plans | kanons | nodarbiba-01 | eksamens | resursi
  gabals INTEGER NOT NULL DEFAULT 0,
  json TEXT NOT NULL,
  versija TEXT,
  PRIMARY KEY (kurss, fails, gabals)
);

CREATE TABLE ek_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kurss TEXT NOT NULL,
  nr INTEGER NOT NULL,
  dalas TEXT DEFAULT '[]',      -- pabeigto daļu id JSON masīvs
  tests_labakais INTEGER,
  nokartots_at TEXT,
  pasvertejums TEXT,            -- JSON {indekss: 1..3}
  piezime TEXT,
  atjaunots TEXT,
  PRIMARY KEY (user_id, kurss, nr)
);

CREATE TABLE ek_meginajumi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kurss TEXT NOT NULL,
  veids TEXT NOT NULL,          -- 'tests' | 'eksamens'
  nr INTEGER,                   -- nodarbība (testam)
  jautajumi TEXT NOT NULL,      -- izsniegto uzdevumu id + sajaukšana (JSON)
  atbildes TEXT,
  rezultats INTEGER,
  sakts_at TEXT,
  iesniegts_at TEXT
);
CREATE INDEX idx_ek_meg ON ek_meginajumi(user_id, kurss, veids);

CREATE TABLE ek_sertifikati (
  kods TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kurss TEXT NOT NULL,
  kursa_nosaukums TEXT NOT NULL,
  vards TEXT NOT NULL,
  datums TEXT NOT NULL,
  rezultats INTEGER,
  stundas INTEGER,
  nodarbibas INTEGER,
  created_at TEXT,
  UNIQUE (user_id, kurss)
);

-- Pilotkurss (neaktīvs, līdz saturs augšupielādēts un īpašnieks to ieslēdz)
INSERT INTO courses (id, name, price_eur, schedule, active, veids, ek_dienas, ek_meginajumi, ek_pauze_h, ek_papildu_cena)
VALUES ('spanu-a1-ps', 'Spāņu valoda A1 — pirmie soļi', 140, 'Pašmācība · 3 mēnešu piekļuve', 0, 'ekurss', 90, 3, 24, 35);
