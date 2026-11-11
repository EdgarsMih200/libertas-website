// E-kursi · šifrēta rezerves kopija (repo ir publisks — saturs tajā nonāk tikai šifrēts).
// Izveidot:  node riki/ek-rezerve.mjs <kurss>
// Atjaunot:  node riki/ek-rezerve.mjs <kurss> --atjaunot     → e-kursi-saturs/<kurss>-atjaunots/
// Parole: jautā terminālī (nav redzama) vai env EK_PAROLE. Parole netiek saglabāta nekur projektā.
// Kopijā: viss no e-kursi-saturs/<kurss>/, izņemot avoti/ (lielie PDF paliek pie īpašnieka).
// Formāts: "LIBEK1" + salt(16) + iv(12) + tag(16) + AES-256-GCM(gzip(JSON {ceļš: base64})); atslēga = scrypt(parole, salt).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';

const [kurss, ...opc] = process.argv.slice(2);
if (!kurss) { console.error('Lietošana: node riki/ek-rezerve.mjs <kurss> [--atjaunot]'); process.exit(1); }
const atjaunot = opc.includes('--atjaunot');
const sakne = path.join('e-kursi-saturs', kurss);
const kopija = path.join('e-kursi-rezerve', `${kurss}.enc`);
const MAGIJA = Buffer.from('LIBEK1');

function jautat(teksts) {
  return new Promise((ok) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(teksts)) process.stdout.write(s); };
    rl.question(teksts, (a) => { rl.close(); process.stdout.write('\n'); ok(a); });
  });
}
async function parole(divreiz) {
  if (process.env.EK_PAROLE) return process.env.EK_PAROLE;
  const p = await jautat('Parole: ');
  if (p.length < 12) { console.error('Parolei vajag ≥ 12 simbolus.'); process.exit(1); }
  if (divreiz && (await jautat('Atkārto paroli: ')) !== p) { console.error('Paroles nesakrīt.'); process.exit(1); }
  return p;
}
const atslega = (p, salt) => crypto.scryptSync(p, salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 << 20 });

function failuSaraksts(dir, rel = '') {
  return fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) return r === 'avoti' ? [] : failuSaraksts(dir, r);
    return [r];
  });
}

if (!atjaunot) {
  if (!fs.existsSync(sakne)) { console.error(`Nav mapes ${sakne}`); process.exit(1); }
  const faili = failuSaraksts(sakne);
  const saturs = Object.fromEntries(faili.map((f) => [f, fs.readFileSync(path.join(sakne, f)).toString('base64')]));
  const p = await parole(!fs.existsSync(kopija));
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', atslega(p, salt), iv);
  const sifrs = Buffer.concat([c.update(zlib.gzipSync(JSON.stringify(saturs))), c.final()]);
  fs.mkdirSync(path.dirname(kopija), { recursive: true });
  fs.writeFileSync(kopija, Buffer.concat([MAGIJA, salt, iv, c.getAuthTag(), sifrs]));
  console.log(`✓ ${faili.length} faili → ${kopija} (${Math.round(fs.statSync(kopija).size / 1024)} KB). Iesūti to ar git commit + push.`);
} else {
  const b = fs.readFileSync(kopija);
  if (!b.subarray(0, 6).equals(MAGIJA)) { console.error('Nav e-kursu rezerves fails.'); process.exit(1); }
  const salt = b.subarray(6, 22), iv = b.subarray(22, 34), tag = b.subarray(34, 50);
  const d = crypto.createDecipheriv('aes-256-gcm', atslega(await parole(false), salt), iv);
  d.setAuthTag(tag);
  let json;
  try { json = JSON.parse(zlib.gunzipSync(Buffer.concat([d.update(b.subarray(50)), d.final()]))); }
  catch { console.error('Nepareiza parole vai bojāts fails.'); process.exit(1); }
  const merkis = `${sakne}-atjaunots`;
  for (const [f, b64] of Object.entries(json)) {
    const p = path.join(merkis, f);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, Buffer.from(b64, 'base64'));
  }
  console.log(`✓ ${Object.keys(json).length} faili atjaunoti → ${merkis}. Pārbaudi un pārdēvē par ${sakne}.`);
}
