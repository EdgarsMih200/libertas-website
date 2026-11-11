// E-kursi (pašmācība): piekļuve, nodarbības, testi un eksāmens ar vērtēšanu serverī, sertifikāti, īpašnieka iestatījumi.
// Saturs: D1 ek_saturs (riki/ek-augsupladet.mjs). Pareizās atbildes testiem/eksāmenam pārlūkam netiek sūtītas.
import { sutit } from './epasts.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400, extra = {}) => json({ error: msg, ...extra }, status);
async function readBody(request) { try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; } }

const SLIEKSNIS = 80;
const DIENA = 86400000;
const nowIso = () => new Date().toISOString();

// ---------- saturs ----------
async function saturs(env, kurss, fails) {
  const { results } = await env.DB.prepare('SELECT json FROM ek_saturs WHERE kurss = ? AND fails = ? ORDER BY gabals').bind(kurss, fails).all();
  return results.length ? JSON.parse(results.map((r) => r.json).join('')) : null;
}
const nodFails = (nr) => `nodarbiba-${String(nr).padStart(2, '0')}`;
const getKurss = (env, id) => env.DB.prepare("SELECT * FROM courses WHERE id = ? AND veids = 'ekurss'").bind(id).first();

// ---------- piekļuve ----------
async function piekluve(env, user, kurss) {
  if (!user) return { ok: false, iemesls: 'ienakt' };
  const enr = await env.DB.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').bind(user.id, kurss).first();
  if (user.is_admin) return { ok: true, admin: true, enr };
  if (!enr || enr.status === 'atteicies') return { ok: false, iemesls: 'nav', enr };
  if (!enr.paid) return { ok: false, iemesls: 'apmaksa', enr };
  if (!enr.ek_lidz || enr.ek_lidz < nowIso()) return { ok: false, iemesls: 'beigusies', enr };
  return { ok: true, enr };
}
async function progresaKarte(env, userId, kurss) {
  const { results } = await env.DB.prepare('SELECT * FROM ek_progress WHERE user_id = ? AND kurss = ?').bind(userId, kurss).all();
  return Object.fromEntries(results.map((r) => [r.nr, { ...r, dalas: JSON.parse(r.dalas || '[]'), pasvertejums: r.pasvertejums ? JSON.parse(r.pasvertejums) : null }]));
}
function atverta(plans, prog, nr, admin) {
  if (admin) return true;
  const i = plans.nodarbibas.findIndex((n) => n.nr === nr);
  if (i < 0) return false;
  return i === 0 || !!prog[plans.nodarbibas[i - 1].nr]?.nokartots_at;
}
const visiNokartoti = (plans, prog) => plans.nodarbibas.every((n) => prog[n.nr]?.nokartots_at);

// ---------- uzdevumi ----------
const jaukt = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function jauktCiti(a) { if (a.length < 2) return [...a]; for (let k = 0; k < 6; k++) { const b = jaukt(a); if (b.some((x, i) => x !== a[i])) return b; } return [...a].reverse(); }

