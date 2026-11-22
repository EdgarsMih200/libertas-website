// Dāvanu kartes (Tirdziņš) — «iekāpšanas karte» uz jaunu valodu. Plūsma bez tiešsaistes maksājuma:
// pircējs (ar kontu vai viesis) pasūta → izveidojas karte 'gaida' + rēķins (rekini), rēķinu uzreiz nosūta pircējam →
// admins rēķinā atzīmē apmaksu → sinhronizetDavanu() aktivizē karti (derīga 12 mēnešus) un piegādā to pēc izvēles:
//   'epasts' saņēmējam uzreiz · 'velak' saņēmējam sutit_at laikā (davanuCron, wrangler.jsonc triggers) · 'pdf' pircējam ·
//   'pasts' pircējam + ziņa adminam izdrukāt un nosūtīt aploksnē (+5 EUR rēķinā).
// Saņēmējs kodu LIB-XXXX-XXXX ievada kursa pieteikuma logā (tas pats lauks, kur atlaides kods).
import { sutit } from './epasts.js';
import { rekviziti, rekinaVestule, nakamaisNr } from './rekini.js';
import { AR_GRAFIKU, periodi } from '../grafiks.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400) => json({ error: msg }, status);
const sodien = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Riga' }).format(new Date());
const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const cent = (n) => Math.round(Number(n || 0) * 100) / 100;
const eur = (n) => cent(n).toFixed(2).replace('.', ',') + ' EUR';
const lv = (iso) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}.` : '');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EPASTS_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VIETNE = 'https://libertas.study';

export const SUMMAS = [30, 50, 100, 150];
export const SUMMA_MIN = 30;
export const SUMMA_MAX = 500;
export const DIZAINI = ['mezs', 'bordo', 'papirs'];
export const PIEGADES = ['epasts', 'velak', 'pdf', 'pasts'];
export const PASTA_MAKSA = 5;
const DERIGUMS_MENESI = 12;
const APMAKSAS_DIENAS = 5;
const MAX_GAIDA = 5;          // neapmaksātas kartes vienam kontam / e-pastam
const VIESU_LIMITS = 5;       // viesu pasūtījumi stundā no vienas IP
export const KODA_RE = /^LIB-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

async function readBody(request) {
  try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; }
}
function plusDienas(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function plusMenesi(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }
function rigasLaiks(isoUtc) {
  const f = new Intl.DateTimeFormat('lv-LV', { timeZone: 'Europe/Riga', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return f.format(new Date(isoUtc)).replace(',', '');
}

// Bez viegli sajaucamiem simboliem (0/O, 1/I)
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function jaunsKods() {
  const s = [...crypto.getRandomValues(new Uint8Array(8))].map((x) => ABC[x % ABC.length]).join('');
  return `LIB-${s.slice(0, 4)}-${s.slice(4)}`;
}

async function viesuLimits(request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'nezinama';
    const atslega = new Request(`https://davanas-limits.libertas.invalid/${encodeURIComponent(ip)}`);
    const kesa = caches.default;
    const ir = await kesa.match(atslega);
    const sk = ir ? Number(await ir.text()) || 0 : 0;
    if (sk >= VIESU_LIMITS) return true;
    await kesa.put(atslega, new Response(String(sk + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
  } catch (e) { console.error('Dāvanu limits', e); }
  return false;
}

// ---------- Kursa dati kartei: maršruts LV → ES/EN, «izlidošana» = tuvākās grupas sākums ----------
function valoda(id) {
  if (/^(spain|spanu)/.test(id)) return { kods: 'ES', nos: 'Spāņu' };
  if (/^(english|anglu)/.test(id)) return { kods: 'EN', nos: 'Angļu' };
  if (/^(estonian|igaunu)/.test(id)) return { kods: 'ET', nos: 'Igauņu' };
  return { kods: '?', nos: 'Valoda' };
}
function izlidosana(c) {
  if (!c) return 'Kad vēlies';
  if (c.veids === 'ekurss') return 'Kad vēlies';
  if (!AR_GRAFIKU.includes(c.id)) return 'Precizēs';
  try { const p = periodi(c.id, { skaits: 1 })[0]; return p ? lv(p.sakums).slice(0, -1) : 'Precizēs'; } catch { return 'Precizēs'; }
}
function kursaKartei(c) {
  if (!c) return null;
  const v = valoda(c.id);
  return { id: c.id, nosaukums: c.name, veids: c.veids || 'grupa', valoda: v.kods, valodas_nos: v.nos, izlidosana: izlidosana(c) };
}

async function kursaSaraksts(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, name, price_eur, COALESCE(veids, 'grupa') AS veids FROM courses WHERE active = 1 AND price_eur > 0 ORDER BY veids, name"
  ).all();
  return results;
}

