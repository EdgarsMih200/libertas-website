// Rēķini: admins izveido rēķinu (arī no pieteikuma), nosūta klientam e-pastā ar saiti uz rēķinu,
// atzīmē apmaksu pa maksājumiem. Klients rēķinu redz rekins.html?k=<token> (bez pieteikšanās).
import { sutit } from './epasts.js';
import { atrastPeriodu, periodaTeksts } from '../grafiks.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400) => json({ error: msg }, status);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const sodien = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Riga' }).format(new Date());
const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

async function readBody(request) {
  try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; }
}

// ---------- Rekvizīti ----------
const REKV_LAUKI = ['vards', 'talrunis', 'epasts', 'adrese', 'banka', 'konts', 'piezime'];
export async function rekviziti(env) {
  const r = await env.DB.prepare("SELECT v FROM iestatijumi WHERE k = 'rekviziti'").first();
  try { return r ? JSON.parse(r.v) : {}; } catch { return {}; }
}

async function nakamaisNr(env) {
  const { results } = await env.DB.prepare('SELECT nr FROM rekini').all();
  const max = results.reduce((m, r) => Math.max(m, parseInt(r.nr, 10) || 0), 0);
  const rk = await rekviziti(env);
  return String(Math.max(max + 1, Number(rk.pirmais_nr) || 1)).padStart(4, '0');
}

// ---------- Rēķina dati ----------
function tiritRindas(rindas) {
  if (!Array.isArray(rindas) || rindas.length > 60) return null;
  const out = [];
  for (const r of rindas) {
    if (!r || typeof r !== 'object') return null;
    const s = Math.round(Number(r.s) * 100) / 100;
    if (!Number.isFinite(s) || s < 0 || s > 100000) return null;
    const d = typeof r.d === 'string' && ISO.test(r.d) ? r.d : null;
    const p = typeof r.p === 'string' && ISO.test(r.p) ? r.p : null;
    out.push({ a: str(r.a, 200) || 'Maksājums', d, s, p });
  }
  return out;
}

function izvert(row) {
  if (!row) return null;
  let rindas = [];
  try { rindas = JSON.parse(row.rindas || '[]'); } catch {}
  return { ...row, rindas };
}

// Statuss sarakstiem: melnraksts / nosutits / daleji / apmaksats (+ kavets, ja kāds termiņš pagājis neapmaksāts)
export function rekinaStatuss(r) {
  const rindas = r.rindas || [];
  const apm = rindas.filter((x) => x.p).length;
  const kavets = rindas.some((x) => !x.p && x.d && x.d < sodien());
  const statuss = rindas.length && apm === rindas.length ? 'apmaksats' : apm ? 'daleji' : r.nosutits_at ? 'nosutits' : 'melnraksts';
  return { statuss, kavets: statuss !== 'apmaksats' && kavets, apmaksatas: apm, rindu: rindas.length };
}

const SELECT = `SELECT r.*, e.course_id, e.user_id, e.status AS enr_status FROM rekini r LEFT JOIN enrollments e ON e.id = r.enrollment_id`;
async function viens(env, id) {
  const r = izvert(await env.DB.prepare(`${SELECT} WHERE r.id = ?`).bind(id).first());
  return r ? { ...r, ...rekinaStatuss(r) } : null;
}

// Pieteikuma apmaksas sinhronizācija: pirmais maksājums → statuss "Uzņemts"; viss apmaksāts → paid = 1
async function sinhronizetPieteikumu(env, r, pecApmaksas) {
  if (!r.enrollment_id) return;
  const rindas = r.rindas || [];
  const apm = rindas.filter((x) => x.p).length;
  const viss = rindas.length > 0 && apm === rindas.length;
  const cur = await env.DB.prepare('SELECT paid, paid_at, status FROM enrollments WHERE id = ?').bind(r.enrollment_id).first();
  if (!cur) return;
  const now = new Date().toISOString();
  const statuss = apm && cur.status === 'pieteicies' ? 'uznemts' : cur.status;
  const paid = viss ? 1 : 0;
  if (paid === cur.paid && statuss === cur.status) return;
  await env.DB.prepare('UPDATE enrollments SET paid = ?, paid_at = ?, status = ?, updated_at = ? WHERE id = ?')
    .bind(paid, paid ? cur.paid_at || now : null, statuss, now, r.enrollment_id).run();
  if (paid && pecApmaksas) await pecApmaksas(env, r.enrollment_id);
}

