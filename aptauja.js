// APTAUJA: viens jautājums ekrānā, progresa josla, zarošanās pēc atbildēm (aptauja-jautajumi.js → ja(a)).
// Melnraksts tiek glabāts šajā pārlūkā (localStorage aptaujaMelnraksts), pēc iesniegšanas — aptaujaAizpildita (paslēpj joslu).
// Iesniegšana: POST /api/aptauja. Visi lietotāja dati tiek rādīti ar textContent.
import { JAUTAJUMI, DALAS, BEIGAS, IZLOZES_DATUMS } from './aptauja-jautajumi.js';

const root = document.getElementById('aptauja');
const MELNRAKSTS = 'aptaujaMelnraksts', AIZPILDITA = 'aptaujaAizpildita';
const mazaKustiba = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const EPASTS_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

const glabat = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { /* privātais režīms */ } };
const lasit = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

let s = jauns();
function jauns() { return { a: {}, i: -1, vesture: [], izloze: false, jaunumi: false }; }

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
// **treknraksts** → <strong>
function bagatigs(p, t) {
  String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean).forEach((d) => {
    p.appendChild(d.startsWith('**') ? el('strong', '', d.slice(2, -2)) : document.createTextNode(d));
  });
  return p;
}
function poga(cls, text, onclick) {
  const b = el('button', cls, text);
  b.type = 'button';
  b.addEventListener('click', onclick);
  return b;
}

const redzams = (q) => !q.ja || q.ja(s.a);
const redzamie = () => JAUTAJUMI.filter(redzams);
function nakamais(no) {
  for (let j = no + 1; j < JAUTAJUMI.length; j++) if (redzams(JAUTAJUMI[j])) return j;
  return -1;
}
const saglabat = () => glabat(MELNRAKSTS, s);

// ---------- Derīgums ----------
function derigs(q) {
  const v = s.a[q.id];
  switch (q.tips) {
    case 'epasts': {
      const e = (s.a.epasts || '').trim();
      return !e || (EPASTS_RE.test(e) && s.izloze);
    }
    case 'viens': return !!v && !(v === 'cits' && !(s.a[q.id + '_cits'] || '').trim());
    case 'vairaki': return Array.isArray(v) && v.length > 0 && !(v.includes('cits') && !(s.a[q.id + '_cits'] || '').trim());
    case 'skala': case 'nps': return typeof v === 'number';
    default: return true;
  }
}

// ---------- Ekrāni ----------
function ekrans(saturs, { fokuss } = {}) {
  root.textContent = '';
  const k = el('div', 'apt-karte' + (mazaKustiba ? '' : ' apt-ienak'));
  saturs(k);
  root.appendChild(k);
  const f = fokuss && k.querySelector(fokuss);
  if (f) f.focus({ preventScroll: true });
  const r = root.getBoundingClientRect();
  if (r.top < 0 || r.top > window.innerHeight * 0.6) root.scrollIntoView({ block: 'start', behavior: mazaKustiba ? 'auto' : 'smooth' });
}

function slegta() {
  ekrans((k) => {
    k.appendChild(el('h2', 'apt-virsraksts', 'Aptauja ir noslēgusies'));
    k.appendChild(el('p', 'apt-teksts', 'Paldies visiem, kas piedalījās! Izlozes uzvarētājus jau esam informējuši pa e-pastu.'));
    const a = el('a', 'apt-poga apt-poga--galvena', 'Uz sākumlapu'); a.href = 'index.html';
    k.appendChild(a);
  });
}