// Redzamais statuss: gaida · planota · aktiva · dalji · izmantota · beigusies · atcelta
export function radamaisStatuss(k) {
  if (k.statuss !== 'aktiva') return k.statuss;
  if (k.derigs_lidz && sodien() > k.derigs_lidz) return 'beigusies';
  if (k.piegade === 'velak' && !k.nosutita_at) return 'planota';
  if (k.tips === 'summa' && cent(k.atlikums) < cent(k.summa)) return 'dalji';
  return 'aktiva';
}

// Publiskais skats uz karti (bez pircēja e-pasta un adreses)
function publiska(k, kurss) {
  const apm = k.statuss !== 'gaida' && k.statuss !== 'atcelta';
  return {
    statuss: radamaisStatuss(k), tips: k.tips, summa: k.summa, atlikums: k.atlikums, dizains: k.dizains,
    kam: k.kam, no: k.no_ka, apsveikums: k.apsveikums, derigs_lidz: k.derigs_lidz,
    piegade: k.piegade, sutit_at: k.sutit_at, nosutita_at: k.nosutita_at,
    kurss: kursaKartei(kurss),
    kods: apm ? k.kods : null,
  };
}

// ---------- Pasūtījums (ar kontu vai viesis) ----------
async function pasutit(request, env, user, origin, ctx) {
  const b = await readBody(request);
  if (b.viltus) return json({ karte: { token: '0'.repeat(48), statuss: 'gaida' }, rekins_nosutits: true }, 201); // honeypot
  const tips = b.tips === 'kurss' ? 'kurss' : b.tips === 'summa' ? 'summa' : null;
  if (!tips) return fail('Izvēlies, ko dāvināsi');
  const dizains = DIZAINI.includes(b.dizains) ? b.dizains : 'mezs';
  const kam = str(b.kam, 24), no = str(b.no, 24), apsveikums = str(b.apsveikums, 140);
  if (!kam) return fail('Ieraksti saņēmēja vārdu');
  if (!no) return fail('Ieraksti, no kā dāvana');

  // Pircējs
  const pirc = user
    ? { id: user.id, vards: user.name || '', epasts: user.email, talrunis: user.phone || '' }
    : { id: null, vards: str(b.pirceja_vards, 80), epasts: str(b.pirceja_epasts, 120).toLowerCase(), talrunis: '' };
  if (!user) {
    if (!pirc.vards) return fail('Ieraksti savu vārdu (rēķinam)');
    if (!EPASTS_RE.test(pirc.epasts)) return fail('Ieraksti derīgu e-pastu — uz to nosūtīsim rēķinu');
    if (await viesuLimits(request)) return fail('Pārāk daudz pasūtījumu. Mēģini vēlāk vai raksti mums.', 429);
  }

  // Piegāde
  const piegade = PIEGADES.includes(b.piegade) ? b.piegade : 'pdf';
  let sanemeja_epasts = null, sutit_at = null, adrese = null;
  if (piegade === 'epasts' || piegade === 'velak') {
    sanemeja_epasts = str(b.sanemeja_epasts, 120).toLowerCase();
    if (!EPASTS_RE.test(sanemeja_epasts)) return fail('Ieraksti saņēmēja e-pastu');
  }
  if (piegade === 'velak') {
    const t = Date.parse(b.sutit_at);
    if (!Number.isFinite(t)) return fail('Izvēlies, kad nosūtīt karti');
    if (t < Date.now() + 10 * 60 * 1000) return fail('Sūtīšanas laikam jābūt nākotnē');
    if (t > Date.now() + 365 * 86400000) return fail('Sūtīšanas laiks var būt ne vēlāk kā pēc gada');
    sutit_at = new Date(t).toISOString();
  }
  if (piegade === 'pasts') {
    adrese = str(b.adrese, 300);
    if (adrese.length < 10) return fail('Ieraksti pilnu piegādes adresi (iela, pilsēta, pasta indekss)');
  }

  let summa, course = null;
  if (tips === 'summa') {
    summa = Number(b.summa);
    if (!Number.isInteger(summa) || summa < SUMMA_MIN || summa > SUMMA_MAX) return fail(`Summai jābūt veselam skaitlim no ${SUMMA_MIN} līdz ${SUMMA_MAX} EUR`);
  } else {
    if (typeof b.course_id !== 'string') return fail('Izvēlies kursu');
    course = (await kursaSaraksts(env)).find((c) => c.id === b.course_id);
    if (!course) return fail('Kurss nav pieejams', 404);
    summa = cent(course.price_eur);
  }

  const gaida = await env.DB.prepare("SELECT COUNT(*) AS n FROM davanu_kartes WHERE statuss = 'gaida' AND (user_id = ? OR pirceja_epasts = ?)").bind(pirc.id || -1, pirc.epasts).first();
  if ((gaida?.n || 0) >= MAX_GAIDA) return fail('Tev jau ir vairākas neapmaksātas dāvanu kartes. Apmaksā tās vai sazinies ar mums.', 429);

  const now = new Date().toISOString();
  const dat = sodien();
  const termins = plusDienas(dat, APMAKSAS_DIENAS);
  const rindas = [{ a: tips === 'kurss' ? `Dāvanu karte — kurss “${course.name}”` : `Dāvanu karte — ${eur(summa)}`, d: termins, s: summa, p: null }];
  const pasta = piegade === 'pasts' ? PASTA_MAKSA : 0;
  if (pasta) rindas.push({ a: 'Iespiesta karte aploksnē un pasta piegāde', d: termins, s: pasta, p: null });
  const kopa = cent(summa + pasta);
  const rk = await rekviziti(env);
  const nr = await nakamaisNr(env);
  const info = `Kam: ${kam} · ${piegade === 'velak' ? `nosūtīsim ${rigasLaiks(sutit_at)}` : piegade === 'epasts' ? 'e-pastā pēc apmaksas' : piegade === 'pasts' ? 'aploksnē pa pastu' : 'PDF pircējam'} · derīga ${DERIGUMS_MENESI} mēnešus no apmaksas`;
  const rek = await env.DB.prepare(
    `INSERT INTO rekini (nr, token, enrollment_id, m_vards, m_talrunis, m_epasts, kurss, kurss_info, datums, rindas, piezime, summa, apmaksats, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).bind(nr, randomHex(24), pirc.vards, pirc.talrunis, pirc.epasts, 'Dāvanu karte', info, dat, JSON.stringify(rindas),
    rk.piezime || 'Rēķins sagatavots elektroniski un ir derīgs bez paraksta.', kopa, now, now).run();
  const rekinsId = rek.meta.last_row_id;

  let id = null;
  for (let i = 0; i < 5 && !id; i++) {
    try {
      const r = await env.DB.prepare(
        `INSERT INTO davanu_kartes (kods, token, tips, summa, atlikums, course_id, dizains, kam, no_ka, apsveikums, user_id, pirceja_vards, pirceja_epasts,
           piegade, sanemeja_epasts, sutit_at, adrese, pasta_maksa, statuss, rekins_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gaida', ?, ?, ?)`
      ).bind(jaunsKods(), randomHex(24), tips, summa, summa, course ? course.id : null, dizains, kam, no, apsveikums || null, pirc.id, pirc.vards, pirc.epasts,
        piegade, sanemeja_epasts, sutit_at, adrese, pasta, rekinsId, now, now).run();
      id = r.meta.last_row_id;
    } catch (e) {
      if (!String(e).includes('UNIQUE')) throw e;
    }
  }
  if (!id) return fail('Neizdevās izveidot karti, mēģini vēlreiz', 500);
  const karte = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE id = ?').bind(id).first();

  // Rēķins pircējam + ziņa administratoram (fonā)
  const epasts = !!(env.RESEND_API_KEY && env.EMAIL_FROM);
  const varSutit = epasts && !!rk.konts;
  if (epasts) {
    const darbs = (async () => {
      const r = await env.DB.prepare('SELECT * FROM rekini WHERE id = ?').bind(rekinsId).first();
      if (varSutit) {
        r.rindas = JSON.parse(r.rindas);
        const ok = await sutit(env, pirc.epasts, rekinaVestule(r, rk, `${origin}/rekins.html?k=${r.token}`), rk.epasts || env.EMAIL_REPLY_TO);
        if (ok) await env.DB.prepare('UPDATE rekini SET nosutits_at = ?, nosutits_uz = ? WHERE id = ?').bind(new Date().toISOString(), pirc.epasts, rekinsId).run();
      }
      const admins = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (admins.length) {
        const t = `Jauna dāvanu karte: ${rindas[0].a}${pasta ? ' + aploksne' : ''}\nPircējs: ${pirc.vards} <${pirc.epasts}>${user ? '' : ' (viesis)'}\nKam: ${kam} · No: ${no}\nPiegāde: ${info}\nRēķins Nr. ${nr} (${eur(kopa)})${varSutit ? ' — nosūtīts pircējam' : ' — NAV nosūtīts (aizpildi rekvizītus un nosūti no administrācijas)'}\n\nKad nauda saņemta, atzīmē apmaksu rēķinā — karte aktivizēsies un tiks piegādāta.\n${origin}/rekins.html?id=${rekinsId}`;
        await sutit(env, admins, { subject: `Dāvanu karte — ${kam} (${eur(kopa)})`, html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${esc(t)}</pre>`, text: t }, pirc.epasts);
      }
    })().catch((e) => console.error(e));
    if (ctx && ctx.waitUntil) ctx.waitUntil(darbs);
  }
  return json({ karte: { token: karte.token, statuss: karte.statuss }, rekins_nosutits: varSutit, kopa }, 201);
}

// ---------- Apmaksas sinhronizācija (rekini.js pēc rēķina rindu maiņas) ----------
export async function sinhronizetDavanu(env, rekins, origin) {
  const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE rekins_id = ?').bind(rekins.id).first();
  if (!k) return;
  const rindas = rekins.rindas || [];
  const viss = rindas.length > 0 && rindas.every((x) => x.p);
  const now = new Date().toISOString();
  if (viss && k.statuss === 'gaida') {
    const lidz = plusMenesi(sodien(), DERIGUMS_MENESI);
    await env.DB.prepare("UPDATE davanu_kartes SET statuss = 'aktiva', derigs_lidz = ?, aktivizeta_at = ?, updated_at = ? WHERE id = ?").bind(lidz, now, now, k.id).run();
    await piegadat(env, { ...k, statuss: 'aktiva', derigs_lidz: lidz, aktivizeta_at: now }, origin).catch((e) => console.error(e));
  } else if (!viss && k.statuss === 'aktiva' && cent(k.atlikums) === cent(k.summa) && !k.nosutita_at) {
    // Apmaksas atzīme noņemta, karte vēl nav ne piegādāta, ne lietota → atpakaļ uz 'gaida'
    await env.DB.prepare("UPDATE davanu_kartes SET statuss = 'gaida', derigs_lidz = NULL, aktivizeta_at = NULL, updated_at = ? WHERE id = ?").bind(now, k.id).run();
  }
}

// Piegāde pēc apmaksas (vai cron 'velak' kartēm, kad pienācis laiks)
async function piegadat(env, k, origin, { piespiest = false } = {}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  const kurss = k.course_id ? await env.DB.prepare('SELECT id, name, veids FROM courses WHERE id = ?').bind(k.course_id).first() : null;
  const saite = `${origin}/davanu-karte.html?k=${k.token}`;
  const rk = await rekviziti(env);
  const atbildet = rk.epasts || env.EMAIL_REPLY_TO;
  let ok = false;
  if (k.piegade === 'epasts' || k.piegade === 'velak') {
    if (k.piegade === 'velak' && !piespiest && Date.parse(k.sutit_at) > Date.now()) {
      // vēl nav laiks: pircējam apstiprinājums, ka karte ieplānota
      await sutit(env, k.pirceja_epasts, pircejaVestule(k, kurss, saite, 'planota'), atbildet);
      return false;
    }
    ok = await sutit(env, k.sanemeja_epasts, sanemejaVestule(k, kurss, saite), atbildet);
    if (ok) await sutit(env, k.pirceja_epasts, pircejaVestule(k, kurss, saite, 'nosutita'), atbildet);
  } else {
    ok = await sutit(env, k.pirceja_epasts, pircejaVestule(k, kurss, saite, k.piegade), atbildet);
    if (k.piegade === 'pasts') {
      const admins = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (admins.length) {
        const t = `Dāvanu karte apmaksāta — jānosūta aploksnē.\n\nKam: ${k.kam}\nAdrese: ${k.adrese}\nKods: ${k.kods}\n\nKarte drukāšanai: ${saite}\nKad nosūtīts, atzīmē administrācijā «Dāvanu kartes» → «Nosūtīta».`;
        await sutit(env, admins, { subject: `Nosūtīt aploksnē: dāvanu karte ${k.kam}`, html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${esc(t)}</pre>`, text: t }, k.pirceja_epasts);
      }
    }
  }
  if (ok && k.piegade !== 'pasts') await env.DB.prepare('UPDATE davanu_kartes SET nosutita_at = ?, updated_at = ? WHERE id = ?').bind(new Date().toISOString(), new Date().toISOString(), k.id).run();
  return ok;
}

