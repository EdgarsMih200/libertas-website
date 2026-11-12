// Adventes kalendārs: /api/advente (stāvoklis), POST /api/advente/<diena> (atvērt durvis), admin statistika + izloze.
// Datums vienmēr pēc Rīgas laika uz servera. Administrators var simulēt dienu ar ?diena=0..25 (0 = pirms 1.12., 25 = pēc 24.12.).
import { GADS, DURVIS, KODI } from './advente-saturs.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400) => json({ error: msg }, status);

const pad = (n) => String(n).padStart(2, '0');
export function rigasDatums(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Riga', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function stavoklis(url, user) {
  let sodien = rigasDatums();
  const sim = url.searchParams.get('diena');
  if (user && user.is_admin && sim !== null && /^\d{1,2}$/.test(sim) && +sim <= 25) {
    const n = +sim;
    sodien = n === 0 ? `${GADS}-11-20` : n === 25 ? `${GADS}-12-26` : `${GADS}-12-${pad(n)}`;
  }
  let diena = 0;
  if (sodien >= `${GADS}-12-01`) diena = sodien <= `${GADS}-12-24` ? +sodien.slice(8) : 25;
  return { sodien, diena, simulets: sodien !== rigasDatums() };
}

async function atvertas(env, userId) {
  const { results } = await env.DB.prepare('SELECT diena FROM advente_atverts WHERE user_id = ? AND gads = ? ORDER BY diena').bind(userId, GADS).all();
  return results.map((r) => r.diena);
}

async function dati(env, user, st) {
  const atverts = user ? await atvertas(env, user.id) : [];
  const durvis = {};
  for (const n of atverts) durvis[n] = DURVIS[n - 1];
  // Viesis var izlasīt šodienas durvis, bet kodu saņem tikai pēc ienākšanas
  if (!user && st.diena >= 1 && st.diena <= 24) {
    const { kods, ...bezKoda } = DURVIS[st.diena - 1];
    durvis[st.diena] = kods ? { ...bezKoda, kodsSlepts: true } : bezKoda;
  }
  const cempions = atverts.length === 24;
  const iz = await env.DB.prepare('SELECT user_id, at FROM advente_izloze WHERE gads = ?').bind(GADS).first();
  return {
    gads: GADS, sodien: st.sodien, diena: st.diena, simulets: st.simulets, lietotajs: !!user,
    atverts, durvis, cempions, cempionaKods: cempions ? 'ADV-CEMPIONS25' : null,
    ragi: atverts.includes(12),
    izloze: iz ? { notikusi: true, es: !!(user && iz.user_id === user.id) } : { notikusi: false },
  };
}

// Atlaides koda pārbaude pieteikumam (worker/index.js enroll). Atgriež { kods, proc } vai { kluda }
export async function parbauditKodu(env, user, course, ievade) {
  const kods = String(ievade || '').trim().toUpperCase();
  const K = KODI[kods];
  if (!K) return { kluda: 'Nezināms atlaides kods' };
  const sodien = rigasDatums();
  if (K.tikaiDiena && sodien !== K.tikaiDiena) return { kluda: 'Kods ' + kods + ' bija derīgs tikai ' + +K.tikaiDiena.slice(8) + '. decembrī' };
  if (K.lidz && sodien > K.lidz) return { kluda: 'Koda ' + kods + ' derīgums ir beidzies' };
  const derKursam = K.kursi === 'visi' || (K.kursi === 'grupas' ? course.veids !== 'ekurss' : K.kursi.includes(course.id));
  if (!derKursam) return { kluda: 'Kods ' + kods + ' neattiecas uz šo kursu' };
  if (K.diena) {
    const r = await env.DB.prepare('SELECT 1 FROM advente_atverts WHERE user_id = ? AND gads = ? AND diena = ?').bind(user.id, GADS, K.diena).first();
    if (!r) return { kluda: 'Lai izmantotu šo kodu, atver adventes kalendāra ' + K.diena + '. durvis' };
  }
  if (K.cempions && (await atvertas(env, user.id)).length < 24) return { kluda: 'Šis kods pieejams tikai tiem, kas atvēruši visas 24 durvis' };
  const lietots = await env.DB.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND atlaides_kods = ? AND status != 'atteicies' AND course_id != ?")
    .bind(user.id, kods, course.id).first();
  if (lietots) return { kluda: 'Kodu ' + kods + ' tu jau esi izmantojis citam kursam' };
  return { kods, proc: K.proc };
}

