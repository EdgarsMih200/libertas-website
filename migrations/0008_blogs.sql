-- Blogs: patīk (viens ieraksts = lietotājs vai viesis atzīmēja rakstu) un komentāri (tikai reģistrētiem)
CREATE TABLE IF NOT EXISTS blogs_patik (
  raksts TEXT NOT NULL,
  kas TEXT NOT NULL,          -- 'u:<user_id>' vai 'v:<viesa uuid no localStorage>'
  at TEXT NOT NULL,
  PRIMARY KEY (raksts, kas)
);

CREATE TABLE IF NOT EXISTS blogs_komentari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raksts TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teksts TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS blogs_komentari_raksts ON blogs_komentari(raksts, at);