// Cron (wrangler.jsonc triggers): ieplānotās kartes, kurām pienācis laiks
export async function davanuCron(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM davanu_kartes WHERE statuss = 'aktiva' AND piegade = 'velak' AND nosutita_at IS NULL AND sutit_at <= ? LIMIT 20"
  ).bind(new Date().toISOString()).all();
  for (const k of results) await piegadat(env, k, VIETNE, { piespiest: true }).catch((e) => console.error('Dāvanu cron', e));
}

// ---------- Izmantošana pieteikumā ----------
export async function parbauditDavanu(env, user, course, ievade) {
  const kods = String(ievade || '').trim().toUpperCase();
  const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE kods = ?').bind(kods).first();
  if (!k || k.statuss === 'gaida' || k.statuss === 'atcelta') return { kluda: 'Dāvanu karte ' + kods + ' nav atrasta vai vēl nav apmaksāta' };
  if (k.statuss === 'izmantota' || k.atlikums <= 0) return { kluda: 'Dāvanu karte ' + kods + ' jau ir izmantota' };
  if (k.derigs_lidz && sodien() > k.derigs_lidz) return { kluda: 'Dāvanu kartes ' + kods + ' derīgums beidzās ' + lv(k.derigs_lidz) };
  const cena = cent(course.price_eur);
  if (k.tips === 'kurss') {
    if (k.course_id !== course.id) return { kluda: 'Dāvanu karte ' + kods + ' ir paredzēta citam kursam' };
    return { karte: k, segt: cena };
  }
  return { karte: k, segt: Math.min(cent(k.atlikums), cena) };
}

