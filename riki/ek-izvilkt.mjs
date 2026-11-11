// E-kursi · 1. solis: teksta izvilkšana no avotiem (0 tokenu).
// Lietošana: node riki/ek-izvilkt.mjs <kurss> [--no <mape ar PDF>] [--tikai 1,2,5]
//   Avoti: e-kursi-saturs/<kurss>/avoti/ (vai --no mape). Atbalsta .pdf, .txt, .md.
//   Rezultāts: e-kursi-saturs/<kurss>/teksts/nodarbiba-NN.md + teksts/parskats.md
//   (vārdu skaits, lapas bez teksta = attēli, kurus Claude skatās tikai vajadzības gadījumā).
// Vajag pdftotext (Git for Windows: /ucrt64/bin) vai env PDFTOTEXT=<ceļš>.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const kurss = args[0];
if (!kurss || kurss.startsWith('--')) { console.error('Lietošana: node riki/ek-izvilkt.mjs <kurss> [--no <mape>] [--tikai 1,2]'); process.exit(1); }
const opc = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const sakne = path.join('e-kursi-saturs', kurss);
const avoti = opc('--no') || path.join(sakne, 'avoti');
const tikai = opc('--tikai')?.split(',').map(Number);
const izeja = path.join(sakne, 'teksts');
fs.mkdirSync(izeja, { recursive: true });

const PDFTOTEXT = process.env.PDFTOTEXT || 'pdftotext';

// Nodarbības numurs no faila nosaukuma: "SVA1_3. nodarbība.pdf" → 3, "nodarbiba-03.pdf" → 3
const numurs = (f) => {
  const m = f.match(/(\d+)\s*\.?\s*nodarb/i) || f.match(/nodarb\D*(\d+)/i) || f.match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : null;
};

const faili = fs.readdirSync(avoti)
  .filter((f) => /\.(pdf|txt|md)$/i.test(f))
  .map((f) => ({ f, nr: numurs(f) }))
  .filter((x) => x.nr && (!tikai || tikai.includes(x.nr)))
  .sort((a, b) => a.nr - b.nr);
if (!faili.length) { console.error(`Nav avotu mapē ${avoti}`); process.exit(1); }

function lapas(fails) {
  if (/\.pdf$/i.test(fails)) {
    const t = execFileSync(PDFTOTEXT, ['-enc', 'UTF-8', '-layout', fails, '-'], { maxBuffer: 64 << 20 }).toString('utf8');
    return t.split('\f');
  }
  return [fs.readFileSync(fails, 'utf8')];
}

// Saspiež: atstarpes, tukšas rindas; izmet rindas, kas atkārtojas ≥ 30 % lapu (slaidu galvenes/kājenes)
function saspiest(lpp) {
  const tiras = lpp.map((l) => l.split('\n').map((r) => r.replace(/\s{2,}/g, ' ').trim()).filter(Boolean));
  const biezums = new Map();
  for (const l of tiras) for (const r of new Set(l)) biezums.set(r, (biezums.get(r) || 0) + 1);
  const slieksnis = Math.max(3, Math.ceil(tiras.length * 0.3));
  return tiras.map((l) => l.filter((r) => (biezums.get(r) || 0) < slieksnis || r.length > 60));
}

const parskats = ['# Avotu pārskats: ' + kurss, '', '| Nod. | Fails | Lapas | Vārdi | Lapas bez teksta (attēli) |', '|---|---|---|---|---|'];
for (const { f, nr } of faili) {
  const lpp = saspiest(lapas(path.join(avoti, f)));
  const tuksas = [];
  const daļas = [];
  lpp.forEach((rindas, i) => {
    const teksts = rindas.join('\n');
    if (teksts.replace(/\s/g, '').length < 5) { if (i < lpp.length - 1 || teksts) tuksas.push(i + 1); return; }
    daļas.push(`§${i + 1}\n${teksts}`);
  });
  const nn = String(nr).padStart(2, '0');
  const saturs = `# ${nr}. nodarbība — ${f}\n\n${daļas.join('\n\n')}\n`;
  fs.writeFileSync(path.join(izeja, `nodarbiba-${nn}.md`), saturs);
  const vardi = saturs.split(/\s+/).filter(Boolean).length;
  const kluda = /�/.test(saturs) ? ' ⚠ bojāti simboli' : '';
  parskats.push(`| ${nr} | ${f} | ${lpp.length} | ${vardi}${kluda} | ${tuksas.join(', ') || '—'} |`);
  console.log(`${nr}. nodarbība: ${vardi} vārdi, ${tuksas.length} lapas bez teksta${kluda}`);
}
parskats.push('', '`§N` = lapas numurs avotā. Lapas bez teksta Claude skatās (Read ar pages, zemā izšķirtspējā) tikai tad, ja tēmai trūkst satura.');
fs.writeFileSync(path.join(izeja, 'parskats.md'), parskats.join('\n') + '\n');
console.log(`→ ${izeja}`);
