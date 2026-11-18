// Grupu kursu telpas (kā Moodle): kursa sākums ar Google Meet saiti, nodarbības ar PDF/HTML prezentācijām,
// tīmekļa saturu un uzdevumiem, pasniedzēja papildmateriāli (fails vai saite), grupas progress.
// Lomas: users.loma = 'students' | 'pasniedzejs'; administrators vienmēr ir arī pasniedzējs.
// Faili un nodarbību saturs: KV GK_FAILI (fails/<id>, saturs/<kurss>/<nr>); metadati D1 (migrations/0011_grupu_kursi.sql).

import { sutit } from './epasts.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400) => json({ error: msg }, status);
async function readBody(request) { try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; } }
const nowIso = () => new Date().toISOString();
const randomHex = (n = 16) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');

const MAX_FAILS = 24 * 1024 * 1024; // KV vērtība ≤ 25 MiB
const PIEKLUVES_STATUSI = ['uznemts', 'sacis', 'pabeidzis'];
const ATLAUTIE_MIME = {
  pdf: ['application/pdf'],
  html: ['text/html'],
};
const LOMAS = ['students', 'pasniedzejs'];

export const irPasniedzejs = (user) => !!user && (user.is_admin || user.loma === 'pasniedzejs');

// Pasniedzējs šajā kursā: globālā loma/administrators vai pieteikums šim kursam ar lomu 'pasniedzejs'
async function kursaPasniedzejs(env, user, kurss) {
  if (!user) return false;
  if (irPasniedzejs(user)) return true;
  const r = await env.DB.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? AND loma = 'pasniedzejs' AND status != 'atteicies'").bind(user.id, kurss).first();
  return !!r;
}

// ---------- piekļuve ----------
async function piekluve(env, user, kurss) {
  const telpa = await env.DB.prepare(
    'SELECT g.*, c.name, c.veids, c.schedule FROM gk_kursi g JOIN courses c ON c.id = g.course_id WHERE g.course_id = ?'
  ).bind(kurss).first();
  if (!user) return { ok: false, iemesls: 'ienakt', telpa };
  if (user.gk_pasn) return { ok: true, pasniedzejs: true, telpa };
  if (user.gk_students) return { ok: !!telpa, students: true, telpa, iemesls: telpa ? null : 'nav_telpas' };
  const enr = await env.DB.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').bind(user.id, kurss).first();
  if (!enr || enr.status === 'atteicies') return { ok: false, iemesls: 'nav', telpa };
  if (!enr.paid && !PIEKLUVES_STATUSI.includes(enr.status)) return { ok: false, iemesls: 'apmaksa', telpa, enr };
  if (!telpa) return { ok: false, iemesls: 'nav_telpas', enr };
  return { ok: true, telpa, enr };
}

// Nodarbības datums: pasniedzēja ievadītais vai no grupas grafika (pēc kārtas)
async function grupasDatumi(kurss, enr) {
  if (!enr || !enr.period_start) return null;
  try {
    const { atrastPeriodu } = await import('../grafiks.js');
    const p = atrastPeriodu(kurss, enr.period_start);
    return p ? { nodarbibas: p.nodarbibas, laiks: p.laiks, teksts: p.dienasTeksts } : null;
  } catch { return null; }
}

const tiraUrl = (u) => {
  if (typeof u !== 'string') return null;
  u = u.trim();
  if (!u) return '';
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; }
};
const teksts = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '');