// Atomiski noraksta summu no kartes. false = kāds cits paspēja izmantot.
export async function norakstitDavanu(env, kartesId, segt, enrollmentId) {
  const now = new Date().toISOString();
  const k = await env.DB.prepare('SELECT tips, atlikums FROM davanu_kartes WHERE id = ?').bind(kartesId).first();
  if (!k) return false;
  const nost = k.tips === 'kurss' ? cent(k.atlikums) : cent(segt); // kursa karte — vienreizēja (noraksta visu)
  const r = await env.DB.prepare(
    `UPDATE davanu_kartes SET atlikums = ROUND(atlikums - ?, 2),
       statuss = CASE WHEN ROUND(atlikums - ?, 2) <= 0 THEN 'izmantota' ELSE statuss END, updated_at = ?
     WHERE id = ? AND statuss = 'aktiva' AND atlikums >= ?`
  ).bind(nost, nost, now, kartesId, nost).run();
  if (!r.meta.changes) return false;
  await env.DB.prepare('UPDATE enrollments SET davanu_karte_id = ?, davanu_summa = ? WHERE id = ?').bind(kartesId, segt, enrollmentId).run();
  return true;
}

// Pieteikums atcelts / dzēsts → segtā summa atgriežas kartē
export async function atgrieztDavanu(env, enrollmentId) {
  const e = await env.DB.prepare('SELECT davanu_karte_id, davanu_summa FROM enrollments WHERE id = ?').bind(enrollmentId).first();
  if (!e || !e.davanu_karte_id) return;
  const now = new Date().toISOString();
  const k = await env.DB.prepare('SELECT tips, summa FROM davanu_kartes WHERE id = ?').bind(e.davanu_karte_id).first();
  if (k) {
    const atpakal = k.tips === 'kurss' ? k.summa : cent(e.davanu_summa);
    await env.DB.prepare(
      "UPDATE davanu_kartes SET atlikums = MIN(summa, ROUND(atlikums + ?, 2)), statuss = CASE WHEN statuss = 'izmantota' THEN 'aktiva' ELSE statuss END, updated_at = ? WHERE id = ?"
    ).bind(atpakal, now, e.davanu_karte_id).run();
  }
  await env.DB.prepare('UPDATE enrollments SET davanu_karte_id = NULL, davanu_summa = NULL WHERE id = ?').bind(enrollmentId).run();
}

