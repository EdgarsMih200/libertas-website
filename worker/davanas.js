// Dāvanu kartes (Tirdziņš). Plūsma bez tiešsaistes maksājuma:
// pircējs (ienācis) pasūta → izveidojas karte statusā 'gaida' + rēķins (rekini), rēķinu uzreiz nosūta pircējam →
// admins rēķinā atzīmē apmaksu → sinhronizetDavanu() aktivizē karti (derīga 12 mēnešus) un nosūta pircējam saiti uz karti.
// Saņēmējs kodu DK-XXXX-XXXX ievada kursa pieteikuma logā (tas pats lauks, kur atlaides kods).
import { sutit } from './epasts.js';
import { rekviziti, rekinaVestule, nakamaisNr } from './rekini.js';

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

export const SUMMAS = [25, 50, 100];
export const SUMMA_MIN = 10;
export const SUMMA_MAX = 500;
export const DIZAINI = ['ziema', 'spanu', 'anglu'];
const DERIGUMS_MENESI = 12;
const APMAKSAS_DIENAS = 5;
const MAX_GAIDA = 5; // neapmaksātas kartes vienam lietotājam
export const KODA_RE = /^DK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

async function readBody(request) {
  try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; }
}

function plusDienas(iso, n) {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
function plusMenesi(iso, n) {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10);
}

// Bez viegli sajaucamiem simboliem (0/O, 1/I)
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function jaunsKods() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  const s = [...b].map((x) => ABC[x % ABC.length]).join('');
  return `DK-${s.slice(0, 4)}-${s.slice(4)}`;
}

async function kursaSaraksts(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, name, price_eur, COALESCE(veids, 'grupa') AS veids FROM courses WHERE active = 1 AND price_eur > 0 ORDER BY veids, name"
  ).all();
  return results;
}

// Publiskais skats uz karti (bez pircēja datiem)
function publiska(k, kurss) {
  const apm = k.statuss !== 'gaida' && k.statuss !== 'atcelta';
  return {
    statuss: k.statuss, tips: k.tips, summa: k.summa, atlikums: k.atlikums, dizains: k.dizains,
    kam: k.kam, no: k.no_ka, apsveikums: k.apsveikums, derigs_lidz: k.derigs_lidz,
    kurss: kurss ? { id: kurss.id, nosaukums: kurss.name, veids: kurss.veids || 'grupa' } : null,
    kods: apm ? k.kods : null,
  };
}

