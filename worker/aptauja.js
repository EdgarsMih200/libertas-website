// Klientu aptauja.
// POST /api/aptauja { atbildes, epasts?, izloze, jaunumi, viltus } — publisks (arī viesiem), līdz BEIGAS.
// GET /api/aptauja — pieteicies lietotājs: vai jau aizpildīta (pēc user_id vai konta e-pasta), viesis: { aizpildita: false }.
// POST /api/aptauja/parbaude { epasts } — vai ar šo e-pastu jau aizpildīta (viesim ≤ 30 stundā no IP).
// Galvenā identitāte = reģistrēts konts: pieteicies lietotājs — viena aizpildīšana uz kontu (jebkurā ierīcē), bez IP limita.
// Viesis: viens e-pasts = viena aizpildīšana (arī konta e-pasts, ar kuru konts jau aizpildījis); IP limits tikai viesiem.
// Admin: GET /api/admin/aptauja, POST|DELETE /api/admin/aptauja/izloze, DELETE /api/admin/aptauja/:id
// Aizsardzība: Origin pārbaude (index.js), slazds `viltus`, izmēra limiti, viesiem ≤ 5 iesniegumi stundā no vienas IP (Cache API).
import { BEIGAS } from '../aptauja-jautajumi.js';

const LIMITS = 5;
const UZVARETAJI = 3;
const EPASTS_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const fail = (error, status = 400) => json({ error }, status);

async function parsniegtsLimits(request, veids = 'iesniegt', limits = LIMITS) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'nezinama';
    const atslega = new Request(`https://aptauja-limits.libertas.invalid/${veids}/${encodeURIComponent(ip)}`);
    const kesa = caches.default;
    const ir = await kesa.match(atslega);
    const sk = ir ? Number(await ir.text()) || 0 : 0;
    if (sk >= limits) return true;
    await kesa.put(atslega, new Response(String(sk + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
  } catch (e) {
    console.error('Aptaujas limits', e);
  }
  return false;
}

// Atbildes: { id: teksts | skaitlis 0–10 | [vērtības] }, id = mazie burti/cipari/_
function tiritAtbildes(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  const r = {};
  const keys = Object.keys(a);
  if (!keys.length || keys.length > 80) return null;
  for (const k of keys) {
    if (!/^[a-z0-9_]{1,40}$/.test(k)) return null;
    const v = a[k];
    if (typeof v === 'string') r[k] = v.trim().slice(0, 2000);
    else if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10) r[k] = v;
    else if (Array.isArray(v) && v.length <= 12 && v.every((x) => typeof x === 'string' && x.length <= 40)) r[k] = v;
    else return null;
  }
  return r;
}

// Lietotāja iepriekšējā aizpildīšana (pēc konta vai konta e-pasta)
async function lietotajaRinda(env, user) {
  if (!user) return null;
  const ep = String(user.email || '').trim().toLowerCase();
  return env.DB.prepare('SELECT izloze FROM aptaujas_atbildes WHERE user_id = ? OR (epasts IS NOT NULL AND epasts = ?) LIMIT 1')
    .bind(user.id, ep || null).first();
}

// Vai ar šo e-pastu jau aizpildīts — kā norādītais e-pasts vai kā konta e-pasts
async function epastsAizpildits(env, epasts) {
  return env.DB.prepare('SELECT 1 FROM aptaujas_atbildes a LEFT JOIN users u ON u.id = a.user_id WHERE a.epasts = ? OR lower(u.email) = ? LIMIT 1')
    .bind(epasts, epasts).first();
}

async function statuss(env, user) {
  const r = await lietotajaRinda(env, user);
  return json({ aizpildita: !!r, izloze: !!(r && r.izloze) });
}

async function parbaude(request, env, user) {
  let b = {};
  try { b = await request.json(); } catch { b = {}; }
  const epasts = String(b.epasts || '').trim().toLowerCase().slice(0, 120);
  if (!EPASTS_RE.test(epasts)) return fail('Pārbaudi e-pasta adresi.');
  if (!user && await parsniegtsLimits(request, 'parbaude', 30)) return fail(LIMITS_TEKSTS, 429);
  return json({ aizpildita: !!(await epastsAizpildits(env, epasts)) });
}

const JAU_AR_EPASTU = 'Ar šo e-pastu aptauja jau ir aizpildīta. Katrs var piedalīties tikai vienu reizi.';
const LIMITS_TEKSTS = 'Pārāk daudz mēģinājumu no šī tīkla. Pieslēdzies ar savu kontu vai pamēģini vēlāk.';