// ---------- E-pasti ----------
const C = { forest: '#1E2E29', forest2: '#2B4038', line: '#3A5249', onForest: '#E9E4D8', muted: '#AFB9B0', paper: '#F6F1E8', accent: '#B4502A', glow: '#F2C46A', sage: '#B5CCAE' };
const SERIF = "Lora, Georgia, 'Times New Roman', serif";
const SANS = "'Source Sans 3', 'Segoe UI', Roboto, Arial, sans-serif";
const MONO = "'IBM Plex Mono', Consolas, 'Courier New', monospace";

function vertibaTeksts(k, kurss) { return k.tips === 'kurss' && kurss ? `kursu “${kurss.name}”` : eur(k.summa); }

// «Biļete» e-pastā: tabulas (e-pasta klienti neatbalsta grid/cqw). Krāsas = izvēlētais noformējums (kā .dk-bilete--*),
// un biļete stāv uz gaiša papīra «galda», lai tumši zaļā karte nesaplūst ar e-pasta meža fonu.
const BIL = {
  mezs: { fons: '#1E2E29', fons2: '#2B4038', teksts: '#F3EEE3', blavs: '#AFB9B0', akc: '#B5CCAE', liste: '#3A5249' },
  bordo: { fons: '#6B1D1D', fons2: '#521515', teksts: '#FBF1E6', blavs: '#E4B9A8', akc: '#F2C46A', liste: '#8A3A33' },
  papirs: { fons: '#FFFDF8', fons2: '#F2EADC', teksts: '#24211E', blavs: '#6E665C', akc: '#B4502A', liste: '#D9CFC0' },
};
function biletesTabula(k, kurss) {
  const b = BIL[k.dizains] || BIL.mezs;
  const v = kurss ? valoda(kurss.id) : { kods: '?' };
  const ir = k.tips === 'kurss' && kurss;
  const rinda = (a, t) => `<td style="padding:0 16px 0 0;vertical-align:top;"><div style="font-family:${SANS};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${b.blavs};">${a}</div><div style="font-family:${MONO};font-size:14px;font-weight:600;color:${b.teksts};padding-top:3px;white-space:nowrap;">${esc(t)}</div></td>`;
  const etik = (t) => `<div style="font-family:${SANS};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${b.blavs};">${t}</div>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EDE5D8;border-radius:16px;"><tr><td style="padding:22px 18px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:14px;background:${b.fons};border:1px solid ${b.liste};box-shadow:0 10px 24px rgba(36,33,30,.22);"><tr>
    <td style="padding:20px 22px;vertical-align:top;">
      <div style="font-family:${SERIF};font-size:20px;font-weight:600;color:${b.teksts};">Libertas<span style="color:${b.akc};">.</span> <span style="font-family:${SANS};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${b.blavs};">Dāvanu karte</span></div>
      <div style="font-family:${MONO};font-size:30px;font-weight:600;color:${b.teksts};padding:12px 0 2px;white-space:nowrap;">LV <span style="color:${b.akc};font-size:18px;letter-spacing:2px;">- - &#9992;&#xFE0E; - -</span> ${esc(ir ? v.kods : '?')}</div>
      <div style="font-family:${SERIF};font-size:18px;color:${b.teksts};padding-bottom:14px;">${esc(ir ? kurss.name : 'Ceļojums pēc izvēles')}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${rinda('Kam', k.kam)}${rinda('No', k.no_ka)}${ir ? rinda('Izlidošana', kurss.veids === 'ekurss' ? 'Kad vēlies' : izlidosana(kurss)) : ''}${rinda('Derīga līdz', lv(k.derigs_lidz))}</tr></table>
    </td>
    <td width="150" style="padding:20px 18px;background:${b.fons2};border-left:2px dashed ${b.liste};border-radius:0 14px 14px 0;vertical-align:top;">
      ${etik('Vērtība')}
      <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${b.teksts};padding:4px 0 16px;white-space:nowrap;">${esc(eur(k.summa))}</div>
      ${etik('Kods')}
      <div style="font-family:${MONO};font-size:14px;font-weight:600;color:${b.akc};padding-top:4px;letter-spacing:.04em;white-space:nowrap;">${esc(k.kods)}</div>
    </td></tr></table>
  </td></tr></table>`;
}

