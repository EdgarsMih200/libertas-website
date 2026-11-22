-- Dāvanu kartes (Tirdziņš) — «iekāpšanas karte» uz jaunu valodu.
-- Pircējs (ar kontu vai viesis) pasūta → automātiski izveidots rēķins (rekini.id = rekins_id) →
-- admins rēķinā atzīmē apmaksu → karte kļūst aktīva (derīga 12 mēnešus) un tiek piegādāta pēc izvēles:
--   piegade 'epasts' = saņēmējam uzreiz, 'velak' = saņēmējam sutit_at laikā (cron), 'pdf' = pircējam, 'pasts' = pircējam + admins sūta aploksnē.
-- tips 'summa' = naudas vērtība (atlikums samazinās, var izmantot vairākiem kursiem);
-- tips 'kurss' = konkrēts kurss (sedz visu kursa cenu, vienreiz).
CREATE TABLE IF NOT EXISTS davanu_kartes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kods TEXT NOT NULL UNIQUE,              -- LIB-XXXX-XXXX (rāda tikai pēc apmaksas)
  token TEXT NOT NULL UNIQUE,             -- 48 hex: davanu-karte.html?k=
  tips TEXT NOT NULL,                     -- 'summa' | 'kurss'
  summa REAL NOT NULL,                    -- vērtība EUR (kursa kartei — cena pirkuma brīdī)
  atlikums REAL NOT NULL,                 -- atlikusī vērtība
  course_id TEXT REFERENCES courses(id),  -- kursa kartei
  dizains TEXT NOT NULL DEFAULT 'mezs',   -- 'mezs' | 'bordo' | 'papirs'
  kam TEXT,                               -- saņēmēja vārds (uz kartes)
  no_ka TEXT,                             -- dāvinātāja vārds (uz kartes)
  apsveikums TEXT,                        -- ziņa kartes aizmugurē, ≤ 140 zīmes
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- pircēja konts (viesim NULL)
  pirceja_vards TEXT,
  pirceja_epasts TEXT,
  piegade TEXT NOT NULL DEFAULT 'pdf',    -- 'epasts' | 'velak' | 'pdf' | 'pasts'
  sanemeja_epasts TEXT,                   -- 'epasts' / 'velak'
  sutit_at TEXT,                          -- 'velak': ISO UTC
  adrese TEXT,                            -- 'pasts': piegādes adrese
  pasta_maksa REAL NOT NULL DEFAULT 0,
  nosutita_at TEXT,                       -- kad karte piegādāta (e-pasts saņēmējam / pircējam)
  statuss TEXT NOT NULL DEFAULT 'gaida',  -- 'gaida' | 'aktiva' | 'izmantota' | 'atcelta' (planota/dalji/beigusies aprēķina)
  rekins_id INTEGER REFERENCES rekini(id) ON DELETE SET NULL,
  derigs_lidz TEXT,                       -- YYYY-MM-DD (no apmaksas + 12 mēneši)
  aktivizeta_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS davanu_kartes_rekins ON davanu_kartes(rekins_id);
CREATE INDEX IF NOT EXISTS davanu_kartes_user ON davanu_kartes(user_id);
CREATE INDEX IF NOT EXISTS davanu_kartes_sutit ON davanu_kartes(statuss, piegade, nosutita_at);

-- Pieteikumā izmantotā dāvanu karte un tās segtā summa (atceļot pieteikumu, summa atgriežas kartē)
ALTER TABLE enrollments ADD COLUMN davanu_karte_id INTEGER REFERENCES davanu_kartes(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN davanu_summa REAL;