// Sagatave no pieteikuma: maksātājs, kurss, grupa, cena ar atlaidi, grupas nodarbību datumi
async function sagatave(env, enrId) {
  const e = await env.DB.prepare(
    `SELECT e.*, u.email, COALESCE(u.display_name, u.name) AS vards, u.phone, c.name AS kurss, c.price_eur, c.veids
     FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id WHERE e.id = ?`
  ).bind(enrId).first();
  if (!e) return fail('Pieteikums nav atrasts', 404);
  const p = e.period_start ? atrastPeriodu(e.course_id, e.period_start) : null;
  const summa = Math.round(Number(e.price_eur || 0) * (100 - (e.atlaide_proc || 0))) / 100;
  return json({
    sagatave: {
      enrollment_id: e.id,
      m_vards: e.vards || '', m_talrunis: e.phone || '', m_epasts: e.email || '',
      kurss: `Kurss “${e.kurss}”`,
      kurss_info: e.veids === 'ekurss' ? 'Tiešsaistes pašmācības kurss' : p ? `Grupa: ${periodaTeksts(p)}` : '',
      summa, cena: e.price_eur, atlaide: e.atlaides_kods ? { kods: e.atlaides_kods, proc: e.atlaide_proc } : null,
      nodarbibas: p ? p.nodarbibas : [],
    },
  });
}

function lauki(body, cur = {}) {
  const out = {};
  for (const k of ['m_vards', 'm_talrunis', 'm_epasts', 'kurss', 'kurss_info', 'piezime']) {
    if (body[k] !== undefined) out[k] = str(body[k], k === 'piezime' ? 300 : 200) || null;
  }
  if (body.datums !== undefined) {
    if (typeof body.datums !== 'string' || !ISO.test(body.datums)) return { kluda: 'Nederīgs rēķina datums' };
    out.datums = body.datums;
  }
  if (body.nr !== undefined) {
    const nr = str(body.nr, 20);
    if (!/^[0-9A-Za-z\-\/]{1,20}$/.test(nr)) return { kluda: 'Nederīgs rēķina numurs' };
    out.nr = nr;
  }
  if (body.rindas !== undefined) {
    const r = tiritRindas(body.rindas);
    if (!r) return { kluda: 'Nederīgas rēķina rindas' };
    out.rindas = JSON.stringify(r);
    out.summa = Math.round(r.reduce((a, x) => a + x.s, 0) * 100) / 100;
    out.apmaksats = Math.round(r.filter((x) => x.p).reduce((a, x) => a + x.s, 0) * 100) / 100;
    const viss = r.length && r.every((x) => x.p);
    out.apmaksats_at = viss ? cur.apmaksats_at || new Date().toISOString() : null;
  }
  return { out };
}

async function izveidot(request, env) {
  const body = await readBody(request);
  const { out, kluda } = lauki({ datums: sodien(), rindas: [], ...body });
  if (kluda) return fail(kluda);
  if (!out.nr) out.nr = await nakamaisNr(env);
  if (await env.DB.prepare('SELECT 1 FROM rekini WHERE nr = ?').bind(out.nr).first()) return fail('Rēķins ar šo numuru jau ir', 409);
  let enr = null;
  if (body.enrollment_id != null) {
    if (!Number.isInteger(body.enrollment_id)) return fail('Nederīgs pieteikums');
    if (!(await env.DB.prepare('SELECT 1 FROM enrollments WHERE id = ?').bind(body.enrollment_id).first())) return fail('Pieteikums nav atrasts', 404);
    enr = body.enrollment_id;
  }
  const now = new Date().toISOString();
  const k = Object.keys(out);
  const r = await env.DB.prepare(
    `INSERT INTO rekini (${k.join(', ')}, token, enrollment_id, created_at, updated_at) VALUES (${k.map(() => '?').join(', ')}, ?, ?, ?, ?)`
  ).bind(...k.map((x) => out[x]), randomHex(24), enr, now, now).run();
  return json({ rekins: await viens(env, r.meta.last_row_id) }, 201);
}

