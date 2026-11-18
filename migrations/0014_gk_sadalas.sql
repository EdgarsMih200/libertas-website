-- Nodarbības sadaļu stāvoklis: JSON {"<sadaļas id>": "slepta" | "dzesta"} (nav ieraksta = redzama).
-- Sadaļu id kursa-telpa.js: s<N> (satura grupa), u-<uzdevums>, majasdarbs, materiali, saturs.
ALTER TABLE gk_nodarbibas ADD COLUMN sadalas TEXT;