function sakums() {
  // Jau aizpildīta šajā pārlūkā: tikai paldies (un vai piedalās izlozē), bez pogām
  const aizpildita = lasit(AIZPILDITA);
  if (aizpildita) { paldies(aizpildita === 'izloze', true); return; }
  const melnraksts = (() => { try { return JSON.parse(lasit(MELNRAKSTS) || 'null'); } catch (e) { return null; } })();
  ekrans((k) => {
    k.classList.add('apt-karte--sakums');
    k.appendChild(el('p', 'apt-zime', '🌴 Izloze · 3 dāvanas no Tenerifes'));
    k.appendChild(el('h2', 'apt-virsraksts apt-virsraksts--liels', 'Palīdzi mums kļūt labākiem!'));
    k.appendChild(el('p', 'apt-teksts', 'Piedalies aptaujā un laimē vienu no trim dāvanām no Tenerifes! Aptauja aizņems ap 5–7 minūtēm, un katrā ekrānā būs tikai viens jautājums.'));
    k.appendChild(el('p', 'apt-teksts apt-teksts--kluss', 'E-pasts nav obligāts: norādi to tikai tad, ja vēlies piedalīties izlozē. Uzvarētājus izlozēsim ' + IZLOZES_DATUMS + ' un informēsim pa e-pastu.'));
    const pogas = el('div', 'apt-pogas apt-pogas--sakums');
    if (melnraksts && melnraksts.i >= 0 && JAUTAJUMI[melnraksts.i]) {
      pogas.appendChild(poga('apt-poga apt-poga--galvena', 'Turpināt, kur paliku', () => { s = Object.assign(jauns(), melnraksts); jautajums(); }));
      pogas.appendChild(poga('apt-poga', 'Sākt no jauna', () => { s = jauns(); glabat(MELNRAKSTS, null); iet(nakamais(-1)); }));
    } else {
      pogas.appendChild(poga('apt-poga apt-poga--galvena', 'Sākt aptauju', () => { s = jauns(); iet(nakamais(-1)); }));
    }
    k.appendChild(pogas);
  }, { fokuss: '.apt-poga--galvena' });
}

function iet(j) {
  if (s.i >= 0) s.vesture.push(s.i);
  s.i = j;
  saglabat();
  jautajums();
}
function atpakal() {
  if (!s.vesture.length) { s.i = -1; saglabat(); sakums(); return; }
  s.i = s.vesture.pop();
  saglabat();
  jautajums();
}

function progress(k, q) {
  const r = redzamie();
  const poz = Math.max(0, r.indexOf(q));
  const pct = Math.round((poz / r.length) * 100);
  const galva = el('div', 'apt-galva');
  galva.appendChild(el('span', 'apt-dala', DALAS[q.dala] || ''));
  galva.appendChild(el('span', 'apt-skaits', (poz + 1) + ' / ' + r.length));
  k.appendChild(galva);
  const josla = el('div', 'apt-progress');
  josla.setAttribute('role', 'progressbar');
  josla.setAttribute('aria-label', 'Aptaujas progress');
  josla.setAttribute('aria-valuemin', '0'); josla.setAttribute('aria-valuemax', '100'); josla.setAttribute('aria-valuenow', String(pct));
  const aizp = el('span', 'apt-progress-aizpildijums');
  aizp.style.width = Math.max(pct, 3) + '%';
  josla.appendChild(aizp);
  k.appendChild(josla);
}

function attels(q) {
  if (!q.attels) return null;
  const f = el('figure', 'apt-attels apt-attels--' + q.attels);
  if (q.attels === 'empa') {
    const E = window.EMPANADILLO;
    if (E && E.svg) {
      const v = el('div', 'apt-empa');
      v.innerHTML = E.svg(E.POZAS && E.POZAS.vicina ? 'vicina' : 'miera', { label: 'Talismans Empanadillo', shadow: false, animate: false }); // statisks SVG no empanadillo.js
      f.appendChild(v);
    }
    return f;
  }
  const lapa = el('div', 'apt-logo-lapa');
  const img = el('img'); img.src = 'assets/libertas.png'; img.alt = 'Libertas logo'; img.width = 500; img.height = 216;
  lapa.appendChild(img);
  if (q.attels === 'sauklis') lapa.appendChild(el('p', 'apt-sauklis', 'Runā, saproti, ceļo, audz!'));
  f.appendChild(lapa);
  return f;
}

function citsLauks(q, vieta) {
  const w = el('div', 'apt-cits');
  const inp = el('input', 'apt-ievade');
  inp.type = 'text'; inp.maxLength = 200;
  inp.placeholder = vieta || 'Ieraksti savu atbildi';
  inp.setAttribute('aria-label', vieta || 'Cita atbilde');
  inp.value = s.a[q.id + '_cits'] || '';
  inp.addEventListener('input', () => { s.a[q.id + '_cits'] = inp.value; saglabat(); atjaunotPogu(); });
  w.appendChild(inp);
  return w;
}

let atjaunotPogu = () => {};

