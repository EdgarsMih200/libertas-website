// Libertas Worker: Google autorizācija, kursu pieteikumi, administrācija.
import { sutitPieteikumaEpastus } from './epasts.js';
import { ekMarsruts, pecApmaksas } from './ekursi.js';
import { AR_GRAFIKU, atrastPeriodu, periodaTeksts } from '../grafiks.js';

const STATUSES = ['pieteicies', 'uznemts', 'sacis', 'pabeidzis', 'atteicies'];
const SESSION_DAYS = 30;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
const fail = (msg, status = 400) => json({ error: msg }, status);

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function sha256Hex(s) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
function randomHex(bytes = 32) {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}

function getCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}
function cookie(name, value, maxAge, path = '/') {
  return `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

// Atļauj tikai relatīvus ceļus uz to pašu vietni
function safeReturn(p) {
  if (typeof p !== 'string' || !p.startsWith('/') || p.startsWith('//') || p.includes('\\') || /[\r\n]/.test(p)) return '/';
  return p;
}

const isAdminEmail = (env, email) =>
  (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes((email || '').toLowerCase());

async function getUser(request, env) {
  const tok = getCookie(request, 'lsid');
  if (!tok || !/^[0-9a-f]{64}$/.test(tok)) return null;
  const hash = await sha256Hex(tok);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(hash, now).first();
  if (!row) return null;
  row.google_name = row.name;
  if (row.display_name) row.name = row.display_name; // paša izvēlētais vārds (e-pastiem, adminam, galvenei)
  row.is_admin = isAdminEmail(env, row.email);
  return row;
}

async function readBody(request) {
  try {
    const b = await request.json();
    return b && typeof b === 'object' ? b : {};
  } catch {
    return {};
  }
}

// picture: paša augšupielādētais foto (ja ir), citādi Google foto. ?v= maina adresi pēc katras nomaiņas (kešs).
const publicUser = (u) => ({
  id: u.id, email: u.email, name: u.name, phone: u.phone, is_admin: !!u.is_admin, created_at: u.created_at,
  picture: u.avatar_at ? `/api/me/avatar?v=${encodeURIComponent(u.avatar_at)}` : u.picture,
  google_picture: u.picture, custom_picture: !!u.avatar_at,
});

// ---------- Google OAuth ----------
async function authStart(request, env, url) {
  // Kamēr Google klients nav iestatīts, nesūta lietotāju uz Google kļūdas lapu
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.startsWith('REPLACE') || !env.GOOGLE_CLIENT_SECRET) {
    return new Response('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;padding:2rem">Pieteikšanās ar Google vēl tiek iestatīta. Lūdzu, mēģiniet vēlāk. <a href="/">Atpakaļ</a></p>',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  const state = randomHex(16);
  const ret = safeReturn(url.searchParams.get('return') || '/');
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return new Response(null, {
    status: 302,
    headers: [
      ['Location', `https://accounts.google.com/o/oauth2/v2/auth?${params}`],
      ['Set-Cookie', cookie('oauth_state', `${state}.${encodeURIComponent(ret)}`, 600, '/auth')],
      ['Cache-Control', 'no-store'],
    ],
  });
}

