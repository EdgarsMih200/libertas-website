// TIRDZIŅŠ (tirdzins.html) + dāvanu kartes «iekāpšanas karte» (arī davanu-karte.html).
// Gadalaiks: html.tirgus-<svetki|ziema|pavasaris|vasara|rudens> (inline skripts <head>).
// Būdiņas: dāvanu kartes (statiskas), e-kursi (no /api/ek/kursi), grupu kursi (saite), «Kā notiek».
// Dāvanu kartes pasūtīšana: <dialog class="pieteikuma-logs dk-logs"> (4 soļi + dzīvs priekšskatījums) → POST /api/davanas → rēķins e-pastā.
// Karte: LIB.dkKarte(o) → .dk-turetajs > .dk-flip (priekšpuse ar maršrutu LV → ES, aizmugure ar ziņu rokrakstā).
(function () {
    var L = window.LIB || {};
    var GADALAIKI = { svetki: 'Ziemassvētku tirdziņš', ziema: 'Ziemas tirdziņš', pavasaris: 'Pavasara tirdziņš', vasara: 'Vasaras tirdziņš', rudens: 'Rudens tirdziņš' };
    var DIZAINI = [['mezs', 'Mežs'], ['bordo', 'Jaungada'], ['papirs', 'Papīrs']];
    var PIEGADES = [['epasts', 'E-pastā tagad', 'saņēmējam pēc apmaksas'], ['velak', 'E-pastā vēlāk', 'tavā izvēlētā brīdī'], ['pdf', 'PDF man', 'izdrukā pats'], ['pasts', 'Aploksnē', '+5 € · 3–5 d. d.']];

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function eur(n) { return Number(n || 0).toFixed(2).replace('.', ',') + ' €'; }
    function lvD(iso) { return iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) + '.' : ''; }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function plus12() { var d = new Date(); d.setFullYear(d.getFullYear() + 1); return lvD(d.toISOString().slice(0, 10)); }

    // ---------- Karte (iekāpšanas karte) ----------
    var LIDMASINA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)"/></svg>';
    var AINAVA = '<svg class="dk-ainava" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="dk-k2" d="M0 50 C60 30 110 44 170 36 S290 20 400 40 V80 H0Z"/><path class="dk-k1" d="M0 64 C80 52 150 66 230 58 S340 50 400 60 V80 H0Z"/><g class="dk-k1"><path d="M330 30 l8 20 h-16z M330 22 l6 14 h-12z"/><path d="M350 38 l7 18 h-14z M350 31 l5 12 h-10z"/><path d="M312 42 l6 16 h-12z M312 36 l4 10 h-8z"/></g></svg>';
    var ZVAIGZNES = '<svg class="dk-zvaigznes" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><circle cx="120" cy="12" r=".9"/><circle cx="96" cy="22" r=".5"/><circle cx="132" cy="30" r=".6"/><circle cx="80" cy="9" r=".4"/><circle cx="108" cy="40" r=".4"/><circle cx="150" cy="16" r=".5"/></svg>';
    // Zīmogs norauj daļā (dekoratīvs; nav QR, ko kāds mēģinātu skenēt)
    var ZIMOGS = '<svg class="dk-zimogs" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><path id="dk-zl" d="M50 50 m-34 0 a34 34 0 1 1 68 0 a34 34 0 1 1 -68 0"/></defs><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="25"/><text><textPath href="#dk-zl" startOffset="2%">LIBERTAS · RUNĀ · SAPROTI · CEĻO ·</textPath></text><path class="dk-zimogs-l" d="M38 62 L50 40 L62 62 Z"/></svg>';

    // o: {dizains, tips, summa, kurss:{nosaukums, valoda, valodas_nos, izlidosana}, kam, no, apsveikums, kods, derigs_lidz}
    function priekspuse(o) {
        var summa = o.tips !== 'kurss', k = o.kurss || {};
        var virsraksts = summa ? 'Ceļojums pēc <em>izvēles</em>' : esc(k.nosaukums || 'Kurss').replace(/ (A1|A2|B1\.1|B1\.2)(\b.*)?$/, ' <em>$1</em>$2');
        return '<div class="dk-bilete dk-bilete--' + esc(o.dizains || 'mezs') + '">' +
            '<div class="dk-galvena">' + (o.dizains === 'bordo' ? ZVAIGZNES : '') + AINAVA +
            '<div class="dk-augsa"><span class="dk-logo">Libertas<i>.</i></span><span class="dk-veids">Dāvanu karte</span></div>' +
            '<div class="dk-marsruts"><div><b>LV</b><small>Latviešu</small></div><div class="dk-cels">' + LIDMASINA + '</div>' +
            '<div><b>' + (summa ? '?' : esc(k.valoda || '?')) + '</b><small>' + (summa ? 'Tava izvēle' : esc(k.valodas_nos || '')) + '</small></div></div>' +
            '<div class="dk-virsraksts">' + virsraksts + '</div>' +
            '<dl class="dk-lauki"><dt>Kam</dt><dt>No</dt><dt>Izlidošana</dt><dt>Derīga līdz</dt>' +
            '<dd>' + esc(o.kam || '—') + '</dd><dd>' + esc(o.no || '—') + '</dd><dd>' + esc(summa ? 'Kad vēlies' : (k.izlidosana || 'Kad vēlies')) + '</dd><dd>' + esc(o.derigs_lidz ? lvD(o.derigs_lidz).slice(0, -1) : plus12().slice(0, -1)) + '</dd></dl>' +
            '</div>' +
            '<div class="dk-norauj"><div class="dk-vertiba"><small>Vērtība</small><b>' + eur(o.summa) + '</b></div>' + ZIMOGS +
            '<div class="dk-kods">' + esc(o.kods || 'LIB-XXXX-XXXX') + '</div></div></div>';
    }
    function aizmugure(o) {
        return '<div class="dk-bilete dk-bilete--' + esc(o.dizains || 'mezs') + ' dk-bilete--aizmugure"><div class="dk-aizm">' +
            '<div class="dk-zina">' + esc(o.apsveikums || 'Lai šis gads ir tas, kad tu beidzot runā!') + '<span class="dk-paraksts">— ' + esc(o.no || '') + '</span></div>' +
            '<div class="dk-ka"><h4>Kā izmantot</h4><ol><li>Izvēlies kursu libertas.study</li><li>Spied «Pieteikties» un ievadi kodu ' + esc(o.kods || '') + '</li><li>Izvēlies grupu un sāc</li></ol><div class="dk-url">libertas.study</div></div>' +
            '</div></div>';
    }
    function dkKarte(o, opc) {
        opc = opc || {};
        if (opc.tikaiPrieksa) return '<div class="dk-turetajs">' + priekspuse(o) + '</div>';
        return '<div class="dk-turetajs"><div class="dk-flip' + (opc.otra ? ' ir-otra' : '') + '"><div class="dk-flip-iekss">' +
            '<div class="dk-puse">' + priekspuse(o) + '</div><div class="dk-puse dk-puse--aizm">' + aizmugure(o) + '</div></div></div></div>';
    }
    // Aploksne ar karti iekšā (davanu-karte.html, pirmo reizi atverot)
    function aploksne(o) {
        var kamV = o.kam ? 'Kam: ' + esc(o.kam) : '';
        return '<div class="dk-aploksne-skatuve"><div class="dk-aploksne" role="button" tabindex="0" aria-label="Atvērt aploksni ar dāvanu karti">' +
            '<span class="dk-apl-aizm"></span>' +
            '<span class="dk-apl-karte">' + dkKarte(o, { tikaiPrieksa: true }) + '</span>' +
            '<svg class="dk-apl-kabata" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="dk-apl-sani" d="M0 0 L80 56 L0 100Z M160 0 L80 56 L160 100Z"/><path class="dk-apl-apaksa" d="M0 100 L80 48 L160 100Z"/></svg>' +
            '<span class="dk-apl-adrese" aria-hidden="true">' + kamV + '</span>' +
            '<svg class="dk-apl-varsts" viewBox="0 0 160 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0 H160 L80 58Z"/></svg>' +
            '<span class="dk-apl-zimogs" aria-hidden="true">L</span>' +
            '</div><p class="dk-apl-padoms">Klikšķini uz zīmoga, lai atvērtu</p></div>';
    }

    // Klikšķis vai Enter/atstarpe uz [data-dk-apgriezt] apgriež karti
    function apgriezams(vieta) {
        var f = vieta.querySelector('.dk-flip');
        if (!f) return;
        f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Apgriezt karti');
        var t = function () { f.classList.toggle('ir-otra'); };
        f.addEventListener('click', t);
        f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
    }
    L.dkKarte = dkKarte;
    window.LIB = L;

    // Paraugi būdiņā (vēdeklis)
    var PARAUGI = [
        { dizains: 'papirs', tips: 'summa', summa: 100, kam: 'Kristaps', no: 'Kolēģi' },
        { dizains: 'mezs', tips: 'kurss', summa: 280, kurss: { nosaukums: 'Spāņu valodas pamati A1', valoda: 'ES', valodas_nos: 'Spāņu', izlidosana: '11.01.2027' }, kam: 'Laura', no: 'Mamma' },
        { dizains: 'bordo', tips: 'kurss', summa: 280, kurss: { nosaukums: 'Angļu valodas pamati A1', valoda: 'EN', valodas_nos: 'Angļu', izlidosana: 'Precizēs' }, kam: 'Anna', no: 'Jānis' }
    ];
    document.querySelectorAll('[data-dk-paraugs]').forEach(function (n, i) {
        n.innerHTML = dkKarte(PARAUGI[i % PARAUGI.length], { tikaiPrieksa: true });
    });

    // ---------- davanu-karte.html?k=<token>: karte (abas puses), kods, kā izmantot, drukāt ----------
    var skats = document.querySelector('[data-dk-skats]');
    if (skats) {
        var tok = (location.search.match(/[?&]k=([0-9a-f]{48})\b/) || [])[1];
        var radit = function (karte) {
            skats.removeAttribute('aria-busy');
            skats.textContent = '';
            if (!karte) {
                skats.appendChild(el('h1', 'dk-skats-virsraksts', 'Dāvanu karte nav atrasta'));
                skats.appendChild(el('p', 'register-intro', 'Pārbaudi, vai saite ir nokopēta pilnībā.'));
                return;
            }
            var gaida = karte.statuss === 'gaida', atcelta = karte.statuss === 'atcelta';
            var rez = el('div', 'dk-skats-rezgis');
            var kv = el('div', 'dk-skats-karte');
            var vieta = el('div', 'dk-skats-vieta');
            kv.appendChild(vieta);
            var pp = el('p', 'dk-skats-padoms');
            kv.appendChild(pp);
            var MAZ = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
            var ATV = 'dkAtvertas';
            var atvertas = function () { try { return JSON.parse(localStorage.getItem(ATV) || '[]'); } catch (x) { return []; } };
            var radKarti = function (ienak) {
                vieta.innerHTML = dkKarte(karte);
                if (ienak) vieta.firstChild.classList.add('dk-ienak');
                apgriezams(vieta);
                pp.textContent = 'Klikšķini uz kartes, lai redzētu aizmuguri. ';
                if (!MAZ && !gaida && !atcelta) {
                    var atpakal = el('button', 'btn-link', 'Ielikt atpakaļ aploksnē'); atpakal.type = 'button';
                    atpakal.addEventListener('click', function () { radAploksni(); });
                    pp.appendChild(atpakal);
                }
            };
            // Aploksne: zīmogs → vāciņš atveras → karte izslīd → aploksne aiziet, paliek karte
            var radAploksni = function () {
                vieta.innerHTML = aploksne(karte);
                pp.textContent = '';
                var a = vieta.querySelector('.dk-aploksne');
                var atvert = function () {
                    if (a.classList.contains('atver')) return;
                    a.classList.add('atver');
                    try { var l = atvertas(); if (l.indexOf(tok.slice(0, 12)) < 0) { l.push(tok.slice(0, 12)); localStorage.setItem(ATV, JSON.stringify(l.slice(-50))); } } catch (x) {}
                    setTimeout(function () { a.classList.add('izvilkta'); }, 1500);
                    setTimeout(function () { radKarti(true); var f = vieta.querySelector('.dk-flip'); if (f) f.focus(); }, 2150);
                };
                a.addEventListener('click', atvert);
                a.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); atvert(); } });
                a.focus({ preventScroll: true });
            };
            if (!gaida && !atcelta && !MAZ && atvertas().indexOf(tok.slice(0, 12)) < 0) radAploksni();
            else radKarti(false);
            // Drukai: abas puses viena zem otras (izgriez un salokām)
            var druka = el('div', 'dk-druka');
            druka.innerHTML = '<div class="dk-turetajs">' + priekspuse(karte) + '</div><div class="dk-turetajs">' + aizmugure(karte) + '</div>';
            kv.appendChild(druka);
            rez.appendChild(kv);

            var info = el('div', 'dk-skats-info');
            info.appendChild(el('p', 'prece-birka', 'Libertas dāvanu karte'));
            info.appendChild(el('h1', 'dk-skats-virsraksts', karte.kam ? karte.kam + ', tev ir dāvana!' : 'Dāvanu karte'));
            if (gaida || atcelta) {
                info.appendChild(el('p', 'dk-skats-statuss', atcelta ? 'Šī karte ir atcelta.' : 'Karte gaida apmaksu. Kods parādīsies, tiklīdz apmaksa būs saņemta.'));
                if (karte.rekins) { var r = el('a', 'btn-cta', 'Atvērt rēķinu'); r.href = 'rekins.html?k=' + karte.rekins; info.appendChild(r); }
            } else {
                var dl = el('dl', 'dk-skats-dati');
                [['Vērtība', karte.tips === 'kurss' && karte.kurss ? karte.kurss.nosaukums + ' (' + eur(karte.summa) + ')' : eur(karte.summa)],
                 karte.tips === 'summa' && Number(karte.atlikums) !== Number(karte.summa) ? ['Atlikums', eur(karte.atlikums)] : null,
                 ['Kods', karte.kods], ['Derīga līdz', lvD(karte.derigs_lidz)],
                 karte.statuss === 'izmantota' ? ['Statuss', 'Izmantota'] : karte.statuss === 'beigusies' ? ['Statuss', 'Termiņš beidzies'] : null].filter(Boolean).forEach(function (x) {
                    var w = el('div'); w.appendChild(el('dt', '', x[0])); w.appendChild(el('dd', x[0] === 'Kods' ? 'dk-skats-kods' : '', x[1])); dl.appendChild(w);
                });
                info.appendChild(dl);
                info.appendChild(el('h2', 'dk-skats-apaksvirsraksts', 'Kā izmantot'));
                var ol = el('ol', 'tirgus-soli dk-skats-soli');
                [['Izvēlies kursu', karte.tips === 'kurss' ? 'Atver kursa lapu un spied «Pieteikties» vai «Iegādāties piekļuvi».' : 'libertas.study sadaļā «Kursi» vai «Tirdziņš».'],
                 ['Ievadi kodu', 'Pieteikuma logā laukā «Atlaides vai dāvanu kartes kods».'],
                 ['Gatavs', karte.tips === 'kurss' ? 'Kurss ir apmaksāts — rēķins nav vajadzīgs.' : 'Kartes vērtība tiek atskaitīta no kursa cenas. Atlikums paliek kartē.']].forEach(function (s) {
                    var li = el('li'); li.appendChild(el('b', '', s[0])); li.appendChild(el('span', '', s[1])); ol.appendChild(li);
                });
                info.appendChild(ol);
                var pg = el('div', 'dk-skats-pogas');
                var dr = el('button', 'btn-cta', 'Drukāt / PDF'); dr.type = 'button'; dr.addEventListener('click', function () { window.print(); });
                var ku = el('a', 'btn-secondary', karte.kurss ? 'Uz kursu' : 'Skatīt kursus');
                ku.href = karte.kurss ? (karte.kurss.veids === 'ekurss' ? 'ek-kurss.html?k=' + encodeURIComponent(karte.kurss.id) : 'kursi.html') : 'kursi.html';
                pg.appendChild(dr); pg.appendChild(ku);
                info.appendChild(pg);
            }
            rez.appendChild(info);
            skats.appendChild(rez);
        };
        if (!tok) radit(null);
        else fetch('/api/davana/' + tok, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { radit(d && d.karte); }).catch(function () { radit(null); });
        return;
    }

    var budinas = document.querySelector('[data-tirgus-budinas]');
    if (!budinas) return;

    var g = document.documentElement.getAttribute('data-tirgus') || 'ziema';
    var nos = document.querySelector('[data-tirgus-nosaukums]');
    if (nos) nos.textContent = GADALAIKI[g] || 'Tirdziņš';

    var piedavajums = null;
    var TUKSS = { summas: [30, 50, 100, 150], min: 30, max: 500, pasta_maksa: 5, kursi: [] };
    function ieladetPiedavajumu() {
        if (piedavajums) return Promise.resolve(piedavajums);
        return fetch('/api/davanas/piedavajums', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { piedavajums = d || TUKSS; return piedavajums; })
            .catch(function () { piedavajums = TUKSS; return piedavajums; });
    }

    // ---------- Būdiņa (kopējā čaula) ----------
    var JUMTS = budinas.querySelector('.budina-virsus').outerHTML;
    function budina(izkartne, prece) {
        var li = el('li', 'budina');
        li.innerHTML = JUMTS;
        var iz = el('p', 'budina-izkartne', izkartne); iz.setAttribute('aria-hidden', 'true');
        li.appendChild(iz);
        li.appendChild(prece);
        var lete = el('div', 'budina-lete'); lete.setAttribute('aria-hidden', 'true');
        li.appendChild(lete);
        return li;
    }

    // ---------- Slēgtas būdiņas: maza priekšpuse ar slēģiem → klikšķis atver (izaug pa visu rindu) ----------
    // Bez JS visas būdiņas paliek atvērtas (vecais izkārtojums).
    var KLUSI = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var budinuSk = 0;
    budinas.classList.add('ir-slegtas');
    var padoms = el('p', 'tirgus-padoms', 'Pieskaries būdiņai, lai to atvērtu');
    budinas.parentNode.insertBefore(padoms, budinas);

    function ieskats(li, prece) {
        var w = el('span', 'budina-ieskats');
        if (prece.classList.contains('prece--davanas')) {
            var k = el('span', 'budina-ieskats-karte');
            k.innerHTML = dkKarte(PARAUGI[1], { tikaiPrieksa: true });
            w.appendChild(k);
        } else if (prece.classList.contains('prece--info')) {
            var s = el('span', 'budina-ieskats-soli');
            ['1', '2', '3'].forEach(function (n) { s.appendChild(el('i', '', n)); });
            w.appendChild(s);
        } else {
            var v = prece.querySelector('.prece-vaks');
            if (v) { var c = v.cloneNode(true); c.removeAttribute('id'); c.setAttribute('class', (v.getAttribute('class') || '') + ' budina-ieskats-vaks'); w.appendChild(c); }
        }
        w.appendChild(el('span', 'budina-slegi'));
        return w;
    }

    function iekartot(li) {
        var prece = li.querySelector('.prece');
        if (!prece || li.querySelector('.budina-logs')) return;
        var n = ++budinuSk;
        if (!prece.id) prece.id = 'budinas-prece-' + n;
        li.style.viewTransitionName = 'budina-' + n;
        li.classList.add('budina--slegta');

        var vh = prece.querySelector('.prece-virsraksts');
        var cena = prece.querySelector('.prece-cena');
        var birka = prece.querySelector('.prece-birka');
        var b = el('button', 'budina-logs'); b.type = 'button';
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', prece.id);
        b.appendChild(ieskats(li, prece));
        var t = el('span', 'budina-logs-teksts');
        if (birka) t.appendChild(el('span', 'budina-logs-birka', birka.textContent));
        t.appendChild(el('span', 'budina-logs-nos', vh ? vh.textContent : ''));
        var apaksa = el('span', 'budina-logs-apaksa');
        apaksa.appendChild(el('span', 'budina-logs-cena', cena ? cena.textContent : 'Uzzināt'));
        apaksa.appendChild(el('span', 'budina-logs-atvert', 'Atvērt'));
        t.appendChild(apaksa);
        b.appendChild(t);
        b.addEventListener('click', function () { parslegt(li, true); });
        prece.parentNode.insertBefore(b, prece);

        var x = el('button', 'budina-aizvert'); x.type = 'button';
        x.setAttribute('aria-label', 'Aizvērt būdiņu');
        x.innerHTML = '<span aria-hidden="true">×</span>';
        x.addEventListener('click', function () { parslegt(li, false); });
        prece.insertBefore(x, prece.firstChild);
        prece.setAttribute('tabindex', '-1');
        prece.hidden = true;
    }

    function parslegt(li, atvert) {
        var mainit = function () {
            budinas.querySelectorAll('.budina--atverta').forEach(function (o) { if (o !== li || !atvert) aizvert(o); });
            if (atvert) {
                li.classList.add('budina--atverta');
                li.querySelector('.budina-logs').setAttribute('aria-expanded', 'true');
                li.querySelector('.prece').hidden = false;
            }
        };
        var beigas = function () {
            if (atvert) {
                var p = li.querySelector('.prece');
                p.focus({ preventScroll: true });
                var r = li.getBoundingClientRect(), aug = (document.querySelector('.site-header') || { offsetHeight: 0 }).offsetHeight;
                if (r.top < aug + 8 || r.bottom > innerHeight) window.scrollBy({ top: r.top - aug - 24, behavior: KLUSI ? 'auto' : 'smooth' });
                if (li.id) history.replaceState(null, '', '#' + li.id);
            } else {
                li.querySelector('.budina-logs').focus({ preventScroll: true });
                history.replaceState(null, '', location.pathname + location.search);
            }
        };
        if (document.startViewTransition && !KLUSI) document.startViewTransition(mainit).finished.then(beigas, beigas);
        else { mainit(); beigas(); }
    }
    function aizvert(li) {
        li.classList.remove('budina--atverta');
        li.querySelector('.budina-logs').setAttribute('aria-expanded', 'false');
        li.querySelector('.prece').hidden = true;
    }
    budinas.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var o = budinas.querySelector('.budina--atverta');
        if (o) { e.preventDefault(); parslegt(o, false); }
    });
    budinas.querySelectorAll('.budina').forEach(iekartot);

    // ---------- E-kursi ----------
    function ekBudinas() {
        return fetch('/api/ek/kursi', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : { kursi: [] }; }).then(function (d) {
            var grupas = budinas.querySelector('[data-budina-grupas]');
            ((d && d.kursi) || []).forEach(function (k) {
                var a = el('article', 'prece'); a.setAttribute('aria-labelledby', 'prece-ek-' + k.id);
                var img = el('img', 'prece-vaks'); img.src = L.ekVaks ? L.ekVaks(k) : 'assets/kursi/spanu-a1.svg'; img.alt = ''; img.width = 600; img.height = 320; img.decoding = 'async'; a.appendChild(img);
                var s = el('div', 'prece-saturs');
                s.appendChild(el('p', 'prece-birka', 'Tiešsaistē · savā tempā'));
                var h = el('h3', 'prece-virsraksts'); h.id = 'prece-ek-' + k.id;
                var hs = el('a', '', k.nosaukums); hs.href = 'ek-kurss.html?k=' + encodeURIComponent(k.id); h.appendChild(hs); s.appendChild(h);
                s.appendChild(el('p', 'prece-apraksts', (k.nodarbibas ? k.nodarbibas.length + ' nodarbības' : 'Nodarbības') + (k.stundas ? ' · ~' + k.stundas + ' stundas' : '') + ' · ' + Math.round((k.dienas || 90) / 30) + ' mēn. piekļuve · noslēguma eksāmens un sertifikāts.'));
                s.appendChild(el('p', 'prece-cena', (L.cenaTeksts ? L.cenaTeksts(k.cena) : eur(k.cena))));
                var p = el('div', 'prece-pogas');
                if (L.ekPoga) { var b = L.ekPoga(k); b.classList.remove('btn-card'); p.appendChild(b); if (L.piesaistitPogu) L.piesaistitPogu(b); }
                var dv = el('button', 'btn-secondary', 'Uzdāvināt'); dv.type = 'button';
                dv.setAttribute('aria-label', 'Uzdāvināt kursu ' + k.nosaukums);
                dv.addEventListener('click', function () { atvertLogu({ tips: 'kurss', course_id: k.id }); });
                p.appendChild(dv);
                s.appendChild(p);
                a.appendChild(s);
                var li = budina(k.limenis ? 'E-kurss ' + k.limenis : 'E-kurss', a);
                li.id = 'e-kurss-' + k.id;
                budinas.insertBefore(li, grupas);
                iekartot(li);
            });
        }).catch(function () {});
    }

    // ---------- Manas dāvanu kartes ----------
    var STAT = { gaida: ['Gaida apmaksu', 'badge-pieteicies'], planota: ['Ieplānota', 'badge-sacis'], aktiva: ['Aktīva', 'badge-uznemts'], dalji: ['Daļēji izmantota', 'badge-sacis'], izmantota: ['Izmantota', 'badge-pabeidzis'], beigusies: ['Beigusies', 'badge-atteicies'] };
    function manasKartes() {
        var vieta = document.querySelector('[data-dk-manas]');
        if (!vieta || !(L.me && L.me.user)) return;
        L.api('GET', '/api/davanas/manas').then(function (d) {
            var ul = vieta.querySelector('[data-dk-saraksts]');
            ul.textContent = '';
            (d.kartes || []).forEach(function (k) {
                var li = el('li', 'dk-saraksts-vienums');
                var kv = el('div'); kv.innerHTML = dkKarte(k, { tikaiPrieksa: true }); li.appendChild(kv);
                var t = el('div', 'dk-saraksts-teksts');
                t.appendChild(el('p', 'dk-saraksts-kam', 'Kam: ' + (k.kam || '—')));
                var st = STAT[k.statuss] || STAT.gaida;
                t.appendChild(el('span', 'badge ' + st[1], st[0]));
                if (k.statuss === 'planota' && k.sutit_at) t.appendChild(el('p', 'dk-saraksts-info', 'Tiks nosūtīta ' + new Date(k.sutit_at).toLocaleString('lv-LV', { dateStyle: 'short', timeStyle: 'short' })));
                else if (k.statuss !== 'gaida') t.appendChild(el('p', 'dk-saraksts-info', 'Derīga līdz ' + lvD(k.derigs_lidz) + (k.tips === 'summa' ? ' · atlikums ' + eur(k.atlikums) : '')));
                var pog = el('div', 'dk-saraksts-pogas');
                var a = el('a', 'btn-link', k.statuss === 'gaida' ? 'Priekšskatīt' : 'Atvērt karti'); a.href = 'davanu-karte.html?k=' + k.token; pog.appendChild(a);
                if (k.rekins) { var r = el('a', 'btn-link', 'Rēķins'); r.href = 'rekins.html?k=' + k.rekins; pog.appendChild(r); }
                t.appendChild(pog);
                li.appendChild(t);
                ul.appendChild(li);
            });
            vieta.hidden = !(d.kartes || []).length;
        }).catch(function () {});
    }

    // ---------- Pasūtīšanas logs (4 soļi + priekšskatījums) ----------
    function atvertLogu(sak) {
        ieladetPiedavajumu().then(function (P) { radiLogu(P, sak || {}); });
    }

    function radiLogu(P, sak) {
        var me = L.me && L.me.user;
        var rit = new Date(Date.now() + 864e5); rit.setHours(18, 0, 0, 0);
        var pad = function (n) { return String(n).padStart(2, '0'); };
        var noklLaiks = rit.getFullYear() + '-' + pad(rit.getMonth() + 1) + '-' + pad(rit.getDate()) + 'T18:00';
        var st = {
            tips: sak.tips === 'summa' ? 'summa' : sak.tips === 'kurss' ? 'kurss' : 'kurss',
            summa: 100, cita: false,
            course_id: sak.course_id || (P.kursi[0] && P.kursi[0].id) || '',
            dizains: g === 'svetki' ? 'bordo' : 'mezs',
            kam: '', no: me ? (me.name || '').split(' ')[0] : '', apsveikums: '',
            piegade: 'epasts', sanemeja_epasts: '', sutit_at: noklLaiks, adrese: '',
            pirceja_vards: '', pirceja_epasts: ''
        };
        if (!P.kursi.length) st.tips = 'summa';

        var d = el('dialog', 'pieteikuma-logs dk-logs');
        d.setAttribute('aria-labelledby', 'dk-virsraksts');
        var galva = el('div', 'pl-galva');
        var gt = el('div', 'pl-galva-teksts');
        gt.appendChild(el('p', 'pl-zime', 'Tirdziņš · dāvanu karte'));
        var h = el('h2', 'pl-virsraksts', 'Biļete uz jaunu valodu'); h.id = 'dk-virsraksts'; gt.appendChild(h);
        galva.appendChild(gt);
        var x = el('button', 'pl-aizvert'); x.type = 'button'; x.setAttribute('aria-label', 'Aizvērt');
        x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        galva.appendChild(x);
        d.appendChild(galva);

        var izk = el('div', 'dk-izkartojums');
        var f = el('form', 'dk-forma'); f.noValidate = true;
        var prev = el('div', 'dk-prieksskats');
        izk.appendChild(f); izk.appendChild(prev);
        d.appendChild(izk);

        function solis(nr, teksts) {
            var w = el('div', 'dk-solis');
            var sh = el('div', 'dk-solis-galva'); sh.appendChild(el('i', '', String(nr))); sh.appendChild(document.createTextNode(teksts));
            w.appendChild(sh);
            f.appendChild(w);
            return w;
        }
        function izvele(vieta, vards, opcijas, vertiba, cb, cls) {
            var w = el('div', 'dk-izveles ' + (cls || ''));
            w.setAttribute('role', 'radiogroup');
            opcijas.forEach(function (o) {
                var l = el('label', 'dk-izvele');
                var i = el('input'); i.type = 'radio'; i.name = vards; i.value = o[0]; i.checked = String(vertiba) === String(o[0]);
                i.addEventListener('change', function () { cb(o[0]); atjaunot(); });
                l.appendChild(i);
                var s = el('span', '', o[1]);
                if (o[2]) s.appendChild(el('small', '', o[2]));
                if (o[3]) s.style.setProperty('--sw', o[3]);
                l.appendChild(s);
                w.appendChild(l);
            });
            vieta.appendChild(w);
            return w;
        }
        function lauks(vieta, etik, val, opc, cb) {
            var w = el('label', 'dk-lauks' + (opc.pilns ? ' dk-lauks--pilns' : ''));
            w.appendChild(el('span', 'dk-etikete', etik));
            var i = el(opc.area ? 'textarea' : 'input', 'lauks');
            if (opc.area) i.rows = 3; else i.type = opc.type || 'text';
            if (opc.max) i.maxLength = opc.max;
            if (opc.auto) i.autocomplete = opc.auto;
            i.value = val;
            i.addEventListener('input', function () { cb(i.value); atjaunot(); });
            w.appendChild(i);
            vieta.appendChild(w);
            return { w: w, i: i };
        }

        // 1. Ko dāvināsi?
        var s1 = solis(1, 'Ko dāvināsi?');
        var veidiOpc = [['kurss', 'Kursu', 'konkrēts līmenis'], ['summa', 'Summu', 'saņēmējs izvēlas']];
        if (!P.kursi.length) veidiOpc = veidiOpc.slice(1);
        izvele(s1, 'dk-tips', veidiOpc, st.tips, function (v) { st.tips = v; });
        var kW = el('label', 'dk-lauks dk-lauks--pilns');
        kW.appendChild(el('span', 'dk-etikete', 'Kurss'));
        var kS = el('select', 'lauks');
        var grupas = { grupa: el('optgroup'), ekurss: el('optgroup') };
        grupas.grupa.label = 'Grupu kursi ar pasniedzēju'; grupas.ekurss.label = 'Tiešsaistes kursi (pašmācība)';
        P.kursi.forEach(function (c) {
            var o = el('option', '', c.nosaukums + ' · ' + eur(c.cena)); o.value = c.id; o.selected = c.id === st.course_id;
            (grupas[c.veids] || grupas.grupa).appendChild(o);
        });
        [grupas.grupa, grupas.ekurss].forEach(function (gr) { if (gr.children.length) kS.appendChild(gr); });
        kS.addEventListener('change', function () { st.course_id = kS.value; atjaunot(); });
        kW.appendChild(kS);
        kW.appendChild(el('span', 'dk-palidziba', 'Karte sedz visu kursa cenu. Grupu saņēmējs izvēlas pats.'));
        s1.appendChild(kW);
        var sW = el('div', 'dk-summas-vieta');
        izvele(sW, 'dk-summa', P.summas.map(function (s) { return [s, s + ' €']; }).concat([['cita', 'Cita']]), st.summa, function (v) {
            st.cita = v === 'cita'; if (!st.cita) st.summa = Number(v); else { st.summa = Number(cita.i.value) || ''; setTimeout(function () { cita.i.focus(); }); }
        });
        var cita = lauks(sW, 'Summa (' + P.min + '–' + P.max + ' €)', '', { type: 'number' }, function (v) { st.summa = Number(v) || ''; });
        cita.i.min = P.min; cita.i.max = P.max; cita.i.step = 1; cita.i.inputMode = 'numeric';
        cita.w.classList.add('dk-cita');
        sW.appendChild(el('span', 'dk-palidziba', 'Atlikums paliek kartē līdz derīguma beigām.'));
        s1.appendChild(sW);

        // 2. Noformējums
        var s2 = solis(2, 'Noformējums');
        izvele(s2, 'dk-dizains', [['bordo', 'Jaungada', '', '#6B1D1D'], ['mezs', 'Mežs', '', '#1E2E29'], ['papirs', 'Papīrs', '', '#FFFDF8']], st.dizains, function (v) { st.dizains = v; }, 'dk-krasas');

        // 3. Kam un no kā
        var s3 = solis(3, 'Kam un no kā');
        var divi = el('div', 'dk-divi'); s3.appendChild(divi);
        var kam = lauks(divi, 'Saņēmēja vārds', st.kam, { max: 24 }, function (v) { st.kam = v; });
        var no = lauks(divi, 'No kā', st.no, { max: 24 }, function (v) { st.no = v; });
        var zina = lauks(s3, 'Ziņa aizmugurē (neobligāta)', st.apsveikums, { area: true, max: 140, pilns: true }, function (v) { st.apsveikums = v; skait.textContent = v.length + ' / 140'; });
        zina.i.placeholder = 'Piem., 2027. gadā mēs beidzot runāsim spāniski. Uz Madridi!';
        var skait = el('span', 'dk-palidziba', '0 / 140'); zina.w.appendChild(skait);

        // 4. Kā nogādāt?
        var s4 = solis(4, 'Kā nogādāt?');
        izvele(s4, 'dk-piegade', PIEGADES, st.piegade, function (v) { st.piegade = v; }, 'dk-piegades');
        var pW = el('div', 'dk-divi'); s4.appendChild(pW);
        var sanE = lauks(pW, 'Saņēmēja e-pasts', '', { type: 'email', auto: 'off' }, function (v) { st.sanemeja_epasts = v; });
        var laiks = lauks(pW, 'Nosūtīt', st.sutit_at, { type: 'datetime-local' }, function (v) { st.sutit_at = v; });
        var adr = lauks(s4, 'Piegādes adrese (iela, pilsēta, pasta indekss)', '', { area: true, max: 300, pilns: true, auto: 'street-address' }, function (v) { st.adrese = v; });
        adr.i.rows = 2;

        // Viesim: pircēja dati rēķinam (ar kontu — no konta)
        var viesis = null;
        if (!me) {
            var s5 = solis(5, 'Tavi dati rēķinam');
            var vd = el('div', 'dk-divi'); s5.appendChild(vd);
            var pv = lauks(vd, 'Vārds, uzvārds', '', { max: 80, auto: 'name' }, function (v) { st.pirceja_vards = v; });
            var pe = lauks(vd, 'E-pasts', '', { type: 'email', auto: 'email' }, function (v) { st.pirceja_epasts = v; });
            var ien = el('p', 'dk-palidziba');
            ien.appendChild(document.createTextNode('Reģistrēties nav obligāti. '));
            var ia = el('a', '', 'Ienākt ar Google'); ia.href = L.signInUrl ? L.signInUrl('/tirdzins.html#davana') : '/auth/google';
            ien.appendChild(ia);
            ien.appendChild(document.createTextNode(' — tad dati aizpildīsies paši un kartes redzēsi šeit.'));
            s5.appendChild(ien);
            viesis = { v: pv, e: pe };
        }
        var viltus = el('input', 'dk-viltus'); viltus.type = 'text'; viltus.tabIndex = -1; viltus.autocomplete = 'off'; viltus.setAttribute('aria-hidden', 'true');
        f.appendChild(viltus);

        // Priekšskatījums + kopsavilkums + pogas (labajā pusē)
        var skatuve = el('div', 'dk-skatuve');
        var pvKarte = el('div'); skatuve.appendChild(pvKarte);
        var riki = el('div', 'dk-skatuves-riki');
        riki.appendChild(el('span', 'dk-palidziba', 'Priekšskatījums'));
        var apgr = el('button', 'btn-secondary btn-small', 'Apgriezt karti'); apgr.type = 'button';
        var otra = false;
        apgr.addEventListener('click', function () { otra = !otra; var fl = pvKarte.querySelector('.dk-flip'); if (fl) fl.classList.toggle('ir-otra', otra); });
        riki.appendChild(apgr);
        skatuve.appendChild(riki);
        prev.appendChild(skatuve);
        var kops = el('div', 'dk-kopsavilkums'); prev.appendChild(kops);
        var lbl = el('label', 'pl-piekrisana');
        var cb = el('input'); cb.type = 'checkbox';
        lbl.appendChild(cb);
        var lt = el('span');
        lt.appendChild(document.createTextNode('Esmu iepazinies ar '));
        var na = el('a', '', 'dāvanu karšu noteikumiem'); na.href = 'noteikumi.html#davanu-kartes'; na.target = '_blank'; na.rel = 'noopener';
        lt.appendChild(na);
        lt.appendChild(document.createTextNode(' (derīga 12 mēnešus no apmaksas, nav apmaināma pret naudu).'));
        lbl.appendChild(lt);
        prev.appendChild(lbl);
        var kluda = el('p', 'dk-kluda'); kluda.setAttribute('role', 'alert');
        prev.appendChild(kluda);
        var ok = el('button', 'btn-cta dk-turpinat', 'Turpināt uz apmaksu'); ok.type = 'button';
        prev.appendChild(ok);
        prev.appendChild(el('p', 'pl-piezime', 'Rēķinu nosūtīsim uz tavu e-pastu. Kad apmaksa saņemta, karte tiek piegādāta tā, kā izvēlējies.'));

        function kursaInfo() { return P.kursi.filter(function (c) { return c.id === st.course_id; })[0]; }
        function cena() { return st.tips === 'kurss' ? (kursaInfo() ? Number(kursaInfo().cena) : 0) : Number(st.summa) || 0; }
        function rinda(a, b, cls) { var r = el('div', 'dk-rinda ' + (cls || '')); r.appendChild(el('span', '', a)); r.appendChild(el('span', '', b)); return r; }
        function piegadesTeksts() {
            if (st.piegade === 'epasts') return 'Uzreiz pēc apmaksas e-pastā';
            if (st.piegade === 'pdf') return 'PDF uz tavu e-pastu';
            if (st.piegade === 'pasts') return 'Aploksnē, 3–5 d. d.';
            var m = (st.sutit_at || '').match(/\d{4}-(\d\d)-(\d\d)T(\d\d:\d\d)/);
            return m ? m[2] + '.' + m[1] + '. ' + m[3] + ' e-pastā' : 'Izvēlies datumu';
        }
        function atjaunot() {
            kW.hidden = st.tips !== 'kurss';
            sW.hidden = st.tips !== 'summa';
            cita.w.hidden = !st.cita;
            sanE.w.hidden = !(st.piegade === 'epasts' || st.piegade === 'velak');
            laiks.w.hidden = st.piegade !== 'velak';
            adr.w.hidden = st.piegade !== 'pasts';
            var c = kursaInfo();
            pvKarte.innerHTML = dkKarte({ dizains: st.dizains, tips: st.tips, summa: cena(), kurss: c, kam: st.kam || 'Vārds', no: st.no, apsveikums: st.apsveikums }, { otra: otra });
            var fl = pvKarte.querySelector('.dk-flip');
            if (fl) fl.addEventListener('click', function () { otra = !otra; fl.classList.toggle('ir-otra', otra); });
            kops.textContent = '';
            var pasta = st.piegade === 'pasts' ? Number(P.pasta_maksa || 5) : 0;
            kops.appendChild(rinda(st.tips === 'kurss' ? (c ? c.nosaukums : 'Kurss') + ' · kursa karte' : 'Summas karte', cena() ? eur(cena()) : '—'));
            if (pasta) kops.appendChild(rinda('Aploksne un pasts', eur(pasta)));
            kops.appendChild(rinda('Piegāde', piegadesTeksts()));
            kops.appendChild(rinda('Kopā', cena() ? eur(cena() + pasta) : '—', 'dk-rinda--kopa'));
        }
        var EP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        function parbaudit() {
            if (st.tips === 'summa' && !(Number.isInteger(Number(st.summa)) && st.summa >= P.min && st.summa <= P.max)) return ['Summai jābūt no ' + P.min + ' līdz ' + P.max + ' €', cita.i];
            if (st.tips === 'kurss' && !st.course_id) return ['Izvēlies kursu', kS];
            if (!st.kam.trim()) return ['Ieraksti saņēmēja vārdu', kam.i];
            if (!st.no.trim()) return ['Ieraksti, no kā dāvana', no.i];
            if ((st.piegade === 'epasts' || st.piegade === 'velak') && !EP.test(st.sanemeja_epasts.trim())) return ['Ieraksti saņēmēja e-pastu', sanE.i];
            if (st.piegade === 'velak' && !(new Date(st.sutit_at).getTime() > Date.now() + 10 * 60 * 1000)) return ['Izvēlies sūtīšanas laiku nākotnē', laiks.i];
            if (st.piegade === 'pasts' && st.adrese.trim().length < 10) return ['Ieraksti pilnu piegādes adresi', adr.i];
            if (viesis && !st.pirceja_vards.trim()) return ['Ieraksti savu vārdu (rēķinam)', viesis.v.i];
            if (viesis && !EP.test(st.pirceja_epasts.trim())) return ['Ieraksti savu e-pastu — uz to nosūtīsim rēķinu', viesis.e.i];
            if (!cb.checked) return ['Atzīmē, ka esi iepazinies ar noteikumiem', cb];
            return null;
        }
        function aizvert() { d.close(); }
        x.addEventListener('click', aizvert);
        d.addEventListener('click', function (e) { if (e.target === d) aizvert(); });
        d.addEventListener('close', function () { d.remove(); });
        f.addEventListener('submit', function (e) { e.preventDefault(); ok.click(); });

        ok.addEventListener('click', function () {
            var p = parbaudit();
            kluda.textContent = p ? p[0] : '';
            if (p) { p[1].focus(); return; }
            var body = {
                tips: st.tips, summa: st.tips === 'summa' ? Number(st.summa) : undefined, course_id: st.tips === 'kurss' ? st.course_id : undefined,
                dizains: st.dizains, kam: st.kam, no: st.no, apsveikums: st.apsveikums,
                piegade: st.piegade, sanemeja_epasts: st.sanemeja_epasts || undefined,
                sutit_at: st.piegade === 'velak' ? new Date(st.sutit_at).toISOString() : undefined,
                adrese: st.piegade === 'pasts' ? st.adrese : undefined,
                pirceja_vards: viesis ? st.pirceja_vards : undefined, pirceja_epasts: viesis ? st.pirceja_epasts : undefined,
                viltus: viltus.value || undefined
            };
            ok.disabled = true; ok.classList.add('btn-busy');
            L.api('POST', '/api/davanas', body).then(function (r) {
                gatavs(r);
                manasKartes();
            }).catch(function (err) {
                kluda.textContent = err.message || 'Neizdevās pasūtīt. Mēģini vēlreiz.';
                ok.disabled = false; ok.classList.remove('btn-busy');
            });
        });

        function gatavs(r) {
            f.textContent = '';
            f.classList.add('dk-forma--gatava');
            prev.querySelectorAll('.pl-piekrisana, .dk-kluda, .dk-turpinat, .pl-piezime, .dk-skatuves-riki').forEach(function (n) { n.remove(); });
            h.textContent = 'Paldies! Pasūtījums saņemts';
            f.appendChild(el('p', 'dk-gatavs-teksts', r.rekins_nosutits
                ? 'Rēķinu (' + eur(r.kopa) + ') nosūtījām uz tavu e-pastu. Tiklīdz apmaksa būs saņemta, karte tiks piegādāta.'
                : 'Rēķinu (' + eur(r.kopa) + ') nosūtīsim uz tavu e-pastu tuvākajā laikā. Tiklīdz apmaksa būs saņemta, karte tiks piegādāta.'));
            f.appendChild(el('p', 'dk-gatavs-teksts', st.piegade === 'velak' ? 'Saņēmējs karti saņems tavā izvēlētajā laikā.' : st.piegade === 'epasts' ? 'Saņēmējs karti saņems e-pastā uzreiz pēc apmaksas, un tu saņemsi kopiju.' : st.piegade === 'pasts' ? 'Iespiestu karti nosūtīsim aploksnē 3–5 darba dienu laikā pēc apmaksas.' : 'Karti ar kodu nosūtīsim tev — to vari izdrukāt vai pārsūtīt.'));
            var pg = el('div', 'pl-pogas');
            var a = el('a', 'btn-cta', 'Skatīt karti'); a.href = 'davanu-karte.html?k=' + r.karte.token;
            var c2 = el('button', 'btn-secondary', 'Aizvērt'); c2.type = 'button'; c2.addEventListener('click', aizvert);
            pg.appendChild(a); pg.appendChild(c2);
            f.appendChild(pg);
            a.focus();
        }

        atjaunot();
        document.body.appendChild(d);
        if (d.showModal) d.showModal(); else d.setAttribute('open', '');
        var pirmais = f.querySelector('input[name="dk-tips"]:checked');
        if (pirmais) pirmais.focus();
    }

    document.querySelectorAll('[data-dk-atvert]').forEach(function (b) {
        b.addEventListener('click', function () { atvertLogu({ tips: b.getAttribute('data-dk-atvert') }); });
    });

    function sakt() {
        ekBudinas().then(function () {
            // #davanu-kartes, #e-kurss-<id> u.c. — atver attiecīgo būdiņu
            var mer = location.hash.length > 1 && !/^#davana/.test(location.hash) && document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (mer && mer.classList && mer.classList.contains('budina--slegta')) parslegt(mer, true);
        });
        manasKartes();
        // #davana vai #davana-<kursa id> (saite «Uzdāvināt» kursa lapās) atver logu
        var m = location.hash.match(/^#davana(?:-([a-z0-9-]+))?$/);
        if (m) {
            history.replaceState(null, '', location.pathname + location.search);
            atvertLogu(m[1] ? { tips: 'kurss', course_id: m[1] } : {});
        }
    }
    if (L.me) sakt();
    else document.addEventListener('lib:me', sakt, { once: true });
})();
