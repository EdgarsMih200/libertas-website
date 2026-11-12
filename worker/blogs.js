// Blogs: patīk (visi; viesis ar anonīmu id no localStorage) un komentāri (tikai reģistrētiem).
//   GET    /api/blogs                       → { raksti: { <slug>: { patik, komentari } } } (saraksta lapai)
//   GET    /api/blogs/<slug>?viesis=<uuid>  → { patik, esPatik, komentari: [...], lietotajs }
//   POST   /api/blogs/<slug>/patik {viesis} → pārslēdz patīk
//   POST   /api/blogs/<slug>/komentari {teksts}
//   DELETE /api/blogs/komentari/<id>        → savs komentārs vai administrators
//   GET    /api/blogs/foto/<userId>         → paša augšupielādētais foto (tikai komentāru autoriem)
// Jaunu rakstu pievieno RAKSTI sarakstam (citiem slug API atbild 404 — lai neviens nevar pildīt DB ar izdomātiem rakstiem).
export const RAKSTI = ['jauna-majaslapa', 'adventes-kalendars'];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400) => json({ error: msg }, status);

const MAX_GARUMS = 2000;
const PAUZE_MS = 15 * 1000; // starp viena lietotāja komentāriem

async function lasit(request) {
  try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; }
}

const viesaId = (v) => (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? 'v:' + v.toLowerCase() : null);
const kasEs = (user, viesis) => (user ? 'u:' + user.id : viesaId(viesis));

// Publiski rāda vārdu un uzvārda pirmo burtu ("Anna B."), nekad e-pastu
function publiskaisVards(r) {
  const v = String(r.display_name || r.name || '').trim();
  if (!v) return 'Lasītājs';
  const d = v.split(/\s+/);
  return d.length > 1 ? d[0] + ' ' + d[d.length - 1].charAt(0).toUpperCase() + '.' : d[0];
}

async function komentari(env, slug, user) {
  const { results } = await env.DB.prepare(
    `SELECT k.id, k.teksts, k.at, k.user_id, u.name, u.display_name, u.picture, u.avatar_at
     FROM blogs_komentari k JOIN users u ON u.id = k.user_id WHERE k.raksts = ? ORDER BY k.at ASC LIMIT 500`
  ).bind(slug).all();
  return results.map((r) => ({
    id: r.id, teksts: r.teksts, at: r.at, vards: publiskaisVards(r),
    foto: r.avatar_at ? `/api/blogs/foto/${r.user_id}?v=${encodeURIComponent(r.avatar_at)}` : r.picture || null,
    mans: !!(user && user.id === r.user_id), dzest: !!(user && (user.id === r.user_id || user.is_admin)),
  }));
}

async function patikSkaits(env, slug) {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM blogs_patik WHERE raksts = ?').bind(slug).first();
  return r ? r.n : 0;
}

export async function blogsMarsruts(request, env, { path, method, user, url }) {
  if (method === 'GET' && path === '/api/blogs') {
    const raksti = {};
    for (const s of RAKSTI) raksti[s] = { patik: 0, komentari: 0 };
    const [p, k] = await env.DB.batch([
      env.DB.prepare('SELECT raksts, COUNT(*) AS n FROM blogs_patik GROUP BY raksts'),
      env.DB.prepare('SELECT raksts, COUNT(*) AS n FROM blogs_komentari GROUP BY raksts'),
    ]);
    for (const r of p.results) if (raksti[r.raksts]) raksti[r.raksts].patik = r.n;
    for (const r of k.results) if (raksti[r.raksts]) raksti[r.raksts].komentari = r.n;
    return json({ raksti });
  }

  let m = path.match(/^\/api\/blogs\/foto\/(\d+)$/);
  if (m && method === 'GET') {
    const row = await env.DB.prepare(
      'SELECT a.mime, a.data FROM avatars a WHERE a.user_id = ? AND EXISTS (SELECT 1 FROM blogs_komentari k WHERE k.user_id = a.user_id)'
    ).bind(Number(m[1])).first();
    if (!row) return new Response('Nav atrasts', { status: 404 });
    const bin = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
    return new Response(bin, {
      headers: { 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  m = path.match(/^\/api\/blogs\/komentari\/(\d+)$/);
  if (m && method === 'DELETE') {
    if (!user) return fail('Nepieciešama pieteikšanās', 401);
    const k = await env.DB.prepare('SELECT user_id FROM blogs_komentari WHERE id = ?').bind(Number(m[1])).first();
    if (!k) return fail('Komentārs nav atrasts', 404);
    if (k.user_id !== user.id && !user.is_admin) return fail('Nav piekļuves', 403);
    await env.DB.prepare('DELETE FROM blogs_komentari WHERE id = ?').bind(Number(m[1])).run();
    return json({ ok: true });
  }

  m = path.match(/^\/api\/blogs\/([a-z0-9-]{1,60})(?:\/(patik|komentari))?$/);
  if (!m) return null;
  const slug = m[1];
  if (!RAKSTI.includes(slug)) return fail('Raksts nav atrasts', 404);

  if (!m[2] && method === 'GET') {
    const kas = kasEs(user, url.searchParams.get('viesis'));
    const es = kas ? await env.DB.prepare('SELECT 1 FROM blogs_patik WHERE raksts = ? AND kas = ?').bind(slug, kas).first() : null;
    return json({ patik: await patikSkaits(env, slug), esPatik: !!es, komentari: await komentari(env, slug, user), lietotajs: !!user });
  }

  if (m[2] === 'patik' && method === 'POST') {
    const b = await lasit(request);
    const kas = kasEs(user, b.viesis);
    if (!kas) return fail('Nederīgs pieprasījums');
    const bija = await env.DB.prepare('SELECT 1 FROM blogs_patik WHERE raksts = ? AND kas = ?').bind(slug, kas).first();
    if (bija) await env.DB.prepare('DELETE FROM blogs_patik WHERE raksts = ? AND kas = ?').bind(slug, kas).run();
    else await env.DB.prepare('INSERT INTO blogs_patik (raksts, kas, at) VALUES (?, ?, ?)').bind(slug, kas, new Date().toISOString()).run();
    return json({ patik: await patikSkaits(env, slug), esPatik: !bija });
  }

  if (m[2] === 'komentari' && method === 'POST') {
    if (!user) return fail('Komentēt var tikai reģistrēti lietotāji', 401);
    const b = await lasit(request);
    const teksts = String(b.teksts || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (teksts.length < 2) return fail('Komentārs ir pārāk īss');
    if (teksts.length > MAX_GARUMS) return fail(`Komentārs var būt līdz ${MAX_GARUMS} zīmēm`);
    const ped = await env.DB.prepare('SELECT at FROM blogs_komentari WHERE user_id = ? ORDER BY at DESC LIMIT 1').bind(user.id).first();
    if (ped && Date.now() - Date.parse(ped.at) < PAUZE_MS) return fail('Mazliet uzgaidi, pirms raksti nākamo komentāru', 429);
    await env.DB.prepare('INSERT INTO blogs_komentari (raksts, user_id, teksts, at) VALUES (?, ?, ?, ?)')
      .bind(slug, user.id, teksts, new Date().toISOString()).run();
    return json({ komentari: await komentari(env, slug, user) }, 201);
  }

  return fail('Nav atrasts', 404);
}
