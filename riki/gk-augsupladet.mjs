// Augšupielādē grupu kursa nodarbības kursa telpā: saturs (JSON) + PDF/HTML prezentācijas → KV GK_FAILI,
// nodarbību un materiālu ieraksti → D1. Pirms tam palaid: node riki/gk-sagatavot.mjs <kurss>
// Lietošana: node riki/gk-augsupladet.mjs <kurss> [nr ...] --remote|--local [--prefikss "SVB1.1_"]
// Pasniedzēja ievadītās lietas (Meet saite, redzamība, datumi, papildmateriāli) netiek aiztiktas.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const arg = process.argv.slice(2);
const kurss = arg[0];
const vieta = arg.includes('--local') ? '--local' : arg.includes('--remote') ? '--remote' : null;
const pi = arg.indexOf('--prefikss');
const prefikss = pi > -1 ? arg[pi + 1] : '';
const nri = arg.slice(1).filter((a, i, a2) => /^\d+$/.test(a) && a2[i - 1] !== '--prefikss').map(Number);
if (!kurss || !vieta) { console.error('Lietošana: node riki/gk-augsupladet.mjs <kurss> [nr ...] --remote|--local [--prefikss "SVB1.1_"]'); process.exit(1); }

const DIR = path.join('grupu-kursi-saturs', kurss);
const AVOTI = path.join(DIR, 'avoti');
const tmp = path.join(DIR, '.augsupielade.sql');
const wr = (...a) => execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['wrangler', ...a], { stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' }).toString();
const kv = (key, file) => wr('kv', 'key', 'put', key, '--path', file, '--binding', 'GK_FAILI', vieta);
const q = (s) => (s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const now = new Date().toISOString();

const visi = fs.readdirSync(DIR).map((f) => f.match(/^(\d{2})\.json$/)).filter(Boolean).map((m) => Number(m[1]));
const kuri = nri.length ? nri : visi.sort((a, b) => a - b);
const sql = [`INSERT OR IGNORE INTO gk_kursi (course_id, izveidots_at, atjaunots_at) VALUES (${q(kurss)}, ${q(now)}, ${q(now)});`];

for (const nr of kuri) {
  const nn = String(nr).padStart(2, '0');
  const fSat = path.join(DIR, nn + '.json');
  const S = JSON.parse(fs.readFileSync(fSat, 'utf8'));
  process.stdout.write(`${nn} saturs… `);
  kv(`saturs/${kurss}/${nr}`, fSat);
  sql.push(`INSERT INTO gk_nodarbibas (course_id, nr, nosaukums, apraksts, temas, redzama, ir_saturs, uzdevumi, atjaunots_at)
    VALUES (${q(kurss)}, ${nr}, ${q(S.nosaukums)}, NULL, ${q(JSON.stringify(S.temas || []))}, 1, 1, ${(S.uzdevumi || []).length}, ${q(now)})
    ON CONFLICT(course_id, nr) DO UPDATE SET nosaukums = excluded.nosaukums, temas = excluded.temas, ir_saturs = 1, uzdevumi = excluded.uzdevumi, atjaunots_at = excluded.atjaunots_at;`);
  for (const [tips, mime] of [['pdf', 'application/pdf'], ['html', 'text/html; charset=utf-8']]) {
    const f = path.join(AVOTI, `${nn}.${tips}`);
    if (!fs.existsSync(f)) continue;
    const key = `fails/${kurss}/${nr}/prezentacija-${tips}`;
    process.stdout.write(`${tips}… `);
    kv(key, f);
    sql.push(`DELETE FROM gk_materiali WHERE course_id = ${q(kurss)} AND nr = ${nr} AND tips = '${tips}';`);
    sql.push(`INSERT INTO gk_materiali (course_id, nr, tips, nosaukums, kv_atslega, mime, izmers, at) VALUES (${q(kurss)}, ${nr}, '${tips}', ${q(`${prefikss}${nr}. nodarbība`)}, ${q(key)}, ${q(mime)}, ${fs.statSync(f).size}, ${q(now)});`);
  }
  console.log('✓');
}
fs.writeFileSync(tmp, sql.join('\n'));
wr('d1', 'execute', 'libertas-db', vieta, '--file', tmp, '--yes');
fs.unlinkSync(tmp);
console.log(`Gatavs: ${kuri.length} nodarbības (${vieta.slice(2)}).`);