function izveles(q, k) {
  const vairaki = q.tips === 'vairaki';
  const fs = el('fieldset', 'apt-izveles');
  fs.appendChild(el('legend', 'apt-sr', q.teksts));
  const vert = () => (vairaki ? (s.a[q.id] || []) : s.a[q.id]);
  const ievades = [];
  q.opc.forEach((op) => {
    const l = el('label', 'apt-opc');
    const inp = el('input');
    inp.type = vairaki ? 'checkbox' : 'radio';
    inp.name = q.id; inp.value = op.v;
    inp.checked = vairaki ? vert().includes(op.v) : vert() === op.v;
    l.appendChild(inp);
    l.appendChild(el('span', 'apt-opc-zime'));
    l.appendChild(el('span', 'apt-opc-teksts', op.t));
    fs.appendChild(l);
    ievades.push([inp, op, l]);
    inp.addEventListener('change', () => {
      if (vairaki) {
        let arr = ievades.filter((x) => x[0].checked).map((x) => x[1].v);
        if (inp.checked && op.vienigais) arr = [op.v];
        else if (inp.checked) arr = arr.filter((v) => !(q.opc.find((o) => o.v === v) || {}).vienigais);
        s.a[q.id] = arr;
      } else {
        s.a[q.id] = op.v;
      }
      saglabat();
      sinhronizet();
    });
  });
  const citsOp = q.opc.find((o) => o.cits);
  const citsW = citsOp ? citsLauks(q, citsOp.citsVieta) : null;
  function sinhronizet() {
    const v = vert();
    const pilns = vairaki && q.max && v.length >= q.max;
    ievades.forEach(([inp, op, l]) => {
      inp.checked = vairaki ? v.includes(op.v) : v === op.v;
      inp.disabled = !!(pilns && !inp.checked);
      l.classList.toggle('ir-izvelets', inp.checked);
    });
    if (citsW) {
      const rad = vairaki ? v.includes(citsOp.v) : v === citsOp.v;
      citsW.hidden = !rad;
      if (!rad) delete s.a[q.id + '_cits'];
    }
    atjaunotPogu();
  }
  k.appendChild(fs);
  if (citsW) {
    // Teksta lauks tieši zem atzīmētās opcijas
    const l = ievades.find((x) => x[1] === citsOp)[2];
    l.after(citsW);
  }
  sinhronizet();
}

function skala(q, k) {
  const nps = q.tips === 'nps';
  const fs = el('fieldset', 'apt-skala' + (nps ? ' apt-skala--nps' : ''));
  fs.appendChild(el('legend', 'apt-sr', q.teksts + ' (' + (nps ? '0' : '1') + ' = ' + q.galas[0] + ', ' + (nps ? '10' : '5') + ' = ' + q.galas[1] + ')'));
  const rinda = el('div', 'apt-skala-rinda');
  const no = nps ? 0 : 1, lidz = nps ? 10 : 5;
  const visi = [];
  for (let n = no; n <= lidz; n++) {
    const l = el('label', 'apt-skala-punkts');
    const inp = el('input'); inp.type = 'radio'; inp.name = q.id; inp.value = String(n);
    inp.checked = s.a[q.id] === n;
    l.appendChild(inp);
    l.appendChild(el('span', '', String(n)));
    rinda.appendChild(l);
    visi.push([inp, l]);
    inp.addEventListener('change', () => { s.a[q.id] = n; saglabat(); sinh(); });
  }
  function sinh() { visi.forEach(([inp, l]) => l.classList.toggle('ir-izvelets', inp.checked)); atjaunotPogu(); }
  fs.appendChild(rinda);
  const galas = el('div', 'apt-skala-galas');
  galas.appendChild(el('span', '', q.galas[0]));
  galas.appendChild(el('span', '', q.galas[1]));
  fs.appendChild(galas);
  k.appendChild(fs);
  if (q.komentars) {
    const l = el('label', 'apt-lauks');
    l.appendChild(el('span', 'apt-lauks-nosaukums', q.komentars));
    const t = el('textarea', 'apt-ievade apt-ievade--teksts'); t.rows = 3; t.maxLength = 1500;
    t.value = s.a[q.id + '_k'] || '';
    t.addEventListener('input', () => { s.a[q.id + '_k'] = t.value; saglabat(); });
    l.appendChild(t);
    k.appendChild(l);
  }
  sinh();
}

