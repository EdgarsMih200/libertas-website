-- E-kursu ierakstītā izruna (mp3), ko ģenerē riki/ek-audio.py un augšupielādē riki/ek-audio-augsupladet.mjs.
-- Atslēga = sha1(teksts NFC)[:16] — to pašu aprēķina macibas.js runat(). Lielus failus glabā gabalos (D1 vaicājuma limits).
CREATE TABLE IF NOT EXISTS ek_audio (
  kurss TEXT NOT NULL,
  atslega TEXT NOT NULL,
  gabals INTEGER NOT NULL DEFAULT 0,
  dati BLOB NOT NULL,
  PRIMARY KEY (kurss, atslega, gabals)
);