// Uzdevums pārlūkam bez atbildēm
function klientam(u) {
  const { atbilde, atbildes, skaidrojums, pari, elementi, kategorijas, nodarbibas, ...r } = u;
  if (u.tips === 'pari') { r.kreisie = pari.map((p) => p[0]); r.labie = jauktCiti(pari.map((p) => p[1])); }
  if (u.tips === 'seciba') r.elementi = jauktCiti(elementi);
  if (u.tips === 'kategorijas') { r.kategorijas = Object.keys(kategorijas); r.vienumi = jaukt(Object.values(kategorijas).flat()); }
  if (u.tips === 'tuksumi') r.tuksumi = atbildes.length;
  return r;
}
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFC').replace(/[.,!?¡¿;:"'’«»“”()]/g, ' ').replace(/\s+/g, ' ').trim();
const sakrit = (a, alt) => typeof a === 'string' && String(alt).split('|').map(norm).includes(norm(a));
function vertet(u, a) {
  switch (u.tips) {
    case 'izvele': return a === u.atbilde ? 1 : 0;
    case 'klausies': return u.varianti ? (a === u.atbilde ? 1 : 0) : (sakrit(a, u.atbilde) ? 1 : 0);
    case 'vairakas': return Array.isArray(a) && a.length === u.atbildes.length && u.atbildes.every((x) => a.includes(x)) ? 1 : 0;
    case 'ievadi': return sakrit(a, u.atbilde) ? 1 : 0;
    case 'tuksumi': return Array.isArray(a) ? u.atbildes.filter((alt, i) => sakrit(a[i], alt)).length / u.atbildes.length : 0;
    case 'pari': return Array.isArray(a) ? u.pari.filter((p, i) => a[i] === p[1]).length / u.pari.length : 0;
    case 'seciba': return Array.isArray(a) && a.length === u.elementi.length && a.every((x, i) => x === u.elementi[i]) ? 1 : 0;
    case 'kategorijas': {
      if (!a || typeof a !== 'object') return 0;
      const visi = Object.entries(u.kategorijas).flatMap(([k, v]) => v.map((x) => [x, k]));
      return visi.filter(([x, k]) => a[x] === k).length / visi.length;
    }
    default: return 0;
  }
}
function pareizaAtbilde(u) {
  const pirma = (s) => String(s).split('|')[0];
  switch (u.tips) {
    case 'izvele': return u.varianti[u.atbilde];
    case 'klausies': return u.varianti ? u.varianti[u.atbilde] : pirma(u.atbilde);
    case 'vairakas': return u.atbildes.map((i) => u.varianti[i]).join(', ');
    case 'ievadi': return pirma(u.atbilde);
    case 'tuksumi': return u.atbildes.map(pirma).join(' · ');
    case 'pari': return u.pari.map((p) => `${p[0]} — ${p[1]}`).join('; ');
    case 'seciba': return u.elementi.join(' ');
    case 'kategorijas': return Object.entries(u.kategorijas).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ');
    default: return '';
  }
}