function epastaSolis(q, k) {
  const l = el('label', 'apt-lauks');
  l.appendChild(el('span', 'apt-sr', q.teksts));
  const inp = el('input', 'apt-ievade');
  inp.type = 'email'; inp.autocomplete = 'email'; inp.inputMode = 'email'; inp.maxLength = 120;
  inp.placeholder = 'vards@piemers.lv';
  inp.value = s.a.epasts || '';
  l.appendChild(inp);
  k.appendChild(l);
  const kluda = el('p', 'apt-kluda'); kluda.hidden = true; kluda.setAttribute('aria-live', 'polite');
  k.appendChild(kluda);

  const izv = el('div', 'apt-piekrisanas');
  function kaste(teksts, key) {
    const w = el('label', 'apt-opc apt-opc--kaste');
    const c = el('input'); c.type = 'checkbox'; c.checked = !!s[key];
    c.addEventListener('change', () => { s[key] = c.checked; saglabat(); sinh(); });
    w.appendChild(c);
    w.appendChild(el('span', 'apt-opc-zime'));
    w.appendChild(el('span', 'apt-opc-teksts', teksts));
    izv.appendChild(w);
    return [c, w];
  }
  const [c1, w1] = kaste('Piekrītu, ka mans e-pasts tiek izmantots izlozes rīkošanai un sazināšanai ar uzvarētājiem.', 'izloze');
  const [c2, w2] = kaste('Vēlos saņemt arī Libertas jaunumus un piedāvājumus (pēc izvēles).', 'jaunumi');
  const priv = el('p', 'apt-teksts apt-teksts--kluss apt-teksts--mazs');
  priv.append('Kā apstrādājam datus: ');
  const pa = el('a', '', 'privātuma politika'); pa.href = 'noteikumi.html#aptauja'; pa.target = '_blank'; pa.rel = 'noopener';
  priv.appendChild(pa);
  priv.append('.');
  izv.appendChild(priv);
  k.appendChild(izv);

  function sinh() {
    const e = inp.value.trim();
    const ir = !!e;
    [[c1, w1], [c2, w2]].forEach(([c, w]) => { c.disabled = !ir; w.classList.toggle('ir-izvelets', c.checked && ir); w.classList.toggle('ir-atslegts', !ir); });
    if (!ir) { s.izloze = false; s.jaunumi = false; c1.checked = false; c2.checked = false; }
    kluda.hidden = true;
    atjaunotPogu();
  }
  inp.addEventListener('input', () => { s.a.epasts = inp.value; saglabat(); sinh(); });
  inp.addEventListener('blur', () => {
    const e = inp.value.trim();
    if (e && !EPASTS_RE.test(e)) { kluda.textContent = 'Pārbaudi e-pasta adresi.'; kluda.hidden = false; }
    else if (e && !s.izloze) { kluda.textContent = 'Lai piedalītos izlozē, atzīmē piekrišanu.'; kluda.hidden = false; }
  });
  // Pieteicies lietotājs — e-pasts jau zināms
  const me = window.LIB && window.LIB.me;
  if (!inp.value && me && me.user && me.user.email) { inp.value = me.user.email; s.a.epasts = me.user.email; saglabat(); }
  sinh();
}

function tekstaSolis(q, k) {
  const l = el('label', 'apt-lauks');
  l.appendChild(el('span', 'apt-sr', q.teksts));
  const t = el('textarea', 'apt-ievade apt-ievade--teksts'); t.rows = 4; t.maxLength = 2000;
  t.placeholder = 'Tava atbilde';
  t.value = s.a[q.id] || '';
  t.addEventListener('input', () => { s.a[q.id] = t.value; saglabat(); });
  l.appendChild(t);
  k.appendChild(l);
}