// ---------- kursu saraksts ----------
async function saraksts(env, user) {
  if (!user) return fail('Nepieciešama pieteikšanās', 401);
  const pasn = irPasniedzejs(user);
  let kursi;
  if (pasn) {
    ({ results: kursi } = await env.DB.prepare(
      `SELECT c.id, c.name, c.schedule, g.course_id AS telpa, g.meet_url,
              (SELECT COUNT(*) FROM gk_nodarbibas n WHERE n.course_id = c.id) AS nodarbibas,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status != 'atteicies' AND COALESCE(e.loma, 'students') != 'pasniedzejs' AND (e.paid = 1 OR e.status IN ('uznemts','sacis','pabeidzis'))) AS studenti
       FROM courses c LEFT JOIN gk_kursi g ON g.course_id = c.id WHERE COALESCE(c.veids, 'grupa') = 'grupa' ORDER BY c.id`
    ).all());
  } else {
    ({ results: kursi } = await env.DB.prepare(
      `SELECT c.id, c.name, c.schedule, g.course_id AS telpa, e.status, e.paid, COALESCE(e.loma, 'students') AS loma,
              (SELECT COUNT(*) FROM gk_nodarbibas n WHERE n.course_id = c.id AND (n.redzama = 1 OR e.loma = 'pasniedzejs')) AS nodarbibas,
              (SELECT COUNT(*) FROM enrollments s WHERE s.course_id = c.id AND s.status != 'atteicies' AND COALESCE(s.loma, 'students') != 'pasniedzejs' AND (s.paid = 1 OR s.status IN ('uznemts','sacis','pabeidzis'))) AS studenti
       FROM enrollments e JOIN courses c ON c.id = e.course_id LEFT JOIN gk_kursi g ON g.course_id = c.id
       WHERE e.user_id = ? AND e.status != 'atteicies' AND COALESCE(c.veids, 'grupa') = 'grupa' ORDER BY e.created_at DESC`
    ).bind(user.id).all());
  }
  return json({ pasniedzejs: pasn, kursi });
}

// ---------- kursa pārskats ----------
async function materialuKarte(env, kurss) {
  const { results } = await env.DB.prepare(
    'SELECT id, nr, tips, nosaukums, url, mime, izmers, at FROM gk_materiali WHERE course_id = ? ORDER BY nr, id'
  ).bind(kurss).all();
  const k = {};
  for (const m of results) {
    if (m.tips !== 'saite') m.url = null; // faili tikai caur /fails/<id>
    (k[m.nr] = k[m.nr] || []).push(m);
  }
  return k;
}

async function parskats(env, user, kurss) {
  const P = await piekluve(env, user, kurss);
  if (!P.ok) return json({ piekluve: { ok: false, iemesls: P.iemesls }, kurss: P.telpa ? { id: kurss, name: P.telpa.name } : null });
  const t = P.telpa;
  if (!t) return fail('Kursa telpa nav izveidota', 404);
  const pasn = !!P.pasniedzejs;
  const { results: nod } = await env.DB.prepare(
    `SELECT nr, nosaukums, apraksts, temas, datums, redzama, ir_saturs, uzdevumi FROM gk_nodarbibas WHERE course_id = ? ${pasn ? '' : 'AND redzama = 1'} ORDER BY nr`
  ).bind(kurss).all();
  const mat = await materialuKarte(env, kurss);
  const gr = await grupasDatumi(kurss, P.enr);
  const { results: prog } = await env.DB.prepare('SELECT nr, uzdevums, rezultats FROM gk_progress WHERE user_id = ? AND course_id = ?').bind(user.id, kurss).all();
  const progress = {};
  prog.forEach((r) => { (progress[r.nr] = progress[r.nr] || {})[r.uzdevums] = r.rezultats; });
  const majasdarbi = {};
  if (pasn) {
    const { results: md } = await env.DB.prepare("SELECT nr, COUNT(*) AS n FROM gk_majasdarbi WHERE course_id = ? AND statuss = 'iesniegts' GROUP BY nr").bind(kurss).all();
    md.forEach((r) => { majasdarbi[r.nr] = r.n; });
  } else {
    const { results: md } = await env.DB.prepare('SELECT nr, statuss, vertejums FROM gk_majasdarbi WHERE user_id = ? AND course_id = ?').bind(user.id, kurss).all();
    md.forEach((r) => { majasdarbi[r.nr] = { statuss: r.statuss, vertejums: r.vertejums }; });
  }
  return json({
    majasdarbi, // pasniedzējam: nepārbaudīto skaits pa nodarbībām; studentam: sava mājasdarba statuss
    piekluve: { ok: true, pasniedzejs: pasn, students: !!P.students },
    kurss: { id: kurss, name: t.name, schedule: t.schedule, meet_url: t.meet_url || '', ievads: t.ievads || '' },
    grupa: gr ? { laiks: gr.laiks, teksts: gr.teksts, sakums: gr.nodarbibas[0], beigas: gr.nodarbibas[gr.nodarbibas.length - 1] } : null,
    nodarbibas: nod.map((n) => ({
      ...n,
      temas: n.temas ? JSON.parse(n.temas) : [],
      redzama: !!n.redzama, ir_saturs: !!n.ir_saturs,
      datums: n.datums || (gr && gr.nodarbibas[n.nr - 1]) || null,
      materiali: mat[n.nr] || [],
    })),
    progress,
  });
}