function ramis(saturs, preview) {
  return `<!doctype html><html lang="lv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>Libertas dāvanu karte</title></head>
<body style="margin:0;padding:0;background:${C.forest};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.forest};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td style="padding:0 8px 24px;"><span style="color:${C.onForest};font-family:${SERIF};font-size:30px;font-weight:700;">Libertas</span>
    <div style="font-family:${SERIF};font-style:italic;font-size:15px;color:${C.muted};padding-top:4px;">Runā, saproti, ceļo, audz!</div></td></tr>
  <tr><td style="background:${C.forest2};border-radius:20px;padding:30px 26px;border:1px solid ${C.line};">${saturs}</td></tr>
  <tr><td style="padding:24px 8px 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted};">libertas.study<br>© ${new Date().getFullYear()} Libertas</td></tr>
</table></td></tr></table></body></html>`;
}
const poga = (href, teksts) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td style="border-radius:999px;background:${C.accent};"><a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">${teksts}</a></td></tr></table>`;
const p = (t, krasa = C.onForest) => `<p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.6;color:${krasa};">${t}</p>`;
const h1 = (t) => `<h1 style="margin:0 0 12px;font-family:${SERIF};font-size:26px;line-height:1.25;color:${C.paper};">${t}</h1>`;

function sanemejaVestule(k, kurss, saite) {
  const ko = vertibaTeksts(k, kurss);
  const zina = k.apsveikums ? `<p style="margin:18px 0 0;font-family:'Caveat','Segoe Print',cursive;font-size:22px;line-height:1.3;color:${C.paper};">“${esc(k.apsveikums)}”<br><span style="color:${C.sage};">— ${esc(k.no_ka)}</span></p>` : '';
  const html = ramis(
    h1(`${esc(k.kam)}, tev ir dāvana!`) +
    p(`<strong style="color:${C.paper};">${esc(k.no_ka)}</strong> tev uzdāvināja Libertas ${esc(ko)}${kurss && kurss.veids !== 'ekurss' && k.tips === 'kurss' ? ` — tuvākā grupa sākas ${esc(izlidosana(kurss))}` : ''}.`) +
    biletesTabula(k, kurss) + zina +
    poga(saite, 'Atvērt dāvanu') +
    `<p style="margin:20px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.muted};">Kā izmantot: izvēlies kursu libertas.study, spied «Pieteikties» un ievadi kodu <strong style="color:${C.glow};">${esc(k.kods)}</strong>. Karte derīga līdz ${lv(k.derigs_lidz)}</p>`,
    `${k.no_ka} tev uzdāvināja ${ko}`);
  const text = `${k.kam}, tev ir dāvana!\n\n${k.no_ka} tev uzdāvināja Libertas ${ko}.\n${k.apsveikums ? `\n“${k.apsveikums}” — ${k.no_ka}\n` : ''}\nKods: ${k.kods}\nDerīga līdz: ${lv(k.derigs_lidz)}\n\nKarte: ${saite}\n\nIzvēlies kursu libertas.study, spied «Pieteikties» un ievadi kodu.\n\nLibertas`;
  return { subject: `${k.kam}, ${k.no_ka} tev uzdāvināja ceļojumu jaunā valodā`, html, text };
}