async function iesniegt(request, env, user) {
  if (Date.now() > Date.parse(BEIGAS)) return fail('Aptauja ir noslēgusies.', 410);
  let b = {};
  try { b = await request.json(); } catch { b = {}; }
  if (b.viltus) return json({ ok: true }); // robots
  const atbildes = tiritAtbildes(b.atbildes);
  if (!atbildes) return fail('Nederīgas atbildes. Pārlādē lapu un mēģini vēlreiz.');
  const epasts = b.epasts ? String(b.epasts).trim().toLowerCase().slice(0, 120) : null;
  if (epasts && !EPASTS_RE.test(epasts)) return fail('Pārbaudi e-pasta adresi.');
  if (epasts && !b.izloze) return fail('Lai piedalītos izlozē, atzīmē piekrišanu.');
  if (user && await lietotajaRinda(env, user)) return fail('Tu aptauju jau aizpildīji.', 409);
  if (epasts && await epastsAizpildits(env, epasts)) return fail(JAU_AR_EPASTU, 409);
  // IP limits tikai viesiem — reģistrētu lietotāju ierobežo konts, ne tīkls (ģimene, birojs, skola)
  if (!user && await parsniegtsLimits(request)) return fail(LIMITS_TEKSTS, 429);
  try {
    await env.DB.prepare('INSERT INTO aptaujas_atbildes (created_at, epasts, izloze, jaunumi, user_id, atbildes) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(new Date().toISOString(), epasts, epasts && b.izloze ? 1 : 0, epasts && b.jaunumi ? 1 : 0, user ? user.id : null, JSON.stringify(atbildes))
      .run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) return fail(JAU_AR_EPASTU, 409);
    throw e;
  }
  return json({ ok: true });
}

async function adminDati(env) {
  const [a, iz] = await Promise.all([
    env.DB.prepare('SELECT id, created_at, epasts, izloze, jaunumi, user_id, atbildes FROM aptaujas_atbildes ORDER BY id DESC').all(),
    env.DB.prepare('SELECT vieta, atbildes_id, epasts, at, dalibnieki FROM aptaujas_izloze ORDER BY vieta').all(),
  ]);
  const atbildes = (a.results || []).map((r) => {
    let x = {};
    try { x = JSON.parse(r.atbildes); } catch { x = {}; }
    return { ...r, atbildes: x };
  });
  return json({ atbildes, izloze: iz.results || [], beigas: BEIGAS });
}

async function izloze(env) {
  const ir = await env.DB.prepare('SELECT COUNT(*) AS n FROM aptaujas_izloze').first();
  if (ir && ir.n) return fail('Izloze jau ir veikta.', 409);
  const r = await env.DB.prepare('SELECT id, epasts FROM aptaujas_atbildes WHERE epasts IS NOT NULL AND izloze = 1').all();
  const dal = r.results || [];
  if (!dal.length) return fail('Nav neviena dalībnieka ar e-pastu.');
  // Fišera–Jeitsa sajaukšana ar kriptogrāfiski drošiem skaitļiem
  const rnd = new Uint32Array(dal.length);
  crypto.getRandomValues(rnd);
  for (let i = dal.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [dal[i], dal[j]] = [dal[j], dal[i]];
  }
  const at = new Date().toISOString();
  const uzv = dal.slice(0, UZVARETAJI);
  await env.DB.batch(uzv.map((d, i) => env.DB.prepare('INSERT INTO aptaujas_izloze (vieta, atbildes_id, epasts, at, dalibnieki) VALUES (?, ?, ?, ?, ?)')
    .bind(i + 1, d.id, d.epasts, at, dal.length)));
  return adminDati(env);
}

export async function aptaujaMarsruts(request, env, { path, method, user }) {
  if (path === '/api/aptauja') {
    if (method === 'GET') return statuss(env, user);
    if (method !== 'POST') return fail('Nav atļauts', 405);
    return iesniegt(request, env, user);
  }
  if (path === '/api/aptauja/parbaude') {
    if (method !== 'POST') return fail('Nav atļauts', 405);
    if (Date.now() > Date.parse(BEIGAS)) return fail('Aptauja ir noslēgusies.', 410);
    return parbaude(request, env, user);
  }
  if (!path.startsWith('/api/admin/aptauja')) return null;
  if (!user || !user.is_admin) return fail('Nav piekļuves', 403);
  if (path === '/api/admin/aptauja' && method === 'GET') return adminDati(env);
  if (path === '/api/admin/aptauja/izloze') {
    if (method === 'POST') return izloze(env);
    if (method === 'DELETE') { await env.DB.prepare('DELETE FROM aptaujas_izloze').run(); return adminDati(env); }
  }
  const m = path.match(/^\/api\/admin\/aptauja\/(\d+)$/);
  if (m && method === 'DELETE') {
    const id = Number(m[1]);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM aptaujas_izloze WHERE atbildes_id = ?').bind(id),
      env.DB.prepare('DELETE FROM aptaujas_atbildes WHERE id = ?').bind(id),
    ]);
    return adminDati(env);
  }
  return fail('Nav atrasts', 404);
}