function jautajums() {
  const q = JAUTAJUMI[s.i];
  if (!q || !redzams(q)) { const j = nakamais(s.i); if (j < 0) { sakums(); return; } s.i = j; }
  const Q = JAUTAJUMI[s.i];
  const pedejais = nakamais(s.i) < 0;
  ekrans((k) => {
    progress(k, Q);
    const form = el('form', 'apt-forma');
    form.noValidate = true;
    const nr = Q.tips === 'info' ? null : el('p', 'apt-nr', Q.nr.replace(/\.$/, ''));
    const h = el('h2', 'apt-virsraksts');
    h.tabIndex = -1;
    if (Q.tips === 'info') {
      h.textContent = Q.virsraksts || '';
      form.appendChild(h);
      form.appendChild(bagatigs(el('p', 'apt-teksts apt-teksts--info'), Q.teksts));
    } else {
      form.appendChild(nr);
      h.textContent = Q.teksts;
      form.appendChild(h);
      if (Q.apaksa) form.appendChild(el('p', 'apt-apaksa', Q.apaksa));
    }
    const a = attels(Q);
    if (a) form.appendChild(a);
    if (Q.tips === 'viens' || Q.tips === 'vairaki') izveles(Q, form);
    else if (Q.tips === 'skala' || Q.tips === 'nps') skala(Q, form);
    else if (Q.tips === 'epasts') epastaSolis(Q, form);
    else if (Q.tips === 'teksts') tekstaSolis(Q, form);

    // Slazds robotiem (cilvēki to neredz)
    if (pedejais) {
      const slazds = el('input', 'apt-slazds'); slazds.type = 'text'; slazds.name = 'majaslapa_url'; slazds.tabIndex = -1; slazds.autocomplete = 'off'; slazds.setAttribute('aria-hidden', 'true');
      form.appendChild(slazds);
    }
    const kluda = el('p', 'apt-kluda apt-kluda--iesniegt'); kluda.hidden = true; kluda.setAttribute('role', 'alert');
    form.appendChild(kluda);

    const pogas = el('div', 'apt-pogas');
    pogas.appendChild(poga('apt-poga apt-poga--atpakal', '← Atpakaļ', atpakal));
    const talak = el('button', 'apt-poga apt-poga--galvena', pedejais ? 'Iesniegt' : 'Tālāk →');
    talak.type = 'submit';
    pogas.appendChild(talak);
    form.appendChild(pogas);
    atjaunotPogu = () => { talak.disabled = !derigs(Q); };
    atjaunotPogu();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!derigs(Q) || talak.disabled) return;
      if (pedejais) iesniegt(talak, kluda, form.querySelector('.apt-slazds'));
      else iet(nakamais(s.i));
    });
    k.appendChild(form);
  }, { fokuss: '.apt-virsraksts' });
}

// Tikai redzamo jautājumu atbildes (ja respondents atgriezās un mainīja zaru)
function tirasAtbildes() {
  const r = {};
  redzamie().forEach((q) => {
    if (q.tips === 'info' || q.tips === 'epasts') return;
    const v = s.a[q.id];
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return;
    r[q.id] = typeof v === 'string' ? v.trim() : v;
    ['_cits', '_k'].forEach((x) => { const t = (s.a[q.id + x] || '').trim(); if (t) r[q.id + x] = t; });
  });
  return r;
}

function iesniegt(btn, kluda, slazds) {
  btn.disabled = true;
  btn.textContent = 'Sūta…';
  kluda.hidden = true;
  const epasts = (s.a.epasts || '').trim();
  window.LIB.api('POST', '/api/aptauja', {
    atbildes: tirasAtbildes(),
    epasts: epasts || null,
    izloze: !!(epasts && s.izloze),
    jaunumi: !!(epasts && s.jaunumi),
    viltus: slazds ? slazds.value : '',
  }).then(() => {
    const izloze = !!(epasts && s.izloze);
    glabat(AIZPILDITA, izloze ? 'izloze' : '1');
    glabat(MELNRAKSTS, null);
    paldies(izloze);
  }).catch((e) => {
    btn.disabled = false;
    btn.textContent = 'Iesniegt';
    kluda.textContent = e.message || 'Neizdevās nosūtīt. Pamēģini vēlreiz.';
    kluda.hidden = false;
  });
}

function paldies(izloze, atkartoti) {
  document.querySelectorAll('.aptaujas-josla').forEach((j) => j.remove());
  ekrans((k) => {
    k.classList.add('apt-karte--paldies');
    const E = window.EMPANADILLO;
    if (E && E.svg) {
      const v = el('div', 'apt-empa apt-empa--paldies');
      v.innerHTML = E.svg(E.POZAS && E.POZAS.vicina ? 'vicina' : 'miera', { shadow: false, animate: false });
      k.appendChild(v);
    }
    const h = el('h2', 'apt-virsraksts apt-virsraksts--liels', '¡Muchas gracias!');
    h.tabIndex = -1;
    k.appendChild(h);
    if (atkartoti) k.appendChild(el('p', 'apt-teksts', 'Tu aptauju jau aizpildīji. Paldies par atbildēm, tās mums ļoti palīdzēs!'));
    else k.appendChild(el('p', 'apt-teksts', 'Paldies par atbildēm! Tās mums ļoti palīdzēs.'));
    if (izloze) k.appendChild(el('p', 'apt-teksts apt-teksts--info', 'Tu piedalies izlozē par vienu no 3 dāvanām no Tenerifes. Uzvarētājus izlozēsim ' + IZLOZES_DATUMS + ' un informēsim pa e-pastu. 🌴'));
  }, { fokuss: '.apt-virsraksts' });
}

if (Date.now() > Date.parse(BEIGAS)) slegta();
else sakums();
