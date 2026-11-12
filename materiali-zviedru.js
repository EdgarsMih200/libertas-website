/* Zviedru A1 — Ziemassvētki (materiali-zviedru-ziemassvetki.html): uzdevumi 4–6 (rätt/fel, saliec teikumu, trūkstošie vārdi)
   un å/ä/ö pogas. Izmanto norvēģu materiāla klases (nor-pp, nor-teikums, nor-banka, nor-burti). Lādē PIRMS materiali.js,
   lai tas pievienotu skaļruņa pogas jaunajiem [data-sv] elementiem. Lapu un šo failu Worker atdod tikai pieslēgtiem lietotājiem */
(function () {
    function jaukt(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function izrunat(t) { if (window.MAT_RUNA) window.MAT_RUNA(t, 'sv'); }
    function el(tag, cls, teksts) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (teksts != null) e.textContent = teksts;
        return e;
    }

    /* ---------- 4. Rätt eller fel? ---------- */
    var RF = [
        ['Elsa får en bok på svenska.', true, 'Oskar ger Elsa en bok på svenska.'],
        ['Lucia är den 24 december.', false, 'Lucia är den 13 december.'],
        ['Elsa ger Oskar pepparkakor.', true, 'Elsa ger Oskar pepparkakor.'],
        ['Klockan tre tittar många på Kalle Anka.', true, ''],
        ['Tomten kommer på nyårsafton.', false, 'Tomten kommer på julafton.'],
        ['På tjugondag Knut dansar man ut julen.', true, '']
    ];
    var rf = document.getElementById('sv-rf');
    if (rf) RF.forEach(function (r) {
        var li = el('li', 'nor-pp');
        var teik = el('span', 'nor-pp-teikums');
        teik.setAttribute('data-sv', r[0]);
        var t = el('span', null, r[0]); t.lang = 'sv';
        teik.appendChild(t);
        var opc = el('span', 'nor-opcijas');
        var atsauksme = el('p', 'nor-atsauksme');
        atsauksme.setAttribute('aria-live', 'polite');
        [['rätt', true], ['fel', false]].forEach(function (o) {
            var b = el('button', 'nor-opcija', o[0]);
            b.type = 'button'; b.lang = 'sv';
            b.addEventListener('click', function () {
                if (li.classList.contains('nor-atbildets')) return;
                li.classList.add('nor-atbildets');
                var ok = o[1] === r[1];
                b.classList.add(ok ? 'nor-pareizi' : 'nor-nepareizi');
                atsauksme.className = 'nor-atsauksme ' + (ok ? 'nor-ok' : 'nor-slikti');
                if (ok) atsauksme.textContent = 'Pareizi!' + (r[2] && !r[1] ? ' ' + r[2] : '');
                else atsauksme.textContent = 'Nepareizi. ' + (r[1] ? 'Šis teikums ir patiess (rätt).' : 'Pareizi: ' + r[2]);
            });
            opc.appendChild(b);
        });
        li.appendChild(teik); li.appendChild(opc); li.appendChild(atsauksme);
        rf.appendChild(li);
    });

    /* ---------- 5. Saliec teikumu (V2: darbības vārds otrajā vietā) ---------- */
    var SEC = [
        { v: ['Jag', 'vill', 'ha', 'en', 'bok'], ok: ['jag vill ha en bok'], beigas: '.' },
        { v: ['På', 'julafton', 'äter', 'vi', 'skinka'], ok: ['på julafton äter vi skinka', 'vi äter skinka på julafton'], beigas: '.' },
        { v: ['Klockan', 'tre', 'tittar', 'vi', 'på', 'Kalle Anka'], ok: ['klockan tre tittar vi på kalle anka', 'vi tittar på kalle anka klockan tre'], beigas: '.' },
        { v: ['I', 'dag', 'är', 'det', 'kallt'], ok: ['i dag är det kallt', 'det är kallt i dag'], beigas: '.' }
    ];
    var sec = document.getElementById('sv-seciba');
    if (sec) SEC.forEach(function (o) {
        var li = el('li', 'nor-teikums');
        var atb = el('div', 'nor-atbilde'); atb.lang = 'sv'; atb.setAttribute('aria-label', 'Tavs teikums');
        var kraj = el('div', 'nor-krajums'); kraj.lang = 'sv';
        var darb = el('div', 'uzd-darbibas');
        var parb = el('button', 'btn-cta uzd-parbaudit', 'Pārbaudīt'); parb.type = 'button';
        var atkal = el('button', 'mat-poga-maza', 'Sākt no jauna'); atkal.type = 'button';
        var rez = el('span', 'uzd-rezultats'); rez.setAttribute('aria-live', 'polite');
        darb.appendChild(parb); darb.appendChild(atkal); darb.appendChild(rez);
        var gatavs = false;
        function aizpildit() {
            atb.innerHTML = ''; kraj.innerHTML = '';
            var s = jaukt(o.v);
            if (s.join() === o.v.join()) s.reverse();
            s.forEach(function (v) {
                var b = el('button', 'nor-vards', v); b.type = 'button';
                b.addEventListener('click', function () {
                    if (gatavs) return;
                    (b.parentNode === kraj ? atb : kraj).appendChild(b);
                    atb.classList.remove('nor-ok', 'nor-slikti'); rez.textContent = '';
                });
                kraj.appendChild(b);
            });
        }
        aizpildit();
        parb.addEventListener('click', function () {
            if (gatavs) return;
            if (kraj.children.length) { rez.className = 'uzd-rezultats nor-slikti-teksts'; rez.textContent = 'Izmanto visus vārdus!'; return; }
            var teik = [].map.call(atb.children, function (b) { return b.textContent; }).join(' ').toLowerCase();
            if (o.ok.indexOf(teik) !== -1) {
                gatavs = true;
                atb.classList.add('nor-ok');
                atb.appendChild(el('b', null, o.beigas));
                var t = teik.charAt(0).toUpperCase() + teik.slice(1).replace('kalle anka', 'Kalle Anka') + o.beigas;
                rez.className = 'uzd-rezultats visi-pareizi'; rez.textContent = 'Pareizi! Bra jobbat!';
                parb.disabled = atkal.disabled = true;
                izrunat(t);
            } else {
                atb.classList.add('nor-slikti');
                rez.className = 'uzd-rezultats nor-slikti-teksts';
                rez.textContent = 'Vēl nav gluži — vai darbības vārds ir otrajā vietā?';
            }
        });
        atkal.addEventListener('click', function () { if (!gatavs) { aizpildit(); rez.textContent = ''; atb.classList.remove('nor-slikti'); } });
        li.appendChild(atb); li.appendChild(kraj); li.appendChild(darb);
        sec.appendChild(li);
    });

    /* ---------- 6. Trūkstošie vārdi (å/ä/ö jābūt pareiziem) ---------- */
    var TR = [
        ['På julafton äter vi', 'julbord', '.'],
        ['Lucia är den 13', 'december', '.'],
        ['Tomten kommer med många', 'julklappar', '.'],
        ['Det är kallt och det', 'snöar', '.'],
        ['Vi dricker varm', 'glögg', '.'],
        ['Klockan tre tittar vi på Kalle', 'Anka', '!']
    ];
    var tr = document.getElementById('sv-trukst');
    var banka = document.getElementById('sv-banka');
    if (tr && banka) {
        jaukt(TR.map(function (x) { return x[1]; })).forEach(function (v) { var li = el('li', null, v); li.lang = 'sv'; banka.appendChild(li); });
        TR.forEach(function (x, i) {
            var li = el('li'); li.lang = 'sv';
            var lauks = el('input', 'uzd-lauks uzd-lauks--m');
            lauks.type = 'text'; lauks.autocomplete = 'off'; lauks.spellcheck = false;
            lauks.setAttribute('autocapitalize', 'off');
            lauks.setAttribute('aria-label', (i + 1) + '. teikuma trūkstošais vārds');
            lauks.dataset.a = x[1].toLowerCase();
            li.appendChild(document.createTextNode(x[0] + ' '));
            li.appendChild(lauks);
            li.appendChild(document.createTextNode(x[2]));
            tr.appendChild(li);
        });
        var rez = document.getElementById('sv-trukst-rez');
        function parbaudit() {
            var n = 0, lauki = tr.querySelectorAll('input');
            lauki.forEach(function (l) {
                var v = l.value.trim().toLowerCase().replace(/\s+/g, ' ');
                var ok = v === l.dataset.a;
                l.classList.toggle('pareizi', ok);
                l.classList.toggle('nepareizi', !ok && v !== '');
                if (ok) { n++; l.readOnly = true; }
            });
            var visi = n === lauki.length;
            rez.className = 'uzd-rezultats' + (visi ? ' visi-pareizi' : '');
            rez.textContent = visi ? 'Viss pareizi! Bra jobbat!' : 'Pareizi: ' + n + ' no ' + lauki.length + '. Pārbaudi sarkanos — vai å, ä, ö ir savās vietās?';
        }
        document.getElementById('sv-trukst-parbaudit').addEventListener('click', parbaudit);
        tr.addEventListener('input', function (e) { e.target.classList.remove('pareizi', 'nepareizi'); });
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') parbaudit(); });
    }

    /* ---------- å/ä/ö pogas: ieraksta burtu pēdējā aktīvajā laukā tajā pašā uzdevumā ---------- */
    document.querySelectorAll('[data-burti]').forEach(function (rinda) {
        var bloks = rinda.closest('.uzdevums-bloks');
        var pedejais = null;
        bloks.addEventListener('focusin', function (e) { if (e.target.tagName === 'INPUT') pedejais = e.target; });
        rinda.querySelectorAll('[data-l]').forEach(function (b) {
            b.setAttribute('aria-label', 'Ievietot burtu ' + b.dataset.l);
            b.addEventListener('mousedown', function (e) { e.preventDefault(); }); // fokuss paliek laukā
            b.addEventListener('click', function () {
                var l = pedejais || bloks.querySelector('input:not([readonly])');
                if (!l || l.readOnly) return;
                var s = l.selectionStart != null ? l.selectionStart : l.value.length;
                var e = l.selectionEnd != null ? l.selectionEnd : s;
                l.value = l.value.slice(0, s) + b.dataset.l + l.value.slice(e);
                l.focus();
                l.setSelectionRange(s + 1, s + 1);
                l.classList.remove('pareizi', 'nepareizi');
            });
        });
    });
})();
