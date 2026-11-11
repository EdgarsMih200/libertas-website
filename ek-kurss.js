// E-kursa apraksta lapa (ek-kurss.html?k=<kurss>): dati no /api/ek/kursi (plāns + īpašnieka iestatījumi — cena, piekļuve, mēģinājumi)
(function () {
    'use strict';
    const id = (new URLSearchParams(location.search).get('k') || '').replace(/[^a-z0-9-]/g, '');
    const sakne = document.getElementById('ek-saknes');
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const IK = {
        gram: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h6"/>', pulk: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
        kal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', ekr: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
        sert: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 7 5-2 5 2-2-7"/>'
    };
    function fakts(ik, html) { const li = el('li'); li.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + IK[ik] + '</svg>'; const s = el('span'); s.innerHTML = html; li.appendChild(s); return li; }
    function sadala(virs, saturs) { const s = el('section', 'kurss-sadala'); s.appendChild(el('h2', '', virs)); saturs.forEach((x) => s.appendChild(x)); return s; }
    const cena = (e) => Number(e || 0).toFixed(2).replace('.', ',') + ' EUR';

    function zimet(k) {
        document.title = k.nosaukums + ' — tiešsaistes kurss — Libertas';
        document.getElementById('ek-virsraksts').textContent = k.nosaukums;
        document.getElementById('ek-cels').textContent = k.nosaukums;
        sakne.className = 'container kurss-izkartojums';
        sakne.textContent = '';
        const a = el('article', 'kurss-saturs');
        a.appendChild(el('p', 'kurss-ievads', k.apraksts || ''));
        const ul = el('ul', 'kurss-rezultati');
        k.nodarbibas.flatMap((n) => (n.merki || []).slice(0, 1)).forEach((m) => ul.appendChild(el('li', '', m.charAt(0).toUpperCase() + m.slice(1) + '.')));
        a.appendChild(sadala('Ko tu iemācīsies', [ul]));
        const ol = el('ol', 'kurss-temas');
        k.nodarbibas.forEach((n) => { const li = el('li'); li.appendChild(el('b', '', n.nosaukums)); li.appendChild(el('span', '', (n.dalas || []).join(' · '))); ol.appendChild(li); });
        const eksLi = el('li'); eksLi.appendChild(el('b', '', 'Noslēguma eksāmens')); eksLi.appendChild(el('span', '', (k.eksamens?.jautajumi || 40) + ' uzdevumi no visām nodarbībām · sertifikāts')); ol.appendChild(eksLi);
        a.appendChild(sadala('Kursa programma', [el('p', 'kurss-piezime', k.nodarbibas.length + ' nodarbības' + (k.stundas ? ' · ~' + k.stundas + ' stundas' : '') + ' · katra nodarbība sadalīta daļās pa ~20 minūtēm'), ol]));
        const pr = el('ul', 'kurss-metodes'); (k.prasmes || []).forEach((p) => pr.appendChild(el('li', '', p.nosaukums)));
        a.appendChild(sadala('Ko tu trenē', [el('p', '', 'Katrā nodarbībā tiek trenētas visas kursa prasmes:'), pr]));
        const kaol = el('ol', 'kurss-temas');
        [['Mācies savā tempā', 'Materiāls, piemēri ar skaņu, vingrinājumi ar tūlītēju atgriezenisko saiti un praktisks uzdevums.'],
         ['Pašpārbaudes tests', 'Katras nodarbības beigās. Nākamā nodarbība atveras, kad iegūti vismaz 80 %; testu var pildīt atkārtoti.'],
         ['Noslēguma eksāmens', k.meginajumi + ' mēģinājumi, starp tiem ' + k.pauze_h + ' h. Ja ' + k.meginajumi + ' reizes neizdodas: konsultācija ar pasniedzēju + 3 mēģinājumi vai 3 papildu mēģinājumi bez konsultācijas — abos gadījumos ' + cena(k.papildu_cena) + '.'],
         ['Sertifikāts', 'Ar ≥ ' + (k.eksamens?.slieksnis || 80) + ' % eksāmenā — automātiski sadaļā «Mani kursi» (PDF, ar pārbaudes kodu).']]
            .forEach(([b, s]) => { const li = el('li'); li.appendChild(el('b', '', b)); li.appendChild(el('span', '', s)); kaol.appendChild(li); });
        a.appendChild(sadala('Kā notiek mācības', [kaol]));
        const div = el('section', 'kurss-sadala kurss-divi');
        const d1 = el('div'); d1.appendChild(el('h2', '', 'Kas tev vajadzīgs')); d1.appendChild(el('p', '', 'Dators, planšete vai telefons ar interneta pieslēgumu un Google konts. Runāšanas uzdevumiem — mikrofons (nav obligāts).')); div.appendChild(d1);
        const d2 = el('div'); d2.appendChild(el('h2', '', 'Svarīgi zināt')); const p2 = el('p'); p2.innerHTML = 'Tu iegādājies <b>piekļuvi digitālam mācību saturam</b> uz ' + k.dienas + ' dienām, nevis uzņemšanu izglītības programmā. Kurss nav akreditēta neformālās izglītības programma; sertifikāts nav valsts atzīts izglītības dokuments. <a href="noteikumi.html#digitalais-saturs">Noteikumi</a>'; d2.appendChild(p2); div.appendChild(d2);
        a.appendChild(div);
        sakne.appendChild(a);

        const pan = el('aside', 'kurss-panelis'); pan.setAttribute('aria-label', 'Piekļuves iegāde');
        const img = el('img'); img.src = window.LIB && LIB.ekVaks ? LIB.ekVaks(k) : 'assets/kursi/spanu-a1.svg'; img.alt = ''; img.width = 600; img.height = 320; pan.appendChild(img);
        const ps = el('div', 'kurss-panelis-saturs');
        const c = el('p', 'kurss-cena', cena(k.cena) + ' '); c.appendChild(el('small', '', 'par ' + k.dienas + ' dienu piekļuvi')); ps.appendChild(c);
        const f = el('ul', 'kurss-fakti');
        f.appendChild(fakts('gram', '<b>' + k.nodarbibas.length + ' nodarbības</b>' + (k.stundas ? ' · ~' + k.stundas + ' st.' : '')));
        f.appendChild(fakts('pulk', 'Savā tempā, <b>bez grafika</b>'));
        f.appendChild(fakts('kal', 'Piekļuve <b>' + k.dienas + ' dienas</b> no apmaksas'));
        f.appendChild(fakts('ekr', 'Tiešsaistē, latviski'));
        f.appendChild(fakts('sert', 'Sertifikāts pēc eksāmena (≥ ' + (k.eksamens?.slieksnis || 80) + ' %)'));
        ps.appendChild(f);
        if (window.LIB && LIB.ekPoga) { const b = LIB.ekPoga(k); b.className = 'btn-cta kurss-poga'; ps.appendChild(b); LIB.piesaistitPogu(b); }
        ps.appendChild(el('p', 'kurss-panelis-piezime', 'Pēc pasūtījuma nosūtīsim apmaksas informāciju. Kurss atveras uzreiz pēc apmaksas.'));
        pan.appendChild(ps);
        sakne.appendChild(pan);
    }

    function sakt() {
        fetch('/api/ek/kursi' + (window.LIB?.me?.user?.is_admin ? '?visi' : ''), { credentials: 'same-origin' }).then((r) => r.json()).then((d) => {
            const k = (d.kursi || []).find((x) => x.id === id);
            if (!k) { sakne.textContent = ''; const p = el('p', 'ielades-stavoklis'); p.innerHTML = 'Kurss nav atrasts. <a href="kursi.html#tiessaistes">Skatīt kursus</a>'; sakne.appendChild(p); return; }
            zimet(k);
        }).catch(() => { sakne.textContent = 'Neizdevās ielādēt.'; });
    }
    if (window.LIB && window.LIB.me) sakt(); else document.addEventListener('lib:me', sakt, { once: true });
})();