async function labot(request, env, id, pecApmaksas) {
  const cur = await env.DB.prepare('SELECT * FROM rekini WHERE id = ?').bind(id).first();
  if (!cur) return fail('Rēķins nav atrasts', 404);
  const { out, kluda } = lauki(await readBody(request), cur);
  if (kluda) return fail(kluda);
  if (out.nr && out.nr !== cur.nr && (await env.DB.prepare('SELECT 1 FROM rekini WHERE nr = ?').bind(out.nr).first())) return fail('Rēķins ar šo numuru jau ir', 409);
  const k = Object.keys(out);
  if (!k.length) return fail('Nav ko mainīt');
  await env.DB.prepare(`UPDATE rekini SET ${k.map((x) => `${x} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .bind(...k.map((x) => out[x]), new Date().toISOString(), id).run();
  const r = await viens(env, id);
  if (out.rindas) await sinhronizetPieteikumu(env, r, pecApmaksas);
  return json({ rekins: r });
}

// ---------- E-pasts ar rēķinu ----------
const K = { forest: '#1E2E29', forest2: '#2B4038', line: '#3A5249', onForest: '#E9E4D8', muted: '#AFB9B0', paper: '#F6F1E8', accent: '#B4502A', glow: '#F0B999' };
const SERIF = "Lora, Georgia, 'Times New Roman', serif";
const SANS = "'Source Sans 3', 'Segoe UI', Roboto, Arial, sans-serif";
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' EUR';
const lv = (iso) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}.` : '');

function rekinaVestule(r, rk, saite) {
  const vards = (r.m_vards || '').split(' ')[0];
  const merkis = `Rēķins Nr. ${r.nr}`;
  const neapm = r.rindas.filter((x) => !x.p);
  const pirmais = neapm.find((x) => x.d);
  const rindasHtml = r.rindas.map((x, i) => `<tr>
    <td style="padding:8px 0;${i ? `border-top:1px solid ${K.line};` : ''}font-family:${SANS};font-size:14px;color:${K.onForest};">${esc(x.a)}${x.d ? `<br><span style="color:${K.muted};font-size:13px;">līdz ${lv(x.d)}</span>` : ''}</td>
    <td align="right" style="padding:8px 0;${i ? `border-top:1px solid ${K.line};` : ''}font-family:${SANS};font-size:15px;color:${K.paper};font-weight:600;white-space:nowrap;">${eur(x.s)}${x.p ? `<br><span style="color:${K.glow};font-size:12px;font-weight:400;">apmaksāts</span>` : ''}</td>
  </tr>`).join('');
  const rek = [['Saņēmējs', rk.vards], ['Banka', rk.banka], ['Konta Nr.', rk.konts], ['Maksājuma mērķis', merkis]].filter((x) => x[1]);
  const html = `<!doctype html><html lang="lv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><title>${esc(merkis)}</title></head>
