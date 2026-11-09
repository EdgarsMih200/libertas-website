-- Sākotnējā shēma: lietotāji, sesijas, kursi, pieteikumi
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  phone TEXT,
  created_at TEXT,
  last_login_at TEXT,
  last_seen_at TEXT,
  login_count INTEGER DEFAULT 0,
  terms_accepted_at TEXT
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT,
  expires_at TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  name TEXT,
  price_eur REAL,
  schedule TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id),
  status TEXT NOT NULL DEFAULT 'pieteicies',
  paid INTEGER DEFAULT 0,
  paid_at TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(user_id, course_id)
);

INSERT INTO courses (id, name, price_eur, schedule, active) VALUES
  ('spain-a1', 'Spāņu valodas pamati (A1)', 280, '7 nedēļas, otrdienās un ceturtdienās', 1),
  ('english-a1', 'Angļu valodas pamati (A1)', 280, '7 nedēļas, pirmdienās un trešdienās', 1);
