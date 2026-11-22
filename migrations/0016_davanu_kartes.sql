-- Dāvanu kartes (Tirdziņš). Pircējs pasūta → automātiski izveidots rēķins (rekini.id = rekins_id) →
-- admins rēķinā atzīmē apmaksu → karte kļūst aktīva (derīga 12 mēnešus), pircējs saņem e-pastu ar saiti uz karti.
-- tips 'summa' = naudas vērtība (atlikums samazinās, var izmantot vairākiem kursiem);
-- tips 'kurss' = konkrēts kurss (sedz visu kursa cenu, vienreiz).
CREATE TABLE IF NOT EXISTS davanu_kartes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kods TEXT NOT NULL UNIQUE,              -- DK-XXXX-XXXX (rāda tikai pēc apmaksas)
  token TEXT NOT NULL UNIQUE,             -- 48 hex: davanu-karte.html?k=
  tips TEXT NOT NULL,                     -- 'summa' | 'kurss'
  summa REAL NOT NULL,                    -- vērtība EUR (kursa kartei — cena pirkuma brīdī)
  atlikums REAL NOT NULL,                 -- summas kartei: atlikusī vērtība
  course_id TEXT REFERENCES courses(id),  -- kursa kartei
  dizains TEXT NOT NULL DEFAULT 'ziema',  -- 'ziema' | 'spanu' | 'anglu'
  kam TEXT,                               -- saņēmēja vārds (uz kartes)
  no_ka TEXT,                              -- dāvinātāja vārds (uz kartes)
  apsveikums TEXT,                        -- ≤ 300 zīmes
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- pircējs
  pirceja_epasts TEXT,
  statuss TEXT NOT NULL DEFAULT 'gaida',  -- 'gaida' | 'aktiva' | 'izmantota' | 'atcelta'
  rekins_id INTEGER REFERENCES rekini(id) ON DELETE SET NULL,
  derigs_lidz TEXT,                       -- YYYY-MM-DD (no apmaksas + 12 mēneši)
  aktivizeta_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS davanu_kartes_rekins ON davanu_kartes(rekins_id);
CREATE INDEX IF NOT EXISTS davanu_kartes_user ON davanu_kartes(user_id);

-- Pieteikumā izmantotā dāvanu karte un tās segtā summa (atceļot pieteikumu, summa atgriežas kartē)
ALTER TABLE enrollments ADD COLUMN davanu_karte_id INTEGER REFERENCES davanu_kartes(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN davanu_summa REAL;