async function nodarbiba(env, user, kurss, nr) {
  const P = await piekluve(env, user, kurss);
  if (!P.ok) return fail('Nav piekļuves', 403);
  const n = await env.DB.prepare('SELECT * FROM gk_nodarbibas WHERE course_id = ? AND nr = ?').bind(kurss, nr).first();
  if (!n || (!n.redzama && !P.pasniedzejs)) return fail('Nodarbība nav atrasta', 404);
  const saturs = n.ir_saturs ? await env.GK_FAILI.get(`saturs/${kurss}/${nr}`, 'json') : null;
  const mat = (await materialuKarte(env, kurss))[nr] || [];
  const { results: prog } = await env.DB.prepare('SELECT uzdevums, rezultats FROM gk_progress WHERE user_id = ? AND course_id = ? AND nr = ?').bind(user.id, kurss, nr).all();
  const gr = await grupasDatumi(kurss, P.enr);
  return json({
    nodarbiba: { nr: n.nr, nosaukums: n.nosaukums, apraksts: n.apraksts, temas: n.temas ? JSON.parse(n.temas) : [], redzama: !!n.redzama, datums: n.datums || (gr && gr.nodarbibas[nr - 1]) || null },
    saturs, materiali: mat,
    progress: Object.fromEntries(prog.map((r) => [r.uzdevums, r.rezultats])),
    pasniedzejs: !!P.pasniedzejs,
    majasdarbs: await env.DB.prepare('SELECT * FROM gk_majasdarbi WHERE user_id = ? AND course_id = ? AND nr = ?').bind(user.id, kurss, nr).first(),
  });
}

// ---------- faili ----------
async function fails(env, user, kurss, id, url) {
  const P = await piekluve(env, user, kurss);
  if (!P.ok) return fail('Nav piekļuves', 403);
  const m = await env.DB.prepare('SELECT m.*, n.redzama FROM gk_materiali m LEFT JOIN gk_nodarbibas n ON n.course_id = m.course_id AND n.nr = m.nr WHERE m.id = ? AND m.course_id = ?').bind(id, kurss).first();
  if (!m || !m.kv_atslega || (m.redzama === 0 && !P.pasniedzejs)) return fail('Fails nav atrasts', 404);
  const obj = await env.GK_FAILI.get(m.kv_atslega, 'arrayBuffer');
  if (!obj) return fail('Fails nav atrasts', 404);
  const lejup = url.searchParams.has('lejupielade');
  const vards = m.nosaukums.replace(/[\\/:*?"<>|\r\n]+/g, ' ').trim() || 'fails';
  const ext = m.tips === 'pdf' ? '.pdf' : m.tips === 'html' ? '.html' : '';
  const pilns = /\.[a-z0-9]{2,5}$/i.test(vards) ? vards : vards + ext;
  const h = new Headers({
    'Content-Type': m.mime || 'application/octet-stream',
    'Content-Disposition': `${lejup ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(pilns)}`,
    'Cache-Control': 'private, max-age=600',
    'X-Content-Type-Options': 'nosniff',
  });
  // HTML prezentācija: atveras izolēti (bez piekļuves vietnes sīkdatnēm/API)
  if ((m.mime || '').startsWith('text/html')) h.set('Content-Security-Policy', 'sandbox allow-scripts allow-popups allow-modals allow-downloads');
  return new Response(obj, { headers: h });
}

// ---------- progress ----------
async function saglabatProgresu(request, env, user, kurss) {
  const P = await piekluve(env, user, kurss);
  if (!P.ok) return fail('Nav piekļuves', 403);
  const b = await readBody(request);
  const nr = Number(b.nr);
  const uzd = typeof b.uzdevums === 'string' && /^[a-z0-9_-]{1,40}$/.test(b.uzdevums) ? b.uzdevums : null;
  if (!Number.isInteger(nr) || nr < 1 || nr > 200 || !uzd) return fail('Nepareizi dati');
  const rez = Math.max(0, Math.min(100, Math.round(Number(b.rezultats) || 0)));
  await env.DB.prepare(
    `INSERT INTO gk_progress (user_id, course_id, nr, uzdevums, rezultats, at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, course_id, nr, uzdevums) DO UPDATE SET rezultats = MAX(rezultats, excluded.rezultats), at = excluded.at`
  ).bind(user.id, kurss, nr, uzd, rez, nowIso()).run();
  return json({ ok: true });
}

// ---------- mājasdarbi ----------
const escH = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function vestule(virsraksts, rindas, poga, saite) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#24211E">
    <div style="background:#2F4A3A;color:#F6F1E8;padding:18px 22px;border-radius:12px 12px 0 0;font-size:18px;font-weight:bold">${escH(virsraksts)}</div>
    <div style="background:#F6F1E8;padding:20px 22px;border-radius:0 0 12px 12px;line-height:1.55">${rindas.map((r) => `<p style="margin:0 0 10px">${r}</p>`).join('')}
    <p style="margin:18px 0 0"><a href="${escH(saite)}" style="background:#B4502A;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${escH(poga)}</a></p></div></div>`;
  const text = [virsraksts, ...rindas.map((r) => r.replace(/<[^>]+>/g, '')), `${poga}: ${saite}`].join('\n\n');
  return { subject: virsraksts, html, text };
}
function pazinot(env, ctx, darbs) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return;
  const p = darbs().catch((e) => console.error('Mājasdarba e-pasts', e));
  if (ctx && ctx.waitUntil) ctx.waitUntil(p);
}
const MD_STATUSI = ['iesniegts', 'novertets', 'jalabo'];