// Izvēle: neredzētie vispirms; eksāmenam — pa prasmēm pēc kārtas (proporcionāli)
function izveleties(banka, n, redzetie, pecPrasmem) {
  const sakartot = (a) => jaukt(a).sort((x, y) => redzetie.has(x.id) - redzetie.has(y.id));
  if (!pecPrasmem) return sakartot(banka).slice(0, n);
  const grupas = Object.values(banka.reduce((g, u) => ((g[u.prasme] ||= []).push(u), g), {})).map(sakartot);
  const rez = [];
  for (let i = 0; rez.length < n && grupas.some((g) => g.length > i); i++)
    for (const g of jaukt(grupas)) if (g[i] && rez.length < n) rez.push(g[i]);
  return jaukt(rez);
}
async function redzetie(env, userId, kurss, veids, nr) {
  const { results } = await env.DB.prepare(
    `SELECT jautajumi FROM ek_meginajumi WHERE user_id = ? AND kurss = ? AND veids = ? AND ${nr == null ? 'nr IS NULL' : 'nr = ?'} AND iesniegts_at IS NOT NULL ORDER BY id DESC LIMIT 2`
  ).bind(...[userId, kurss, veids, ...(nr == null ? [] : [nr])]).all();
  return new Set(results.flatMap((r) => JSON.parse(r.jautajumi).map((u) => u.id)));
}
async function atvertsMeginajums(env, userId, kurss, veids, nr) {
  return env.DB.prepare(
    `SELECT * FROM ek_meginajumi WHERE user_id = ? AND kurss = ? AND veids = ? AND ${nr == null ? 'nr IS NULL' : 'nr = ?'} AND iesniegts_at IS NULL ORDER BY id DESC LIMIT 1`
  ).bind(...[userId, kurss, veids, ...(nr == null ? [] : [nr])]).first();
}
async function sakt(env, userId, kurss, veids, nr, izvele) {
  const atv = await atvertsMeginajums(env, userId, kurss, veids, nr);
  if (atv) return { id: atv.id, jautajumi: JSON.parse(atv.jautajumi), turpinats: true };
  const jaut = izvele.map(klientam);
  const r = await env.DB.prepare('INSERT INTO ek_meginajumi (user_id, kurss, veids, nr, jautajumi, sakts_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(userId, kurss, veids, nr, JSON.stringify(jaut), nowIso()).run();
  return { id: r.meta.last_row_id, jautajumi: jaut };
}
async function vertetMeginajumu(env, userId, body, veids, banka) {
  const m = await env.DB.prepare('SELECT * FROM ek_meginajumi WHERE id = ? AND user_id = ? AND veids = ?').bind(Number(body.id), userId, veids).first();
  if (!m) return { kluda: fail('Mēģinājums nav atrasts', 404) };
  if (m.iesniegts_at) return { kluda: fail('Šis mēģinājums jau iesniegts', 409) };
  const atb = body.atbildes && typeof body.atbildes === 'object' ? body.atbildes : {};
  const pecId = new Map(banka.map((u) => [u.id, u]));
  const jaut = JSON.parse(m.jautajumi);
  let summa = 0;
  const vertejums = jaut.map((j) => {
    const u = pecId.get(j.id);
    const p = u ? vertet(u, atb[j.id]) : 0;
    summa += p;
    return { id: j.id, u, punkti: p };
  });
  const rezultats = Math.round((summa / (jaut.length || 1)) * 100);
  await env.DB.prepare('UPDATE ek_meginajumi SET atbildes = ?, rezultats = ?, iesniegts_at = ? WHERE id = ?')
    .bind(JSON.stringify(atb).slice(0, 100000), rezultats, nowIso(), m.id).run();
  return { m, rezultats, vertejums, pareizi: vertejums.filter((v) => v.punkti === 1).length, kopa: jaut.length };
}

// ---------- eksāmena statuss ----------
async function eksamenaStatuss(env, user, kurss, course, enr, plans, prog, admin) {
  const { results } = await env.DB.prepare(
    "SELECT rezultats, iesniegts_at FROM ek_meginajumi WHERE user_id = ? AND kurss = ? AND veids = 'eksamens' AND iesniegts_at IS NOT NULL ORDER BY id"
  ).bind(user.id, kurss).all();
  const slieksnis = plans.eksamens?.slieksnis || SLIEKSNIS;
  const limits = admin && !enr ? 99 : (enr?.ek_eks_limits ?? course.ek_meginajumi ?? 3);
  const pedejais = results[results.length - 1];
  const pauzeLidz = pedejais ? new Date(Date.parse(pedejais.iesniegts_at) + (course.ek_pauze_h ?? 24) * 3600000).toISOString() : null;
  const nokartots = results.some((r) => r.rezultats >= slieksnis);
  const atv = await atvertsMeginajums(env, user.id, kurss, 'eksamens', null);
  return {
    jautajumi: plans.eksamens?.jautajumi || 40, slieksnis,
    atverts: admin || visiNokartoti(plans, prog),
    izmantoti: results.length, limits,
    labakais: results.length ? Math.max(...results.map((r) => r.rezultats)) : null,
    pedejais: pedejais?.rezultats ?? null,
    nakamais_no: !nokartots && pauzeLidz && pauzeLidz > nowIso() && !admin ? pauzeLidz : null,
    nokartots, iesakts: !!atv,
    pauze_h: course.ek_pauze_h ?? 24, papildu_cena: course.ek_papildu_cena, pieprasijums: enr?.ek_pieprasijums || null,
  };
}
const sertifikats = (env, userId, kurss) => env.DB.prepare('SELECT * FROM ek_sertifikati WHERE user_id = ? AND kurss = ?').bind(userId, kurss).first();

// ---------- publiskie ----------
async function kursuSaraksts(env, user, visi) {
  const { results } = await env.DB.prepare(`SELECT * FROM courses WHERE veids = 'ekurss' ${visi ? '' : 'AND active = 1'} ORDER BY name`).all();
  const kursi = [];
  for (const c of results) {
    const p = await saturs(env, c.id, 'plans');
    if (!p) continue;
    kursi.push({
      id: c.id, nosaukums: c.name, cena: c.price_eur, dienas: c.ek_dienas, meginajumi: c.ek_meginajumi, pauze_h: c.ek_pauze_h,
      papildu_cena: c.ek_papildu_cena, aktivs: !!c.active,
      limenis: p.limenis, valoda: p.valoda, apraksts: p.apraksts, stundas: p.stundas, prasmes: p.prasmes,
      nodarbibas: p.nodarbibas.map((n) => ({ nr: n.nr, nosaukums: n.nosaukums, merki: n.merki, dalas: (n.dalas || []).map((d) => d.nosaukums) })),
      eksamens: p.eksamens,
    });
  }
  return json({ kursi });
}
async function parbauditSertifikatu(env, kods) {
  const s = await env.DB.prepare('SELECT kods, vards, kursa_nosaukums, datums, rezultats, stundas, nodarbibas FROM ek_sertifikati WHERE kods = ?').bind(kods).first();
  return s ? json({ sertifikats: s }) : fail('Sertifikāts nav atrasts', 404);
}

// ---------- dalībnieks ----------
async function parskats(env, user, kurss) {
  const course = await getKurss(env, kurss);
  if (!course) return fail('Kurss nav atrasts', 404);
  const pk = await piekluve(env, user, kurss);
  const plans = await saturs(env, kurss, 'plans');
  if (!plans) return fail('Kursa saturs vēl nav publicēts', 404);
  const pamata = { id: kurss, nosaukums: course.name, limenis: plans.limenis, valoda: plans.valoda, cena: course.price_eur, dienas: course.ek_dienas };
  if (!pk.ok) {
    const s = user ? await sertifikats(env, user.id, kurss) : null;
    return json({ kurss: pamata, piekluve: { ok: false, iemesls: pk.iemesls, lidz: pk.enr?.ek_lidz || null }, sertifikats: s });
  }
  const prog = await progresaKarte(env, user.id, kurss);
  const eks = await eksamenaStatuss(env, user, kurss, course, pk.enr, plans, prog, pk.admin);
  const s = await sertifikats(env, user.id, kurss);
  return json({
    kurss: { ...pamata, apraksts: plans.apraksts, stundas: plans.stundas, prasmes: plans.prasmes,
      nodarbibas: plans.nodarbibas.map((n) => ({ nr: n.nr, nosaukums: n.nosaukums, merki: n.merki, temas: n.temas,
        dalas: (n.dalas || []).map((d) => ({ nosaukums: d.nosaukums, ilgums_min: d.ilgums_min })), atverta: atverta(plans, prog, n.nr, pk.admin) })) },
    piekluve: { ok: true, admin: !!pk.admin, lidz: pk.enr?.ek_lidz || null },
    progress: prog, eksamens: eks, sertifikats: s,
    resursi: eks.nokartots || pk.admin ? await saturs(env, kurss, 'resursi') : null,
    lietotajs: { vards: user.name || '' },
  });
}

async function nodarbiba(env, user, kurss, nr) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok) return fail('Nav piekļuves šim kursam', 403, { iemesls: pk.iemesls });
  const plans = await saturs(env, kurss, 'plans');
  const prog = await progresaKarte(env, user.id, kurss);
  if (!atverta(plans, prog, nr, pk.admin)) return fail('Šī nodarbība vēl nav atvērta — nokārto iepriekšējās nodarbības testu', 403, { iemesls: 'slegta' });
  const n = await saturs(env, kurss, nodFails(nr));
  if (!n) return fail('Nodarbība nav atrasta', 404);
  // Iesildīšanās atkārtojums: 3 uzdevumi no 1–2 iepriekšējo (jau nokārtoto) nodarbību testu bankām
  const i = plans.nodarbibas.findIndex((x) => x.nr === nr);
  const ieprieks = plans.nodarbibas.slice(Math.max(0, i - 2), i);
  const atk = [];
  for (const p of ieprieks) { const pn = await saturs(env, kurss, nodFails(p.nr)); if (pn?.tests?.banka) atk.push(...pn.tests.banka); }
  const { tests, ...bez } = n;
  return json({
    nodarbiba: { ...bez, tests: { jautajumi: tests?.jautajumi || 0 } },
    atkartojums: jaukt(atk).slice(0, 3),
    progress: prog[nr] || null,
    nakama: plans.nodarbibas[i + 1]?.nr || null,
    kurss: { id: kurss, nosaukums: plans.nosaukums, valoda: plans.valoda },
  });
}

