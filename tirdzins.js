// TIRDZIŅŠ (tirdzins.html) + dāvanu kartes zīmējums (arī davanu-karte.html).
// Gadalaiks: html.tirgus-<svetki|ziema|pavasaris|vasara|rudens> (inline skripts <head>).
// Būdiņas: dāvanu kartes (statiskas), e-kursi (no /api/ek/kursi), grupu kursi (saite), «Kā notiek».
// Dāvanu kartes pasūtīšana: <dialog class="pieteikuma-logs dk-logs"> → POST /api/davanas → rēķins e-pastā.
(function () {
    var L = window.LIB || {};
    var GADALAIKI = { svetki: 'Ziemassvētku tirdziņš', ziema: 'Ziemas tirdziņš', pavasaris: 'Pavasara tirdziņš', vasara: 'Vasaras tirdziņš', rudens: 'Rudens tirdziņš' };
    var DIZAINI = [['ziema', 'Ziemas vakars'], ['spanu', 'Spānijas saule'], ['anglu', 'Angļu rīts']];

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function eur(n) { var v = Number(n || 0); return (v % 1 ? v.toFixed(2).replace('.', ',') : String(v)) + ' EUR'; }
    function lvD(iso) { return iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) + '.' : ''; }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

    // ---------- Kartes zīmējums ----------
    // o: {dizains, vertiba, apaksa (kursa karte: "kurss"), kam, kods}
    function dkKarte(o) {
        var d = DIZAINI.some(function (x) { return x[0] === o.dizains; }) ? o.dizains : 'ziema';
        var A = 'assets/scene/ainava.svg#';
        var sc = { ziema: 'sc-ziema', spanu: 'sc-kafija', anglu: 'sc-rits' }[d];
        return '<div class="dk-karte dk-karte--' + d + ' ' + sc + (o.mazs ? ' dk-karte--mazs' : '') + '">' +
            '<svg class="dk-karte-ainava" viewBox="0 300 1440 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
            '<use href="' + A + 'sc-sun"/><use href="' + A + 'sc-far"/><use href="' + A + 'sc-lake"/><use href="' + A + 'sc-mid"/><use href="' + A + 'sc-near"/></svg>' +
            '<div class="dk-karte-saturs">' +
            '<img class="dk-karte-logo" src="assets/libertas.png" alt="Libertas" width="500" height="216">' +
            '<p class="dk-karte-zime">Dāvanu karte</p>' +
            '<p class="dk-karte-vertiba">' + esc(o.vertiba || '50 EUR') + (o.apaksa ? '<small>' + esc(o.apaksa) + '</small>' : '') + '</p>' +
            (o.kam ? '<p class="dk-karte-kam">' + esc(o.kam) + '</p>' : '') +
            (o.kods ? '<p class="dk-karte-kods">' + esc(o.kods) + '</p>' : '') +
            '</div></div>';
    }
    function vertibaNo(k) {
        // k: {tips, summa, kurss{nosaukums}} vai melnraksts {tips, summa, kursaNos}
        if (k.tips === 'kurss') return { vertiba: (k.kurss && k.kurss.nosaukums) || k.kursaNos || 'Kurss', apaksa: 'kurss pēc izvēles' };
        return { vertiba: eur(k.summa), apaksa: '' };
    }
    L.dkKarte = dkKarte;
    L.dkVertiba = vertibaNo;
    window.LIB = L;

    // Paraugi būdiņā
    document.querySelectorAll('[data-dk-paraugs]').forEach(function (n, i) {
        n.outerHTML = dkKarte({ dizains: n.getAttribute('data-dk-paraugs'), vertiba: ['50 EUR', 'Spāņu A1', '25 EUR'][i] || '50 EUR', mazs: true });
    });

    // ---------- davanu-karte.html?k=<token>: karte, kods, kā izmantot, drukāt ----------
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
            var v = vertibaNo(karte);
            var gaida = karte.statuss === 'gaida', atcelta = karte.statuss === 'atcelta';
            var rez = el('div', 'dk-skats-rezgis');
            var kv = el('div', 'dk-skats-karte');
            kv.innerHTML = dkKarte({ dizains: karte.dizains, vertiba: v.vertiba, apaksa: v.apaksa, kam: karte.kam, kods: karte.kods });
            if (karte.apsveikums || karte.no) {
                var ap = el('div', 'dk-skats-apsveikums');
                if (karte.apsveikums) ap.appendChild(el('p', 'dk-skats-apsveikums-teksts', '“' + karte.apsveikums + '”'));
                if (karte.no) ap.appendChild(el('p', 'dk-skats-no', '— ' + karte.no));
                kv.appendChild(ap);
            }
            rez.appendChild(kv);

            var info = el('div', 'dk-skats-info');
            info.appendChild(el('p', 'prece-birka', 'Libertas dāvanu karte'));
            info.appendChild(el('h1', 'dk-skats-virsraksts', karte.kam ? 'Dāvana: ' + karte.kam : 'Dāvanu karte'));
            if (gaida || atcelta) {
                var b = el('p', 'dk-skats-statuss', atcelta ? 'Šī karte ir atcelta.' : 'Karte gaida apmaksu. Kods parādīsies, tiklīdz apmaksa būs saņemta.');
                info.appendChild(b);
                if (karte.rekins) { var r = el('a', 'btn-cta', 'Atvērt rēķinu'); r.href = 'rekins.html?k=' + karte.rekins; info.appendChild(r); }
            } else {
                var dl = el('dl', 'dk-skats-dati');
                [['Vērtība', karte.tips === 'kurss' ? v.vertiba + ' (kurss)' : eur(karte.summa)],
                 karte.tips === 'summa' && Number(karte.atlikums) !== Number(karte.summa) ? ['Atlikums', eur(karte.atlikums)] : null,
                 ['Kods', karte.kods], ['Derīga līdz', lvD(karte.derigs_lidz)],
                 karte.statuss === 'izmantota' ? ['Statuss', 'Izmantota'] : null].filter(Boolean).forEach(function (x) {
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
    function ieladetPiedavajumu() {
        if (piedavajums) return Promise.resolve(piedavajums);
        return fetch('/api/davanas/piedavajums', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { piedavajums = d || { summas: [25, 50, 100], min: 10, max: 500, kursi: [] }; return piedavajums; })
            .catch(function () { piedavajums = { summas: [25, 50, 100], min: 10, max: 500, kursi: [] }; return piedavajums; });
    }

    // ---------- Būdiņa (kopējā čaula) ----------
    var JUMTS = budinas.querySelector('.budina-virsus').outerHTML;
    function budina(izkartne, prece, plata) {
        var li = el('li', 'budina' + (plata ? ' budina--plata' : ''));
        li.innerHTML = JUMTS;
        var iz = el('p', 'budina-izkartne', izkartne); iz.setAttribute('aria-hidden', 'true');
        li.appendChild(iz);
        li.appendChild(prece);
        var lete = el('div', 'budina-lete'); lete.setAttribute('aria-hidden', 'true');
        li.appendChild(lete);
        return li;
    }

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
                var dv = el('button', 'btn-secondary', 'Dāvināt'); dv.type = 'button';
                dv.setAttribute('aria-label', 'Dāvināt kursu ' + k.nosaukums);
                dv.addEventListener('click', function () { atvertLogu({ tips: 'kurss', course_id: k.id }); });
                p.appendChild(dv);
                s.appendChild(p);
                a.appendChild(s);
                budinas.insertBefore(budina(k.limenis ? 'E-kurss ' + k.limenis : 'E-kurss', a), grupas);
            });
        }).catch(function () {});
    }

    // ---------- Manas dāvanu kartes ----------
    var STAT = { gaida: ['Gaida apmaksu', 'badge-pieteicies'], aktiva: ['Aktīva', 'badge-uznemts'], izmantota: ['Izmantota', 'badge-pabeidzis'] };
    function manasKartes() {
        var vieta = document.querySelector('[data-dk-manas]');
        if (!vieta || !(L.me && L.me.user)) return;
        L.api('GET', '/api/davanas/manas').then(function (d) {
            var ul = vieta.querySelector('[data-dk-saraksts]');
            ul.textContent = '';
            (d.kartes || []).forEach(function (k) {
                var li = el('li', 'dk-saraksts-vienums');
                var v = vertibaNo(k);
                li.innerHTML = dkKarte({ dizains: k.dizains, vertiba: v.vertiba, apaksa: v.apaksa, kam: k.kam, mazs: true });
                var t = el('div', 'dk-saraksts-teksts');
                t.appendChild(el('p', 'dk-saraksts-kam', 'Kam: ' + (k.kam || '—')));
                var st = STAT[k.statuss] || STAT.gaida;
                t.appendChild(el('span', 'badge ' + st[1], st[0]));
                if (k.statuss === 'aktiva') t.appendChild(el('p', 'dk-saraksts-info', 'Derīga līdz ' + lvD(k.derigs_lidz) + (k.tips === 'summa' ? ' · atlikums ' + eur(k.atlikums) : '')));
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

    // ---------- Pasūtīšanas logs ----------
    var MELNRAKSTS = 'dkMelnraksts';
    function atvertLogu(sak) {
        ieladetPiedavajumu().then(function (P) { radiLogu(P, sak || {}); });
    }

    function radiLogu(P, sak) {
        var logged = !!(L.me && L.me.user);
        var st = {
            tips: sak.tips === 'kurss' ? 'kurss' : 'summa',
            summa: sak.summa || 50, cita: false,
            course_id: sak.course_id || (P.kursi[0] && P.kursi[0].id) || '',
            dizains: sak.dizains || (g === 'svetki' || g === 'ziema' ? 'ziema' : 'spanu'),
            kam: sak.kam || '', no: sak.no || (logged ? ((L.me.user.name || '').split(' ')[0]) : ''), apsveikums: sak.apsveikums || ''
        };
        if (P.summas.indexOf(Number(st.summa)) < 0) st.cita = true;

        var d = el('dialog', 'pieteikuma-logs dk-logs');
        d.setAttribute('aria-labelledby', 'dk-virsraksts');
        var galva = el('div', 'pl-galva');
        var gt = el('div', 'pl-galva-teksts');
        gt.appendChild(el('p', 'pl-zime', 'Tirdziņš · dāvanu karte'));
        var h = el('h2', 'pl-virsraksts', 'Uzdāvini valodu'); h.id = 'dk-virsraksts'; gt.appendChild(h);
        galva.appendChild(gt);
        var x = el('button', 'pl-aizvert'); x.type = 'button'; x.setAttribute('aria-label', 'Aizvērt');
        x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        galva.appendChild(x);
        d.appendChild(galva);

        var izk = el('div', 'dk-izkartojums');
        var prev = el('div', 'dk-prieksskats'); prev.setAttribute('aria-hidden', 'true');
        izk.appendChild(prev);
        var f = el('form', 'dk-forma'); f.noValidate = true;
        izk.appendChild(f);
        d.appendChild(izk);

        // Veids
        var fsV = el('fieldset', 'dk-lauks');
        fsV.appendChild(el('legend', '', 'Ko dāvināt?'));
        var veidi = el('div', 'dk-segmenti');
        [['summa', 'Summu'], ['kurss', 'Kursu']].forEach(function (v) {
            var l = el('label', 'dk-segments');
            var i = el('input'); i.type = 'radio'; i.name = 'dk-tips'; i.value = v[0]; i.checked = st.tips === v[0];
            i.addEventListener('change', function () { st.tips = v[0]; atjaunot(); });
            l.appendChild(i); l.appendChild(el('span', '', v[1])); veidi.appendChild(l);
        });
        fsV.appendChild(veidi);
        f.appendChild(fsV);

        // Summa
        var fsS = el('fieldset', 'dk-lauks');
        fsS.appendChild(el('legend', '', 'Summa'));
        var summas = el('div', 'dk-summas');
        P.summas.concat(['cita']).forEach(function (s) {
            var l = el('label', 'dk-summa');
            var i = el('input'); i.type = 'radio'; i.name = 'dk-summa'; i.value = s;
            i.checked = s === 'cita' ? st.cita : (!st.cita && Number(st.summa) === s);
            i.addEventListener('change', function () { st.cita = s === 'cita'; if (!st.cita) st.summa = s; else { citaL.focus(); st.summa = Number(citaL.value) || ''; } atjaunot(); });
            l.appendChild(i); l.appendChild(el('span', '', s === 'cita' ? 'Cita' : s + ' €')); summas.appendChild(l);
        });
        fsS.appendChild(summas);
        var citaW = el('label', 'dk-cita');
        citaW.appendChild(el('span', '', 'Cita summa (' + P.min + '–' + P.max + ' EUR)'));
        var citaL = el('input', 'lauks'); citaL.type = 'number'; citaL.min = P.min; citaL.max = P.max; citaL.step = 1; citaL.inputMode = 'numeric';
        if (st.cita) citaL.value = st.summa;
        citaL.addEventListener('input', function () { st.summa = Number(citaL.value) || ''; atjaunot(); });
        citaW.appendChild(citaL);
        fsS.appendChild(citaW);
        f.appendChild(fsS);

        // Kurss
        var kW = el('label', 'dk-lauks dk-kurss');
        kW.appendChild(el('span', 'dk-etikete', 'Kurss'));
        var kS = el('select', 'lauks');
        var grupas = { grupa: el('optgroup'), ekurss: el('optgroup') };
        grupas.grupa.label = 'Grupu kursi ar pasniedzēju'; grupas.ekurss.label = 'Tiešsaistes kursi (pašmācība)';
        P.kursi.forEach(function (c) {
            var o = el('option', '', c.nosaukums + ' — ' + eur(c.cena)); o.value = c.id; o.selected = c.id === st.course_id;
            (grupas[c.veids] || grupas.grupa).appendChild(o);
        });
        [grupas.grupa, grupas.ekurss].forEach(function (gr) { if (gr.children.length) kS.appendChild(gr); });
        kS.addEventListener('change', function () { st.course_id = kS.value; atjaunot(); });
        kW.appendChild(kS);
        kW.appendChild(el('span', 'dk-palidziba', 'Karte sedz visu kursa cenu. Grupas datumus saņēmējs izvēlas pats.'));
        f.appendChild(kW);

        // Dizains
        var fsD = el('fieldset', 'dk-lauks');
        fsD.appendChild(el('legend', '', 'Noformējums'));
        var diz = el('div', 'dk-dizaini');
        DIZAINI.forEach(function (x) {
            var l = el('label', 'dk-dizains');
            var i = el('input'); i.type = 'radio'; i.name = 'dk-dizains'; i.value = x[0]; i.checked = st.dizains === x[0];
            i.addEventListener('change', function () { st.dizains = x[0]; atjaunot(); });
            l.appendChild(i);
            var m = el('span', 'dk-dizains-attels'); m.innerHTML = dkKarte({ dizains: x[0], vertiba: '', mazs: true }); m.setAttribute('aria-hidden', 'true');
            l.appendChild(m);
            l.appendChild(el('span', 'dk-dizains-nos', x[1]));
            diz.appendChild(l);
        });
        fsD.appendChild(diz);
        f.appendChild(fsD);

        // Kam / no kā / apsveikums
        function teksts(id, etik, val, max, cb, area) {
            var w = el('label', 'dk-lauks');
            w.appendChild(el('span', 'dk-etikete', etik));
            var i = el(area ? 'textarea' : 'input', 'lauks'); i.id = id; i.maxLength = max; i.value = val;
            if (area) i.rows = 3; else i.type = 'text';
            i.addEventListener('input', function () { cb(i.value); atjaunot(); });
            w.appendChild(i);
            return { w: w, i: i };
        }
        var divi = el('div', 'dk-divi');
        var kam = teksts('dk-kam', 'Kam (vārds uz kartes)', st.kam, 60, function (v) { st.kam = v; });
        var no = teksts('dk-no', 'No kā', st.no, 60, function (v) { st.no = v; });
        divi.appendChild(kam.w); divi.appendChild(no.w);
        f.appendChild(divi);
        var aps = teksts('dk-apsveikums', 'Apsveikums (neobligāts)', st.apsveikums, 300, function (v) { st.apsveikums = v; skait.textContent = v.length + ' / 300'; }, true);
        var skait = el('span', 'dk-palidziba', st.apsveikums.length + ' / 300');
        aps.w.appendChild(skait);
        f.appendChild(aps.w);
        var viltus = el('input', 'dk-viltus'); viltus.type = 'text'; viltus.tabIndex = -1; viltus.autocomplete = 'off'; viltus.setAttribute('aria-hidden', 'true');
        f.appendChild(viltus);

        // Kopsavilkums + piekrišana + pogas
        var kopa = el('p', 'dk-kopa');
        f.appendChild(kopa);
        var lbl = el('label', 'pl-piekrisana');
        var cb = el('input'); cb.type = 'checkbox';
        lbl.appendChild(cb);
        var lt = el('span');
        lt.appendChild(document.createTextNode('Esmu iepazinies ar '));
        var na = el('a', '', 'dāvanu karšu noteikumiem'); na.href = 'noteikumi.html#davanu-kartes'; na.target = '_blank'; na.rel = 'noopener';
        lt.appendChild(na);
        lt.appendChild(document.createTextNode(' (derīga 12 mēnešus no apmaksas, nav apmaināma pret naudu).'));
        lbl.appendChild(lt);
        f.appendChild(lbl);
        var kluda = el('p', 'dk-kluda'); kluda.setAttribute('role', 'alert');
        f.appendChild(kluda);
        var pogas = el('div', 'pl-pogas');
        var ok = el('button', 'btn-cta', logged ? 'Pasūtīt un saņemt rēķinu' : 'Ienākt ar Google un pasūtīt'); ok.type = 'submit';
        var atcelt = el('button', 'btn-secondary', 'Atcelt'); atcelt.type = 'button';
        pogas.appendChild(ok); pogas.appendChild(atcelt);
        f.appendChild(pogas);
        f.appendChild(el('p', 'pl-piezime', 'Rēķinu nosūtīsim uz tava Google konta e-pastu. Kad apmaksa saņemta, karte atnāks e-pastā, un to vari izdrukāt vai pārsūtīt.'));

        function kursaInfo() { return P.kursi.filter(function (c) { return c.id === st.course_id; })[0]; }
        function cena() { return st.tips === 'kurss' ? (kursaInfo() ? Number(kursaInfo().cena) : 0) : Number(st.summa) || 0; }
        function atjaunot() {
            fsS.hidden = st.tips !== 'summa';
            kW.hidden = st.tips !== 'kurss';
            citaW.hidden = !st.cita;
            var c = kursaInfo();
            var v = vertibaNo({ tips: st.tips, summa: st.summa || 0, kursaNos: c ? c.nosaukums : '' });
            prev.innerHTML = dkKarte({ dizains: st.dizains, vertiba: v.vertiba, apaksa: v.apaksa, kam: st.kam || 'Vārds' }) +
                (st.apsveikums ? '<p class="dk-prieksskats-teksts">“' + esc(st.apsveikums) + '”' + (st.no ? '<br><b>— ' + esc(st.no) + '</b>' : '') + '</p>' : '');
            kopa.textContent = 'Kopā apmaksai: ' + (cena() ? eur(cena()) : '—');
        }
        function parbaudit() {
            if (st.tips === 'summa' && !(Number.isInteger(Number(st.summa)) && st.summa >= P.min && st.summa <= P.max)) return ['Summai jābūt no ' + P.min + ' līdz ' + P.max + ' EUR', citaL];
            if (st.tips === 'kurss' && !st.course_id) return ['Izvēlies kursu', kS];
            if (!st.kam.trim()) return ['Ieraksti, kam dāvana paredzēta', kam.i];
            if (!st.no.trim()) return ['Ieraksti, no kā dāvana', no.i];
            if (!cb.checked) return ['Atzīmē, ka esi iepazinies ar noteikumiem', cb];
            return null;
        }
        function aizvert() { d.close(); }
        x.addEventListener('click', aizvert);
        atcelt.addEventListener('click', aizvert);
        d.addEventListener('click', function (e) { if (e.target === d) aizvert(); });
        d.addEventListener('close', function () { d.remove(); });

        f.addEventListener('submit', function (e) {
            e.preventDefault();
            var p = parbaudit();
            kluda.textContent = p ? p[0] : '';
            if (p) { p[1].focus(); return; }
            var body = { tips: st.tips, summa: st.tips === 'summa' ? Number(st.summa) : undefined, course_id: st.tips === 'kurss' ? st.course_id : undefined, dizains: st.dizains, kam: st.kam, no: st.no, apsveikums: st.apsveikums, viltus: viltus.value || undefined };
            if (!logged) {
                try { sessionStorage.setItem(MELNRAKSTS, JSON.stringify(body)); } catch (x2) {}
                location.href = L.signInUrl ? L.signInUrl('/tirdzins.html#davana') : '/auth/google?return=' + encodeURIComponent('/tirdzins.html#davana');
                return;
            }
            ok.disabled = true; ok.classList.add('btn-busy');
            L.api('POST', '/api/davanas', body).then(function (r) {
                try { sessionStorage.removeItem(MELNRAKSTS); } catch (x3) {}
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
            h.textContent = 'Paldies! Pasūtījums saņemts';
            f.appendChild(el('p', 'dk-gatavs-teksts', r.rekins_nosutits
                ? 'Rēķinu nosūtījām uz tavu e-pastu. Tiklīdz apmaksa būs saņemta, dāvanu karte ar kodu atnāks e-pastā.'
                : 'Rēķinu nosūtīsim uz tavu e-pastu tuvākajā laikā. Tiklīdz apmaksa būs saņemta, dāvanu karte ar kodu atnāks e-pastā.'));
            f.appendChild(el('p', 'dk-gatavs-teksts', 'Pasūtījums un apmaksas statuss redzams šeit, tirdziņā, sadaļā «Manas dāvanu kartes».'));
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
        (st.tips === 'kurss' ? kS : f.querySelector('input[name="dk-summa"]:checked') || kam.i).focus();
    }

    document.querySelectorAll('[data-dk-atvert]').forEach(function (b) {
        b.addEventListener('click', function () { atvertLogu({ tips: b.getAttribute('data-dk-atvert') }); });
    });

    function sakt() {
        ekBudinas();
        manasKartes();
        // Atgriešanās pēc ienākšanas: atver logu ar melnrakstu
        var m = null;
        try { m = JSON.parse(sessionStorage.getItem(MELNRAKSTS) || 'null'); } catch (x) {}
        if (location.hash === '#davana' || m) {
            if (m && L.me && L.me.user) { try { sessionStorage.removeItem(MELNRAKSTS); } catch (x) {} }
            history.replaceState(null, '', location.pathname + location.search);
            atvertLogu(m || {});
        }
    }
    if (L.me) sakt();
    else document.addEventListener('lib:me', sakt, { once: true });
})();