function pircejaVestule(k, kurss, saite, gadijums) {
  const vards = (k.pirceja_vards || '').split(' ')[0];
  const temas = {
    planota: ['Apmaksa saņemta — karte ieplānota', `Paldies! Dāvanu karte <strong style="color:${C.paper};">${esc(k.kam)}</strong> ir apmaksāta un tiks nosūtīta uz ${esc(k.sanemeja_epasts)} <strong style="color:${C.paper};">${k.sutit_at ? esc(rigasLaiks(k.sutit_at)) : ''}</strong>.`],
    nosutita: ['Dāvanu karte nosūtīta', `Dāvanu karte <strong style="color:${C.paper};">${esc(k.kam)}</strong> tikko nosūtīta uz ${esc(k.sanemeja_epasts)}. Zemāk ir tās kopija.`],
    pdf: ['Tava dāvanu karte ir gatava', `Paldies — apmaksa saņemta! Dāvanu karte <strong style="color:${C.paper};">${esc(k.kam)}</strong> ir aktīva. Atver to, izdrukā vai pārsūti saiti.`],
    pasts: ['Apmaksa saņemta — karte ceļā', `Paldies! Iespiestu karti aploksnē nosūtīsim uz norādīto adresi 3–5 darba dienās. Tikmēr karte jau ir aktīva, un tās kopija ir zemāk.`],
  };
  const [tema, teksts] = temas[gadijums] || temas.pdf;
  const html = ramis(
    `<span style="display:inline-block;background:${C.paper};color:${C.forest};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">${esc(tema)}</span>` +
    h1(vards ? `Labdien, ${esc(vards)}!` : 'Labdien!') + p(teksts) + biletesTabula(k, kurss) + poga(saite, 'Atvērt dāvanu karti'),
    tema);
  const text = `${vards ? `Labdien, ${vards}!` : 'Labdien!'}\n\n${teksts.replace(/<[^>]+>/g, '')}\n\nKods: ${k.kods}\nDerīga līdz: ${lv(k.derigs_lidz)}\nKarte: ${saite}\n\nLibertas`;
  return { subject: `${tema} — Libertas`, html, text };
}