async function saglabatProgresu(request, env, user, kurss, nr) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok) return fail('Nav piekļuves', 403);
  const b = await readBody(request);
  const cur = (await progresaKarte(env, user.id, kurss))[nr];
  const dalas = new Set(cur?.dalas || []);
  if (typeof b.dala === 'string' && b.dala.length < 20) dalas.add(b.dala);
  const pasv = b.pasvertejums && typeof b.pasvertejums === 'object' ? JSON.stringify(b.pasvertejums).slice(0, 2000) : (cur?.pasvertejums ? JSON.stringify(cur.pasvertejums) : null);
  const piez = typeof b.piezime === 'string' ? b.piezime.slice(0, 4000) : (cur?.piezime ?? null);
  await env.DB.prepare(`INSERT INTO ek_progress (user_id, kurss, nr, dalas, pasvertejums, piezime, atjaunots) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (user_id, kurss, nr) DO UPDATE SET dalas = excluded.dalas, pasvertejums = excluded.pasvertejums, piezime = excluded.piezime, atjaunots = excluded.atjaunots`)
    .bind(user.id, kurss, nr, JSON.stringify([...dalas]), pasv, piez, nowIso()).run();
  return json({ ok: true, dalas: [...dalas] });
}

async function testsSakt(env, user, kurss, nr) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok) return fail('Nav piekļuves', 403);
  const plans = await saturs(env, kurss, 'plans');
  const prog = await progresaKarte(env, user.id, kurss);
  if (!atverta(plans, prog, nr, pk.admin)) return fail('Nodarbība vēl nav atvērta', 403);
  const n = await saturs(env, kurss, nodFails(nr));
  if (!n?.tests?.banka?.length) return fail('Testa nav', 404);
  const izv = izveleties(n.tests.banka, n.tests.jautajumi, await redzetie(env, user.id, kurss, 'tests', nr), false);
  return json({ meginajums: await sakt(env, user.id, kurss, 'tests', nr, izv), slieksnis: SLIEKSNIS });
}