// Students saglabā melnrakstu vai iesniedz. Novērtētu vairs nevar mainīt; «jalabo» = var iesniegt vēlreiz.
async function saglabatMajasdarbu(request, env, user, kurss, nr, origin, ctx) {
  const P = await piekluve(env, user, kurss);
  if (!P.ok) return fail('Nav piekļuves', 403);
  const n = await env.DB.prepare('SELECT nosaukums, redzama FROM gk_nodarbibas WHERE course_id = ? AND nr = ?').bind(kurss, nr).first();
  if (!n || (!n.redzama && !P.pasniedzejs)) return fail('Nodarbība nav atrasta', 404);
  const b = await readBody(request);
  const t = typeof b.teksts === 'string' ? b.teksts.replace(/\r\n/g, '\n').slice(0, 20000) : '';
  const iesniegt = !!b.iesniegt;
  const vecs = await env.DB.prepare('SELECT * FROM gk_majasdarbi WHERE user_id = ? AND course_id = ? AND nr = ?').bind(user.id, kurss, nr).first();
  if (vecs && vecs.statuss === 'novertets') return fail('Mājasdarbs jau novērtēts — to vairs nevar mainīt', 409);
  if (vecs && vecs.statuss === 'iesniegts' && !iesniegt) return fail('Mājasdarbs jau iesniegts', 409);
  if (iesniegt && t.trim().length < 20) return fail('Uzraksti mājasdarbu, pirms to iesniedz');
  let parb = null;
  if (b.parbaudes && typeof b.parbaudes === 'object') {
    parb = {};
    for (const [k, v] of Object.entries(b.parbaudes).slice(0, 20)) if (/^[a-z0-9_-]{1,20}$/.test(k) && Array.isArray(v)) parb[k] = [v[0] ? 1 : 0, String(v[1] ?? '').slice(0, 10)];
    parb = JSON.stringify(parb);
  }
  const now = nowIso();
  const statuss = iesniegt ? 'iesniegts' : 'melnraksts';
  await env.DB.prepare(
    `INSERT INTO gk_majasdarbi (user_id, course_id, nr, teksts, parbaudes, statuss, reizes, iesniegts_at, atjaunots_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, course_id, nr) DO UPDATE SET teksts = excluded.teksts, parbaudes = COALESCE(excluded.parbaudes, parbaudes),
       statuss = excluded.statuss, reizes = reizes + excluded.reizes, iesniegts_at = COALESCE(excluded.iesniegts_at, iesniegts_at), atjaunots_at = excluded.atjaunots_at`
  ).bind(user.id, kurss, nr, t, parb, statuss, iesniegt ? 1 : 0, iesniegt ? now : null, now).run();
  if (iesniegt && !P.pasniedzejs) {
    pazinot(env, ctx, async () => {
      const { results } = await env.DB.prepare(
        "SELECT email FROM users WHERE loma = 'pasniedzejs' OR id IN (SELECT user_id FROM enrollments WHERE course_id = ? AND loma = 'pasniedzejs' AND status != 'atteicies')"
      ).bind(kurss).all();
      const kam = [...new Set([...(env.ADMIN_EMAILS || '').split(','), ...results.map((r) => r.email)].map((x) => x.trim()).filter(Boolean))];
      if (!kam.length) return;
      const kursaNos = (P.telpa && P.telpa.name) || kurss;
      await sutit(env, kam, vestule(`Jauns mājasdarbs: ${user.name || user.email} · ${nr}. nodarbība`, [
        `<b>${escH(user.name || user.email)}</b> iesniedza mājasdarbu kursā <b>${escH(kursaNos)}</b> (${nr}. ${escH(n.nosaukums)})${vecs && vecs.reizes ? ' — labotā versija' : ''}.`,
        `<i>${escH(t.slice(0, 600))}${t.length > 600 ? '…' : ''}</i>`,
      ], 'Pārbaudīt kursa telpā', `${origin}/kursa-telpa.html?k=${kurss}#majasdarbi`), user.email);
    });
  }
  return json({ ok: true, statuss });
}

