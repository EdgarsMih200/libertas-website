-- Loma konkrētajā kursā: 'students' (noklusējums) vai 'pasniedzejs'. Kursa pasniedzējs rediģē tikai šī kursa telpu
-- (users.loma = 'pasniedzejs' joprojām nozīmē pasniedzēju visos grupu kursos).
ALTER TABLE enrollments ADD COLUMN loma TEXT DEFAULT 'students';