async function testsIesniegt(request, env, user, kurss, nr) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok) return fail('Nav piekļuves', 403);
  const n = await saturs(env, kurss, nodFails(nr));
  const v = await vertetMeginajumu(env, user.id, await readBody(request), 'tests', n.tests.banka);
  if (v.kluda) return v.kluda;
  if (v.m.nr !== nr) return fail('Nepareiza nodarbība');
  const nokartots = v.rezultats >= SLIEKSNIS;
  await env.DB.prepare(`INSERT INTO ek_progress (user_id, kurss, nr, tests_labakais, nokartots_at, atjaunots) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (user_id, kurss, nr) DO UPDATE SET tests_labakais = MAX(COALESCE(tests_labakais, 0), excluded.tests_labakais),
      nokartots_at = COALESCE(nokartots_at, excluded.nokartots_at), atjaunots = excluded.atjaunots`)
    .bind(user.id, kurss, nr, v.rezultats, nokartots ? nowIso() : null, nowIso()).run();
  return json({
    rezultats: v.rezultats, pareizi: v.pareizi, kopa: v.kopa, nokartots, slieksnis: SLIEKSNIS,
    kludas: v.vertejums.filter((x) => x.punkti < 1).map((x) => ({ id: x.id, saite: x.u?.saite || null, prasme: x.u?.prasme })),
    // Pareizās atbildes un skaidrojumi — tikai pēc nokārtošanas (citādi tests iemācās no galvas)
    atbildes: nokartots ? v.vertejums.map((x) => ({ id: x.id, pareiza: x.u ? pareizaAtbilde(x.u) : '', skaidrojums: x.u?.skaidrojums || '', ok: x.punkti === 1 })) : null,
  });
}

async function eksamensSakt(env, user, kurss) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok) return fail('Nav piekļuves', 403);
  const course = await getKurss(env, kurss);
  const plans = await saturs(env, kurss, 'plans');
  const prog = await progresaKarte(env, user.id, kurss);
  const st = await eksamenaStatuss(env, user, kurss, course, pk.enr, plans, prog, pk.admin);
  if (!st.atverts) return fail('Eksāmens atveras, kad nokārtoti visu nodarbību testi', 403, { kods: 'slegts' });
  if (st.nokartots && !pk.admin) return fail('Eksāmens jau nokārtots', 409, { kods: 'nokartots' });
  if (!st.iesakts) {
    if (st.izmantoti >= st.limits) return fail('Visi eksāmena mēģinājumi izmantoti', 409, { kods: 'limits' });
    if (st.nakamais_no) return fail('Nākamais mēģinājums būs pieejams vēlāk', 409, { kods: 'pauze', nakamais_no: st.nakamais_no });
  }
  const eks = await saturs(env, kurss, 'eksamens');
  if (!eks?.banka?.length) return fail('Eksāmens vēl nav publicēts', 404);
  const izv = izveleties(eks.banka, st.jautajumi, await redzetie(env, user.id, kurss, 'eksamens', null), true);
  return json({ meginajums: await sakt(env, user.id, kurss, 'eksamens', null, izv), statuss: st });
}