// ---------- Pasūtījums ----------
async function pasutit(request, env, user, origin, ctx) {
  const b = await readBody(request);
  if (b.viltus) return json({ ok: true }); // honeypot
  const tips = b.tips === 'kurss' ? 'kurss' : b.tips === 'summa' ? 'summa' : null;
  if (!tips) return fail('Izvēlies kartes veidu');
  const dizains = DIZAINI.includes(b.dizains) ? b.dizains : 'ziema';
  const kam = str(b.kam, 60), no = str(b.no, 60), apsveikums = str(b.apsveikums, 300);
  if (!kam) return fail('Ieraksti, kam dāvana paredzēta');
  if (!no) return fail('Ieraksti, no kā dāvana');

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

  const gaida = await env.DB.prepare("SELECT COUNT(*) AS n FROM davanu_kartes WHERE user_id = ? AND statuss = 'gaida'").bind(user.id).first();
  if ((gaida?.n || 0) >= MAX_GAIDA) return fail('Tev jau ir vairākas neapmaksātas dāvanu kartes. Apmaksā tās vai sazinies ar mums.', 429);

  const now = new Date().toISOString();
  const dat = sodien();
  const rindas = [{
    a: tips === 'kurss' ? `Dāvanu karte — kurss “${course.name}”` : `Dāvanu karte — ${eur(summa)}`,
    d: plusDienas(dat, APMAKSAS_DIENAS), s: summa, p: null,
  }];
  const rk = await rekviziti(env);
  const nr = await nakamaisNr(env);
  const rek = await env.DB.prepare(
    `INSERT INTO rekini (nr, token, enrollment_id, m_vards, m_talrunis, m_epasts, kurss, kurss_info, datums, rindas, piezime, summa, apmaksats, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).bind(
    nr, randomHex(24), user.name || '', user.phone || '', user.email, 'Dāvanu karte',
    `Kam: ${kam} · derīga ${DERIGUMS_MENESI} mēnešus no apmaksas`, dat, JSON.stringify(rindas),
    rk.piezime || 'Rēķins sagatavots elektroniski un ir derīgs bez paraksta.', summa, now, now
  ).run();
  const rekinsId = rek.meta.last_row_id;

  let id = null;
  for (let i = 0; i < 5 && !id; i++) {
    try {
      const r = await env.DB.prepare(
        `INSERT INTO davanu_kartes (kods, token, tips, summa, atlikums, course_id, dizains, kam, no_ka, apsveikums, user_id, pirceja_epasts, statuss, rekins_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gaida', ?, ?, ?)`
      ).bind(jaunsKods(), randomHex(24), tips, summa, summa, course ? course.id : null, dizains, kam, no, apsveikums || null, user.id, user.email, rekinsId, now, now).run();
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
        const ok = await sutit(env, user.email, rekinaVestule(r, rk, `${origin}/rekins.html?k=${r.token}`), rk.epasts || env.EMAIL_REPLY_TO);
        if (ok) await env.DB.prepare('UPDATE rekini SET nosutits_at = ?, nosutits_uz = ? WHERE id = ?').bind(new Date().toISOString(), user.email, rekinsId).run();
      }
      const admins = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (admins.length) {
        const t = `Jauna dāvanu karte: ${rindas[0].a}\nPircējs: ${user.name || ''} <${user.email}>\nKam: ${kam} · No: ${no}\nRēķins Nr. ${nr}${varSutit ? ' (nosūtīts pircējam)' : ' — NAV nosūtīts (aizpildi rekvizītus un nosūti no administrācijas)'}\n\nKad nauda saņemta, atzīmē apmaksu rēķinā — karte aktivizēsies un pircējs saņems e-pastu.\n${origin}/rekins.html?id=${rekinsId}`;
        await sutit(env, admins, { subject: `Dāvanu karte — ${kam} (${eur(summa)})`, html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${esc(t)}</pre>`, text: t }, user.email);
      }
    })().catch((e) => console.error(e));
    if (ctx && ctx.waitUntil) ctx.waitUntil(darbs);
  }
  return json({ karte: { token: karte.token, statuss: karte.statuss }, rekins_nosutits: varSutit }, 201);
}

// ---------- Apmaksas sinhronizācija (izsauc rekini.js pēc rēķina rindu maiņas) ----------
export async function sinhronizetDavanu(env, rekins, origin) {
  const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE rekins_id = ?').bind(rekins.id).first();
  if (!k) return;
  const rindas = rekins.rindas || [];
  const viss = rindas.length > 0 && rindas.every((x) => x.p);
  const now = new Date().toISOString();
  if (viss && k.statuss === 'gaida') {
    const lidz = plusMenesi(sodien(), DERIGUMS_MENESI);
    await env.DB.prepare("UPDATE davanu_kartes SET statuss = 'aktiva', derigs_lidz = ?, aktivizeta_at = ?, updated_at = ? WHERE id = ?").bind(lidz, now, now, k.id).run();
    await sutitKarti(env, { ...k, statuss: 'aktiva', derigs_lidz: lidz }, origin).catch((e) => console.error(e));
  } else if (!viss && k.statuss === 'aktiva' && cent(k.atlikums) === cent(k.summa)) {
    // Apmaksas atzīme noņemta un karte vēl nav lietota → atpakaļ uz 'gaida'
    await env.DB.prepare("UPDATE davanu_kartes SET statuss = 'gaida', derigs_lidz = NULL, aktivizeta_at = NULL, updated_at = ? WHERE id = ?").bind(now, k.id).run();
  }
}

// ---------- Izmantošana pieteikumā ----------
// Atgriež { karte, segt } vai { kluda }. cena = kursa cena pēc atlaides.
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

// ---------- E-pasts ar karti ----------
const C = { forest: '#1E2E29', forest2: '#2B4038', line: '#3A5249', onForest: '#E9E4D8', muted: '#AFB9B0', paper: '#F6F1E8', accent: '#B4502A', glow: '#F0B999' };
const SERIF = "Lora, Georgia, 'Times New Roman', serif";
const SANS = "'Source Sans 3', 'Segoe UI', Roboto, Arial, sans-serif";

async function sutitKarti(env, k, origin) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !k.pirceja_epasts) return false;
  const kurss = k.course_id ? await env.DB.prepare('SELECT name FROM courses WHERE id = ?').bind(k.course_id).first() : null;
  const vertiba = k.tips === 'kurss' && kurss ? `Kurss “${kurss.name}”` : eur(k.summa);
  const saite = `${origin}/davanu-karte.html?k=${k.token}`;
  const html = `<!doctype html><html lang="lv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>Dāvanu karte</title></head>
<body style="margin:0;padding:0;background:${C.forest};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.forest};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td style="padding:0 8px 24px;"><span style="color:${C.onForest};font-family:${SERIF};font-size:30px;font-weight:700;">Libertas</span>
    <div style="font-family:${SERIF};font-style:italic;font-size:15px;color:${C.muted};padding-top:4px;">Tirdziņš</div></td></tr>
  <tr><td style="background:${C.forest2};border-radius:20px;padding:32px 28px;border:1px solid ${C.line};">
    <span style="display:inline-block;background:${C.paper};color:${C.forest};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">Dāvanu karte gatava</span>
    <h1 style="margin:16px 0 8px;font-family:${SERIF};font-size:26px;line-height:1.25;color:${C.paper};">Paldies — apmaksa saņemta!</h1>
    <p style="margin:0 0 20px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.onForest};">Dāvanu karte <strong style="color:${C.paper};">${esc(k.kam)}</strong> ir aktīva. To vari izdrukāt vai pārsūtīt saiti.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr><td style="background:${C.forest};border-radius:12px;padding:16px;">
      <div style="font-family:${SANS};font-size:14px;line-height:1.8;color:${C.muted};">Vērtība: <strong style="color:${C.paper};">${esc(vertiba)}</strong></div>
      <div style="font-family:${SANS};font-size:14px;line-height:1.8;color:${C.muted};">Kods: <strong style="color:${C.glow};font-size:18px;letter-spacing:.08em;">${esc(k.kods)}</strong></div>
      <div style="font-family:${SANS};font-size:14px;line-height:1.8;color:${C.muted};">Derīga līdz: <strong style="color:${C.paper};">${lv(k.derigs_lidz)}</strong></div>
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:${C.accent};">
      <a href="${esc(saite)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">Atvērt dāvanu karti</a>
    </td></tr></table>
    <p style="margin:24px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.muted};">Saņēmējs kodu ievada, piesakoties kursam libertas.study (lauks «Atlaides vai dāvanu kartes kods»).</p>
  </td></tr>
</table></td></tr></table></body></html>`;
  const text = `Paldies — apmaksa saņemta!\n\nDāvanu karte (${k.kam}) ir aktīva.\nVērtība: ${vertiba}\nKods: ${k.kods}\nDerīga līdz: ${lv(k.derigs_lidz)}\n\nKarte: ${saite}\n\nSaņēmējs kodu ievada, piesakoties kursam libertas.study.\n\nLibertas`;
  const rk = await rekviziti(env);
  return sutit(env, k.pirceja_epasts, { subject: 'Tava dāvanu karte ir gatava — Libertas', html, text }, rk.epasts || env.EMAIL_REPLY_TO);
}

// ---------- Maršruti ----------
export async function davanasMarsruts(request, env, { path, method, user, url, ctx }) {
  if (method === 'GET' && path === '/api/davanas/piedavajums') {
    return json({ summas: SUMMAS, min: SUMMA_MIN, max: SUMMA_MAX, dizaini: DIZAINI, derigums_menesi: DERIGUMS_MENESI, kursi: (await kursaSaraksts(env)).map((c) => ({ id: c.id, nosaukums: c.name, cena: c.price_eur, veids: c.veids })) });
  }
  let m = path.match(/^\/api\/davana\/([0-9a-f]{48})$/);
  if (m && method === 'GET') {
    const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE token = ?').bind(m[1]).first();
    if (!k) return fail('Dāvanu karte nav atrasta', 404);
    const kurss = k.course_id ? await env.DB.prepare('SELECT id, name, veids FROM courses WHERE id = ?').bind(k.course_id).first() : null;
    const out = publiska(k, kurss);
    // Pircējam (un adminam) neapmaksātai kartei — saite uz rēķinu
    if (user && (user.id === k.user_id || user.is_admin) && k.statuss === 'gaida' && k.rekins_id) {
      const r = await env.DB.prepare('SELECT token FROM rekini WHERE id = ?').bind(k.rekins_id).first();
      if (r) out.rekins = r.token;
    }
    return json({ karte: out });
  }
  if (path === '/api/davanas' || path === '/api/davanas/manas') {
    if (!user) return fail('Nepieciešama pieteikšanās', 401);
    if (method === 'POST' && path === '/api/davanas') return pasutit(request, env, user, url.origin, ctx);
    if (method === 'GET' && path === '/api/davanas/manas') {
      const { results } = await env.DB.prepare(
        `SELECT d.*, c.name AS kursa_nosaukums, r.token AS rekins_token FROM davanu_kartes d
         LEFT JOIN courses c ON c.id = d.course_id LEFT JOIN rekini r ON r.id = d.rekins_id
         WHERE d.user_id = ? AND d.statuss != 'atcelta' ORDER BY d.created_at DESC`
      ).bind(user.id).all();
      return json({ kartes: results.map((k) => ({ ...publiska(k, k.course_id ? { id: k.course_id, name: k.kursa_nosaukums } : null), token: k.token, created_at: k.created_at, rekins: k.statuss === 'gaida' ? k.rekins_token : null })) });
    }
    return fail('Nav atrasts', 404);
  }

  if (!path.startsWith('/api/admin/davanas')) return null;
  if (!user?.is_admin) return fail('Nav piekļuves', 403);
  if (method === 'GET' && path === '/api/admin/davanas') {
    const { results } = await env.DB.prepare(
      `SELECT d.*, c.name AS kursa_nosaukums, r.nr AS rekins_nr, u.email AS lietotaja_epasts, COALESCE(u.display_name, u.name) AS pircejs,
        (SELECT COUNT(*) FROM enrollments e WHERE e.davanu_karte_id = d.id) AS izmantojumi
       FROM davanu_kartes d LEFT JOIN courses c ON c.id = d.course_id LEFT JOIN rekini r ON r.id = d.rekins_id LEFT JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC`
    ).all();
    return json({ kartes: results });
  }
  m = path.match(/^\/api\/admin\/davanas\/(\d+)(\/sutit)?$/);
  if (m) {
    const id = Number(m[1]);
    const k = await env.DB.prepare('SELECT * FROM davanu_kartes WHERE id = ?').bind(id).first();
    if (!k) return fail('Dāvanu karte nav atrasta', 404);
    if (m[2] && method === 'POST') {
      if (k.statuss !== 'aktiva') return fail('Sūtīt var tikai aktīvu karti');
      return (await sutitKarti(env, k, url.origin)) ? json({ ok: true }) : fail('E-pastu neizdevās nosūtīt', 502);
    }
    if (method === 'PATCH') {
      const b = await readBody(request);
      const now = new Date().toISOString();
      if (b.statuss === 'atcelta') {
        if (k.statuss === 'izmantota' || cent(k.atlikums) < cent(k.summa)) return fail('Karte jau izmantota — to nevar atcelt');
        await env.DB.prepare("UPDATE davanu_kartes SET statuss = 'atcelta', updated_at = ? WHERE id = ?").bind(now, id).run();
      } else if (typeof b.derigs_lidz === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.derigs_lidz)) {
        await env.DB.prepare('UPDATE davanu_kartes SET derigs_lidz = ?, updated_at = ? WHERE id = ?').bind(b.derigs_lidz, now, id).run();
      } else return fail('Nav ko mainīt');
      return json({ karte: await env.DB.prepare('SELECT * FROM davanu_kartes WHERE id = ?').bind(id).first() });
    }
  }
  return fail('Nav atrasts', 404);
}
