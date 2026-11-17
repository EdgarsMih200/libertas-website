// Grupu kursa nodarbību satura sagatavošana kursa telpai (kursa-telpa.html).
// Avoti: grupu-kursi-saturs/<kurss>/avoti/NN.html (interaktīvā prezentācija ar `const S = [...]`)
//        vai NN.json ({head, items, homework, S}) + NN.pdf (lejupielādei).
// Rezultāts: grupu-kursi-saturs/<kurss>/NN.json = {nr, nosaukums, temas, bloki, majasdarbs, uzdevumi}
// Uzdevumi (krustvārdu mīkla, vārdu meklēšana, atmiņas spēle, burtu jucekļi, teikumu secība) tiek ģenerēti
// no nodarbības vārdu krājuma un vingrinājumiem, ar fiksētu sēklu (vienmēr vienādi).
// Lietošana: node riki/gk-sagatavot.mjs spain-b1-1 [nr ...]
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const [kurss, ...nri] = process.argv.slice(2);
if (!kurss) { console.error('Lietošana: node riki/gk-sagatavot.mjs <kurss> [nr ...]'); process.exit(1); }
const DIR = path.join('grupu-kursi-saturs', kurss);
const AVOTI = path.join(DIR, 'avoti');

// ---------- avotu nolasīšana ----------
function noHtml(f) {
  const h = fs.readFileSync(f, 'utf8');
  const sc = h.slice(h.lastIndexOf('<script>') + 8);
  const i = sc.indexOf('const S = [');
  const j = sc.indexOf('\n];', i);
  if (i < 0 || j < 0) throw new Error(f + ': nav atrasts `const S = [...]`');
  const S = vm.runInNewContext('const IMG={},BG=[];' + sc.slice(i, j + 3) + ';S', {});
  const ov = S.find((s) => s.type === 'overview') || {};
  let head = ov.head, items = ov.items;
  if (!head) { // vecāks formāts: virsraksts ir overview() HTML
    const m = sc.match(/overview\(s\)\{[\s\S]*?`\}; \}/);
    if (m) {
      const bold = [...m[0].matchAll(/class="ov-bold"[^>]*>([^<]+)</g)].map((x) => x[1].trim());
      head = bold[bold.length - 1];
      items = [...m[0].matchAll(/<p[^>]*>([^<]+)<\/p>/g)].map((x) => x[1].trim());
    }
  }
  let homework = null;
  const hw = sc.match(/homework\(s\)\{[\s\S]*?<p style="margin:0">([\s\S]*?)<\/p>[\s\S]*?<ul class="chk">([\s\S]*?)<\/ul>/);
  if (hw) {
    const tirs = (x) => x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    homework = {
      teksts: tirs(hw[1]).replace(/\s*Raksti šeit – prasības tiek pārbaudītas automātiski!?/, ''),
      prasibas: [...hw[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((x) => tirs(x[1])).filter(Boolean),
    };
  }
  return { head, items, homework, S };
}

// ---------- sēklots nejaušums ----------
function rng(seed) {
  let a = [...seed].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const jaukt = (arr, r) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ---------- vārdu krājums ----------
const ARTIKULI = /^(el|la|los|las|un|una|unos|unas)\s+/i;
const bezIek = (s) => s.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
function pirmaisVariants(s) {
  const d = bezIek(s).split(/\s+\/\s+|\s+o\s+|;\s*/).map((x) => x.trim()).filter(Boolean);
  return d.find((x) => !/^(el|la|los|las)$/i.test(x)) || d[0] || '';
}
const burti = (s) => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function vardnica(S) {
  const pari = [];
  for (const s of S) {
    if (s.type !== 'vocab' || !Array.isArray(s.pairs)) continue;
    if (/rupj|viltīg|eifēm/i.test(s.title || '')) continue; // spēlēs neliekam rupjības un to aizstājējus
    for (const p of s.pairs) {
      const [lv0, es] = s.dir === 'es' ? [p[1], p[0]] : [p[0], p[1]];
      if (/[¡!]/.test(es) || /vulgār/i.test(lv0)) continue; // izsauksmes vārdi nav piemēroti spēlēm
      const lv = lv0.replace(/^(Spānijā|Latīņamerikā|Meksikā):\s*/, '');
      pari.push({ lv: pirmaisVariants(lv), es: pirmaisVariants(es), lvPilns: bezIek(lv), esPilns: bezIek(es), kopa: s.title });
    }
  }
  return pari;
}
// Viena vārda kandidāti (bez artikula) krustvārdiem, meklēšanai, jucekļiem
function vienvardi(pari, min = 4, max = 11) {
  const redz = new Set();
  return pari.map((p) => ({ ...p, vards: p.es.replace(ARTIKULI, '') }))
    .filter((p) => /^[a-záéíóúüñ]+$/i.test(p.vards) && p.vards.length >= min && p.vards.length <= max && p.lv.length <= 40)
    .filter((p) => { const k = burti(p.vards); if (redz.has(k)) return false; redz.add(k); return true; });
}

// ---------- krustvārdu mīkla ----------
function krustvardi(vardi, r) {
  let labakais = null;
  for (let meg = 0; meg < 60; meg++) {
    const sar = jaukt(vardi, r).sort((a, b) => b.burti.length - a.burti.length + (r() - 0.5) * 3);
    const rez = new Map(); // "x,y" -> burts
    const vietas = [];
    const liek = (w, x, y, dx, dy) => { for (let i = 0; i < w.length; i++) rez.set((x + dx * i) + ',' + (y + dy * i), w[i]); };
    const var_likt = (w, x, y, dx, dy) => {
      if (rez.has((x - dx) + ',' + (y - dy)) || rez.has((x + dx * w.length) + ',' + (y + dy * w.length))) return -1;
      let krust = 0;
      for (let i = 0; i < w.length; i++) {
        const cx = x + dx * i, cy = y + dy * i, b = rez.get(cx + ',' + cy);
        if (b) { if (b !== w[i]) return -1; krust++; continue; }
        // blakus šūnas perpendikulāri nedrīkst būt aizņemtas
        if (rez.has((cx + dy) + ',' + (cy + dx)) || rez.has((cx - dy) + ',' + (cy - dx))) return -1;
      }
      return krust;
    };
    const [pirmais, ...citi] = sar;
    liek(pirmais.burti, 0, 0, 1, 0); vietas.push({ ...pirmais, x: 0, y: 0, virziens: 'h' });
    for (const v of citi) {
      let lab = null;
      for (const p of vietas) for (let i = 0; i < p.burti.length; i++) for (let j = 0; j < v.burti.length; j++) {
        if (p.burti[i] !== v.burti[j]) continue;
        const [dx, dy] = p.virziens === 'h' ? [0, 1] : [1, 0];
        const px = p.x + (p.virziens === 'h' ? i : 0), py = p.y + (p.virziens === 'v' ? i : 0);
        const x = px - dx * j, y = py - dy * j;
        const k = var_likt(v.burti, x, y, dx, dy);
        if (k > 0) {
          const xs = vietas.flatMap((q) => [q.x, q.x + (q.virziens === 'h' ? q.burti.length : 1)]).concat([x, x + (dx ? v.burti.length : 1)]);
          const ys = vietas.flatMap((q) => [q.y, q.y + (q.virziens === 'v' ? q.burti.length : 1)]).concat([y, y + (dy ? v.burti.length : 1)]);
          const lauk = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
          const s = k * 100 - lauk - Math.abs((Math.max(...xs) - Math.min(...xs)) - (Math.max(...ys) - Math.min(...ys))) * 4;
          if (!lab || s > lab.s) lab = { s, x, y, virziens: dx ? 'h' : 'v' };
        }
      }
      if (lab) { liek(v.burti, lab.x, lab.y, lab.virziens === 'h' ? 1 : 0, lab.virziens === 'v' ? 1 : 0); vietas.push({ ...v, x: lab.x, y: lab.y, virziens: lab.virziens }); }
    }
    const minX = Math.min(...vietas.map((v) => v.x)), minY = Math.min(...vietas.map((v) => v.y));
    vietas.forEach((v) => { v.x -= minX; v.y -= minY; });
    const plat = Math.max(...vietas.map((v) => v.x + (v.virziens === 'h' ? v.burti.length : 1)));
    const augst = Math.max(...vietas.map((v) => v.y + (v.virziens === 'v' ? v.burti.length : 1)));
    const vertejums = vietas.length * 1000 - plat * augst - Math.abs(plat - augst) * 10 - (plat > 15 ? 5000 : 0);
    if (!labakais || vertejums > labakais.vertejums) labakais = { vertejums, vietas, plat, augst };
  }
  // numerācija: pēc rindas, tad kolonnas
  const { vietas, plat, augst } = labakais;
  const sakumi = [...new Set(vietas.map((v) => v.y * 100 + v.x))].sort((a, b) => a - b);
  vietas.forEach((v) => { v.n = sakumi.indexOf(v.y * 100 + v.x) + 1; });
  vietas.sort((a, b) => (a.virziens === b.virziens ? a.n - b.n : a.virziens === 'h' ? -1 : 1));
  return { platums: plat, augstums: augst, vardi: vietas.map((v) => ({ n: v.n, x: v.x, y: v.y, virziens: v.virziens, atbilde: v.burti, vards: v.vards, jautajums: v.lv })) };
}

// ---------- vārdu meklēšana ----------
const ALFABETS = 'AAAAABCCDDEEEEEFGHIIIJLLLMMNNNOOOOPQRRRSSSSTTUUVYZ';
function meklesana(vardi, r, izm = 12) {
  for (let meg = 0; meg < 200; meg++) {
    const rez = Array.from({ length: izm }, () => Array(izm).fill(''));
    const virzieni = [[1, 0], [0, 1], [1, 1], [1, -1]];
    const vietas = [];
    let ok = true;
    for (const v of jaukt(vardi, r).sort((a, b) => b.burti.length - a.burti.length)) {
      let lik = false;
      for (let t = 0; t < 300 && !lik; t++) {
        const [dx, dy] = virzieni[Math.floor(r() * virzieni.length)];
        const L = v.burti.length;
        const x = Math.floor(r() * izm), y = Math.floor(r() * izm);
        const ex = x + dx * (L - 1), ey = y + dy * (L - 1);
        if (ex < 0 || ex >= izm || ey < 0 || ey >= izm) continue;
        let der = true;
        for (let i = 0; i < L; i++) { const c = rez[y + dy * i][x + dx * i]; if (c && c !== v.burti[i]) { der = false; break; } }
        if (!der) continue;
        for (let i = 0; i < L; i++) rez[y + dy * i][x + dx * i] = v.burti[i];
        vietas.push({ vards: v.vards, atbilde: v.burti, jautajums: v.lv, x, y, dx, dy });
        lik = true;
      }
      if (!lik) { ok = false; break; }
    }
    if (!ok) continue;
    const rindas = rez.map((row) => row.map((c) => c || ALFABETS[Math.floor(r() * ALFABETS.length)]).join(''));
    vietas.sort((a, b) => a.jautajums.localeCompare(b.jautajums, 'lv'));
    return { izmers: izm, rindas, vardi: vietas };
  }
  throw new Error('Neizdevās izveidot vārdu meklēšanu');
}

// ---------- teikumi secībai ----------
function teikumi(S) {
  const out = [];
  for (const s of S) {
    if (s.type === 'fill') for (const it of s.items || []) out.push(it.replace(/\{([^}|]+)(\|[^}]*)?\}/g, '$1'));
    if (s.type === 'choice') for (const it of s.items || []) if (it.a) out.push(String(it.q).replace(/\[[^\]]*\]/, it.a));
  }
  return out.map((t) => t.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim())
    .filter((t) => !/[{}[\]/_…]|\.\.\./.test(t) && /[.!?]$/.test(t))
    .filter((t) => { const n = t.split(' ').length; return n >= 5 && n <= 10; });
}

// ---------- viena nodarbība ----------
function sagatavot(nr) {
  const nn = String(nr).padStart(2, '0');
  const fHtml = path.join(AVOTI, nn + '.html'), fJson = path.join(AVOTI, nn + '.json');
  const avots = fs.existsSync(fJson) ? JSON.parse(fs.readFileSync(fJson, 'utf8')) : noHtml(fHtml);
  const S = avots.S;
  const r = rng(kurss + ':' + nr);
  const pari = vardnica(S);
  const vv = jaukt(vienvardi(pari), r);
  if (vv.length < 18) console.warn(`  ! ${nn}: tikai ${vv.length} viena vārda kandidāti`);
  const izmantoti = new Set();
  const nemt = (sar, n, filtrs = () => true) => { const o = []; for (const p of sar) { if (o.length >= n) break; if (izmantoti.has(p.vards) || !filtrs(p)) continue; o.push(p); izmantoti.add(p.vards); } return o; };

  const kv = krustvardi(nemt(vv, 12, (p) => p.vards.length >= 4 && p.vards.length <= 10).map((p) => ({ ...p, burti: burti(p.vards) })), r);
  const vm_ = meklesana(nemt(vv, 9, (p) => p.vards.length >= 4 && p.vards.length <= 9).map((p) => ({ ...p, burti: burti(p.vards) })), r);
  const juc = nemt(vv, 8, (p) => p.vards.length >= 5 && p.vards.length <= 10).map((p) => {
    let j; do { j = jaukt([...p.vards.toLowerCase()], r).join(''); } while (j === p.vards.toLowerCase());
    return { vards: p.vards.toLowerCase(), jauktie: j, jautajums: p.lv };
  });
  const atm = jaukt(pari.filter((p) => p.esPilns.length <= 30 && p.lv.length <= 30 && !izmantoti.has(p.es.replace(ARTIKULI, ''))), r)
    .filter((p, i, a) => a.findIndex((q) => q.es === p.es || q.lv === p.lv) === i).slice(0, 8).map((p) => [p.lv, p.es]);
  const sek = jaukt(teikumi(S), r).slice(0, 6);

  const uzdevumi = [
    { id: 'krustvardi', tips: 'krustvardi', virsraksts: 'Krustvārdu mīkla', apraksts: 'Ieraksti spāņu vārdus pēc latviskajiem jautājumiem. Garumzīmes nav jāraksta.', ...kv },
    { id: 'vardu-meklesana', tips: 'meklesana', virsraksts: 'Vārdu meklēšana', apraksts: 'Atrodi tabulā spāņu vārdus: noklikšķini uz pirmā un pēdējā burta. Vārdi iet → ↓ ↘ ↗.', ...vm_ },
    { id: 'atmina', tips: 'atmina', virsraksts: 'Atmiņas spēle', apraksts: 'Apgriez kartītes un atrodi pārus: latviski ↔ spāniski.', pari: atm },
    { id: 'jucekli', tips: 'jucekli', virsraksts: 'Burtu jucekļi', apraksts: 'Saliec burtus pareizā secībā, lai iegūtu spāņu vārdu.', vardi: juc },
  ];
  if (sek.length >= 4) uzdevumi.push({ id: 'seciba', tips: 'seciba', virsraksts: 'Saliec teikumu', apraksts: 'Spied uz vārdiem pareizā secībā, lai saliktu teikumu.', teikumi: sek });

  const bloki = S.filter((s) => !['img', 'overview', 'homework'].includes(s.type));
  const out = {
    nr, nosaukums: avots.head || `${nr}. nodarbība`, temas: avots.items || [],
    bloki, majasdarbs: avots.homework || null, uzdevumi,
  };
  const fOut = path.join(DIR, nn + '.json');
  fs.writeFileSync(fOut, JSON.stringify(out));
  console.log(`✓ ${nn}: «${out.nosaukums}» · ${bloki.length} bloki · krustvārdi ${kv.vardi.length} · meklēšana ${vm_.vardi.length} · atmiņa ${atm.length} · jucekļi ${juc.length} · teikumi ${sek.length} · ${(fs.statSync(fOut).size / 1024).toFixed(0)} KB`);
}

const visi = fs.readdirSync(AVOTI).map((f) => f.match(/^(\d{2})\.(html|json)$/)).filter(Boolean).map((m) => Number(m[1]));
const kuri = nri.length ? nri.map(Number) : [...new Set(visi)].sort((a, b) => a - b);
for (const nr of kuri) sagatavot(nr);