async function majasdarbuSaraksts(env, kurss, url) {
  const nr = Number(url.searchParams.get('nr')) || null;
  const { results } = await env.DB.prepare(
    `SELECT m.id, m.nr, m.teksts, m.parbaudes, m.statuss, m.reizes, m.vertejums, m.komentars, m.iesniegts_at, m.novertets_at,
            u.id AS user_id, COALESCE(u.display_name, u.name) AS name, u.email, n.nosaukums
     FROM gk_majasdarbi m JOIN users u ON u.id = m.user_id LEFT JOIN gk_nodarbibas n ON n.course_id = m.course_id AND n.nr = m.nr
     WHERE m.course_id = ? AND m.statuss != 'melnraksts' ${nr ? 'AND m.nr = ?' : ''} ORDER BY (m.statuss = 'iesniegts') DESC, m.iesniegts_at DESC`
  ).bind(...(nr ? [kurss, nr] : [kurss])).all();
  return json({ majasdarbi: results.map((r) => ({ ...r, parbaudes: r.parbaudes ? JSON.parse(r.parbaudes) : null })) });
}

async function novertetMajasdarbu(request, env, kurss, id, origin, ctx) {
  const b = await readBody(request);
  const m = await env.DB.prepare('SELECT m.*, u.email FROM gk_majasdarbi m JOIN users u ON u.id = m.user_id WHERE m.id = ? AND m.course_id = ?').bind(id, kurss).first();
  if (!m) return fail('Nav atrasts', 404);
  const statuss = MD_STATUSI.includes(b.statuss) ? b.statuss : 'novertets';
  const vert = teksts(b.vertejums, 40), kom = teksts(b.komentars, 4000);
  const now = nowIso();
  await env.DB.prepare('UPDATE gk_majasdarbi SET statuss = ?, vertejums = ?, komentars = ?, novertets_at = ?, atjaunots_at = ? WHERE id = ?')
    .bind(statuss, vert || null, kom || null, statuss === 'iesniegts' ? null : now, now, id).run();
  if (statuss !== 'iesniegts') {
    pazinot(env, ctx, () => sutit(env, m.email, vestule(
      statuss === 'jalabo' ? `Mājasdarbs jāpalabo · ${m.nr}. nodarbība` : `Mājasdarbs novērtēts · ${m.nr}. nodarbība`,
      [statuss === 'jalabo' ? 'Pasniedzējs atgrieza tavu mājasdarbu labošanai. Izlabo to un iesniedz vēlreiz kursa telpā.' : 'Pasniedzējs ir pārbaudījis tavu mājasdarbu.',
        vert ? `Vērtējums: <b>${escH(vert)}</b>` : '', kom ? `Komentārs: <i>${escH(kom)}</i>` : ''].filter(Boolean),
      'Atvērt mājasdarbu', `${origin}/kursa-telpa.html?k=${kurss}#n/${m.nr}`), env.EMAIL_REPLY_TO));
  }
  return json({ ok: true });
}