async function authCallback(request, env, url) {
  const stored = getCookie(request, 'oauth_state') || '';
  const dot = stored.indexOf('.');
  const state = dot > -1 ? stored.slice(0, dot) : '';
  let ret = '/';
  try { ret = safeReturn(decodeURIComponent(stored.slice(dot + 1))); } catch {}
  const clearState = cookie('oauth_state', '', 0, '/auth');
  const bad = (msg) => new Response(msg, { status: 400, headers: { 'Set-Cookie': clearState, 'Content-Type': 'text/plain; charset=utf-8' } });

  const code = url.searchParams.get('code');
  if (!state || url.searchParams.get('state') !== state || !code) return bad('Pieteikšanās neizdevās (nederīgs stāvoklis).');

  const tokRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${url.origin}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokRes.ok) return bad('Pieteikšanās neizdevās (Google noraidīja kodu).');
  const tok = await tokRes.json();
  if (!tok.id_token) return bad('Pieteikšanās neizdevās.');

  const infoRes = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(tok.id_token));
  if (!infoRes.ok) return bad('Pieteikšanās neizdevās (nederīgs token).');
  const info = await infoRes.json();
  if (info.aud !== env.GOOGLE_CLIENT_ID || !(info.email_verified === true || info.email_verified === 'true') || !info.sub || !info.email) {
    return bad('Pieteikšanās neizdevās (neapstiprināts konts).');
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (google_sub, email, name, picture, created_at, last_login_at, last_seen_at, login_count, terms_accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture,
       last_login_at = excluded.last_login_at, last_seen_at = excluded.last_seen_at, login_count = login_count + 1`
  ).bind(info.sub, info.email.toLowerCase(), info.name || null, info.picture || null, now, now, now, now).run();
  const user = await env.DB.prepare('SELECT id FROM users WHERE google_sub = ?').bind(info.sub).first();

  const token = randomHex(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), user.id, now, expires).run();
  // Iztīra novecojušās sesijas
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();

  return new Response(null, {
    status: 302,
    headers: [
      ['Location', ret],
      ['Set-Cookie', cookie('lsid', token, SESSION_DAYS * 86400)],
      ['Set-Cookie', clearState],
      ['Cache-Control', 'no-store'],
    ],
  });
}

async function logout(request, env) {
  const tok = getCookie(request, 'lsid');
  if (tok) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(tok)).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('lsid', '', 0) });
}

// ---------- Lietotāja API ----------
const ENROLL_SELECT = `SELECT e.id, e.user_id, e.course_id, c.name AS course_name, c.price_eur, c.schedule, e.status, e.paid, e.created_at,
  e.period_start, e.period_end, e.period_days, c.veids, e.ek_lidz,
  (SELECT kods FROM ek_sertifikati s WHERE s.user_id = e.user_id AND s.kurss = e.course_id) AS ek_sertifikats,
  (SELECT COUNT(*) FROM ek_progress p WHERE p.user_id = e.user_id AND p.kurss = e.course_id AND p.nokartots_at IS NOT NULL) AS ek_nokartotas,
  (SELECT COUNT(*) FROM ek_saturs x WHERE x.kurss = e.course_id AND x.fails LIKE 'nodarbiba-%' AND x.gabals = 0) AS ek_nodarbibas
  FROM enrollments e JOIN courses c ON c.id = e.course_id`;

async function me(request, env, user) {
  if (!user) return json({ user: null });
  const now = Date.now();
  if (!user.last_seen_at || now - Date.parse(user.last_seen_at) > 5 * 60000) {
    await env.DB.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(new Date(now).toISOString(), user.id).run();
  }
  const { results } = await env.DB.prepare(`${ENROLL_SELECT} WHERE e.user_id = ? ORDER BY e.created_at DESC`).bind(user.id).all();
  return json({ user: publicUser(user), enrollments: results.map(({ user_id, ...rest }) => rest) });
}

// Profila labošana: tālrunis un/vai vārds (tukšs vārds = atpakaļ uz Google vārdu)
async function patchMe(request, env, user) {
  const body = await readBody(request);
  const sets = [];
  const vals = [];
  const out = { ok: true };
  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') return fail('Nederīgs tālrunis');
    const phone = body.phone.trim().slice(0, 40);
    if (phone && !/^[0-9+()\-\s.]{5,40}$/.test(phone)) return fail('Tālrunī drīkst būt tikai cipari, atstarpes un + ( ) -');
    sets.push('phone = ?'); vals.push(phone || null);
    out.phone = phone || null;
  }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string') return fail('Nederīgs vārds');
    const name = body.name.replace(/\s+/g, ' ').trim().slice(0, 80);
    const dn = name && name !== user.google_name ? name : null;
    sets.push('display_name = ?'); vals.push(dn);
    out.name = dn || user.google_name || null;
  }
  if (!sets.length) return fail('Nav ko mainīt');
  await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, user.id).run();
  return json(out);
}

// ---------- Profila foto (D1 tabula avatars; klients to jau samazina līdz ~256×256 JPEG) ----------
const AVATAR_MAX_B64 = 200 * 1024;

async function putAvatar(request, env, user) {
  const { image } = await readBody(request);
  const m = typeof image === 'string' && image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return fail('Nederīgs attēls');
  if (m[2].length > AVATAR_MAX_B64) return fail('Attēls ir par lielu', 413);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO avatars (user_id, mime, data, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET mime = excluded.mime, data = excluded.data, updated_at = excluded.updated_at`)
      .bind(user.id, m[1], m[2], now),
    env.DB.prepare('UPDATE users SET avatar_at = ? WHERE id = ?').bind(now, user.id),
  ]);
  return json({ user: publicUser({ ...user, avatar_at: now }) });
}

