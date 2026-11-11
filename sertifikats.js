// Sertifikāts (sertifikats.html?kods=LIB-EK-…): publiska pārbaude + drukāšana A4 ainavas formātā (= PDF)
(function () {
    'use strict';
    const sakne = document.getElementById('ek-saknes');
    const kods = (new URLSearchParams(location.search).get('kods') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function lvDat(s) { const p = String(s).split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] + '.' : s; }

    function forma(zinja) {
        sakne.textContent = '';
        const k = el('div', 'ek-karte ek-sert-forma');
        k.appendChild(el('h2', '', 'Pārbaudīt sertifikātu'));
        if (zinja) k.appendChild(el('p', '', zinja));
        const f = el('form'); f.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';
        const i = el('input', 'lauks'); i.name = 'kods'; i.placeholder = 'LIB-EK-2026-XXXXXX'; i.required = true; i.setAttribute('aria-label', 'Sertifikāta kods'); i.style.flex = '1';
        f.appendChild(i); const b = el('button', 'btn-cta', 'Pārbaudīt'); b.type = 'submit'; f.appendChild(b);
        k.appendChild(f); sakne.appendChild(k);
    }
    if (!kods) return forma('Ieraksti sertifikāta kodu, lai pārbaudītu tā īstumu.');

    fetch('/api/sertifikats/' + encodeURIComponent(kods), { credentials: 'same-origin' }).then((r) => r.json().then((d) => ({ ok: r.ok, d }))).then(({ ok, d }) => {
        if (!ok) return forma('Sertifikāts ar kodu ' + kods + ' nav atrasts.');
        const s = d.sertifikats;
        document.title = 'Sertifikāts — ' + s.vards + ' — Libertas';
        const h1 = document.querySelector('.section-title'); if (h1) h1.textContent = 'Sertifikāts';
        sakne.textContent = '';
        const p = el('p', 'ek-noteikumi ek-piezime-druka');
        p.textContent = '✓ Īsts sertifikāts: izsniedza Libertas ' + lvDat(s.datums) + '. «Lejupielādēt PDF» → drukas logā izvēlies «Saglabāt kā PDF».';
        p.style.cssText = 'background:var(--c-success-bg);color:var(--c-success);margin-bottom:var(--sp-5)';
        sakne.appendChild(p);
        const r = el('div', 'ek-sert-ramis');
        const c = el('article', 'ek-sert'); c.setAttribute('aria-label', 'Sertifikāts');
        const img = el('img', 'logo-s'); img.src = 'assets/libertas.png'; img.alt = 'Libertas'; img.width = 500; img.height = 216; c.appendChild(img);
        c.appendChild(el('p', 's-virs', 'SERTIFIKĀTS'));
        c.appendChild(el('p', 's-apak', 'par tiešsaistes kursa apguvi'));
        c.appendChild(el('p', 's-teksts', 'Šis sertifikāts piešķirts'));
        c.appendChild(el('p', 's-vards', s.vards));
        c.appendChild(el('p', 's-teksts', 'par sekmīgu tiešsaistes kursa apguvi'));
        c.appendChild(el('p', 's-kurss', '«' + s.kursa_nosaukums + '»'));
        const apj = [s.nodarbibas ? s.nodarbibas + ' nodarbības' : '', s.stundas ? '~' + s.stundas + ' stundas' : '', s.rezultats != null ? 'noslēguma eksāmens ' + s.rezultats + ' %' : ''].filter(Boolean).join(' · ');
        const a = el('p', 's-teksts', apj); a.style.cssText = 'margin-top:1.4cqw;font-size:1.5cqw'; c.appendChild(a);
        const ap = el('div', 's-apakssija');
        const d1 = el('div'); d1.appendChild(el('span', '', lvDat(s.datums))); d1.appendChild(el('b', '', 'Pabeigšanas datums')); ap.appendChild(d1);
        const z = el('div', 's-zimogs'); z.innerHTML = 'LIBERTAS<br>valodu<br>skola'; ap.appendChild(z);
        const d2 = el('div'); const sp = el('span', '', 'Libertas'); sp.style.cssText = 'font-family:var(--ff-display);font-style:italic'; d2.appendChild(sp); d2.appendChild(el('b', '', 'Mācību satura izdevējs')); ap.appendChild(d2);
        c.appendChild(ap);
        const k = el('p', 's-kods');
        k.appendChild(el('span', '', 'Kods: ' + s.kods + ' · pārbaude: ' + location.host + '/sertifikats.html?kods=' + s.kods));
        k.appendChild(el('span', '', 'Apliecina digitālā mācību satura apguvi. Nav valsts atzīts izglītības dokuments.'));
        c.appendChild(k);
        r.appendChild(c); sakne.appendChild(r);
        const dar = el('div', 'ek-sert-darb');
        const pdf = el('button', 'btn-cta', 'Lejupielādēt PDF'); pdf.type = 'button'; pdf.addEventListener('click', () => window.print()); dar.appendChild(pdf);
        const kop = el('button', 'btn-secondary', 'Kopēt pārbaudes saiti'); kop.type = 'button';
        kop.addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => { kop.textContent = 'Saite nokopēta ✓'; }); });
        dar.appendChild(kop); sakne.appendChild(dar);
    }).catch(() => forma('Neizdevās ielādēt. Mēģini vēlreiz.'));
})();