<body style="margin:0;padding:0;background:${K.forest};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(merkis)} — ${esc(eur(r.summa))}${pirmais ? `, pirmais maksājums līdz ${lv(pirmais.d)}` : ''}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${K.forest};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td style="padding:0 8px 24px;">
    <span style="color:${K.onForest};font-family:${SERIF};font-size:30px;font-weight:700;letter-spacing:.02em;">Libertas</span>
    <div style="font-family:${SERIF};font-style:italic;font-size:15px;color:${K.muted};padding-top:4px;">Runā, saproti, ceļo, audz!</div>
  </td></tr>
  <tr><td style="background:${K.forest2};border-radius:20px;padding:32px 28px;border:1px solid ${K.line};">
    <span style="display:inline-block;background:${K.paper};color:${K.forest};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">Rēķins Nr. ${esc(r.nr)}</span>
    <h1 style="margin:16px 0 8px;font-family:${SERIF};font-size:26px;line-height:1.25;color:${K.paper};font-weight:700;">${vards ? `Labdien, ${esc(vards)}!` : 'Labdien!'}</h1>
    <p style="margin:0 0 20px;font-family:${SANS};font-size:16px;line-height:1.6;color:${K.onForest};">
      Nosūtām rēķinu${r.kurss ? ` — <strong style="color:${K.paper};">${esc(r.kurss)}</strong>` : ''}.${r.kurss_info ? `<br><span style="color:${K.muted};">${esc(r.kurss_info)}</span>` : ''}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:8px;">${rindasHtml}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${K.paper};margin-bottom:24px;"><tr>
      <td style="padding:10px 0;font-family:${SANS};font-size:16px;color:${K.paper};font-weight:700;">Kopā apmaksai</td>
      <td align="right" style="padding:10px 0;font-family:${SANS};font-size:18px;color:${K.paper};font-weight:700;">${eur(r.summa)}</td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr><td style="background:${K.forest};border-radius:12px;padding:14px 16px;">
      ${rek.map(([k, v]) => `<div style="font-family:${SANS};font-size:14px;line-height:1.7;color:${K.muted};">${k}: <strong style="color:${K.paper};">${esc(v)}</strong></div>`).join('')}
    </td></tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:${K.accent};">
      <a href="${esc(saite)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">Atvērt rēķinu (PDF)</a>
    </td></tr></table>
    <p style="margin:24px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${K.onForest};">Ja ir jautājumi, vienkārši atbildi uz šo e-pastu.</p>
    <p style="margin:16px 0 0;font-family:${SERIF};font-style:italic;font-size:18px;color:${K.glow};">Paldies!</p>
    <p style="margin:4px 0 0;font-family:${SANS};font-size:15px;color:${K.onForest};">${esc(rk.vards || 'Libertas')}</p>
  </td></tr>
  <tr><td style="padding:24px 8px 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${K.muted};">${esc([rk.talrunis, rk.epasts].filter(Boolean).join(' · '))}<br>© ${new Date().getFullYear()} Libertas</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    vards ? `Labdien, ${vards}!` : 'Labdien!', '',
    `Nosūtām rēķinu Nr. ${r.nr}${r.kurss ? ` — ${r.kurss}` : ''}.`, '',
    ...r.rindas.map((x) => `${x.a}${x.d ? ` (līdz ${lv(x.d)})` : ''}: ${eur(x.s)}${x.p ? ' — apmaksāts' : ''}`),
    `Kopā apmaksai: ${eur(r.summa)}`, '',
    ...rek.map(([k, v]) => `${k}: ${v}`), '',
    `Rēķins: ${saite}`, '', 'Paldies!', rk.vards || 'Libertas',
  ].join('\n');
  return { subject: `${merkis} — Libertas`, html, text };
}

async function nosutit(request, env, id, origin) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return fail('E-pasta sūtīšana nav iestatīta (RESEND_API_KEY / EMAIL_FROM)', 503);
  const r = await viens(env, id);
  if (!r) return fail('Rēķins nav atrasts', 404);
  const body = await readBody(request);
  const uz = str(body.epasts, 200) || r.m_epasts;
  if (!uz || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uz)) return fail('Nav derīga maksātāja e-pasta adrese');
  if (!r.rindas.length) return fail('Rēķinā nav nevienas rindas');
  const rk = await rekviziti(env);
  if (!rk.konts) return fail('Vispirms aizpildi rekvizītus (Rēķini → Rekvizīti)');
  const saite = `${origin}/rekins.html?k=${r.token}`;
  const ok = await sutit(env, uz, rekinaVestule(r, rk, saite), rk.epasts || env.EMAIL_REPLY_TO);
  if (!ok) return fail('E-pastu neizdevās nosūtīt. Mēģini vēlreiz.', 502);
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE rekini SET nosutits_at = ?, nosutits_uz = ?, updated_at = ? WHERE id = ?').bind(now, uz, now, id).run();
  return json({ rekins: await viens(env, id) });
}

