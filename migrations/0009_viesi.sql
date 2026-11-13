-- Nereģistrētu apmeklētāju (viesu) statistika bez sīkdatnēm.
-- kas = SHA-256(dienas sāls + IP + pārlūks), sāls mainās katru dienu, tāpēc vienu cilvēku nevar izsekot starp dienām.
CREATE TABLE IF NOT EXISTS viesu_apmeklejumi (
  diena TEXT NOT NULL,        -- YYYY-MM-DD (UTC)
  kas TEXT NOT NULL,
  skatijumi INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (diena, kas)
);