async function eksamensIesniegt(request, env, user, kurss) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok) return fail('Nav piekļuves', 403);
  const plans = await saturs(env, kurss, 'plans');
  const eks = await saturs(env, kurss, 'eksamens');
  const v = await vertetMeginajumu(env, user.id, await readBody(request), 'eksamens', eks.banka);
  if (v.kluda) return v.kluda;
  const slieksnis = plans.eksamens?.slieksnis || SLIEKSNIS;
  const nokartots = v.rezultats >= slieksnis;
  if (nokartots && pk.enr) await env.DB.prepare("UPDATE enrollments SET status = 'pabeidzis', updated_at = ? WHERE id = ?").bind(nowIso(), pk.enr.id).run();
  // Vājās vietas pa nodarbībām (bez pareizajām atbildēm)
  const kl = {};
  for (const x of v.vertejums) if (x.punkti < 1) for (const nr of x.u?.nodarbibas || []) kl[nr] = (kl[nr] || 0) + 1;
  const vajas = Object.entries(kl).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nr, sk]) => ({ nr: Number(nr), kludas: sk, nosaukums: plans.nodarbibas.find((n) => n.nr === Number(nr))?.nosaukums }));
  const course = await getKurss(env, kurss);
  const prog = await progresaKarte(env, user.id, kurss);
  return json({ rezultats: v.rezultats, pareizi: v.pareizi, kopa: v.kopa, nokartots, slieksnis, vajas_vietas: vajas,
    statuss: await eksamenaStatuss(env, user, kurss, course, pk.enr, plans, prog, pk.admin) });
}