// ---------- Maršruti ----------
export async function rekiniMarsruts(request, env, { path, method, user, url, pecApmaksas }) {
  let m = path.match(/^\/api\/rekins\/([0-9a-f]{48})$/);
  if (m && method === 'GET') {
    const r = izvert(await env.DB.prepare('SELECT nr, m_vards, m_talrunis, m_epasts, kurss, kurss_info, datums, rindas, piezime, summa, apmaksats FROM rekini WHERE token = ?').bind(m[1]).first());
    if (!r) return fail('Rēķins nav atrasts', 404);
    const rk = await rekviziti(env);
    return json({ rekins: r, rekviziti: Object.fromEntries(REKV_LAUKI.map((k) => [k, rk[k] || ''])) });
  }
  if (!path.startsWith('/api/admin/rekini') && path !== '/api/admin/rekviziti') return null;
  if (!user?.is_admin) return fail('Nav piekļuves', 403);

  if (path === '/api/admin/rekviziti') {
    if (method === 'GET') return json({ rekviziti: await rekviziti(env) });
    if (method === 'PUT') {
      const b = await readBody(request);
      const v = Object.fromEntries(REKV_LAUKI.map((k) => [k, str(b[k], 300)]));
      const n = parseInt(b.pirmais_nr, 10);
      if (Number.isInteger(n) && n > 0) v.pirmais_nr = n;
      await env.DB.prepare("INSERT INTO iestatijumi (k, v) VALUES ('rekviziti', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(v)).run();
      return json({ rekviziti: v });
    }
  }
  if (path === '/api/admin/rekini') {
    if (method === 'GET') {
      const { results } = await env.DB.prepare(`${SELECT} ORDER BY r.created_at DESC`).all();
      return json({
        rekini: results.map((x) => { const r = izvert(x); return { ...r, ...rekinaStatuss(r) }; }),
        nakamais_nr: await nakamaisNr(env), rekviziti: await rekviziti(env),
        epasts: !!(env.RESEND_API_KEY && env.EMAIL_FROM),
      });
    }
    if (method === 'POST') return izveidot(request, env);
  }
  if (path === '/api/admin/rekini/sagatave' && method === 'GET') {
    const id = Number(url.searchParams.get('pieteikums'));
    if (!Number.isInteger(id) || id < 1) return fail('Nav norādīts pieteikums');
    return sagatave(env, id);
  }
  m = path.match(/^\/api\/admin\/rekini\/(\d+)(\/sutit)?$/);
  if (m) {
    const id = Number(m[1]);
    if (m[2]) return method === 'POST' ? nosutit(request, env, id, url.origin) : fail('Nav atrasts', 404);
    if (method === 'GET') {
      const r = await viens(env, id);
      return r ? json({ rekins: r, rekviziti: await rekviziti(env), epasts: !!(env.RESEND_API_KEY && env.EMAIL_FROM) }) : fail('Rēķins nav atrasts', 404);
    }
    if (method === 'PUT') return labot(request, env, id, pecApmaksas);
    if (method === 'DELETE') {
      const r = await env.DB.prepare('DELETE FROM rekini WHERE id = ?').bind(id).run();
      return r.meta.changes ? json({ ok: true }) : fail('Rēķins nav atrasts', 404);
    }
  }
  return fail('Nav atrasts', 404);
}

// Priekšskatījumam / testiem
export { rekinaVestule };