// ---------- pasniedzējs ----------
async function dalibnieki(env, kurss) {
  const { results: st } = await env.DB.prepare(
    `SELECT u.id, COALESCE(u.display_name, u.name) AS name, u.email, e.status, e.paid, e.period_start
     FROM enrollments e JOIN users u ON u.id = e.user_id WHERE e.course_id = ? AND e.status != 'atteicies' AND COALESCE(e.loma, 'students') != 'pasniedzejs' ORDER BY name`
  ).bind(kurss).all();
  const { results: pr } = await env.DB.prepare('SELECT user_id, nr, COUNT(*) AS izpilditi, MAX(at) AS pedejais FROM gk_progress WHERE course_id = ? GROUP BY user_id, nr').bind(kurss).all();
  const k = {};
  pr.forEach((r) => { (k[r.user_id] = k[r.user_id] || {})[r.nr] = r.izpilditi; });
  return json({ dalibnieki: st.map((s) => ({ ...s, piekluve: !!s.paid || PIEKLUVES_STATUSI.includes(s.status), progress: k[s.id] || {} })) });
}

async function labotKursu(request, env, kurss) {
  const b = await readBody(request);
  const sets = [], v = [];
  if ('meet_url' in b) { const u = tiraUrl(b.meet_url); if (u === null) return fail('Saitei jāsākas ar https://'); sets.push('meet_url = ?'); v.push(u); }
  if ('ievads' in b) { sets.push('ievads = ?'); v.push(teksts(b.ievads, 4000)); }
  if (!sets.length) return fail('Nav ko mainīt');
  sets.push('atjaunots_at = ?'); v.push(nowIso());
  await env.DB.prepare(`UPDATE gk_kursi SET ${sets.join(', ')} WHERE course_id = ?`).bind(...v, kurss).run();
  return json({ ok: true });
}

async function jaunaNodarbiba(request, env, kurss) {
  const b = await readBody(request);
  const max = await env.DB.prepare('SELECT MAX(nr) AS m FROM gk_nodarbibas WHERE course_id = ?').bind(kurss).first();
  const nr = Number.isInteger(b.nr) && b.nr > 0 ? b.nr : (max?.m || 0) + 1;
  const nos = teksts(b.nosaukums, 160) || `${nr}. nodarbība`;
  try {
    await env.DB.prepare('INSERT INTO gk_nodarbibas (course_id, nr, nosaukums, apraksts, redzama, atjaunots_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(kurss, nr, nos, teksts(b.apraksts, 2000), b.redzama === false ? 0 : 1, nowIso()).run();
  } catch { return fail('Nodarbība ar šo numuru jau ir'); }
  return json({ ok: true, nr });
}

async function labotNodarbibu(request, env, kurss, nr) {
  const b = await readBody(request);
  const sets = [], v = [];
  if ('nosaukums' in b) { const n = teksts(b.nosaukums, 160); if (!n) return fail('Nosaukums nevar būt tukšs'); sets.push('nosaukums = ?'); v.push(n); }
  if ('apraksts' in b) { sets.push('apraksts = ?'); v.push(teksts(b.apraksts, 2000)); }
  if ('redzama' in b) { sets.push('redzama = ?'); v.push(b.redzama ? 1 : 0); }
  if ('datums' in b) {
    const d = b.datums == null || b.datums === '' ? null : String(b.datums);
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return fail('Nepareizs datums');
    sets.push('datums = ?'); v.push(d);
  }
  if (!sets.length) return fail('Nav ko mainīt');
  sets.push('atjaunots_at = ?'); v.push(nowIso());
  await env.DB.prepare(`UPDATE gk_nodarbibas SET ${sets.join(', ')} WHERE course_id = ? AND nr = ?`).bind(...v, kurss, nr).run();
  return json({ ok: true });
}

async function dzestNodarbibu(env, kurss, nr) {
  const { results } = await env.DB.prepare('SELECT kv_atslega FROM gk_materiali WHERE course_id = ? AND nr = ? AND kv_atslega IS NOT NULL').bind(kurss, nr).all();
  await Promise.all(results.map((r) => env.GK_FAILI.delete(r.kv_atslega)));
  await env.GK_FAILI.delete(`saturs/${kurss}/${nr}`);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM gk_materiali WHERE course_id = ? AND nr = ?').bind(kurss, nr),
    env.DB.prepare('DELETE FROM gk_progress WHERE course_id = ? AND nr = ?').bind(kurss, nr),
    env.DB.prepare('DELETE FROM gk_nodarbibas WHERE course_id = ? AND nr = ?').bind(kurss, nr),
  ]);
  return json({ ok: true });
}