async function adminDati(env) {
  const { results: dalibnieki } = await env.DB.prepare(
    `SELECT u.id, COALESCE(u.display_name, u.name) AS name, u.email, COUNT(*) AS atvertas, MAX(a.at) AS pedeja
     FROM advente_atverts a JOIN users u ON u.id = a.user_id WHERE a.gads = ? GROUP BY u.id ORDER BY atvertas DESC, pedeja ASC`
  ).bind(GADS).all();
  const { results: kodi } = await env.DB.prepare(
    "SELECT atlaides_kods AS kods, COUNT(*) AS skaits FROM enrollments WHERE atlaides_kods IS NOT NULL AND status != 'atteicies' GROUP BY atlaides_kods"
  ).all();
  const iz = await env.DB.prepare(
    'SELECT i.at, i.dalibnieki, u.id, COALESCE(u.display_name, u.name) AS name, u.email FROM advente_izloze i JOIN users u ON u.id = i.user_id WHERE i.gads = ?'
  ).bind(GADS).first();
  return { gads: GADS, dalibnieki, kodi, izloze: iz || null };
}

export async function adventeMarsruts(request, env, { path, method, user, url }) {
  const st = stavoklis(url, user);

  if (path === '/api/advente') {
    if (method === 'GET') return json(await dati(env, user, st));
    // Administratoram: notīrīt savu progresu (testēšanai)
    if (method === 'DELETE') {
      if (!user || !user.is_admin) return fail('Nav piekļuves', 403);
      await env.DB.prepare('DELETE FROM advente_atverts WHERE user_id = ? AND gads = ?').bind(user.id, GADS).run();
      return json(await dati(env, user, st));
    }
  }

  const m = path.match(/^\/api\/advente\/(\d{1,2})$/);
  if (m && method === 'POST') {
    if (!user) return fail('Lai saglabātu progresu, ienāc ar Google', 401);
    const n = +m[1];
    if (n < 1 || n > 24) return fail('Tādu durvju nav', 404);
    if (st.diena < 1) return fail('Kalendārs atvērsies 1. decembrī', 403);
    if (st.diena > 24) return fail('Kalendārs ir noslēdzies — durvis vairs nevar atvērt', 403);
    if (n > st.diena) return fail('Šīs durvis atvērsies ' + n + '. decembrī', 403);
    await env.DB.prepare('INSERT OR IGNORE INTO advente_atverts (user_id, gads, diena, at) VALUES (?, ?, ?, ?)')
      .bind(user.id, GADS, n, new Date().toISOString()).run();
    return json(await dati(env, user, st));
  }

  if (path.startsWith('/api/admin/advente')) {
    if (!user || !user.is_admin) return fail('Nav piekļuves', 403);
    if (path === '/api/admin/advente' && method === 'GET') return json(await adminDati(env));
    if (path === '/api/admin/advente/izloze') {
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM advente_izloze WHERE gads = ?').bind(GADS).run();
        return json(await adminDati(env));
      }
      if (method === 'POST') {
        if (st.diena < 25) return fail('Izlozi var veikt pēc 24. decembra');
        const jau = await env.DB.prepare('SELECT 1 FROM advente_izloze WHERE gads = ?').bind(GADS).first();
        if (jau) return fail('Izloze jau ir notikusi', 409);
        const { results } = await env.DB.prepare('SELECT user_id FROM advente_atverts WHERE gads = ? GROUP BY user_id HAVING COUNT(*) = 24').bind(GADS).all();
        if (!results.length) return fail('Neviens nav atvēris visas 24 durvis');
        const r = crypto.getRandomValues(new Uint32Array(1))[0] % results.length;
        await env.DB.prepare('INSERT INTO advente_izloze (gads, user_id, dalibnieki, at) VALUES (?, ?, ?, ?)')
          .bind(GADS, results[r].user_id, results.length, new Date().toISOString()).run();
        return json(await adminDati(env));
      }
    }
  }
  return null;
}
