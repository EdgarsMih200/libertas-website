// E-kursi · 7. solis: satura augšupielāde D1 (0 tokenu).
// Lietošana: node riki/ek-augsupladet.mjs <kurss> [--remote | --local] [--piespiest]
//   1) palaiž ek-parbaudit (kļūdas aptur, ja nav --piespiest);
//   2) JSON → SQL (gabalos ≤ 90 KB, D1 limits 100 KB uz vaicājumu) → wrangler d1 execute;
//   3) ja kursa rindas vēl nav — pievieno courses (veids 'ekurss', neaktīvs, noklusējuma iestatījumi).
// Kursu ieslēdz un cenu maina īpašnieks: admin.html → E-kursi.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [kurss, ...opc] = process.argv.slice(2);
if (!kurss) { console.error('Lietošana: node riki/ek-augsupladet.mjs <kurss> [--remote|--local] [--piespiest]'); process.exit(1); }
const kur = opc.includes('--remote') ? '--remote' : '--local';
const sakne = path.join('e-kursi-saturs', kurss);

const p = spawnSync(process.execPath, ['riki/ek-parbaudit.mjs', kurss], { stdio: 'inherit' });
if (p.status !== 0 && !opc.includes('--piespiest')) { console.error('Pārbaudē ir kļūdas — augšupielāde atcelta.'); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const versija = new Date().toISOString();
const faili = ['plans', 'kanons', 'eksamens', 'resursi', ...fs.readdirSync(sakne).filter((f) => /^nodarbiba-\d+\.json$/.test(f)).map((f) => f.slice(0, -5))];
const sql = [`DELETE FROM ek_saturs WHERE kurss = ${q(kurss)};`];
for (const f of faili) {
  const fp = path.join(sakne, f + '.json');
  if (!fs.existsSync(fp)) { console.log(`– ${f}.json nav, izlaižu`); continue; }
  const json = JSON.stringify(JSON.parse(fs.readFileSync(fp, 'utf8'))); // saspiests
  const GAB = 90000;
  for (let i = 0, g = 0; i < json.length; i += GAB, g++)
    sql.push(`INSERT INTO ek_saturs (kurss, fails, gabals, json, versija) VALUES (${q(kurss)}, ${q(f)}, ${g}, ${q(json.slice(i, i + GAB))}, ${q(versija)});`);
  console.log(`✓ ${f} (${Math.round(json.length / 1024)} KB)`);
}
const plans = JSON.parse(fs.readFileSync(path.join(sakne, 'plans.json'), 'utf8'));
sql.push(`INSERT OR IGNORE INTO courses (id, name, price_eur, schedule, active, veids, ek_dienas, ek_meginajumi, ek_pauze_h, ek_papildu_cena)
  VALUES (${q(kurss)}, ${q(plans.nosaukums)}, 140, 'Pašmācība · 3 mēnešu piekļuve', 0, 'ekurss', 90, 3, 24, 35);`);
sql.push(`UPDATE courses SET name = ${q(plans.nosaukums)} WHERE id = ${q(kurss)};`);

const tmp = path.join(os.tmpdir(), `ek-${kurss}-${Date.now()}.sql`);
fs.writeFileSync(tmp, sql.join('\n'));
try {
  execFileSync('npx', ['--no-install', 'wrangler', 'd1', 'execute', 'libertas-db', kur, '--file', tmp, '-y'], { stdio: 'inherit', shell: process.platform === 'win32' });
  console.log(`✓ ${kurss} augšupielādēts (${kur}). Versija ${versija}.`);
} finally { fs.rmSync(tmp, { force: true }); }
