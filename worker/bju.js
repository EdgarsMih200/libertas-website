// BJU (biežāk uzdotie jautājumi): jautājums, uz kuru Empanadillo nezina atbildi, aiziet Edgaram pa e-pastu.
// POST /api/bju { vards, uzvards, epasts, jautajums, lapa, viltus } — publisks (arī viesiem).
// Aizsardzība: Origin pārbaude (index.js), slazds `viltus` (robotiem), garuma limiti, ≤ 5 jautājumi stundā no vienas IP (Cache API).
import { sutit } from './epasts.js';

const ADRESATS = 'edgars.libertas@gmail.com';
const LIMITS = 5;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const teksts = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

async function parsniegtsLimits(request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'nezinama';
    const atslega = new Request(`https://bju-limits.libertas.invalid/${encodeURIComponent(ip)}`);
    const kesa = caches.default;
    const ir = await kesa.match(atslega);
    const sk = ir ? Number(await ir.text()) || 0 : 0;
    if (sk >= LIMITS) return true;
    await kesa.put(atslega, new Response(String(sk + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
  } catch (e) {
    console.error('BJU limits', e);
  }
  return false;
}

export async function bjuMarsruts(request, env, { path, method, user }) {
  if (path !== '/api/bju') return null;
  if (method !== 'POST') return json({ error: 'Nav atļauts' }, 405);

  let b = {};
  try { b = await request.json(); } catch { b = {}; }
  if (b.viltus) return json({ ok: true }); // robots — izliekamies, ka viss kārtībā

  const vards = teksts(b.vards, 60);
  const uzvards = teksts(b.uzvards, 60);
  const epasts = teksts(b.epasts, 120);
  const jautajums = String(b.jautajums == null ? '' : b.jautajums).trim().slice(0, 1500);
  const lapa = teksts(b.lapa, 200);
  if (!vards || !uzvards) return json({ error: 'Ieraksti vārdu un uzvārdu' }, 400);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(epasts)) return json({ error: 'Pārbaudi e-pasta adresi' }, 400);
  if (jautajums.length < 3) return json({ error: 'Ieraksti jautājumu' }, 400);

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return json({ error: 'E-pasts nav iestatīts' }, 503);
  if (await parsniegtsLimits(request)) return json({ error: 'Pārāk daudz jautājumu. Pamēģini vēlāk.' }, 429);

  const konts = user ? `${user.name || ''} <${user.email}>` : 'nav pieteicies';
  const rinda = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#5C554D;vertical-align:top;">${k}</td><td style="padding:4px 0;"><strong>${esc(v)}</strong></td></tr>`;
  const html = `<div style="font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;font-size:15px;color:#24211E;">
<p>Empanadillo nezināja atbildi un nodod jautājumu tev.</p>
<blockquote style="margin:12px 0;padding:12px 16px;border-left:4px solid #1E2E29;background:#F6F1E8;white-space:pre-wrap;">${esc(jautajums)}</blockquote>
<table>${rinda('Vārds', vards)}${rinda('Uzvārds', uzvards)}${rinda('E-pasts', epasts)}${rinda('Konts', konts)}${lapa ? rinda('Lapa', lapa) : ''}</table>
<p style="color:#5C554D;">Atbildi uz šo vēstuli — tā aizies klientam (${esc(epasts)}).</p></div>`;
  const text = `Empanadillo nezināja atbildi.\n\nJautājums:\n${jautajums}\n\nVārds: ${vards}\nUzvārds: ${uzvards}\nE-pasts: ${epasts}\nKonts: ${konts}${lapa ? `\nLapa: ${lapa}` : ''}\n\nAtbildi uz šo vēstuli — tā aizies klientam.`;

  const ok = await sutit(env, ADRESATS, { subject: `Jautājums no ${vards} ${uzvards} (Empanadillo)`, html, text }, epasts);
  return ok ? json({ ok: true }) : json({ error: 'Neizdevās nosūtīt' }, 502);
}
