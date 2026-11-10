// Noderīgi materiāli: izruna, vārdu kartītes, dialogs, uzdevumu pārbaude, saturs, filtri
(function () {
    var runaIr = 'speechSynthesis' in window;
    var balss = null;

    // IZRUNA (pārlūka runas sintēze): data-es → es-ES, data-en → en-GB
    var VALODAS = { es: 'es-ES', en: 'en-GB' };
    var balsis = {};

    function izveletiesBalsis() {
        var visas = speechSynthesis.getVoices();
        Object.keys(VALODAS).forEach(function (v) {
            balsis[v] = visas.find(function (b) { return b.lang === VALODAS[v]; }) ||
                        visas.find(function (b) { return b.lang && b.lang.indexOf(v) === 0; }) || null;
        });
    }

    // Atgriež { teksts, valoda } no elementa ar data-es vai data-en
    function runasDati(el) {
        if (el.hasAttribute('data-en')) return { teksts: el.getAttribute('data-en'), valoda: 'en' };
        return { teksts: el.getAttribute('data-es'), valoda: 'es' };
    }

    function izteikums(d) {
        var u = new SpeechSynthesisUtterance(d.teksts);
        u.lang = VALODAS[d.valoda];
        u.rate = 0.85;
        if (balsis[d.valoda]) u.voice = balsis[d.valoda];
        return u;
    }

    if (runaIr) {
        izveletiesBalsis();
        speechSynthesis.addEventListener('voiceschanged', izveletiesBalsis);

        document.querySelectorAll('[data-es], [data-en]').forEach(function (el) {
            var d = runasDati(el);
            var poga = document.createElement('button');
            poga.type = 'button';
            poga.className = 'runat-poga';
            poga.textContent = '🔊';
            poga.setAttribute('aria-label', 'Klausīties: ' + d.teksts);
            poga.title = 'Klausīties izrunu';
            poga.addEventListener('click', function (e) {
                e.stopPropagation();
                speechSynthesis.cancel();
                speechSynthesis.speak(izteikums(d));
            });
            var vieta = el.querySelector('[data-runa-vieta]');
            if (vieta) vieta.appendChild(poga);
            else el.insertBefore(poga, el.firstChild);
        });
    }

    // VĀRDU KARTĪTES: klikšķis apgriež kartīti
    document.querySelectorAll('.vards-karte').forEach(function (k) {
        k.addEventListener('click', function () {
            var apgriezta = k.classList.toggle('apgriezta');
            k.setAttribute('aria-pressed', apgriezta ? 'true' : 'false');
        });
    });

    // DIALOGS: tulkojums un visa dialoga atskaņošana
    var cats = document.querySelector('.cats');
    var tulk = document.getElementById('radit-tulkojumu');
    if (cats && tulk) {
        tulk.addEventListener('change', function () {
            cats.classList.toggle('rada-tulkojumu', tulk.checked);
        });
    }
    var dialogaPoga = document.getElementById('klausities-dialogu');
    if (cats && dialogaPoga && runaIr) {
        dialogaPoga.hidden = false;
        dialogaPoga.addEventListener('click', function () {
            speechSynthesis.cancel();
            var replikas = cats.querySelectorAll('.replika');
            replikas.forEach(function (r, i) {
                var u = izteikums(runasDati(r));
                // Pārmaiņus divas balss augstuma variācijas, lai atšķirtu runātājus
                u.pitch = r.classList.contains('replika--p') ? 0.8 : 1.15;
                u.onstart = function () {
                    replikas.forEach(function (x) { x.classList.remove('runa'); });
                    r.classList.add('runa');
                };
                if (i === replikas.length - 1) u.onend = function () { r.classList.remove('runa'); };
                speechSynthesis.speak(u);
            });
        });
    }

    // UZDEVUMI: atbilžu pārbaude (bez garumzīmēm, pieturzīmēm un lielajiem burtiem)
    function normalizet(s) {
        return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/['’]/g, '')
            .replace(/[¡!¿?.,;:—–-]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Uzslava, kad viss pareizi (body data-uzslava, citādi spāniski)
    var uzslava = document.body.getAttribute('data-uzslava') || '¡Muy bien!';

    document.querySelectorAll('.uzdevums-bloks').forEach(function (bloks) {
        var poga = bloks.querySelector('.uzd-parbaudit');
        var rez = bloks.querySelector('.uzd-rezultats');
        var lauki = bloks.querySelectorAll('.uzd-lauks');
        if (!poga) return;

        function parbaudit() {
            var pareizi = 0;
            lauki.forEach(function (l) {
                var atbildes = l.getAttribute('data-atbilde').split('|').map(normalizet);
                var ok = atbildes.indexOf(normalizet(l.value)) !== -1;
                l.classList.toggle('pareizi', ok);
                l.classList.toggle('nepareizi', !ok);
                if (ok) pareizi++;
            });
            var visi = pareizi === lauki.length;
            rez.textContent = pareizi + ' / ' + lauki.length + ' pareizi' + (visi ? ' — ' + uzslava + ' 🎉' : '');
            rez.classList.toggle('visi-pareizi', visi);
        }

        poga.addEventListener('click', parbaudit);
        lauki.forEach(function (l) {
            l.addEventListener('input', function () { l.classList.remove('pareizi', 'nepareizi'); });
            l.addEventListener('keydown', function (e) { if (e.key === 'Enter') parbaudit(); });
        });
    });

    // SATURS: izceļ sadaļu, kas pašlaik redzama
    var saites = document.querySelectorAll('.mat-saturs a');
    if (saites.length && 'IntersectionObserver' in window) {
        var pec = {};
        saites.forEach(function (a) { pec[a.getAttribute('href').slice(1)] = a; });
        var nov = new IntersectionObserver(function (ieraksti) {
            ieraksti.forEach(function (e) {
                if (!e.isIntersecting) return;
                saites.forEach(function (a) { a.classList.remove('aktivs'); });
                var a = pec[e.target.id];
                if (a) a.classList.add('aktivs');
            });
        }, { rootMargin: '-30% 0px -60% 0px' });
        document.querySelectorAll('.mat-sadala[id]').forEach(function (s) { nov.observe(s); });
    }

    // FILTRI materiālu sarakstā (parādās, kad ir vairāk nekā viena valoda)
    var filtri = document.querySelector('.mat-filtri');
    var kartes = document.querySelectorAll('.mat-karte[data-valoda]');
    if (filtri && kartes.length) {
        var valodas = {};
        kartes.forEach(function (k) { valodas[k.dataset.valoda] = k.dataset.valodaNosaukums || k.dataset.valoda; });
        var atslegas = Object.keys(valodas);
        if (atslegas.length > 1) {
            function izveidot(atsl, nos) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'mat-filtrs';
                b.textContent = nos;
                b.setAttribute('aria-pressed', atsl === '' ? 'true' : 'false');
                b.addEventListener('click', function () {
                    filtri.querySelectorAll('.mat-filtrs').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
                    b.setAttribute('aria-pressed', 'true');
                    kartes.forEach(function (k) { k.hidden = atsl !== '' && k.dataset.valoda !== atsl; });
                });
                filtri.appendChild(b);
            }
            izveidot('', 'Visas valodas');
            atslegas.forEach(function (a) { izveidot(a, valodas[a]); });
            filtri.hidden = false;
        }
    }
})();