const KODA_BURTI = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function izsniegtSertifikatu(request, env, user, kurss) {
  const esosais = await sertifikats(env, user.id, kurss);
  if (esosais) return json({ sertifikats: esosais });
  const plans = await saturs(env, kurss, 'plans');
  if (!plans) return fail('Kurss nav atrasts', 404);
  const slieksnis = plans.eksamens?.slieksnis || SLIEKSNIS;
  const lab = await env.DB.prepare(
    "SELECT rezultats, iesniegts_at FROM ek_meginajumi WHERE user_id = ? AND kurss = ? AND veids = 'eksamens' AND rezultats >= ? ORDER BY iesniegts_at LIMIT 1"
  ).bind(user.id, kurss, slieksnis).first();
  if (!lab) return fail('Sertifikāts pieejams pēc noslēguma eksāmena nokārtošanas', 403);
  const { vards } = await readBody(request);
  const v = typeof vards === 'string' ? vards.replace(/\s+/g, ' ').trim() : '';
  if (v.length < 4 || v.length > 80 || v.split(' ').length < 2 || /[<>{}]/.test(v)) return fail('Ieraksti vārdu un uzvārdu (vismaz divi vārdi)');
  const rnd = crypto.getRandomValues(new Uint8Array(6));
  const kods = `LIB-EK-${lab.iesniegts_at.slice(0, 4)}-${[...rnd].map((b) => KODA_BURTI[b % KODA_BURTI.length]).join('')}`;
  await env.DB.prepare(`INSERT INTO ek_sertifikati (kods, user_id, kurss, kursa_nosaukums, vards, datums, rezultats, stundas, nodarbibas, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(kods, user.id, kurss, plans.nosaukums, v, lab.iesniegts_at.slice(0, 10), lab.rezultats,
    plans.stundas || null, plans.nodarbibas.length, nowIso()).run();
  return json({ sertifikats: await sertifikats(env, user.id, kurss) }, 201);
}

async function pieprasijums(request, env, user, kurss, origin) {
  const pk = await piekluve(env, user, kurss);
  if (!pk.ok || !pk.enr) return fail('Nav piekļuves', 403);
  const { veids } = await readBody(request);
  if (!['konsultacija', 'meginajumi'].includes(veids)) return fail('Nederīga izvēle');
  const course = await getKurss(env, kurss);
  const plans = await saturs(env, kurss, 'plans');
  const st = await eksamenaStatuss(env, user, kurss, course, pk.enr, plans, await progresaKarte(env, user.id, kurss), false);
  if (st.nokartots || st.izmantoti < st.limits) return fail('Papildu mēģinājumi vēl nav vajadzīgi', 409);
  await env.DB.prepare('UPDATE enrollments SET ek_pieprasijums = ?, ek_pieprasijums_at = ?, updated_at = ? WHERE id = ?').bind(veids, nowIso(), nowIso(), pk.enr.id).run();
  const admins = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (env.RESEND_API_KEY && env.EMAIL_FROM && admins.length) {
    const ko = veids === 'konsultacija' ? 'konsultāciju ar pasniedzēju + 3 mēģinājumus' : '3 papildu eksāmena mēģinājumus';
    const teksts = `${user.name} (${user.email}) vēlas ${ko} kursā „${course.name}” (${course.ek_papildu_cena} EUR).\nPēc apmaksas: ${origin}/admin.html → E-kursi → „+${course.ek_meginajumi ?? 3} mēģinājumi”.`;
    await sutit(env, admins, { subject: `E-kurss: pieprasījums — ${course.name}`, text: teksts, html: `<p>${teksts.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` }, user.email).catch((e) => console.error(e));
  }
  return json({ ok: true, pieprasijums: veids });
}

// ---------- administrācija ----------
async function adminParskats(env) {
  const { results: kursi } = await env.DB.prepare("SELECT * FROM courses WHERE veids = 'ekurss' ORDER BY name").all();
  for (const c of kursi) {
    const r = await env.DB.prepare("SELECT COUNT(*) AS n, MAX(versija) AS v FROM ek_saturs WHERE kurss = ? AND fails LIKE 'nodarbiba-%' AND gabals = 0").bind(c.id).first();
    c.nodarbibas = r.n; c.versija = r.v;
  }
  const { results: dal } = await env.DB.prepare(`SELECT e.id, e.user_id, e.course_id, e.status, e.paid, e.paid_at, e.created_at, e.ek_lidz, e.ek_eks_limits,
      e.ek_pieprasijums, e.ek_pieprasijums_at, u.email, COALESCE(u.display_name, u.name) AS name, c.ek_meginajumi,
      (SELECT COUNT(*) FROM ek_progress p WHERE p.user_id = e.user_id AND p.kurss = e.course_id AND p.nokartots_at IS NOT NULL) AS nokartotas,
      (SELECT COUNT(*) FROM ek_meginajumi m WHERE m.user_id = e.user_id AND m.kurss = e.course_id AND m.veids = 'eksamens' AND m.iesniegts_at IS NOT NULL) AS eks_izmantoti,
      (SELECT MAX(rezultats) FROM ek_meginajumi m WHERE m.user_id = e.user_id AND m.kurss = e.course_id AND m.veids = 'eksamens') AS eks_labakais,
      (SELECT kods FROM ek_sertifikati s WHERE s.user_id = e.user_id AND s.kurss = e.course_id) AS sertifikats
    FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id
    WHERE c.veids = 'ekurss' AND e.status != 'atteicies' ORDER BY (e.ek_lidz IS NULL), e.ek_lidz`).all();
  return json({ kursi, dalibnieki: dal });
}
async function adminKurss(request, env, id) {
  const c = await getKurss(env, id);
  if (!c) return fail('Kurss nav atrasts', 404);
  const b = await readBody(request);
  const lauki = { price_eur: [0, 10000], ek_dienas: [1, 3650], ek_meginajumi: [1, 20], ek_pauze_h: [0, 720], ek_papildu_cena: [0, 10000] };
  const sets = [], vals = [];
  for (const [k, [min, max]] of Object.entries(lauki)) {
    if (b[k] === undefined) continue;
    const n = Number(b[k]);
    if (!Number.isFinite(n) || n < min || n > max) return fail(`Nederīga vērtība: ${k}`);
    sets.push(`${k} = ?`); vals.push(k === 'price_eur' || k === 'ek_papildu_cena' ? Math.round(n * 100) / 100 : Math.round(n));
  }
  if (b.active !== undefined) {
    if (b.active && !(await saturs(env, id, 'plans'))) return fail('Vispirms augšupielādē kursa saturu');
    sets.push('active = ?'); vals.push(b.active ? 1 : 0);
  }
  if (!sets.length) return fail('Nav ko mainīt');
  await env.DB.prepare(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
  return json({ kurss: await getKurss(env, id) });
}
async function adminDalibnieks(request, env, id) {
  const e = await env.DB.prepare("SELECT e.*, c.ek_meginajumi FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = ? AND c.veids = 'ekurss'").bind(id).first();
  if (!e) return fail('Dalībnieks nav atrasts', 404);
  const b = await readBody(request);
  const sets = [], vals = [];
  if (b.ek_lidz !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.ek_lidz || '')) return fail('Datums formā GGGG-MM-DD');
    sets.push('ek_lidz = ?'); vals.push(`${b.ek_lidz}T23:59:59.000Z`);
  }
  if (b.papildu_meginajumi) {
    sets.push('ek_eks_limits = ?', 'ek_pieprasijums = NULL', 'ek_pieprasijums_at = NULL');
    vals.push((e.ek_eks_limits ?? e.ek_meginajumi ?? 3) + (e.ek_meginajumi ?? 3));
  }
  if (b.notirit_pieprasijumu) sets.push('ek_pieprasijums = NULL', 'ek_pieprasijums_at = NULL');
  if (!sets.length) return fail('Nav ko mainīt');
  sets.push('updated_at = ?'); vals.push(nowIso());
  await env.DB.prepare(`UPDATE enrollments SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
  return json({ ok: true });
}

// Pēc apmaksas atzīmes (admin): e-kursam uzliek piekļuvi uz ek_dienas un statusu "uzņemts" (= aktīvs)
export async function pecApmaksas(env, enrId) {
  const e = await env.DB.prepare("SELECT e.*, c.ek_dienas FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = ? AND c.veids = 'ekurss'").bind(enrId).first();
  if (!e || !e.paid || e.ek_lidz) return;
  const lidz = new Date(Date.now() + (e.ek_dienas || 90) * DIENA).toISOString().slice(0, 10) + 'T23:59:59.000Z';
  await env.DB.prepare("UPDATE enrollments SET ek_lidz = ?, status = CASE WHEN status = 'pieteicies' THEN 'uznemts' ELSE status END WHERE id = ?").bind(lidz, enrId).run();
}

// ---------- maršruti ----------
export async function ekMarsruts(request, env, { path, method, user, origin, url }) {
  if (method === 'GET' && path === '/api/ek/kursi') return kursuSaraksts(env, user, user?.is_admin && url.searchParams.has('visi'));
  let m = path.match(/^\/api\/sertifikats\/(LIB-EK-\d{4}-[A-Z0-9]{6})$/);
  if (m && method === 'GET') return parbauditSertifikatu(env, m[1]);

  if (path.startsWith('/api/admin/ek')) {
    if (!user?.is_admin) return fail('Nav piekļuves', 403);
    if (method === 'GET' && path === '/api/admin/ek') return adminParskats(env);
    if ((m = path.match(/^\/api\/admin\/ek\/kursi\/([a-z0-9-]+)$/)) && method === 'PATCH') return adminKurss(request, env, m[1]);
    if ((m = path.match(/^\/api\/admin\/ek\/dalibnieki\/(\d+)$/)) && method === 'PATCH') return adminDalibnieks(request, env, Number(m[1]));
    return fail('Nav atrasts', 404);
  }

  m = path.match(/^\/api\/ek\/([a-z0-9-]+)(?:\/(.*))?$/);
  if (!m) return null;
  const [, kurss, rest = ''] = m;
  if (method === 'GET' && rest === '') return parskats(env, user, kurss);
  if (!user) return fail('Nepieciešama pieteikšanās', 401);
  let r;
  if ((r = rest.match(/^nodarbiba\/(\d+)$/)) && method === 'GET') return nodarbiba(env, user, kurss, Number(r[1]));
  if ((r = rest.match(/^nodarbiba\/(\d+)\/progress$/)) && method === 'POST') return saglabatProgresu(request, env, user, kurss, Number(r[1]));
  if ((r = rest.match(/^tests\/(\d+)$/)) && method === 'POST') return testsSakt(env, user, kurss, Number(r[1]));
  if ((r = rest.match(/^tests\/(\d+)\/iesniegt$/)) && method === 'POST') return testsIesniegt(request, env, user, kurss, Number(r[1]));
  if (rest === 'eksamens' && method === 'POST') return eksamensSakt(env, user, kurss);
  if (rest === 'eksamens/iesniegt' && method === 'POST') return eksamensIesniegt(request, env, user, kurss);
  if (rest === 'sertifikats' && method === 'POST') return izsniegtSertifikatu(request, env, user, kurss);
  if (rest === 'pieprasijums' && method === 'POST') return pieprasijums(request, env, user, kurss, origin);
  return fail('Nav atrasts', 404);
}