// ---------- Maršruti ----------
export async function davanasMarsruts(request, env, { path, method, user, url, ctx }) {
  if (method === 'GET' && path === '/api/davanas/piedavajums') {
    const kursi = (await kursaSaraksts(env)).map((c) => ({ ...kursaKartei(c), cena: c.price_eur }));
    return json({ summas: SUMMAS, min: SUMMA_MIN, max: SUMMA_MAX, dizaini: DIZAINI, pasta_maksa: PASTA_MAKSA, derigums_menesi: DERIGUMS_MENESI, kursi });
  }
  let m = path.match(/^\/api\/davana\/([0-9a-f]{48})$/);
  if (m && method === 'GET') {
    const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE token = ?').bind(m[1]).first();
    if (!k) return fail('Dāvanu karte nav atrasta', 404);
    const kurss = k.course_id ? await env.DB.prepare('SELECT id, name, veids FROM courses WHERE id = ?').bind(k.course_id).first() : null;
    const out = publiska(k, kurss);
    if (k.statuss === 'gaida' && k.rekins_id) {
      // Saite uz rēķinu: pircēja kontam, adminam vai viesim (kartes saite pēc pasūtījuma ir tikai pircējam)
      const r = await env.DB.prepare('SELECT token FROM rekini WHERE id = ?').bind(k.rekins_id).first();
      if (r && (!k.user_id || (user && (user.id === k.user_id || user.is_admin)))) out.rekins = r.token;
    }
    return json({ karte: out });
  }
  if (method === 'POST' && path === '/api/davanas') return pasutit(request, env, user, url.origin, ctx);
  if (method === 'GET' && path === '/api/davanas/manas') {
    if (!user) return fail('Nepieciešama pieteikšanās', 401);
    const { results } = await env.DB.prepare(
      `SELECT d.*, c.name AS kursa_nosaukums, c.veids AS kursa_veids, r.token AS rekins_token FROM davanu_kartes d
       LEFT JOIN courses c ON c.id = d.course_id LEFT JOIN rekini r ON r.id = d.rekins_id
       WHERE (d.user_id = ? OR d.pirceja_epasts = ?) AND d.statuss != 'atcelta' ORDER BY d.created_at DESC`
    ).bind(user.id, (user.email || '').toLowerCase()).all();
    return json({ kartes: results.map((k) => ({ ...publiska(k, k.course_id ? { id: k.course_id, name: k.kursa_nosaukums, veids: k.kursa_veids } : null), token: k.token, created_at: k.created_at, rekins: k.statuss === 'gaida' ? k.rekins_token : null })) });
  }

  if (!path.startsWith('/api/admin/davanas')) return null;
  if (!user?.is_admin) return fail('Nav piekļuves', 403);
  if (path === '/api/admin/davanas') {
    if (method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT d.*, c.name AS kursa_nosaukums, r.nr AS rekins_nr,
          (SELECT COUNT(*) FROM enrollments e WHERE e.davanu_karte_id = d.id) AS izmantojumi
         FROM davanu_kartes d LEFT JOIN courses c ON c.id = d.course_id LEFT JOIN rekini r ON r.id = d.rekins_id
         ORDER BY d.created_at DESC`
      ).all();
      return json({ kartes: results.map((k) => ({ ...k, redzamais: radamaisStatuss(k) })) });
    }
    if (method === 'POST') {
      // Manuāli izveidota karte (balva / kompensācija): uzreiz aktīva, bez rēķina; kartes saite adminam
      const b = await readBody(request);
      const tips = b.tips === 'kurss' ? 'kurss' : 'summa';
      let summa, course = null;
      if (tips === 'summa') { summa = Number(b.summa); if (!Number.isInteger(summa) || summa < 1 || summa > SUMMA_MAX) return fail('Nederīga summa'); }
      else { course = (await kursaSaraksts(env)).find((c) => c.id === b.course_id); if (!course) return fail('Kurss nav pieejams'); summa = cent(course.price_eur); }
      const kam = str(b.kam, 24) || 'Tev', no = str(b.no, 24) || 'Libertas';
      const now = new Date().toISOString();
      const r = await env.DB.prepare(
        `INSERT INTO davanu_kartes (kods, token, tips, summa, atlikums, course_id, dizains, kam, no_ka, apsveikums, user_id, pirceja_vards, pirceja_epasts, piegade, statuss, derigs_lidz, aktivizeta_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pdf', 'aktiva', ?, ?, ?, ?)`
      ).bind(jaunsKods(), randomHex(24), tips, summa, summa, course ? course.id : null, DIZAINI.includes(b.dizains) ? b.dizains : 'mezs', kam, no, str(b.apsveikums, 140) || null,
        user.id, 'Libertas (manuāli)', user.email, plusMenesi(sodien(), DERIGUMS_MENESI), now, now, now).run();
      return json({ karte: await env.DB.prepare('SELECT * FROM davanu_kartes WHERE id = ?').bind(r.meta.last_row_id).first() }, 201);
    }
  }
  m = path.match(/^\/api\/admin\/davanas\/(\d+)(\/sutit)?$/);
  if (m) {
    const id = Number(m[1]);
    const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE id = ?').bind(id).first();
    if (!k) return fail('Dāvanu karte nav atrasta', 404);
    if (m[2] && method === 'POST') {
      if (k.statuss !== 'aktiva') return fail('Sūtīt var tikai aktīvu karti');
      return (await piegadat(env, k, url.origin, { piespiest: true })) ? json({ ok: true }) : fail('E-pastu neizdevās nosūtīt', 502);
    }
    if (method === 'PATCH') {
      const b = await readBody(request);
      const now = new Date().toISOString();
      if (b.statuss === 'atcelta') {
        if (k.statuss === 'izmantota' || cent(k.atlikums) < cent(k.summa)) return fail('Karte jau izmantota — to nevar atcelt');
        await env.DB.prepare("UPDATE davanu_kartes SET statuss = 'atcelta', updated_at = ? WHERE id = ?").bind(now, id).run();
      } else if (typeof b.derigs_lidz === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.derigs_lidz)) {
        await env.DB.prepare('UPDATE davanu_kartes SET derigs_lidz = ?, updated_at = ? WHERE id = ?').bind(b.derigs_lidz, now, id).run();
      } else if (b.nosutita === true) {
        await env.DB.prepare('UPDATE davanu_kartes SET nosutita_at = ?, updated_at = ? WHERE id = ?').bind(now, now, id).run();
      } else return fail('Nav ko mainīt');
      const r = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE id = ?').bind(id).first();
      return json({ karte: { ...r, redzamais: radamaisStatuss(r) } });
    }
  }
  return fail('Nav atrasts', 404);
}

// Priekšskatījumam / testiem
export { sanemejaVestule, pircejaVestule };
