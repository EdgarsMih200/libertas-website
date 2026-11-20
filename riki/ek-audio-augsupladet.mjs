// E-kursi: ierakstītās izrunas (riki/ek-audio.py) augšupielāde D1 tabulā ek_audio (migrations/0015_ek_audio.sql).
// Lietošana: node riki/ek-audio-augsupladet.mjs <kurss> [--remote | --local] [--viss]
//   Augšupielādē tikai jaunās atslēgas (--viss = visas no jauna) un dzēš tās, kuru vairs nav audio/saraksts.json.
//   mp3 dala gabalos ≤ 45 KB (hex SQL literālis < 100 KB D1 vaicājuma limita); SQL faili ≤ ~4 MB.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [kurss, ...opc] = process.argv.slice(2);
if (!kurss) { console.error('Lietošana: node riki/ek-audio-augsupladet.mjs <kurss> [--remote|--local] [--viss]'); process.exit(1); }
const kur = opc.includes('--remote') ? '--remote' : '--local';
const mape = path.join('e-kursi-saturs', kurss, 'audio');
const saraksts = JSON.parse(fs.readFileSync(path.join(mape, 'saraksts.json'), 'utf8'));
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const wr = (args, json) => execFileSync('npx', ['--no-install', 'wrangler', 'd1', 'execute', 'libertas-db', kur, ...args, ...(json ? ['--json'] : ['-y'])],
  { encoding: 'utf8', stdio: json ? ['ignore', 'pipe', 'inherit'] : 'inherit', shell: process.platform === 'win32' });

let ir = new Set();
if (!opc.includes('--viss')) {
  const izv = JSON.parse(wr(['--command', `"SELECT DISTINCT atslega FROM ek_audio WHERE kurss = ${q(kurss)}"`], true)); // pēdiņas: Windows čaula
  ir = new Set((izv[0]?.results || []).map((r) => r.atslega));
}
const atslegas = Object.keys(saraksts).filter((k) => fs.existsSync(path.join(mape, k + '.mp3')));
const jaunas = atslegas.filter((k) => !ir.has(k));
const lieki = [...ir].filter((k) => !saraksts[k]);
console.log(`${atslegas.length} ieraksti: jauni ${jaunas.length}, jau augšā ${atslegas.length - jaunas.length}, dzēšami ${lieki.length}`);

const faili = [];
let buf = [], izm = 0;
const flush = () => { if (!buf.length) return; const f = path.join(os.tmpdir(), `ek-audio-${kurss}-${faili.length}-${Date.now()}.sql`); fs.writeFileSync(f, buf.join('\n')); faili.push(f); buf = []; izm = 0; };
const add = (s) => { if (izm + s.length > 4e6) flush(); buf.push(s); izm += s.length; };
if (opc.includes('--viss')) add(`DELETE FROM ek_audio WHERE kurss = ${q(kurss)};`);
if (lieki.length) add(`DELETE FROM ek_audio WHERE kurss = ${q(kurss)} AND atslega IN (${lieki.map(q).join(',')});`);
const GAB = 45000;
for (const k of jaunas) {
  const b = fs.readFileSync(path.join(mape, k + '.mp3'));
  add(`DELETE FROM ek_audio WHERE kurss = ${q(kurss)} AND atslega = ${q(k)};`);
  for (let i = 0, g = 0; i < b.length; i += GAB, g++)
    add(`INSERT INTO ek_audio (kurss, atslega, gabals, dati) VALUES (${q(kurss)}, ${q(k)}, ${g}, X'${b.subarray(i, i + GAB).toString('hex')}');`);
}
flush();
try {
  faili.forEach((f, i) => { console.log(`→ ${i + 1}/${faili.length}`); wr(['--file', f]); });
  console.log(`✓ ${kurss}: izruna augšupielādēta (${kur}).`);
} finally { faili.forEach((f) => fs.rmSync(f, { force: true })); }
