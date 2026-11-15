-- Klientu aptauja (aptauja.html). Atbildes kā JSON (jautājumu id no aptauja-jautajumi.js).
-- epasts nav obligāts; izloze = piekrita e-pasta izmantošanai izlozē, jaunumi = vēlas saņemt jaunumus.
CREATE TABLE IF NOT EXISTS aptaujas_atbildes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  epasts TEXT,
  izloze INTEGER NOT NULL DEFAULT 0,
  jaunumi INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER,
  atbildes TEXT NOT NULL
);
-- Viens e-pasts = viena dalība izlozē
CREATE UNIQUE INDEX IF NOT EXISTS aptaujas_atbildes_epasts ON aptaujas_atbildes(epasts) WHERE epasts IS NOT NULL;

-- Izlozes uzvarētāji (3 vietas)
CREATE TABLE IF NOT EXISTS aptaujas_izloze (
  vieta INTEGER PRIMARY KEY,
  atbildes_id INTEGER NOT NULL,
  epasts TEXT NOT NULL,
  at TEXT NOT NULL,
  dalibnieki INTEGER NOT NULL
);