// Fails: neapstrādāts ķermenis + galvenes X-Tips (pdf|html|fails), X-Nosaukums (URI kodēts). Saite: JSON {tips:'saite', nosaukums, url}
async function pievienotMaterialu(request, env, user, kurss, nr) {
  const n = await env.DB.prepare('SELECT nr FROM gk_nodarbibas WHERE course_id = ? AND nr = ?').bind(kurss, nr).first();
  if (!n) return fail('Nodarbība nav atrasta', 404);
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (ct.startsWith('application/json')) {
    const b = await readBody(request);
    const u = tiraUrl(b.url);
    if (!u) return fail('Ievadi derīgu saiti (https://…)');
    const nos = teksts(b.nosaukums, 160) || new URL(u).hostname;
    const r = await env.DB.prepare('INSERT INTO gk_materiali (course_id, nr, tips, nosaukums, url, pievienoja, at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id')
      .bind(kurss, nr, 'saite', nos, u, user.id, nowIso()).first();
    return json({ ok: true, id: r.id });
  }
  const tips = request.headers.get('X-Tips');
  if (!['pdf', 'html', 'fails'].includes(tips)) return fail('Nepareizs materiāla veids');
  let nos = '';
  try { nos = decodeURIComponent(request.headers.get('X-Nosaukums') || ''); } catch {}
  nos = teksts(nos, 160) || 'Materiāls';
  const mime = ct.split(';')[0].trim() || 'application/octet-stream';
  if (ATLAUTIE_MIME[tips] && !ATLAUTIE_MIME[tips].includes(mime)) return fail(tips === 'pdf' ? 'Izvēlies PDF failu' : 'Izvēlies HTML failu');
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > MAX_FAILS) return fail('Fails ir par lielu (līdz 24 MB)', 413);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return fail('Tukšs fails');
  if (buf.byteLength > MAX_FAILS) return fail('Fails ir par lielu (līdz 24 MB)', 413);
  const key = `fails/${kurss}/${nr}/${randomHex(12)}`;
  await env.GK_FAILI.put(key, buf, { metadata: { mime, nos } });
  // Prezentācija (pdf/html) nodarbībai ir viena: jaunā aizstāj veco
  const vecie = [];
  if (tips === 'pdf' || tips === 'html') {
    const { results } = await env.DB.prepare('SELECT id, kv_atslega FROM gk_materiali WHERE course_id = ? AND nr = ? AND tips = ?').bind(kurss, nr, tips).all();
    vecie.push(...results);
  }
  const r = await env.DB.prepare('INSERT INTO gk_materiali (course_id, nr, tips, nosaukums, kv_atslega, mime, izmers, pievienoja, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(kurss, nr, tips, nos, key, mime, buf.byteLength, user.id, nowIso()).first();
  for (const v of vecie) {
    await env.DB.prepare('DELETE FROM gk_materiali WHERE id = ?').bind(v.id).run();
    if (v.kv_atslega) await env.GK_FAILI.delete(v.kv_atslega);
  }
  return json({ ok: true, id: r.id });
}

