// Kursu grafiks: grupu periodi, aprēķināti pēc cikla, bez nodarbībām Latvijas svētku dienās.
// ES modulis — to lieto gan pārlūks (script.js ar import('/grafiks.js'), kursu lapas), gan Worker (pieteikuma pārbaude).
//
// Noteikumi:
// - Katru gadu pirmā grupa sākas pirmajā pirmdienā, sākot no 10. janvāra (2027: 11.01.).
// - Gadā 6 bloki: 7 nedēļas kursi + 2 nedēļas pauze (bloks = 9 nedēļas).
// - Katram kursam 14 nodarbības (2× nedēļā, 18:00–21:00). Ja nodarbība krīt svētku dienā, tā pārceļas
//   uz nākamo tās pašas grupas nodarbības dienu (kurss beidzas dažas dienas vēlāk, pauzes laikā).
// - Bloku cikls (atkārtojas nepārtraukti, arī pāri gadu mijai, lai grupas var turpināt nākamo līmeni tajās pašās dienās):
//     1) B1.2 (O/C) + A1 (P/T)   2) A1 (O/C) + A2 (P/T)   3) A2 (O/C) + B1.1 (P/T)   4) B1.1 (O/C) + B1.2 (P/T)
// - Angļu kursiem grafiks vēl nav: tiem periods = "nākamā grupa, datumi tiks precizēti".

export const SAKUMA_GADS = 2027;
export const LAIKS = '18:00–21:00';
export const NODARBIBAS = 14;
const BLOKI_GADA = 6;
const BLOKA_NEDELAS = 9;

export const DIENAS = {
  'pr-tr': { dienas: [1, 3], teksts: 'Pirmdienās un trešdienās', iss: 'P un T' },
  'ot-ce': { dienas: [2, 4], teksts: 'Otrdienās un ceturtdienās', iss: 'O un C' },
};

const CIKLS = [
  { 'spain-b1-2': 'ot-ce', 'spain-a1': 'pr-tr' },
  { 'spain-a1': 'ot-ce', 'spain-a2': 'pr-tr' },
  { 'spain-a2': 'ot-ce', 'spain-b1-1': 'pr-tr' },
  { 'spain-b1-1': 'ot-ce', 'spain-b1-2': 'pr-tr' },
];

export const AR_GRAFIKU = ['spain-a1', 'spain-a2', 'spain-b1-1', 'spain-b1-2'];

// Valdības papildu brīvdienas (pārceltās darba dienas u. c.), ja tādas izsludina: 'YYYY-MM-DD'.
// 2027. gadā darba dienas netiek pārceltas (Labklājības ministrija, 14.10.2026.).
export const PAPILDU_BRIVDIENAS = [];

// ---------- datumi (UTC, lai nav laika joslu nobīžu) ----------
const D = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const iso = (dt) => dt.toISOString().slice(0, 10);
const plus = (dt, n) => new Date(dt.getTime() + n * 86400000);
export const noIso = (s) => { const [y, m, d] = s.split('-').map(Number); return D(y, m, d); };

function lieldienas(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const men = Math.floor((h + l - 7 * m + 114) / 31), diena = ((h + l - 7 * m + 114) % 31) + 1;
  return D(y, men, diena);
}

// Latvijas svētku dienas (likums "Par svētku, atceres un atzīmējamām dienām"), kas var krist darba dienās
const brivKesh = new Map();
export function brivdienas(y) {
  if (brivKesh.has(y)) return brivKesh.get(y);
  const l = lieldienas(y);
  const m = new Map();
  const pievienot = (dt, nos) => m.set(iso(dt), nos);
  pievienot(D(y, 1, 1), 'Jaungada diena');
  pievienot(plus(l, -2), 'Lielā Piektdiena');
  pievienot(l, 'Lieldienas');
  pievienot(plus(l, 1), 'Otrās Lieldienas');
  pievienot(D(y, 5, 1), 'Darba svētki');
  // 4. maijs un 18. novembris: ja krīt brīvdienā, brīva nākamā pirmdiena
  [[D(y, 5, 4), 'Neatkarības atjaunošanas diena'], [D(y, 11, 18), 'Latvijas Republikas proklamēšanas diena']].forEach(([dt, nos]) => {
    pievienot(dt, nos);
    const wd = dt.getUTCDay();
    if (wd === 6) pievienot(plus(dt, 2), nos + ' (pārcelta)');
    if (wd === 0) pievienot(plus(dt, 1), nos + ' (pārcelta)');
  });
  pievienot(D(y, 6, 23), 'Līgo diena');
  pievienot(D(y, 6, 24), 'Jāņu diena');
  pievienot(D(y, 12, 24), 'Ziemassvētku vakars');
  pievienot(D(y, 12, 25), 'Ziemassvētki');
  pievienot(D(y, 12, 26), 'Otrie Ziemassvētki');
  pievienot(D(y, 12, 31), 'Vecgada diena');
  PAPILDU_BRIVDIENAS.forEach((s) => { if (s.startsWith(y + '-')) m.set(s, 'Papildu brīvdiena'); });
  brivKesh.set(y, m);
  return m;
}
export function svetki(dt) { return brivdienas(dt.getUTCFullYear()).get(iso(dt)) || null; }

