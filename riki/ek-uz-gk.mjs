// E-kursa saturs (e-kursi-saturs/<ek>/) → grupu kursa telpas avoti (grupu-kursi-saturs/<gk>/avoti/NN.json + NN.majasdarbs.json).
// Pēc tam: node riki/gk-sagatavot.mjs <gk> → python -I riki/ek-audio.py --gk <gk> → node riki/gk-augsupladet.mjs <gk> --remote
// Lietošana: node riki/ek-uz-gk.mjs <ek-kurss> <gk-kurss>
// Kartējums: teksts/svarigi/tabula → text; piemers/vardnica/burti → vocab (dir "es" = mērķvaloda pirmā);
// izvele/klausies/pari/kategorijas/vairakas → choice (klausies = poga ar data-runa); tuksumi → fill; ievadi/seciba → transform;
// runat → speak; rakstit → text (+ mājasdarbs); tests → «Pašpārbaude»; eksāmens → pēdējā nodarbība «Noslēguma pārbaude».
import fs from 'node:fs';
import path from 'node:path';

const [ek, gk] = process.argv.slice(2);
if (!ek || !gk) { console.error('Lietošana: node riki/ek-uz-gk.mjs <ek-kurss> <gk-kurss>'); process.exit(1); }
const SRC = path.join('e-kursi-saturs', ek);
const AVOTI = path.join('grupu-kursi-saturs', gk, 'avoti');
fs.mkdirSync(AVOTI, { recursive: true });
const plans = JSON.parse(fs.readFileSync(path.join(SRC, 'plans.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LV = /[āčēģīķļņū]/i, MERK = /[õäöü]/i;
const irMerk = (t, slipr) => !LV.test(t) && (slipr || MERK.test(t));
function inl(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, (_, t) => (irMerk(t) ? `<b class="es">${t}</b>` : `<b>${t}</b>`))
    .replace(/\*([^*]+)\*/g, (_, t) => (irMerk(t, true) ? `<i class="es">${t}</i>` : `<i>${t}</i>`));
}
function md(s) {
  return String(s || '').split(/\n{2,}/).map((p) => {
    const r = p.split('\n');
    if (r.every((x) => /^\s*-\s+/.test(x))) return '<ul class="dash">' + r.map((x) => '<li>' + inl(x.replace(/^\s*-\s+/, '')) + '</li>').join('') + '</ul>';
    if (r.every((x) => /^\s*\d+\.\s+/.test(x))) return '<ol>' + r.map((x) => '<li>' + inl(x.replace(/^\s*\d+\.\s+/, '')) + '</li>').join('') + '</ol>';
    return '<p>' + r.map(inl).join('<br>') + '</p>';
  }).join('');
}
const tabula = (b) => '<table class="t">' + (b.galva?.some(Boolean) ? '<tr>' + b.galva.map((h) => `<td><b>${esc(h)}</b></td>`).join('') + '</tr>' : '')
  + b.rindas.map((r) => '<tr>' + r.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
const kv = (s) => String(s).replace(/\[/g, '(').replace(/\]/g, ')').replace(/\|/g, '/'); // choice sintaksei
const frag = (u) => (u.fragments ? `<br><span class="gk-fragments">${esc(u.fragments).replace(/\n/g, '<br>')}</span><br>` : '');
const klaus = (u) => (u.runa ? `<span class="es gk-klausies" data-runa="${esc(u.runa)}">Klausīties</span> ` : '');
// deterministiska sajaukšana (lai atbilde nav vienmēr pirmā)
const sajaukt = (arr, seed) => { const b = arr.slice(); let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  for (let i = b.length - 1; i > 0; i--) { a = Math.imul(a ^ (a >>> 13), 1103515245) + 12345 >>> 0; const j = a % (i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// Viens e-kursa uzdevums → slaidu fragmenti {choice:[items], fill:[...], transform:[...], citi:[slaidi]}
function uzd(u, kur, nr) {
  const o = { choice: [], fill: [], transform: [], citi: [] };
  const q = (t) => kv(t);
  switch (u.tips) {
    case 'izvele':
      o.choice.push({ q: `${klaus(u)}${q(u.teksts)}${u.jautajums ? ' ' + q(u.jautajums) : ''}${frag(u)} [${u.varianti.map(kv).join('|')}]`, a: kv(u.varianti[u.atbilde]) }); break;
    case 'klausies':
      if (u.varianti) o.choice.push({ q: `${klaus(u)}${q(u.teksts)} [${u.varianti.map(kv).join('|')}]`, a: kv(u.varianti[u.atbilde]) });
      else o.transform.push({ q: u.teksts, runa: u.runa, a: u.atbilde.split('|') });
      break;
    case 'vairakas':
      o.citi.push({ type: 'choice', noSent: true, title: kur + ': ' + 'atzīmē pareizo', note: u.teksts, items: u.varianti.map((v, i) => ({ q: `${i === 0 ? frag(u) : ''}${kv(v)} [Jā|Nē]`, a: u.atbildes.includes(i) ? 'Jā' : 'Nē' })) });
      break;
    case 'pari': {
      const bb = u.pari.map((p) => kv(p[1]));
      o.citi.push({ type: 'choice', noSent: true, title: kur + ': savieno', note: u.teksts, items: u.pari.map((p, i) => ({ q: `${kv(p[0])} → [${sajaukt(bb, u.id + nr + i).join('|')}]`, a: kv(p[1]) })) });
      break;
    }
    case 'kategorijas': {
      const kat = Object.keys(u.kategorijas).map(kv);
      const vien = Object.entries(u.kategorijas).flatMap(([k, arr]) => arr.map((x) => [x, kv(k)]));
      o.citi.push({ type: 'choice', noSent: true, title: kur + ': sašķiro', note: u.teksts, items: sajaukt(vien, u.id + nr).map(([x, k]) => ({ q: `${kv(x)} [${kat.join('|')}]`, a: k })) });
      break;
    }
    case 'tuksumi': {
      let i = 0;
      const t = u.jautajums.replace(/_{3,}/g, () => `{${u.atbildes[i++]}}`);
      o.fill.push(`${t} (${u.teksts.replace(/[.:]$/, '')})`); // norāde iekavās — teikumu spēle tās noņem
      break;
    }
    case 'ievadi': o.transform.push({ q: u.teksts, a: u.atbilde.split('|') }); break;
    case 'seciba': {
      const vid = u.elementi.reduce((n, e) => n + e.length, 0) / u.elementi.length;
      if (vid <= 14) { // vārdu secība teikumā
        o.transform.push({ q: `${u.teksts} ${sajaukt(u.elementi, u.id + nr).join(' / ')}`, a: [u.elementi.join(' ')] });
      } else { // dialogs vai darbību secība → burtu atbilde
        const jauk = sajaukt(u.elementi.map((e, i) => [e, i]), u.id + nr);
        const burti = 'ABCDEFGH';
        const pareizi = u.elementi.map((_, i) => burti[jauk.findIndex((x) => x[1] === i)]);
        o.transform.push({ q: `${u.teksts} Ieraksti burtus pareizā secībā: ${jauk.map((x, j) => burti[j] + ') ' + x[0]).join('  ')}`, a: [pareizi.join(' '), pareizi.join('')] });
      }
      break;
    }
    case 'runat':
      o.citi.push({ type: 'speak', title: kur + ': runā skaļi', note: u.teksts + (u.parbaude?.length ? ' Pārbaudi: ' + u.parbaude.join('; ') + '.' : ''), questions: [u.paraugs] });
      break;
    case 'rakstit':
      o.citi.push({ type: 'text', title: kur + ': raksti', html: `<p>${esc(u.teksts)}</p><p class="note">Paraugs: <span>${esc(u.paraugs).replace(/\n/g, '<br>')}</span></p>` + (u.parbaude?.length ? '<ul class="dash">' + u.parbaude.map((p) => `<li>${esc(p)}</li>`).join('') + '</ul>' : '') });
      break;
  }
  return o;
}
function uzdSlaidi(saraksts, kur, nr, nosaukums = 'Vingrinājumi') {
  const acc = { choice: [], fill: [], transform: [], citi: [] };
  for (const u of saraksts) { const o = uzd(u, kur, nr); for (const k of Object.keys(acc)) acc[k].push(...o[k]); }
  const S = [];
  if (acc.choice.length) S.push({ type: 'choice', noSent: true, title: `${kur}: ${nosaukums.toLowerCase()} — izvēlies`, items: acc.choice });
  if (acc.fill.length) S.push({ type: 'fill', title: `${kur}: ${nosaukums.toLowerCase()} — papildini`, items: acc.fill });
  if (acc.transform.length) S.push({ type: 'transform', title: `${kur}: ${nosaukums.toLowerCase()} — ieraksti`, ph: 'Atbilde…', items: acc.transform });
  return S.concat(acc.citi);
}
const teikSk = (t) => String(t).split(/[.!?…]+/).map((y) => y.trim()).filter((y) => y.split(/\s+/).length >= 3).length;

let skaits = 0;
for (const np of plans.nodarbibas) {
  const nn = String(np.nr).padStart(2, '0');
  const n = JSON.parse(fs.readFileSync(path.join(SRC, `nodarbiba-${nn}.json`), 'utf8'));
  const S = [];
  S.push({ type: 'text', title: 'Šodien', html: '<p><b>Pēc nodarbības tu varēsi:</b></p><ul class="dash">' + n.merki.map((m) => `<li>${esc(m)}</li>`).join('') + '</ul>'
    + (n.iesildisanas?.jautajumi?.length ? '<p class="note">Iesildīšanās: ' + n.iesildisanas.jautajumi.map(esc).join(' ') + '</p>' : '') });
  const vocabIds = [];
  for (const d of n.dalas) {
    const kur = d.nosaukums;
    let pirmais = true, k = 0;
    const tituls = (pap) => { const t = pirmais ? kur : `${kur}: ${pap}`; pirmais = false; return t; };
    for (const b of d.materials) {
      if (b.t === 'teksts') S.push({ type: 'text', title: tituls('skaidrojums'), html: md(b.md) });
      else if (b.t === 'svarigi') S.push({ type: 'text', title: tituls('svarīgi'), html: '<p class="note"><b>Svarīgi!</b> ' + inl(b.md) + '</p>' });
      else if (b.t === 'tabula') S.push({ type: 'text', title: tituls('tabula'), html: tabula(b) });
      else if (b.t === 'piemers' || b.t === 'vardnica' || b.t === 'burti') {
        if (b.md) S.push({ type: 'text', title: tituls('piemērs'), html: md(b.md) });
        const id = `n${np.nr}-${d.id}-${++k}`;
        const pairs = b.t === 'burti' ? b.vienumi.map((v) => [v[2] || v[0], `${v[0]} — ${v[1]}`]) : b.vienumi.map((v) => [v[0], v[1] || '']);
        S.push({ type: 'vocab', id, dir: 'es', title: tituls(b.t === 'vardnica' ? 'vārdi' : 'piemēri'), pairs });
        if (b.t === 'vardnica') vocabIds.push(id);
      }
    }
    S.push(...uzdSlaidi(d.vingrinajumi || [], kur, np.nr));
  }
  if (n.prakse) S.push(...uzdSlaidi([{ ...n.prakse, id: 'prakse', teksts: n.prakse.uzdevums }], 'Praktiskais uzdevums', np.nr));
  const pasp = uzdSlaidi(n.tests?.banka || [], 'Pašpārbaude', np.nr, 'Tests');
  pasp.forEach((s) => { s.title = s.title.replace(/^Pašpārbaude: tests — /, 'Pašpārbaude: '); });
  S.push(...pasp);
  // «Nodarbības vārdi»: tabulu rindas ar latvisko kolonnu (pirmā kolonna → «latviski») — atkārtošanai, testam un spēlēm
  const redz = new Set(S.filter((s) => s.type === 'vocab').flatMap((s) => s.pairs.map((p) => p[0].toLowerCase())));
  const tabPari = [];
  for (const d of n.dalas) for (const b of d.materials) {
    if (b.t !== 'tabula') continue;
    const li = (b.galva || []).findIndex((h) => /^latviski$/i.test(h));
    if (li < 1) continue;
    for (const r of b.rindas) {
      const et = String(r[0]).replace(/\s*\([^)]*\)/g, '').replace(/\s+—.*$/, '').trim();
      if (!et || /[–\-]$/.test(et) || redz.has(et.toLowerCase())) continue;
      redz.add(et.toLowerCase()); tabPari.push([et, r[li]]);
    }
  }
  if (tabPari.length >= 4) S.push({ type: 'vocab', id: `n${np.nr}-tabulas`, dir: 'es', title: 'Nodarbības vārdi', pairs: tabPari });
  const visiVardi = S.filter((s) => s.type === 'vocab').reduce((nn2, s) => nn2 + s.pairs.length, 0);
  if (visiVardi >= 6) S.push({ type: 'quiz', title: 'Vārdu tests', from: S.filter((s) => s.type === 'vocab' && !/^Šodien/.test(s.title)).map((s) => s.id), n: 10 });
  S.push({ type: 'text', title: 'Kopsavilkums', html: '<ul class="dash">' + n.kopsavilkums.punkti.map((p) => `<li>${inl(p)}</li>`).join('') + '</ul>'
    + '<p><b>Es protu…</b></p><ul class="dash">' + n.kopsavilkums.var_darit.map((p) => `<li>${esc(p)}</li>`).join('') + '</ul>' });
  S.push({ type: 'homework', title: 'Mājasdarbs' });

  // Mājasdarbs: pēdējais rakstīšanas uzdevums vai praktiskais uzdevums rakstiski
  const rakst = (n.dalas.flatMap((d) => d.vingrinajumi || []).filter((u) => u.tips === 'rakstit').pop());
  const avotsMd = rakst || { teksts: 'Uzraksti to, ko praktiskajā uzdevumā teici skaļi: ' + n.prakse.uzdevums, paraugs: n.prakse.paraugs, parbaude: n.prakse.parbaude };
  const min = Math.max(3, Math.min(8, teikSk(avotsMd.paraugs)));
  fs.writeFileSync(path.join(AVOTI, nn + '.majasdarbs.json'), JSON.stringify({
    teksts: avotsMd.teksts, piemers: avotsMd.paraugs,
    parbaudes: [{ id: 'teik', teksts: `Vismaz ${min} teikumi igauniski`, tips: 'teikumi', min }],
  }, null, 1));
  fs.writeFileSync(path.join(AVOTI, nn + '.json'), JSON.stringify({
    head: n.nosaukums, items: n.dalas.map((d, i) => `${np.nr}.${i + 1}. ${d.nosaukums}.`), valoda: plans.valoda, audio: !!plans.audio,
    homework: { teksts: avotsMd.teksts, prasibas: [] }, S,
  }, null, 1));
  skaits++;
}

// Noslēguma pārbaude no eksāmena bankas
const eks = JSON.parse(fs.readFileSync(path.join(SRC, 'eksamens.json'), 'utf8'));
const nr = plans.nodarbibas.length + 1, nn = String(nr).padStart(2, '0');
const S = [{ type: 'text', title: 'Noslēguma pārbaude', html: '<p>Jauni uzdevumi par visām nodarbībām. Atbildi pats, tad pārbaudi. Kļūdas — tēmas, ko atkārtot.</p>' }];
const grupas = [[1, 4], [5, 9], [10, 14], [15, 19]];
for (const [no, lidz] of grupas) {
  const g = eks.banka.filter((u) => { const m = Math.max(...u.nodarbibas); return m >= no && m <= lidz; });
  S.push(...uzdSlaidi(g, `${no}.–${Math.min(lidz, plans.nodarbibas.length)}. nodarbība`, nr, 'Uzdevumi'));
}
fs.writeFileSync(path.join(AVOTI, nn + '.json'), JSON.stringify({ head: 'Noslēguma pārbaude', items: [`${nr}.1. Uzdevumi par visām nodarbībām.`], valoda: plans.valoda, audio: !!plans.audio, homework: null, S }, null, 1));
console.log(`✓ ${skaits} nodarbības + noslēguma pārbaude (${nr}) → ${AVOTI}`);