async function deleteAvatar(env, user) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM avatars WHERE user_id = ?').bind(user.id),
    env.DB.prepare('UPDATE users SET avatar_at = NULL WHERE id = ?').bind(user.id),
  ]);
  return json({ user: publicUser({ ...user, avatar_at: null }) });
}

// Tikai savs foto (privāts kešs; adrese mainās ar ?v=)
async function getAvatar(env, user) {
  const row = await env.DB.prepare('SELECT mime, data FROM avatars WHERE user_id = ?').bind(user.id).first();
  if (!row) return new Response('Nav atrasts', { status: 404 });
  const bin = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
  return new Response(bin, {
    headers: { 'Content-Type': row.mime, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}

async function getEnrollment(env, userId, courseId) {
  return env.DB.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').bind(userId, courseId).first();
}

// Grupas periods: kursiem ar grafiku obligāts un vēl nesācies; citiem — null ("datumi tiks precizēti")
function parbauditPeriodu(courseId, period, { prasitNakotni = true } = {}) {
  if (!AR_GRAFIKU.includes(courseId)) return { p: null };
  if (period === undefined || period === null || period === '') return { kluda: 'Izvēlies grupas periodu' };
  const p = atrastPeriodu(courseId, period);
  if (!p) return { kluda: 'Nederīgs grupas periods' };
  if (prasitNakotni && p.sakums < new Date().toISOString().slice(0, 10)) return { kluda: 'Šī grupa jau ir sākusies — izvēlies citu periodu' };
  return { p };
}

async function enroll(request, env, user, ctx, origin) {
  const { course_id, period } = await readBody(request);
  if (typeof course_id !== 'string') return fail('Nav norādīts kurss');
  const course = await env.DB.prepare('SELECT id, name, price_eur, schedule, veids, ek_dienas FROM courses WHERE id = ? AND active = 1').bind(course_id).first();
  if (!course) return fail('Kurss nav atrasts', 404);
  const pr = parbauditPeriodu(course_id, period);
  if (pr.kluda) return fail(pr.kluda);
  const pv = pr.p ? [pr.p.sakums, pr.p.beigas, pr.p.dienas] : [null, null, null];
  const now = new Date().toISOString();
  const existing = await getEnrollment(env, user.id, course_id);
  if (existing) {
    if (existing.status !== 'atteicies') return fail('Jūs jau esat pieteicies šim kursam', 409);
    await env.DB.prepare("UPDATE enrollments SET status = 'pieteicies', period_start = ?, period_end = ?, period_days = ?, updated_at = ? WHERE id = ?")
      .bind(...pv, now, existing.id).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO enrollments (user_id, course_id, status, paid, period_start, period_end, period_days, created_at, updated_at) VALUES (?, ?, 'pieteicies', 0, ?, ?, ?, ?, ?)"
    ).bind(user.id, course_id, ...pv, now, now).run();
  }
  const enrollment = await getEnrollment(env, user.id, course_id);
  // Apstiprinājuma e-pasts klientam + paziņojums administratoram (fonā, neaizkavē atbildi)
  const admins = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const kursam = { ...course, schedule: course.veids === 'ekurss' ? `Pašmācība · ${course.ek_dienas || 90} dienas no apmaksas` : pr.p ? periodaTeksts(pr.p) : 'Nākamā grupa — datumi tiks precizēti' };
  const darbs = sutitPieteikumaEpastus(env, { user, course: kursam, enrollment, origin, admins }).catch((e) => console.error(e));
  if (ctx && ctx.waitUntil) ctx.waitUntil(darbs);
  return json({ enrollment, email_sent: !!(env.RESEND_API_KEY && env.EMAIL_FROM) });
}

async function cancel(request, env, user) {
  const { course_id } = await readBody(request);
  if (typeof course_id !== 'string') return fail('Nav norādīts kurss');
  const existing = await getEnrollment(env, user.id, course_id);
  if (!existing) return fail('Pieteikums nav atrasts', 404);
  if (existing.status !== 'pieteicies') return fail('Šo pieteikumu vairs nevar atcelt', 409);
  await env.DB.prepare("UPDATE enrollments SET status = 'atteicies', updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), existing.id).run();
  return json({ enrollment: await getEnrollment(env, user.id, course_id) });
}

async function courses(env) {
  const { results } = await env.DB.prepare('SELECT id, name, price_eur, schedule FROM courses WHERE active = 1 ORDER BY name').all();
  return json({ courses: results });
}

// ---------- Administrācija ----------
const ADMIN_ENROLL_SELECT = `SELECT e.*, u.email AS user_email, COALESCE(u.display_name, u.name) AS user_name, c.name AS course_name
  FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id`;

async function adminUsers(env) {
  const { results: users } = await env.DB.prepare('SELECT * FROM users ORDER BY last_seen_at DESC').all();
  const { results: enr } = await env.DB.prepare(`${ENROLL_SELECT} ORDER BY e.created_at DESC`).all();
  const byUser = new Map();
  for (const e of enr) {
    if (!byUser.has(e.user_id)) byUser.set(e.user_id, []);
    byUser.get(e.user_id).push(e);
  }
  return json({ users: users.map((u) => ({ ...u, name: u.display_name || u.name, enrollments: byUser.get(u.id) || [] })) });
}

async function adminEnrollments(env) {
  const { results } = await env.DB.prepare(`${ADMIN_ENROLL_SELECT} ORDER BY e.created_at DESC`).all();
  return json({ enrollments: results });
}

async function adminAddEnrollment(request, env) {
  const { user_id, course_id, status, period } = await readBody(request);
  const st = status === undefined ? 'pieteicies' : status;
  if (!Number.isInteger(user_id) || typeof course_id !== 'string') return fail('Nepilnīgi dati');
  if (!STATUSES.includes(st)) return fail('Nederīgs statuss');
  const u = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(user_id).first();
  if (!u) return fail('Lietotājs nav atrasts', 404);
  const c = await env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(course_id).first();
  if (!c) return fail('Kurss nav atrasts', 404);
  if (await getEnrollment(env, user_id, course_id)) return fail('Pieteikums jau eksistē', 409);
  const pr = period ? parbauditPeriodu(course_id, period, { prasitNakotni: false }) : { p: null };
  if (pr.kluda) return fail(pr.kluda);
  const pv = pr.p ? [pr.p.sakums, pr.p.beigas, pr.p.dienas] : [null, null, null];
  const now = new Date().toISOString();
  const r = await env.DB.prepare(
    'INSERT INTO enrollments (user_id, course_id, status, paid, period_start, period_end, period_days, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)'
  ).bind(user_id, course_id, st, ...pv, now, now).run();
  const row = await env.DB.prepare(`${ADMIN_ENROLL_SELECT} WHERE e.id = ?`).bind(r.meta.last_row_id).first();
  return json({ enrollment: row }, 201);
}

async function adminPatchEnrollment(request, env, id) {
  const body = await readBody(request);
  const cur = await env.DB.prepare('SELECT * FROM enrollments WHERE id = ?').bind(id).first();
  if (!cur) return fail('Pieteikums nav atrasts', 404);
  const sets = [];
  const vals = [];
  const now = new Date().toISOString();
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return fail('Nederīgs statuss');
    sets.push('status = ?'); vals.push(body.status);
  }
  if (body.paid !== undefined) {
    const paid = body.paid === true || body.paid === 1;
    sets.push('paid = ?', 'paid_at = ?');
    vals.push(paid ? 1 : 0, paid ? (cur.paid && cur.paid_at ? cur.paid_at : now) : null);
  }
  if (body.period !== undefined) {
    // Administrators var mainīt grupu (arī uz jau sākušos) vai noņemt (null)
    const pr = body.period ? parbauditPeriodu(cur.course_id, body.period, { prasitNakotni: false }) : { p: null };
    if (pr.kluda) return fail(pr.kluda);
    sets.push('period_start = ?', 'period_end = ?', 'period_days = ?');
    vals.push(...(pr.p ? [pr.p.sakums, pr.p.beigas, pr.p.dienas] : [null, null, null]));
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') return fail('Nederīgas piezīmes');
    sets.push('notes = ?'); vals.push(body.notes === null ? null : body.notes.slice(0, 2000));
  }
  if (!sets.length) return fail('Nav ko mainīt');
  sets.push('updated_at = ?'); vals.push(now);
  await env.DB.prepare(`UPDATE enrollments SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run();
  if (body.paid !== undefined) await pecApmaksas(env, id);
  const row = await env.DB.prepare(`${ADMIN_ENROLL_SELECT} WHERE e.id = ?`).bind(id).first();
  return json({ enrollment: row });
}

async function adminDeleteEnrollment(env, id) {
  const r = await env.DB.prepare('DELETE FROM enrollments WHERE id = ?').bind(id).run();
  if (!r.meta.changes) return fail('Pieteikums nav atrasts', 404);
  return json({ ok: true });
}

// ---------- Materiāli tikai reģistrētiem (wrangler.jsonc run_worker_first: /materiali-zviedru*) ----------
// Bez sesijas: lapa → materiali.html?slegts=zviedru (tur Empanadillo paskaidro), skripts → 403. Ar sesiju: parastais fails, bez koplietota keša
async function tikaiRegistretiem(request, env, url) {
  let user = null;
  try { user = await getUser(request, env); } catch { user = null; }
  if (!user) {
    if (/\.(js|json|mp3|svg)$/.test(url.pathname)) return new Response('Tikai reģistrētiem lietotājiem', { status: 403, headers: { 'Cache-Control': 'no-store' } });
    return new Response(null, { status: 302, headers: { Location: '/materiali.html?slegts=zviedru', 'Cache-Control': 'no-store' } });
  }
  const r = await env.ASSETS.fetch(request);
  const h = new Headers(r.headers);
  h.set('Cache-Control', 'private, no-store');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

// ---------- Maršrutēšana ----------
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method;

    if (path.startsWith('/materiali-zviedru')) return await tikaiRegistretiem(request, env, url);
    if (!path.startsWith('/api/') && !path.startsWith('/auth/')) return env.ASSETS.fetch(request);

    try {
      // CSRF aizsardzība
      if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
        const origin = request.headers.get('Origin');
        if (origin && origin !== url.origin) return fail('Aizliegts', 403);
      }

      if (method === 'GET' && path === '/auth/google') return await authStart(request, env, url);
      if (method === 'GET' && path === '/auth/google/callback') return await authCallback(request, env, url);
      if (method === 'POST' && path === '/auth/logout') return await logout(request, env);

      if (method === 'GET' && path === '/api/courses') return await courses(env);

      const user = await getUser(request, env);
      if (method === 'GET' && path === '/api/me') return await me(request, env, user);

      if (path.startsWith('/api/ek/') || path.startsWith('/api/admin/ek') || path.startsWith('/api/sertifikats/')) {
        const atb = await ekMarsruts(request, env, { path, method, user, origin: url.origin, url });
        if (atb) return atb;
      }

      if (path.startsWith('/api/admin/')) {
        if (!user || !user.is_admin) return fail('Nav piekļuves', 403);
        if (method === 'GET' && path === '/api/admin/users') return await adminUsers(env);
        if (path === '/api/admin/enrollments') {
          if (method === 'GET') return await adminEnrollments(env);
          if (method === 'POST') return await adminAddEnrollment(request, env);
        }
        const m = path.match(/^\/api\/admin\/enrollments\/(\d+)$/);
        if (m) {
          const id = Number(m[1]);
          if (method === 'PATCH') return await adminPatchEnrollment(request, env, id);
          if (method === 'DELETE') return await adminDeleteEnrollment(env, id);
        }
        return fail('Nav atrasts', 404);
      }

      if (['/api/me', '/api/me/avatar', '/api/enroll', '/api/enroll/cancel'].includes(path)) {
        if (!user) return fail('Nepieciešama pieteikšanās', 401);
        if (method === 'PATCH' && path === '/api/me') return await patchMe(request, env, user);
        if (path === '/api/me/avatar') {
          if (method === 'GET') return await getAvatar(env, user);
          if (method === 'PUT') return await putAvatar(request, env, user);
          if (method === 'DELETE') return await deleteAvatar(env, user);
        }
        if (method === 'POST' && path === '/api/enroll') return await enroll(request, env, user, ctx, url.origin);
        if (method === 'POST' && path === '/api/enroll/cancel') return await cancel(request, env, user);
      }
      return fail('Nav atrasts', 404);
    } catch (err) {
      console.error(err);
      return fail('Servera kļūda', 500);
    }
  },
};
