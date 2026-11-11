// E-kursi · 4. solis: kursa satura pārbaude (0 tokenu). Formāts: .claude/skills/e-kurss/shema.md
// Lietošana: node riki/ek-parbaudit.mjs <kurss> [--nodarbiba 3]
// Izvade: viena rinda katrai kļūdai "fails id: ziņa". Exit 1, ja ir kļūdas (brīdinājumi neaptur).
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const kurss = args[0];
if (!kurss) { console.error('Lietošana: node riki/ek-parbaudit.mjs <kurss> [--nodarbiba N]'); process.exit(1); }
const tikaiNr = args.includes('--nodarbiba') ? Number(args[args.indexOf('--nodarbiba') + 1]) : null;
const sakne = path.join('e-kursi-saturs', kurss);

const kludas = [], bridinajumi = [];
const kl = (f, id, z) => kludas.push(`${f} ${id}: ${z}`);
const br = (f, id, z) => bridinajumi.push(`${f} ${id}: ${z}`);

function lasit(f, obligats = true) {
  const p = path.join(sakne, f);
  if (!fs.existsSync(p)) { if (obligats) kl(f, '-', 'fails nav atrasts'); return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { kl(f, '-', 'nederīgs JSON: ' + e.message); return null; }
}

const plans = lasit('plans.json');
const kanons = lasit('kanons.json');
if (!plans || !kanons) beigas();

// ---------- plans.json ----------
for (const k of ['id', 'nosaukums', 'valoda', 'limenis', 'prasmes', 'nodarbibas', 'eksamens', 'avoti'])
  if (plans[k] == null) kl('plans.json', k, 'trūkst lauka');
const PRASMES = new Set((plans.prasmes || []).map((p) => p.id));
if (PRASMES.size < 4 || PRASMES.size > 6) br('plans.json', 'prasmes', `ieteicamas 4–6 prasmes, ir ${PRASMES.size}`);

// ---------- uzdevumu tipi ----------
const AUTO = new Set(['izvele', 'vairakas', 'ievadi', 'tuksumi', 'pari', 'seciba', 'klausies', 'kategorijas']);
const PASPARBAUDE = new Set(['rakstit', 'runat']);
const BLOKI = new Set(['teksts', 'svarigi', 'piemers', 'burti', 'zilbes', 'tabula', 'vardnica', 'attels']);
const TUKSUMS = /_{3,}/g;

function parbauditUzd(f, u, { tikaiAuto = false } = {}) {
  const id = u.id || '(bez id)';
  if (!u.id) kl(f, id, 'trūkst id');
  if (!u.teksts) kl(f, id, 'trūkst teksts (uzdevuma norāde)');
  if (!PRASMES.has(u.prasme)) kl(f, id, `prasme "${u.prasme}" nav plans.prasmes`);
  if (tikaiAuto && !AUTO.has(u.tips)) kl(f, id, `tips "${u.tips}" nav automātiski pārbaudāms (testā/eksāmenā drīkst tikai ${[...AUTO].join(', ')})`);
  if (!AUTO.has(u.tips) && !PASPARBAUDE.has(u.tips)) return kl(f, id, `nezināms tips "${u.tips}"`);
  if (AUTO.has(u.tips) && !u.skaidrojums) kl(f, id, 'trūkst skaidrojums (atgriezeniskā saite)');
  const varianti = () => {
    if (!Array.isArray(u.varianti) || u.varianti.length < 2) kl(f, id, 'vajag ≥ 2 varianti');
    else if (new Set(u.varianti).size !== u.varianti.length) kl(f, id, 'varianti atkārtojas');
  };
  switch (u.tips) {
    case 'izvele': varianti(); if (!Number.isInteger(u.atbilde) || u.atbilde < 0 || u.atbilde >= (u.varianti?.length || 0)) kl(f, id, 'atbilde = varianta indekss'); break;
    case 'vairakas': varianti(); if (!Array.isArray(u.atbildes) || !u.atbildes.length || u.atbildes.some((a) => a < 0 || a >= (u.varianti?.length || 0))) kl(f, id, 'atbildes = indeksu masīvs'); break;
    case 'ievadi': if (typeof u.atbilde !== 'string' || !u.atbilde.trim()) kl(f, id, 'atbilde = teksts, alternatīvas ar |'); break;
    case 'tuksumi': {
      const n = (u.jautajums || '').match(TUKSUMS)?.length || 0;
      if (!n) kl(f, id, 'jautajums bez ___ tukšumiem');
      if (!Array.isArray(u.atbildes) || u.atbildes.length !== n) kl(f, id, `atbildes skaits (${u.atbildes?.length}) ≠ tukšumu skaits (${n})`);
      break;
    }
    case 'pari': if (!Array.isArray(u.pari) || u.pari.length < 3 || u.pari.some((p) => p.length !== 2)) kl(f, id, 'pari = ≥ 3 [a, b]'); break;
    case 'seciba': if (!Array.isArray(u.elementi) || u.elementi.length < 3) kl(f, id, 'elementi = ≥ 3 pareizā secībā'); break;
    case 'kategorijas': if (!u.kategorijas || Object.keys(u.kategorijas).length < 2) kl(f, id, 'kategorijas = { nosaukums: [vienumi] }, ≥ 2'); break;
    case 'klausies':
      if (!u.runa) kl(f, id, 'trūkst runa (ko atskaņot)');
      if (u.varianti) { varianti(); if (!Number.isInteger(u.atbilde)) kl(f, id, 'atbilde = varianta indekss'); }
      else if (typeof u.atbilde !== 'string') kl(f, id, 'atbilde = teksts vai varianti + indekss');
      break;
    case 'rakstit': case 'runat':
      if (!u.paraugs) kl(f, id, 'trūkst paraugs');
      if (!Array.isArray(u.parbaude) || u.parbaude.length < 2) kl(f, id, 'parbaude = ≥ 2 pašpārbaudes punkti');
      break;
  }
}

// Visas virknes objektā (tekstu pārbaudēm)
const virknes = (o, acc = []) => { if (typeof o === 'string') acc.push(o); else if (o && typeof o === 'object') for (const v of Object.values(o)) virknes(v, acc); return acc; };
const vardi = (s) => s.split(/\s+/).filter(Boolean).length;
const LV = /[āčēģīķļņšūž]/i;

// ---------- kanons: secība ----------
const atstarpe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const kanonaVardi = Object.entries(kanons.vardi || {}).map(([v, nr]) => ({ v, nr, re: new RegExp(`(?<!\\p{L})${atstarpe(v)}(?!\\p{L})`, 'iu') }));
const kanonaTermini = Object.entries(kanons.termini || {}).map(([t, d]) => ({ v: t, nr: d.nr, re: new RegExp(`(?<!\\p{L})${atstarpe(t)}`, 'iu') }));
const pirmsLaika = (f, nr, saturs) => {
  const teksts = virknes(saturs).join('\n');
  for (const k of [...kanonaVardi, ...kanonaTermini])
    if (k.nr > nr && k.re.test(teksts)) kl(f, 'kanons', `"${k.v}" lietots pirms tā ieviešanas (${k.nr}. nodarbībā)`);
};

// ---------- nodarbības ----------
const visiUzd = []; // eksāmena pārklāšanās pārbaudei
const nodPlani = plans.nodarbibas || [];
for (const np of nodPlani) {
  const nn = String(np.nr).padStart(2, '0'), f = `nodarbiba-${nn}.json`;
  const n = lasit(f, false);
  if (!n) { br(f, '-', 'vēl nav izveidota'); continue; }
  for (const u of [...(n.dalas || []).flatMap((d) => d.vingrinajumi || []), ...(n.tests?.banka || [])]) visiUzd.push({ f, u });
  if (tikaiNr && np.nr !== tikaiNr) continue;

  for (const k of ['nr', 'nosaukums', 'merki', 'saites', 'iesildisanas', 'dalas', 'prakse', 'tests', 'kopsavilkums'])
    if (n[k] == null) kl(f, k, 'trūkst lauka');
  if (n.nr !== np.nr) kl(f, 'nr', `nr ${n.nr} ≠ plānā ${np.nr}`);
  if ((n.merki || []).length < 2 || (n.merki || []).length > 5) br(f, 'merki', 'ieteicami 3–4 mērķi');

  const ids = new Set();
  const dalas = n.dalas || [];
  if (dalas.length < 3 || dalas.length > 4) br(f, 'dalas', `ieteicamas 3–4 daļas, ir ${dalas.length}`);
  for (const d of dalas) {
    if (!(d.ilgums_min >= 15 && d.ilgums_min <= 25)) kl(f, d.id, `daļas ilgums ${d.ilgums_min} min (vajag 15–25)`);
    if (!d.materials?.length) kl(f, d.id, 'daļai nav materiāla');
    for (const b of d.materials || []) {
      if (!BLOKI.has(b.t)) kl(f, d.id, `nezināms bloks "${b.t}"`);
      if (b.md && vardi(b.md) > 250) kl(f, d.id, `bloks "${b.t}" ${vardi(b.md)} vārdi (≤ 250)`);
    }
    if ((d.vingrinajumi || []).length < 3) kl(f, d.id, 'daļā vajag ≥ 3 vingrinājumus');
    for (const u of d.vingrinajumi || []) { parbauditUzd(f, u); if (ids.has(u.id)) kl(f, u.id, 'id atkārtojas'); ids.add(u.id); }
  }
  if (n.prakse) parbauditUzd(f, { id: 'prakse', teksts: n.prakse.uzdevums, ...n.prakse });

  const t = n.tests || {}, banka = t.banka || [];
  const vajag = Math.ceil((t.jautajumi || 0) * 1.5);
  if (!(t.jautajumi >= 8)) kl(f, 'tests', 'tests.jautajumi ≥ 8');
  if (banka.length < vajag) kl(f, 'tests', `bankā ${banka.length} uzdevumi, vajag ≥ ${vajag} (1,5 × ${t.jautajumi})`);
  for (const u of banka) { parbauditUzd(f, u, { tikaiAuto: true }); if (ids.has(u.id)) kl(f, u.id, 'id atkārtojas'); ids.add(u.id); }

  // Katra kursa prasme katrā nodarbībā (izņemot plānā pamatoti izlaistās)
  const ir = new Set([...dalas.flatMap((d) => (d.vingrinajumi || []).map((u) => u.prasme)), n.prakse?.prasme, ...banka.map((u) => u.prasme)]);
  for (const p of PRASMES) if (!ir.has(p) && !np.prasmes_izlaist?.[p]) kl(f, 'prasmes', `prasme "${p}" netiek trenēta (vai pamato plans.nodarbibas[].prasmes_izlaist)`);

  const teksts = virknes(n).join(' ');
  if (/�|Ã.|Ä./.test(teksts)) kl(f, '-', 'bojāti simboli (kodējums)');
  if (teksts.length > 500 && !LV.test(teksts)) kl(f, '-', 'nav latviešu garumzīmju — vai teksts ir latviski?');
  if (!(n.kopsavilkums?.punkti?.length >= 3)) kl(f, 'kopsavilkums', 'vajag ≥ 3 punktus');
  pirmsLaika(f, np.nr, { ...n, saites: null }); // saites.sagatavo drīkst minēt nākamās tēmas
}

// ---------- eksāmens ----------
const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
function paraksts(u) {
  const atb = u.tips === 'izvele' || (u.tips === 'klausies' && u.varianti) ? [u.varianti?.[u.atbilde]] : u.tips === 'vairakas' ? (u.atbildes || []).map((i) => u.varianti?.[i]) : [u.atbilde, ...(u.atbildes || [])];
  const saturs = [u.jautajums, u.fragments, u.runa, ...(u.pari || []).flat(), ...(u.elementi || []), ...Object.values(u.kategorijas || {}).flat(), ...atb].filter((x) => typeof x === 'string');
  return new Set(norm((saturs.length ? saturs : [u.teksts || '']).join(' ')));
}
const jaccard = (a, b) => { let k = 0; for (const x of a) if (b.has(x)) k++; return k / (a.size + b.size - k || 1); };

const eks = lasit('eksamens.json', false);
if (!eks) br('eksamens.json', '-', 'vēl nav izveidots');
else if (!tikaiNr) {
  const banka = eks.banka || [], vajag = Math.ceil((plans.eksamens?.jautajumi || 40) * 1.5);
  if (banka.length < vajag) kl('eksamens.json', 'banka', `${banka.length} uzdevumi, vajag ≥ ${vajag}`);
  const ids = new Set();
  const lielakaisNr = Math.max(...nodPlani.map((n) => n.nr));
  for (const u of banka) {
    parbauditUzd('eksamens.json', u, { tikaiAuto: true });
    if (ids.has(u.id)) kl('eksamens.json', u.id, 'id atkārtojas'); ids.add(u.id);
    if (!u.nodarbibas?.length) kl('eksamens.json', u.id, 'trūkst nodarbibas: [nr]');
    const p = paraksts(u);
    for (const { f, u: v } of visiUzd) {
      const lidz = jaccard(p, paraksts(v));
      if (lidz >= 0.7) { kl('eksamens.json', u.id, `pārāk līdzīgs ${f} ${v.id} (${Math.round(lidz * 100)} %) — pārraksti ar jaunu piemēru`); break; }
    }
  }
  const ir = new Set(banka.map((u) => u.prasme));
  for (const p of PRASMES) if (!ir.has(p)) kl('eksamens.json', 'prasmes', `prasme "${p}" netiek pārbaudīta`);
  const vairaku = banka.filter((u) => (u.nodarbibas || []).length > 1).length;
  if (vairaku < banka.length * 0.25) br('eksamens.json', 'banka', `tikai ${vairaku} uzdevumi apvieno vairākas nodarbības (ieteicams ≥ 25 %)`);
  for (const nr of nodPlani.map((n) => n.nr)) if (!banka.some((u) => u.nodarbibas?.includes(nr))) kl('eksamens.json', 'banka', `nav uzdevumu no ${nr}. nodarbības`);
  pirmsLaika('eksamens.json', lielakaisNr, eks);
}

// ---------- resursi ----------
const res = lasit('resursi.json', false);
if (!res) br('resursi.json', '-', 'vēl nav izveidots');
else if (!tikaiNr) {
  if (!(res.celi?.length >= 2)) kl('resursi.json', 'celi', 'vajag ≥ 2 tālākās mācīšanās ceļus');
  for (const c of res.celi || []) for (const r of c.resursi || [])
    if (!/^https:\/\//.test(r.url || '')) kl('resursi.json', r.nosaukums || '?', 'url jābūt https://');
}

beigas();
function beigas() {
  for (const b of bridinajumi) console.log('⚠ ' + b);
  for (const k of kludas) console.log('✗ ' + k);
  console.log(kludas.length ? `${kludas.length} kļūdas, ${bridinajumi.length} brīdinājumi` : `✓ Kļūdu nav (${bridinajumi.length} brīdinājumi)`);
  process.exit(kludas.length ? 1 : 0);
}
