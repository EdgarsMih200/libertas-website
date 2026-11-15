// Klientu aptauja.
// POST /api/aptauja { atbildes, epasts?, izloze, jaunumi, viltus } — publisks (arī viesiem), līdz BEIGAS.
// Admin: GET /api/admin/aptauja, POST|DELETE /api/admin/aptauja/izloze, DELETE /api/admin/aptauja/:id
// Aizsardzība: Origin pārbaude (index.js), slazds `viltus`, izmēra limiti, ≤ 5 iesniegumi stundā no vienas IP (Cache API).
import { BEIGAS } from '../aptauja-jautajumi.js';

const LIMITS = 5;
const UZVARETAJI = 3;
const EPASTS_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const fail = (error, status = 400) => json({ error }, status);

async function parsniegtsLimits(request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'nezinama';
    const atslega = new Request(`https://aptauja-limits.libertas.invalid/${encodeURIComponent(ip)}`);
    const kesa = caches.default;
    const ir = await kesa.match(atslega);
    const sk = ir ? Number(await ir.text()) || 0 : 0;
    if (sk >= LIMITS) return true;
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
  if (await parsniegtsLimits(request)) return fail('Pārāk daudz mēģinājumu. Pamēģini vēlāk.', 429);
  try {
    await env.DB.prepare('INSERT INTO aptaujas_atbildes (created_at, epasts, izloze, jaunumi, user_id, atbildes) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(new Date().toISOString(), epasts, epasts && b.izloze ? 1 : 0, epasts && b.jaunumi ? 1 : 0, user ? user.id : null, JSON.stringify(atbildes))
      .run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) return fail('Ar šo e-pastu aptauja jau ir aizpildīta. Lai iesniegtu atbildes bez dalības izlozē, atgriezies 1. jautājumā un izdzēs e-pastu.', 409);
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
    if (method !== 'POST') return fail('Nav atļauts', 405);
    return iesniegt(request, env, user);
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
