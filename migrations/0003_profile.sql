-- Profils: lietotāja izvēlēts vārds (Google vārds paliek users.name) un paša augšupielādēts foto
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN avatar_at TEXT;

-- Foto atsevišķā tabulā, lai users.* vaicājumi nevilktu līdzi attēlu (base64 JPEG, ~256×256)
CREATE TABLE avatars (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT
);
