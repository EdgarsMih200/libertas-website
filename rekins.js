// Rēķins: klienta skats (?k=<token>) un administratora redaktors (?id=N | ?jauns | ?pieteikums=N).
// Visi dati tiek ievietoti ar textContent. Lapa nav atkarīga no script.js (bez vietnes galvenes).
(function() {
    'use strict';
    var Q = new URLSearchParams(location.search);
    var MENESI = ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'];
    var STATUSI = { melnraksts: 'Melnraksts', nosutits: 'Nosūtīts', daleji: 'Daļēji apmaksāts', apmaksats: 'Apmaksāts' };
    var S = { r: null, rk: {}, labot: false, id: null, sag: null, mainits: false, epasts: false, sutita: null };
    var lapa, tbody, panelis;

    // ---------- palīgi ----------
    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }
    function api(method, url, body) {
        return fetch(url, {
            method: method, credentials: 'same-origin',
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body: body ? JSON.stringify(body) : undefined
        }).then(function(r) {
            return r.json().catch(function() { return {}; }).then(function(d) {
                if (!r.ok) { var e = new Error(d.error || 'Kļūda (' + r.status + ')'); e.status = r.status; throw e; }
                return d;
            });
        });
    }
    function pad(n) { return String(n).padStart(2, '0'); }
    function isoNo(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function sodien() { return isoNo(new Date()); }
    function plusDienas(iso, n) { var d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return isoNo(d); }
    function lvD(iso) { return iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) + '.' : ''; }
    function garais(iso) { return iso ? Number(iso.slice(0, 4)) + '. gada ' + Number(iso.slice(8, 10)) + '. ' + MENESI[Number(iso.slice(5, 7)) - 1] : ''; }
    function noLv(t) {
        var m = String(t).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
        if (!m) return null;
        var d = new Date(+m[3], +m[2] - 1, +m[1]);
        return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? isoNo(d) : null;
    }
    function skaitlis(t) { var n = parseFloat(String(t).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : Math.round(n * 100) / 100; }
    function eur(n) { return (Number(n) || 0).toFixed(2).replace('.', ','); }
    function summa(rindas) { return Math.round(rindas.reduce(function(a, x) { return a + (Number(x.s) || 0); }, 0) * 100) / 100; }
    function toast(msg, kluda) {
        var t = el('div', 'rk-toast' + (kluda ? ' rk-toast--kluda' : ''), msg);
        t.setAttribute('role', 'status');
        document.body.appendChild(t);
        setTimeout(function() { t.remove(); }, kluda ? 5000 : 3000);
    }
    function zinojums(teksts, saite) {
        document.body.textContent = '';
        var b = el('div', 'rk-zinojums');
        b.appendChild(el('p', '', teksts));
        if (saite) { var a = el('a', '', saite[1]); a.href = saite[0]; b.appendChild(a); }
        document.body.appendChild(b);
    }
    function statuss() {
        var r = S.r.rindas, apm = r.filter(function(x) { return x.p; }).length;
        var st = r.length && apm === r.length ? 'apmaksats' : apm ? 'daleji' : S.r.nosutits_at ? 'nosutits' : 'melnraksts';
        var kav = st !== 'apmaksats' && r.some(function(x) { return !x.p && x.d && x.d < sodien(); });
        return { st: st, kav: kav, apm: apm };
    }

    // ---------- lapa ----------
    function lauks(tag, cls, key, vieta) {
        var e = el(tag, cls, S.r[key] || '');
        if (S.labot) {
            e.contentEditable = 'true'; e.spellcheck = false; e.dataset.vieta = vieta || '';
            e.addEventListener('input', function() { S.r[key] = e.textContent.replace(/\s+/g, ' ').trim(); mainits(); atjaunot(); });
        }
        return e;
    }
    function dd(dl, k, v, id) { dl.appendChild(el('dt', '', k)); var d = el('dd', '', v); if (id) d.id = id; dl.appendChild(d); return d; }

    function zimetLapu() {
        lapa = el('main', 'rk-lapa');
        var g = el('header', 'rk-galva');
        var logo = el('img'); logo.src = 'assets/libertas-light.svg'; logo.alt = 'Libertas'; logo.width = 431; logo.height = 172;
        g.appendChild(logo);
        var v = el('div', 'rk-virsraksts');
        v.appendChild(el('div', 'rk-vards', 'Rēķins'));
        var nr = el('div', 'rk-nr', 'Nr. '); nr.appendChild(lauks('span', '', 'nr', '0000')); v.appendChild(nr);
        v.appendChild(el('div', 'rk-datums')).id = 'rk-t-datums';
        g.appendChild(v);
        lapa.appendChild(g);
        lapa.appendChild(el('div', 'rk-josla'));

        var sat = el('div', 'rk-saturs');
        var puses = el('section', 'rk-puses');
        var m = el('div');
        m.appendChild(el('div', 'rk-birka', 'Maksātājs'));
        m.appendChild(lauks('div', 'rk-maks-vards', 'm_vards', 'Vārds Uzvārds'));
        m.appendChild(lauks('div', '', 'm_talrunis', 'Tālrunis'));
        m.appendChild(lauks('div', '', 'm_epasts', 'E-pasts'));
        puses.appendChild(m);
        var d = el('div');
        d.appendChild(el('div', 'rk-birka', 'Rēķina dati'));
        var dl = el('dl', 'rk-dati');
        dd(dl, 'Rēķina datums', '', 'rk-t-datums-2');
        dd(dl, 'Pirmais maksājums līdz', '', 'rk-t-pirmais');
        dd(dl, 'Pēdējais maksājums līdz', '', 'rk-t-pedejais');
        dd(dl, 'Maksājumu skaits', '', 'rk-t-skaits');
        d.appendChild(dl);
        puses.appendChild(d);
        sat.appendChild(puses);

        var t = el('table', 'rk-tabula'); t.id = 'rk-tabula';
        var th = el('thead'), tr = el('tr');
        ['Nr.', 'Apraksts', 'Apmaksāt līdz', 'Summa, EUR'].forEach(function(h, i) { var c = el('th', i === 3 ? 'rk-summa' : '', h); if (i === 1) c.style.width = '50%'; tr.appendChild(c); });
        var ekr = el('th', 'rk-ekrans', S.labot ? 'Apmaksa' : ''); ekr.id = 'rk-ekrans-th'; tr.appendChild(ekr);
        th.appendChild(tr); t.appendChild(th);
        tbody = el('tbody');
        var kr = el('tr', 'rk-kurss'), kc = el('td'); kc.colSpan = 4;
        kc.appendChild(lauks('div', 'rk-kurss-nos', 'kurss', 'Kurss “…”'));
        kc.appendChild(lauks('div', 'rk-kurss-info', 'kurss_info', S.labot ? 'Papildu informācija (grupa, datumi) — neobligāti' : ''));
        kr.appendChild(kc); tbody.appendChild(kr);
        t.appendChild(tbody);
        sat.appendChild(t);

        var kopa = el('div', 'rk-kopa'), kk = el('div', 'rk-kopa-kaste');
        var r1 = el('div', 'r'); r1.appendChild(el('span', '', 'Starpsumma')); r1.appendChild(el('span')).id = 'rk-t-starp'; kk.appendChild(r1);
        var r2 = el('div', 'r'); r2.appendChild(el('span', '', 'PVN netiek piemērots')); r2.appendChild(el('span', '', '—')); kk.appendChild(r2);
        var r3 = el('div', 'r liela'); r3.appendChild(el('span', '', 'Kopā apmaksai')); r3.appendChild(el('span')).id = 'rk-t-kopa'; kk.appendChild(r3);
        var r4 = el('div', 'r rk-ekrans-r'); r4.id = 'rk-t-apm-r'; r4.appendChild(el('span', '', 'Apmaksāts')); r4.appendChild(el('span')).id = 'rk-t-apm'; kk.appendChild(r4);
        kopa.appendChild(kk); sat.appendChild(kopa);

        var ap = el('section', 'rk-apaksa');
        var mk = el('div', 'rk-maksajums');
        var b = el('div', 'rk-birka', 'Maksājuma informācija'); b.style.border = '0'; b.style.marginBottom = '6px'; mk.appendChild(b);
        var dl2 = el('dl', 'rk-dati');
        dd(dl2, 'Saņēmējs', S.rk.vards || '—'); dd(dl2, 'Banka', S.rk.banka || '—'); dd(dl2, 'Konta Nr.', S.rk.konts || '—');
        mk.appendChild(dl2);
        var mr = el('div', 'rk-merkis', 'Maksājuma mērķī lūdzu norādīt:'); mr.appendChild(el('br')); mr.appendChild(el('b')).id = 'rk-t-merkis';
        mk.appendChild(mr); ap.appendChild(mk);
        var pal = el('div', 'rk-paldies');
        pal.appendChild(el('div', 'rk-script', 'Paldies!'));
        pal.appendChild(el('div', 'rk-izd-vards', S.rk.vards || ''));
        pal.appendChild(el('div', 'rk-kontakti', [S.rk.talrunis, S.rk.epasts].filter(Boolean).join(' · ')));
        if (S.rk.adrese) pal.appendChild(el('div', 'rk-kontakti', S.rk.adrese));
        ap.appendChild(pal);
        sat.appendChild(ap);
        lapa.appendChild(sat);

        var kaje = el('footer', 'rk-kaje');
        kaje.appendChild(lauks('span', '', 'piezime', S.labot ? 'Piezīme (piem., derīgs bez paraksta)' : ''));
        kaje.appendChild(el('span', '', 'Libertas · valodu kursi'));
        lapa.appendChild(kaje);

        if (S.labot) {
            lapa.addEventListener('keydown', function(e) { if (e.key === 'Enter' && e.target.isContentEditable) { e.preventDefault(); e.target.blur(); } });
            lapa.addEventListener('paste', function(e) {
                if (!e.target.isContentEditable) return;
                e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
            });
        }
        return lapa;
    }

    function zimetRindas() {
        tbody.querySelectorAll('tr.rk-poz').forEach(function(x) { x.remove(); });
        var radit = S.labot || S.r.rindas.some(function(x) { return x.p; });
        document.getElementById('rk-ekrans-th').style.display = radit ? '' : 'none';
        S.r.rindas.forEach(function(x, i) {
            var tr = el('tr', 'rk-poz');
            tr.appendChild(el('td', '', String(i + 1)));
            var a = el('td', 'rk-apr', x.a), d = el('td', 'rk-termins', lvD(x.d)), s = el('td', 'rk-summa', eur(x.s));
            tr.appendChild(a); tr.appendChild(d); tr.appendChild(s);
            if (S.labot) {
                [a, d, s].forEach(function(c) { c.contentEditable = 'true'; c.spellcheck = false; });
                d.dataset.vieta = 'dd.mm.gggg.';
                a.addEventListener('input', function() { x.a = a.textContent.trim(); mainits(); });
                d.addEventListener('input', function() {
                    var t = d.textContent.trim(), iso = noLv(t);
                    d.setAttribute('aria-invalid', t && !iso ? 'true' : 'false');
                    x.d = iso; x._slikts = !!(t && !iso); mainits(); atjaunot();
                });
                d.addEventListener('blur', function() { if (x.d) d.textContent = lvD(x.d); });
                s.addEventListener('input', function() { x.s = skaitlis(s.textContent); mainits(); atjaunot(); });
                s.addEventListener('blur', function() { s.textContent = eur(x.s); });
            }
            var e = el('td', 'rk-ekrans');
            if (S.labot) {
                var lab = el('label', 'rk-apm' + (x.p ? ' rk-apm--ja' : ''));
                var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!x.p; cb.setAttribute('aria-label', 'Maksājums ' + (i + 1) + ' apmaksāts');
                lab.appendChild(cb);
                if (!x.p) lab.appendChild(document.createTextNode('nav'));
                e.appendChild(lab);
                if (x.p) {
                    var di = el('input'); di.type = 'date'; di.value = x.p; di.setAttribute('aria-label', 'Apmaksas datums');
                    di.style.cssText = 'font:inherit;font-size:12px;border:1px solid var(--c-line);border-radius:4px;padding:1px 2px';
                    di.addEventListener('change', function() { if (di.value) { x.p = di.value; saglabat(true); } });
                    e.appendChild(di);
                }
                cb.addEventListener('change', function() { x.p = cb.checked ? sodien() : null; zimetRindas(); atjaunot(); saglabat(true); });
                var del = el('button', 'rk-dzest', '×'); del.type = 'button'; del.title = 'Dzēst rindu'; del.setAttribute('aria-label', 'Dzēst rindu ' + (i + 1));
                del.addEventListener('click', function() { S.r.rindas.splice(i, 1); mainits(); zimetRindas(); atjaunot(); });
                e.appendChild(del);
            } else if (x.p) {
                var z = el('span', 'rk-apm-zime', '✓'); z.title = 'Apmaksāts ' + lvD(x.p); z.setAttribute('aria-label', z.title);
                e.appendChild(z);
            }
            if (radit) tr.appendChild(e);
            if (!x.p && x.d && x.d < sodien()) tr.classList.add('rk-poz--kavets');
            tbody.appendChild(tr);
        });
    }

    function atjaunot() {
        var r = S.r.rindas, kopa = summa(r);
        var apm = summa(r.filter(function(x) { return x.p; }));
        var dat = r.map(function(x) { return x.d; }).filter(Boolean).sort();
        document.getElementById('rk-t-starp').textContent = eur(kopa) + ' EUR';
        document.getElementById('rk-t-kopa').textContent = eur(kopa) + ' EUR';
        document.getElementById('rk-t-apm').textContent = eur(apm) + ' / ' + eur(kopa) + ' EUR';
        document.getElementById('rk-t-apm-r').style.display = apm ? '' : 'none';
        document.getElementById('rk-t-datums').textContent = garais(S.r.datums);
        document.getElementById('rk-t-datums-2').textContent = lvD(S.r.datums);
        document.getElementById('rk-t-pirmais').textContent = dat.length ? lvD(dat[0]) : '—';
        document.getElementById('rk-t-pedejais').textContent = dat.length ? lvD(dat[dat.length - 1]) : '—';
        document.getElementById('rk-t-skaits').textContent = String(r.length);
        document.getElementById('rk-t-merkis').textContent = 'Rēķins Nr. ' + (S.r.nr || '');
        document.getElementById('rk-tabula').classList.toggle('rk-blivs', r.length > 12);
        document.title = 'Libertas_Rēķins Nr. ' + (S.r.nr || '');
        atjPogu();
    }

    function merogs() {
        if (!lapa) return;
        var w = Math.min(1, (document.documentElement.clientWidth - 32) / 794);
        lapa.style.setProperty('--rk-merogs', String(Math.max(0.3, w)));
    }

    // ---------- redaktora panelis ----------
    function mainits() { S.mainits = true; atjPogu(); }
    var sgPoga = null;
    function atjPogu() {
        if (!sgPoga) return;
        sgPoga.textContent = S.mainits || !S.id ? 'Saglabāt' : 'Saglabāts ✓';
        sgPoga.disabled = !S.mainits && !!S.id;
    }
    function fs(leg) { var f = el('fieldset'); f.appendChild(el('legend', '', leg)); return f; }
    function poga(teksts, cls, fn) { var b = el('button', 'rk-poga' + (cls ? ' ' + cls : ''), teksts); b.type = 'button'; b.addEventListener('click', fn); return b; }
    function ievade(f, label, type, value, attrs) {
        var id = 'rk-' + Math.random().toString(36).slice(2, 8);
        var l = el('label', '', label); l.htmlFor = id; f.appendChild(l);
        var i = el('input'); i.type = type; i.id = id; i.value = value == null ? '' : value;
        Object.keys(attrs || {}).forEach(function(k) { i.setAttribute(k, attrs[k]); });
        f.appendChild(i); return i;
    }

    var GEN = null; // ģeneratora lauku vērtības saglabājas starp pārzīmēšanām
    function zimetPaneli() {
        panelis.textContent = '';
        var at = el('a', 'rk-atpakal', '← Administrācija'); at.href = 'admin.html#rekini'; panelis.appendChild(at);
        panelis.appendChild(el('h2', '', S.id ? 'Rēķins Nr. ' + S.r.nr : 'Jauns rēķins'));
        var st = statuss();
        panelis.appendChild(el('span', 'rk-statuss rk-statuss--' + st.st, STATUSI[st.st] + (st.st === 'daleji' ? ' (' + st.apm + '/' + S.r.rindas.length + ')' : '')));
        if (st.kav) panelis.appendChild(el('span', 'rk-statuss rk-statuss--kavets', 'Kavēts maksājums')).style.marginLeft = '6px';
        var inf = [];
        if (S.r.nosutits_at) inf.push('Nosūtīts ' + new Date(S.r.nosutits_at).toLocaleString('lv-LV', { dateStyle: 'short', timeStyle: 'short' }) + ' uz ' + (S.r.nosutits_uz || ''));
        if (S.r.enrollment_id) inf.push('Saistīts ar pieteikumu — pēc pirmā maksājuma statuss kļūst «Uzņemts», kad viss apmaksāts — «Apmaksāts».');
        if (!S.id) inf.push('Vēl nav saglabāts.');
        panelis.appendChild(el('p', 'rk-piez', inf.join(' ')));

        sgPoga = poga('Saglabāt', 'rk-poga--galvena', function() { saglabat(); });
        atjPogu();
        panelis.appendChild(sgPoga);

        // Nosūtīšana
        var f1 = fs('Nosūtīt klientam');
        var ep = ievade(f1, 'Maksātāja e-pasts', 'email', S.r.m_epasts || '', { autocomplete: 'off' });
        var sb = poga(S.r.nosutits_at ? 'Nosūtīt vēlreiz' : 'Nosūtīt rēķinu', 'rk-poga--akcents', function() { nosutit(ep.value.trim()); });
        if (!S.epasts) { sb.disabled = true; f1.appendChild(el('p', 'rk-piez', 'E-pasta sūtīšana serverī nav iestatīta.')); }
        f1.appendChild(sb);
        f1.appendChild(el('p', 'rk-piez', 'Klients saņems e-pastu ar summu, rekvizītiem un saiti uz šo rēķinu (to var saglabāt kā PDF).'));
        panelis.appendChild(f1);

        // Datums
        var f2 = fs('Rēķins');
        var dt = ievade(f2, 'Rēķina datums', 'date', S.r.datums);
        dt.addEventListener('change', function() { if (dt.value) { S.r.datums = dt.value; mainits(); atjaunot(); } });
        f2.appendChild(el('p', 'rk-piez', 'Numuru, maksātāju, kursu un rindas labo tieši uz rēķina, uzklikšķinot uz teksta.'));
        panelis.appendChild(f2);

        // Maksājumu grafiks
        var nod = (S.sag && S.sag.nodarbibas) || [];
        if (!GEN) GEN = { kopsumma: S.sag ? S.sag.summa : summa(S.r.rindas) || '', skaits: 1, apraksts: 'Kursa maksa', veids: 'viens', sakums: plusDienas(sodien(), 7), dienas: [2, 4] };
        var f3 = fs('Maksājumu grafiks');
        var ks = ievade(f3, 'Kopsumma (EUR)', 'number', GEN.kopsumma, { min: '0', step: '0.01' });
        var sk = ievade(f3, 'Maksājumu skaits', 'number', GEN.skaits, { min: '1', max: '60' });
        var apr = ievade(f3, 'Apraksts rindā', 'text', GEN.apraksts);
        var rad = el('div', 'rk-radio'); rad.appendChild(el('label', '', 'Termiņi')).style.fontWeight = '600';
        var veidi = [['viens', 'Ik pēc 7 dienām no datuma'], ['dienas', 'Izvēlētajās nedēļas dienās']];
        if (nod.length) veidi.unshift(['grupa', 'Grupas nodarbību dienās (' + nod.length + ')']);
        veidi.forEach(function(v) {
            var l = el('label'), r = el('input'); r.type = 'radio'; r.name = 'rk-veids'; r.value = v[0]; r.checked = GEN.veids === v[0];
            r.addEventListener('change', function() { GEN.veids = v[0]; if (v[0] === 'grupa') { GEN.skaits = nod.length; GEN.apraksts = 'Maksājums par nodarbību'; } zimetPaneli(); });
            l.appendChild(r); l.appendChild(document.createTextNode(v[1])); rad.appendChild(l);
        });
        f3.appendChild(rad);
        var sa = null, dienas = el('div', 'rk-dienas');
        if (GEN.veids !== 'grupa') sa = ievade(f3, 'Pirmais termiņš', 'date', GEN.sakums);
        if (GEN.veids === 'dienas') {
            [[1, 'P'], [2, 'O'], [3, 'T'], [4, 'C'], [5, 'Pk'], [6, 'S'], [0, 'Sv']].forEach(function(x) {
                var l = el('label'), c = el('input'); c.type = 'checkbox'; c.value = x[0]; c.checked = GEN.dienas.indexOf(x[0]) >= 0;
                l.appendChild(c); l.appendChild(document.createTextNode(x[1])); dienas.appendChild(l);
            });
            f3.appendChild(dienas);
        }
        f3.appendChild(poga('Izveidot rindas', 'rk-poga--galvena', function() {
            GEN.kopsumma = skaitlis(ks.value); GEN.skaits = Math.max(1, Math.min(60, parseInt(sk.value, 10) || 1)); GEN.apraksts = apr.value.trim() || 'Maksājums';
            if (sa) GEN.sakums = sa.value;
            if (GEN.veids === 'dienas') GEN.dienas = [].map.call(dienas.querySelectorAll('input:checked'), function(c) { return +c.value; });
            if (S.r.rindas.some(function(x) { return x.p; }) && !confirm('Dažas rindas jau atzīmētas kā apmaksātas. Aizstāt visas rindas?')) return;
            generet();
        }));
        f3.appendChild(poga('+ Pievienot vienu rindu', '', function() {
            var ped = S.r.rindas[S.r.rindas.length - 1];
            S.r.rindas.push({ a: ped ? ped.a : 'Maksājums', d: ped && ped.d ? plusDienas(ped.d, 7) : null, s: ped ? ped.s : 0, p: null });
            mainits(); zimetRindas(); atjaunot();
        }));
        panelis.appendChild(f3);

        // Apmaksa
        var f4 = fs('Apmaksa');
        f4.appendChild(el('p', 'rk-piez', 'Atzīmē katru maksājumu rēķina kolonnā «Apmaksa» — saglabājas uzreiz.'));
        f4.appendChild(poga('Atzīmēt visu kā apmaksātu', '', function() {
            if (!S.r.rindas.length) return;
            S.r.rindas.forEach(function(x) { if (!x.p) x.p = sodien(); });
            zimetRindas(); atjaunot(); saglabat(true);
        }));
        panelis.appendChild(f4);

        panelis.appendChild(poga('Drukāt / saglabāt PDF', '', function() { window.print(); }));
        if (S.r.token) {
            var kl = el('a', 'rk-poga', 'Klienta skats ↗'); kl.href = 'rekins.html?k=' + S.r.token; kl.target = '_blank'; kl.rel = 'noopener'; panelis.appendChild(kl);
        }
        if (S.id) panelis.appendChild(poga('Dzēst rēķinu', 'rk-poga--bistama', dzest));
    }

    function generet() {
        var n = GEN.skaits, nod = (S.sag && S.sag.nodarbibas) || [], dat = [];
        if (GEN.veids === 'grupa') { dat = nod.slice(0, n); n = dat.length; }
        else {
            if (!GEN.sakums) return toast('Norādi pirmo termiņu.', true);
            var d = new Date(GEN.sakums + 'T12:00'), dr = 0;
            var dn = GEN.veids === 'dienas' && GEN.dienas.length ? GEN.dienas : null;
            while (dat.length < n && dr++ < 2000) {
                if (!dn || dn.indexOf(d.getDay()) >= 0) { dat.push(isoNo(d)); if (!dn) { d.setDate(d.getDate() + 7); continue; } }
                d.setDate(d.getDate() + 1);
            }
        }
        var centi = Math.round(GEN.kopsumma * 100), viens = Math.floor(centi / n), atl = centi - viens * n;
        S.r.rindas = dat.map(function(iso, i) {
            return { a: n > 1 ? GEN.apraksts + ' ' + (i + 1) + '/' + n : GEN.apraksts, d: iso, s: (viens + (i === n - 1 ? atl : 0)) / 100, p: null };
        });
        mainits(); zimetRindas(); atjaunot();
    }

    // ---------- saglabāšana / sūtīšana ----------
    function dati() {
        return {
            nr: S.r.nr, datums: S.r.datums, m_vards: S.r.m_vards || '', m_talrunis: S.r.m_talrunis || '', m_epasts: S.r.m_epasts || '',
            kurss: S.r.kurss || '', kurss_info: S.r.kurss_info || '', piezime: S.r.piezime || '',
            rindas: S.r.rindas.map(function(x) { return { a: x.a, d: x.d, s: x.s, p: x.p }; })
        };
    }
    var sagl = null;
    function saglabat(kluss) {
        if (S.r.rindas.some(function(x) { return x._slikts; })) { toast('Izlabo termiņa datumu (formāts dd.mm.gggg.).', true); return Promise.reject(); }
        if (!S.r.nr) { toast('Norādi rēķina numuru.', true); return Promise.reject(); }
        var b = dati();
        if (!S.id) b.enrollment_id = S.r.enrollment_id || null;
        sagl = (S.id ? api('PUT', '/api/admin/rekini/' + S.id, b) : api('POST', '/api/admin/rekini', b)).then(function(d) {
            var jauns = !S.id;
            S.id = d.rekins.id;
            ['token', 'nosutits_at', 'nosutits_uz', 'enrollment_id', 'apmaksats_at'].forEach(function(k) { S.r[k] = d.rekins[k]; });
            S.mainits = false;
            if (jauns) history.replaceState(null, '', 'rekins.html?id=' + S.id);
            toast(kluss ? 'Apmaksa saglabāta.' : 'Saglabāts.');
            zimetPaneli();
        }).catch(function(e) { if (e) toast(e.message, true); throw e; });
        return sagl;
    }
    function nosutit(uz) {
        if (!uz) return toast('Ieraksti maksātāja e-pastu.', true);
        if (!S.r.rindas.length) return toast('Rēķinā nav rindu.', true);
        if (!confirm('Nosūtīt rēķinu Nr. ' + S.r.nr + ' (' + eur(summa(S.r.rindas)) + ' EUR) uz ' + uz + '?')) return;
        var p = S.mainits || !S.id ? saglabat(true) : Promise.resolve();
        p.then(function() { return api('POST', '/api/admin/rekini/' + S.id + '/sutit', { epasts: uz }); }).then(function(d) {
            S.r.nosutits_at = d.rekins.nosutits_at; S.r.nosutits_uz = d.rekins.nosutits_uz;
            toast('Rēķins nosūtīts uz ' + uz + '.'); zimetPaneli();
        }).catch(function(e) { if (e) toast(e.message, true); });
    }
    function dzest() {
        if (!confirm('Dzēst rēķinu Nr. ' + S.r.nr + '? To nevarēs atjaunot, un klienta saite pārstās darboties.')) return;
        api('DELETE', '/api/admin/rekini/' + S.id).then(function() { S.mainits = false; location.href = 'admin.html#rekini'; })
            .catch(function(e) { toast(e.message, true); });
    }

    // ---------- starts ----------
    function paradit() {
        document.body.textContent = '';
        if (S.labot) { panelis = el('aside', 'rk-panelis'); panelis.setAttribute('aria-label', 'Rēķina iestatījumi'); document.body.appendChild(panelis); }
        document.body.appendChild(zimetLapu());
        if (!S.labot) {
            var j = el('div', 'rk-klienta-josla');
            j.appendChild(poga('Saglabāt PDF / drukāt', 'rk-poga--galvena', function() { window.print(); }));
            document.body.appendChild(j);
        }
        if (S.labot) zimetPaneli();
        zimetRindas(); atjaunot(); merogs();
        window.addEventListener('resize', merogs);
    }
    function kluda(e) {
        if (e.status === 401 || e.status === 403) zinojums('Rēķinu redaktors pieejams tikai administratoram.', ['/auth/google?return=' + encodeURIComponent(location.pathname + location.search), 'Ienākt ar Google']);
        else zinojums(e.message || 'Kļūda', ['admin.html', 'Uz administrāciju']);
    }

    if (Q.get('k')) {
        if (!/^[0-9a-f]{48}$/.test(Q.get('k'))) return zinojums('Nederīga rēķina saite.');
        api('GET', '/api/rekins/' + Q.get('k')).then(function(d) { S.r = d.rekins; S.rk = d.rekviziti || {}; paradit(); })
            .catch(function(e) { zinojums(e.status === 404 ? 'Rēķins nav atrasts. Iespējams, tas ir atsaukts.' : (e.message || 'Kļūda')); });
        return;
    }

    S.labot = true;
    window.addEventListener('beforeunload', function(e) { if (S.mainits) { e.preventDefault(); e.returnValue = ''; } });
    var id = parseInt(Q.get('id'), 10);
    if (id > 0) {
        api('GET', '/api/admin/rekini/' + id).then(function(d) {
            S.id = id; S.r = d.rekins; S.rk = d.rekviziti || {}; S.epasts = !!d.epasts;
            if (!S.r.enrollment_id) return paradit();
            return api('GET', '/api/admin/rekini/sagatave?pieteikums=' + S.r.enrollment_id)
                .then(function(x) { S.sag = x.sagatave; }, function() {}).then(paradit);
        }).catch(kluda);
        return;
    }
    var enr = parseInt(Q.get('pieteikums'), 10);
    Promise.all([api('GET', '/api/admin/rekini'), enr > 0 ? api('GET', '/api/admin/rekini/sagatave?pieteikums=' + enr) : null]).then(function(d) {
        S.rk = d[0].rekviziti || {}; S.epasts = !!d[0].epasts;
        var sg = d[1] && d[1].sagatave;
        S.sag = sg || null;
        S.r = {
            nr: d[0].nakamais_nr, datums: sodien(), piezime: S.rk.piezime || 'Rēķins sagatavots elektroniski un ir derīgs bez paraksta.',
            m_vards: sg ? sg.m_vards : '', m_talrunis: sg ? sg.m_talrunis : '', m_epasts: sg ? sg.m_epasts : '',
            kurss: sg ? sg.kurss : '', kurss_info: sg ? sg.kurss_info : '', enrollment_id: sg ? sg.enrollment_id : null,
            rindas: [{
                a: 'Kursa maksa' + (sg && sg.atlaide ? ' (atlaide −' + sg.atlaide.proc + ' %, kods ' + sg.atlaide.kods + ')' : ''),
                d: sg && sg.nodarbibas.length ? sg.nodarbibas[0] : plusDienas(sodien(), 7), s: sg ? sg.summa : 0, p: null
            }]
        };
        S.mainits = true;
        if (!S.rk.konts) toast('Rekvizīti nav aizpildīti: administrācijā «Rēķini → Rekvizīti».', true);
        paradit();
    }).catch(kluda);
})();
