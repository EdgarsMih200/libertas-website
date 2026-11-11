// E-pasti pēc pieteikšanās: apstiprinājums klientam + paziņojums administratoram.
// Sūta caur Resend API (https://resend.com). Vajag:
//   secret RESEND_API_KEY  (npx wrangler secret put RESEND_API_KEY)
//   var    EMAIL_FROM      piem. "Libertas <pieteikumi@libertas.study>" (domēnam jābūt apstiprinātam Resend)
//   var    EMAIL_REPLY_TO  (neobligāts) adrese, uz kuru klients var atbildēt
// Ja kaut kas nav iestatīts, e-pasts netiek sūtīts (pieteikums tik un tā tiek saglabāts).

// Krāsas no style.css (e-pasta klienti neatbalsta CSS mainīgos)
const K = {
  forest: '#1E2E29', forest2: '#2B4038', line: '#3A5249', onForest: '#E9E4D8', onForestMuted: '#AFB9B0',
  paper: '#F6F1E8', accent: '#B4502A', accentSoft: '#F6E1D5', glow: '#F0B999', warnBg: '#FAEED3', warn: '#7F5300',
};
const SERIF = "Lora, Georgia, 'Times New Roman', serif";
const SANS = "'Source Sans 3', 'Segoe UI', Roboto, Arial, sans-serif";

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cena(eur) {
  const n = Number(eur);
  return Number.isFinite(n) ? n.toFixed(2).replace('.', ',') + ' EUR' : '';
}