// Gada pirmā bloka sākums: pirmā pirmdiena no 10. janvāra
function gadaSakums(y) {
  const d = D(y, 1, 10);
  return plus(d, (8 - d.getUTCDay()) % 7);
}

// Viena grupa: 14 nodarbības no bloka pirmdienas, izlaižot svētku dienas
function grupa(kurssId, sakumaPirmdiena, dienasKods) {
  const ned = DIENAS[dienasKods].dienas;
  const nodarbibas = [];
  const izlaistas = [];
  let dt = sakumaPirmdiena;
  while (nodarbibas.length < NODARBIBAS) {
    if (ned.includes(dt.getUTCDay())) {
      const s = svetki(dt);
      if (s) izlaistas.push({ datums: iso(dt), svetki: s });
      else nodarbibas.push(iso(dt));
    }
    dt = plus(dt, 1);
  }
  return {
    id: nodarbibas[0],
    kurss: kurssId,
    sakums: nodarbibas[0],
    beigas: nodarbibas[nodarbibas.length - 1],
    dienas: dienasKods,
    dienasTeksts: DIENAS[dienasKods].teksts,
    laiks: LAIKS,
    nodarbibas,
    izlaistas,
  };
}

// Visas kursa grupas gadā
export function gadaPeriodi(kurssId, y) {
  if (y < SAKUMA_GADS) return [];
  const out = [];
  const s = gadaSakums(y);
  for (let i = 0; i < BLOKI_GADA; i++) {
    const k = (y - SAKUMA_GADS) * BLOKI_GADA + i;
    const dk = CIKLS[k % CIKLS.length][kurssId];
    if (dk) out.push(grupa(kurssId, plus(s, i * BLOKA_NEDELAS * 7), dk));
  }
  return out;
}

// Nākamās grupas, kurām vēl var pieteikties (sākums šodien vai vēlāk)
export function periodi(kurssId, { no = new Date(), skaits = 3 } = {}) {
  if (!AR_GRAFIKU.includes(kurssId)) return [];
  const sodien = iso(no);
  const out = [];
  for (let y = Math.max(SAKUMA_GADS, no.getUTCFullYear()); out.length < skaits && y < SAKUMA_GADS + 50; y++) {
    gadaPeriodi(kurssId, y).forEach((p) => { if (p.sakums >= sodien && out.length < skaits) out.push(p); });
  }
  return out;
}

// Pieteikuma pārbaudei: periods pēc sākuma datuma (vai null)
export function atrastPeriodu(kurssId, sakums) {
  if (typeof sakums !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(sakums)) return null;
  const y = Number(sakums.slice(0, 4));
  return gadaPeriodi(kurssId, y).find((p) => p.sakums === sakums) || null;
}

// "11.01.2027."
export function datums(s) { const [y, m, d] = s.split('-'); return `${d}.${m}.${y}.`; }
// "11.01.2027.–25.02.2027."
export function periodaDatumi(p) { return `${datums(p.sakums)}–${datums(p.beigas)}`; }
// "11.01.2027.–25.02.2027. · Pirmdienās un trešdienās 18:00–21:00"
export function periodaTeksts(p) { return `${periodaDatumi(p)} · ${p.dienasTeksts} ${p.laiks}`; }