async function dzestMaterialu(env, kurss, id) {
  const m = await env.DB.prepare('SELECT * FROM gk_materiali WHERE id = ? AND course_id = ?').bind(id, kurss).first();
  if (!m) return fail('Nav atrasts', 404);
  if (m.kv_atslega) await env.GK_FAILI.delete(m.kv_atslega);
  await env.DB.prepare('DELETE FROM gk_materiali WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

async function izveidotTelpu(env, kurss) {
  const c = await env.DB.prepare("SELECT id FROM courses WHERE id = ? AND COALESCE(veids, 'grupa') = 'grupa'").bind(kurss).first();
  if (!c) return fail('Grupu kurss nav atrasts', 404);
  await env.DB.prepare('INSERT OR IGNORE INTO gk_kursi (course_id, izveidots_at, atjaunots_at) VALUES (?, ?, ?)').bind(kurss, nowIso(), nowIso()).run();
  return json({ ok: true });
}

// Administrators maina lomu
async function mainitLomu(request, env, id) {
  const b = await readBody(request);
  if (!LOMAS.includes(b.loma)) return fail('Nepareiza loma');
  const r = await env.DB.prepare('UPDATE users SET loma = ? WHERE id = ?').bind(b.loma, id).run();
  if (!r.meta.changes) return fail('Lietotājs nav atrasts', 404);
  return json({ ok: true });
}

// ---------- maršruti ----------
export async function gkMarsruts(request, env, { path, method, user, url, ctx }) {
  let m;
  if ((m = path.match(/^\/api\/admin\/lietotaji\/(\d+)\/loma$/)) && method === 'PATCH') {
    if (!user?.is_admin) return fail('Nav piekļuves', 403);
    return mainitLomu(request, env, Number(m[1]));
  }
  if (method === 'GET' && path === '/api/gk') return saraksts(env, user);

  m = path.match(/^\/api\/gk\/([a-z0-9-]+)(?:\/(.*))?$/);
  if (!m) return null;
  const [, kurss, rest = ''] = m;
  if (!user) return method === 'GET' && rest === '' ? parskats(env, null, kurss) : fail('Nepieciešama pieteikšanās', 401);
  // gk_pasn = pasniedzējs šajā kursā; «studenta skats» (gk-skats localStorage → galvene) to izslēdz
  const pasn = await kursaPasniedzejs(env, user, kurss);
  if (pasn && request.headers.get('X-Gk-Skats') === 'students') user = { ...user, is_admin: false, loma: 'students', gk_students: true, gk_pasn: false };
  else user = { ...user, gk_pasn: pasn };

  if (method === 'GET' && rest === '') return parskats(env, user, kurss);
  let r;
  if ((r = rest.match(/^nodarbiba\/(\d+)$/)) && method === 'GET') return nodarbiba(env, user, kurss, Number(r[1]));
  if ((r = rest.match(/^fails\/(\d+)$/)) && method === 'GET') return fails(env, user, kurss, Number(r[1]), url);
  if (rest === 'progress' && method === 'POST') return saglabatProgresu(request, env, user, kurss);
  if ((r = rest.match(/^majasdarbs\/(\d+)$/)) && method === 'PUT') return saglabatMajasdarbu(request, env, user, kurss, Number(r[1]), url.origin, ctx);

  // Turpmāk tikai šī kursa pasniedzējam
  if (!user.gk_pasn) return fail('Nav piekļuves', 403);
  if (rest === '' && method === 'POST') return izveidotTelpu(env, kurss);
  const telpa = await env.DB.prepare('SELECT course_id FROM gk_kursi WHERE course_id = ?').bind(kurss).first();
  if (!telpa) return fail('Kursa telpa nav izveidota', 404);
  if (rest === '' && method === 'PATCH') return labotKursu(request, env, kurss);
  if (rest === 'dalibnieki' && method === 'GET') return dalibnieki(env, kurss);
  if (rest === 'majasdarbi' && method === 'GET') return majasdarbuSaraksts(env, kurss, url);
  if ((r = rest.match(/^majasdarbi\/(\d+)$/)) && method === 'PATCH') return novertetMajasdarbu(request, env, kurss, Number(r[1]), url.origin, ctx);
  if (rest === 'nodarbibas' && method === 'POST') return jaunaNodarbiba(request, env, kurss);
  if ((r = rest.match(/^nodarbiba\/(\d+)$/))) {
    if (method === 'PATCH') return labotNodarbibu(request, env, kurss, Number(r[1]));
    if (method === 'DELETE') return dzestNodarbibu(env, kurss, Number(r[1]));
  }
  if ((r = rest.match(/^nodarbiba\/(\d+)\/materiali$/)) && method === 'POST') return pievienotMaterialu(request, env, user, kurss, Number(r[1]));
  if ((r = rest.match(/^materiali\/(\d+)$/)) && method === 'DELETE') return dzestMaterialu(env, kurss, Number(r[1]));
  return fail('Nav atrasts', 404);
}