function datums(iso) {
  try {
    return new Intl.DateTimeFormat('lv-LV', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Riga' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

// Atvadu frāze kursa valodā
function atvadas(courseId) {
  if (courseId.startsWith('spain')) return { teksts: '¡Hasta pronto!', lang: 'es' };
  if (courseId.startsWith('english')) return { teksts: 'See you soon!', lang: 'en' };
  return { teksts: 'Uz tikšanos!', lang: 'lv' };
}

function klientaVestule({ user, course, enrollment, origin }) {
  const vards = (user.name || '').split(' ')[0];
  const sveiciens = vards ? `Paldies, ${esc(vards)}!` : 'Paldies!';
  const kontaUrl = `${origin}/konts.html`;
  const kursiUrl = `${origin}/kursi.html`;
  const noteikumiUrl = `${origin}/noteikumi.html`;
  const atv = atvadas(course.id);
  const rindas = [
    ['Kurss', esc(course.name)],
    ['Cena', esc(cena(course.price_eur))],
    [course.veids === 'ekurss' ? 'Piekļuve' : 'Grupa', esc(course.schedule || 'Tiks precizēta')],
    ['Pieteikums iesniegts', esc(datums(enrollment.created_at || enrollment.updated_at))],
  ].filter((r) => r[1]);
  const soli = course.veids === 'ekurss' ? [
    ['Pieteikums saņemts', 'Tu iegādājies piekļuvi digitālam mācību saturam (tiešsaistes pašmācības kurss).'],
    ['Apmaksas informācija', 'Tuvākajā laikā nosūtīsim rēķinu vai apmaksas rekvizītus.'],
    ['Piekļuve uzreiz pēc apmaksas', `Kurss atvērsies sadaļā “Mani kursi” uz ${course.ek_dienas || 90} dienām. Tu piekriti, ka piekļuve sākas uzreiz, tāpēc 14 dienu atteikuma tiesības pēc tam vairs nav spēkā.`],
  ] : [
    ['Rezervējām tev vietu', 'Pieteikums ir saņemts un vieta grupā tev ir paturēta.'],
    ['Apmaksas informācija', 'Tuvākajā laikā sazināsimies un nosūtīsim rēķinu vai apmaksas rekvizītus.'],
    ['Vieta grupā ir tava', 'Pēc apmaksas statuss sadaļā “Mani kursi” mainīsies uz “Uzņemts”, un nosūtīsim visu nepieciešamo pirmajai nodarbībai.'],
  ];

  const html = `<!doctype html>
<html lang="lv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Pieteikums saņemts — ${esc(course.name)}</title>
</head>
<body style="margin:0;padding:0;background:${K.forest};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tavs pieteikums kursam „${esc(course.name)}” ir saņemts. Statuss: gaida apmaksu.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${K.forest};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

    <!-- Zīmols -->
    <tr><td style="padding:0 8px 24px;">
      <a href="${origin}/" style="text-decoration:none;color:${K.onForest};font-family:${SERIF};font-size:30px;font-weight:700;letter-spacing:.02em;">Libertas</a>
      <div style="font-family:${SERIF};font-style:italic;font-size:15px;color:${K.onForestMuted};padding-top:4px;">Runā, saproti, ceļo, audz!</div>
    </td></tr>

    <!-- Kartīte -->
    <tr><td style="background:${K.forest2};border-radius:20px;padding:32px 28px;border:1px solid ${K.line};">
      <span style="display:inline-block;background:${K.accentSoft};color:${K.accent};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">Pieteikums saņemts</span>
      <h1 style="margin:16px 0 8px;font-family:${SERIF};font-size:28px;line-height:1.25;color:${K.paper};font-weight:700;">${sveiciens}</h1>
      <p style="margin:0 0 24px;font-family:${SANS};font-size:16px;line-height:1.6;color:${K.onForest};">
        Esam saņēmuši tavu pieteikumu kursam <strong style="color:${K.paper};">${esc(course.name)}</strong>.
        Šī vēstule ir apstiprinājums — <strong style="color:${K.paper};">tas vēl nav rēķins</strong>, un pagaidām nekas nav jāmaksā.
      </p>

      <!-- Kopsavilkums -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
        ${rindas.map(([k, v], i) => `<tr>
          <td style="padding:12px 0;${i ? `border-top:1px solid ${K.line};` : ''}font-family:${SANS};font-size:14px;color:${K.onForestMuted};width:42%;vertical-align:top;">${k}</td>
          <td style="padding:12px 0;${i ? `border-top:1px solid ${K.line};` : ''}font-family:${SANS};font-size:15px;color:${K.paper};font-weight:600;vertical-align:top;">${v}</td>
        </tr>`).join('')}
      </table>

      <!-- Statuss -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr><td style="background:${K.warnBg};border-radius:12px;padding:14px 16px;font-family:${SANS};font-size:15px;line-height:1.5;color:${K.warn};">
          <strong>Statuss: Gaida apmaksu.</strong> Vieta grupā kļūst galīga pēc apmaksas. Līdz tam pieteikumu vari atcelt sadaļā „Mani kursi”.
        </td></tr>
      </table>

      <!-- Kas notiks tālāk -->
      <h2 style="margin:0 0 12px;font-family:${SERIF};font-size:20px;color:${K.paper};font-weight:700;">Kas notiks tālāk</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        ${soli.map(([v, t], i) => `<tr>
          <td width="40" style="vertical-align:top;padding:6px 0;">
            <div style="width:28px;height:28px;line-height:28px;border-radius:50%;background:${K.accent};color:#FFFFFF;text-align:center;font-family:${SANS};font-size:14px;font-weight:700;">${i + 1}</div>
          </td>
          <td style="vertical-align:top;padding:6px 0;font-family:${SANS};font-size:15px;line-height:1.5;color:${K.onForest};">
            <strong style="color:${K.paper};">${v}</strong><br>${t}
          </td>
        </tr>`).join('')}
      </table>

      <!-- Poga -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="border-radius:999px;background:${K.accent};">
          <a href="${kontaUrl}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">Skatīt „Mani kursi”</a>
        </td></tr>
      </table>

      <p style="margin:28px 0 0;font-family:${SERIF};font-style:italic;font-size:18px;color:${K.glow};" lang="${atv.lang}">${atv.teksts}</p>
      <p style="margin:4px 0 0;font-family:${SANS};font-size:15px;color:${K.onForest};">Libertas komanda</p>
    </td></tr>

    <!-- Kājene -->
    <tr><td style="padding:24px 8px 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${K.onForestMuted};">
      Šo vēstuli saņēmi, jo libertas.study iesniedzi pieteikumu kursam. Ja to neesi darījis tu, vienkārši atbildi uz šo e-pastu vai atcel pieteikumu sadaļā „Mani kursi”.<br><br>
      <a href="${kursiUrl}" style="color:${K.glow};text-decoration:underline;">Visi kursi</a> &nbsp;·&nbsp;
      <a href="${origin}/materiali.html" style="color:${K.glow};text-decoration:underline;">Noderīgi materiāli</a> &nbsp;·&nbsp;
      <a href="${noteikumiUrl}" style="color:${K.glow};text-decoration:underline;">Noteikumi un privātums</a><br>
      © ${new Date().getFullYear()} Libertas
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `${vards ? `Paldies, ${vards}!` : 'Paldies!'}`,
    '',
    `Esam saņēmuši tavu pieteikumu kursam "${course.name}". Šī vēstule ir apstiprinājums — tas vēl nav rēķins.`,
    '',
    `Kurss: ${course.name}`,
    `Cena: ${cena(course.price_eur)}`,
    `Grupa: ${course.schedule || 'Tiks precizēta'}`,
    '',
    'Statuss: Gaida apmaksu. Vieta grupā kļūst galīga pēc apmaksas.',
    '',
    'Kas notiks tālāk:',
    ...soli.map(([v, t], i) => `${i + 1}. ${v} — ${t}`),
    '',
    `Mani kursi: ${kontaUrl}`,
    '',
    atv.teksts,
    'Libertas komanda',
  ].join('\n');

  return { subject: `Pieteikums saņemts: ${course.name}`, html, text };
}

function adminaVestule({ user, course, origin }) {
  const rinda = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#5C554D;">${k}</td><td style="padding:4px 0;"><strong>${esc(v)}</strong></td></tr>`;
  const html = `<div style="font-family:${SANS};font-size:15px;color:#24211E;">
<p>Jauns pieteikums kursam <strong>${esc(course.name)}</strong>.</p>
<table>${rinda('Vārds', user.name || '—')}${rinda('E-pasts', user.email)}${rinda('Tālrunis', user.phone || '—')}${rinda('Cena', cena(course.price_eur))}${rinda(course.veids === 'ekurss' ? 'Piekļuve' : 'Grupa', course.schedule || 'Tiks precizēta')}</table>
<p><a href="${origin}/admin.html">Atvērt administrāciju</a></p></div>`;
  const text = `Jauns pieteikums: ${course.name}\n${user.name || ''} <${user.email}>\nTālrunis: ${user.phone || '—'}\n${origin}/admin.html`;
  return { subject: `Jauns pieteikums: ${course.name} — ${user.name || user.email}`, html, text };
}

async function sutit(env, to, { subject, html, text }, replyTo) {
  const body = { from: env.EMAIL_FROM, to: Array.isArray(to) ? to : [to], subject, html, text };
  if (replyTo) body.reply_to = replyTo;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.error('E-pasts netika nosūtīts', r.status, await r.text().catch(() => ''));
}

export async function sutitPieteikumaEpastus(env, { user, course, enrollment, origin, admins }) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log('E-pasts nav iestatīts (RESEND_API_KEY / EMAIL_FROM) — izlaižam.');
    return;
  }
  const darbi = [sutit(env, user.email, klientaVestule({ user, course, enrollment, origin }), env.EMAIL_REPLY_TO)];
  if (admins.length) darbi.push(sutit(env, admins, adminaVestule({ user, course, origin }), user.email));
  const rez = await Promise.allSettled(darbi);
  rez.forEach((x) => { if (x.status === 'rejected') console.error('E-pasta kļūda', x.reason); });
}

// Priekšskatījumam / testiem
export { klientaVestule, sutit };
