// Noderīgi materiāli: izruna, vārdu kartītes, dialogs, uzdevumu pārbaude, saturs, filtri
(function () {
    var runaIr = 'speechSynthesis' in window;
    var balss = null;

    // IZRUNA (pārlūka runas sintēze): data-es → es-ES, data-en → en-GB, data-sv → sv-SE
    var VALODAS = { es: 'es-ES', en: 'en-GB', sv: 'sv-SE' };
    var balsis = {};

    function izveletiesBalsis() {
        var visas = speechSynthesis.getVoices();
        Object.keys(VALODAS).forEach(function (v) {
            balsis[v] = visas.find(function (b) { return b.lang === VALODAS[v]; }) ||
                        visas.find(function (b) { return b.lang && b.lang.indexOf(v) === 0; }) || null;
        });
    }

    // Atgriež { teksts, valoda } no elementa ar data-es, data-en vai data-sv
    function runasDati(el) {
        if (el.hasAttribute('data-en')) return { teksts: el.getAttribute('data-en'), valoda: 'en' };
        if (el.hasAttribute('data-sv')) return { teksts: el.getAttribute('data-sv'), valoda: 'sv' };
        return { teksts: el.getAttribute('data-es'), valoda: 'es' };
    }

    function izteikums(d) {
        var u = new SpeechSynthesisUtterance(d.teksts);
        u.lang = VALODAS[d.valoda];
        u.rate = 0.85;
        if (balsis[d.valoda]) u.voice = balsis[d.valoda];
        return u;
    }

    // Citi skripti (materiali-zviedru.js) var likt izrunāt: window.MAT_RUNA('God jul!', 'sv')
    window.MAT_RUNA = function (teksts, valoda) {
        if (!runaIr) return;
        speechSynthesis.cancel();
        speechSynthesis.speak(izteikums({ teksts: teksts, valoda: valoda }));
    };

    if (runaIr) {
        izveletiesBalsis();
        speechSynthesis.addEventListener('voiceschanged', izveletiesBalsis);

        document.querySelectorAll('[data-es], [data-en], [data-sv]').forEach(function (el) {
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
        if (!poga || bloks.hasAttribute('data-pats')) return; // data-pats = bloks ar savu loģiku (materiali-zviedru.js)

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

    // FILTRI materiālu sarakstā: segmentēta josla ar slīdošu indikatoru, skaits pogās un zem galvas
    var filtri = document.querySelector('.mat-filtri');
    var kartes = document.querySelectorAll('.mat-karte[data-valoda]');
    var skaits = document.querySelector('.mat-skaits');
    function skaitsTeksts(n) {
        var vienskaitlis = n % 10 === 1 && n % 100 !== 11;
        return '<strong>' + n + '</strong> ' + (vienskaitlis ? 'materiāls' : 'materiāli');
    }
    if (skaits) skaits.innerHTML = skaitsTeksts(kartes.length);
    if (filtri && kartes.length) {
        var valodas = {}, skaiti = {};
        kartes.forEach(function (k) {
            valodas[k.dataset.valoda] = k.dataset.valodaNosaukums || k.dataset.valoda;
            skaiti[k.dataset.valoda] = (skaiti[k.dataset.valoda] || 0) + 1;
        });
        var atslegas = Object.keys(valodas);
        if (atslegas.length > 1) {
            var slids = document.createElement('span');
            slids.className = 'mat-filtri-slids';
            slids.setAttribute('aria-hidden', 'true');
            filtri.appendChild(slids);

            function novietot(b) {
                filtri.style.setProperty('--x', b.offsetLeft + 'px');
                filtri.style.setProperty('--w', b.offsetWidth + 'px');
            }
            function izveidot(atsl, nos, n) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'mat-filtrs';
                b.innerHTML = '<span></span><span class="mat-filtrs-sk">' + n + '</span>';
                b.firstChild.textContent = nos;
                b.setAttribute('aria-pressed', atsl === '' ? 'true' : 'false');
                b.addEventListener('click', function () {
                    filtri.querySelectorAll('.mat-filtrs').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
                    b.setAttribute('aria-pressed', 'true');
                    novietot(b);
                    var redzamas = 0;
                    kartes.forEach(function (k) {
                        var slept = atsl !== '' && k.dataset.valoda !== atsl;
                        k.hidden = slept;
                        k.classList.remove('paradas');
                        if (!slept) {
                            redzamas++;
                            void k.offsetWidth; // restartē animāciju
                            k.classList.add('paradas');
                        }
                    });
                    if (skaits) skaits.innerHTML = skaitsTeksts(redzamas);
                });
                filtri.appendChild(b);
            }
            izveidot('', 'Visas valodas', kartes.length);
            atslegas.forEach(function (a) { izveidot(a, valodas[a], skaiti[a]); });
            filtri.hidden = false;

            function atjaunot() { novietot(filtri.querySelector('.mat-filtrs[aria-pressed="true"]')); }
            filtri.classList.add('bez-anim'); // pirmā novietošana bez animācijas
            atjaunot();
            requestAnimationFrame(function () { requestAnimationFrame(function () { filtri.classList.remove('bez-anim'); }); });
            window.addEventListener('resize', atjaunot);
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(atjaunot);
        }
    }
    // SLĒGTI MATERIĀLI (tikai reģistrētiem): kartīte slēgta, līdz /api/me apstiprina lietotāju.
    // Viesis spiež → Empanadillo pamāj un saka "¡No, no, no!"; Worker sūta viesus atpakaļ ar ?slegts=<valoda>
    var slegtas = document.querySelectorAll('.mat-karte[data-slegts]');
    function lietotajs() { return window.LIB && window.LIB.me && window.LIB.me.user; }
    function noNoNo(karte) {
        var saite = karte && karte.querySelector('.mat-karte-saite');
        var atpakal = saite ? saite.getAttribute('href') : location.pathname;
        var pieslegties = window.LIB && window.LIB.signInUrl ? window.LIB.signInUrl('/' + atpakal) : '/auth/google';
        var teksts = '<b>¡No, no, no!</b> Šis materiāls ir tikai reģistrētiem lietotājiem. ' +
            '<a href="' + pieslegties + '">Pieslēdzies vai reģistrējies</a> — un tas atvērsies!';
        if (karte) {
            karte.classList.remove('mat-karte--klauve');
            void karte.offsetWidth;
            karte.classList.add('mat-karte--klauve');
        }
        if (window.EMPANADILLO && window.EMPANADILLO.runat) window.EMPANADILLO.runat(teksts, { liedz: true });
        else if (window.LIB && window.LIB.toast) window.LIB.toast('Šis materiāls ir tikai reģistrētiem lietotājiem.');
    }
    if (slegtas.length) {
        slegtas.forEach(function (k) {
            k.addEventListener('click', function (e) {
                // kamēr /api/me vēl nav atbildējis, ļauj iet: Worker pats pārbaudīs sesiju
                if (!window.LIB || !window.LIB.me || lietotajs()) return;
                e.preventDefault();
                noNoNo(k);
            });
        });
        document.addEventListener('lib:me', function () {
            if (!lietotajs()) return;
            slegtas.forEach(function (k) { k.classList.remove('mat-karte--slegta'); });
        });
        var atgriezts = /[?&]slegts=([a-z]+)/.exec(location.search);
        if (atgriezts) {
            var karte = document.querySelector('.mat-karte[data-slegts][data-valoda="' + atgriezts[1] + '"]');
            try { history.replaceState(null, '', location.pathname + location.hash); } catch (x) {}
            window.addEventListener('load', function () {
                if (karte) karte.scrollIntoView({ block: 'center', behavior: 'smooth' });
                setTimeout(function () { noNoNo(karte); }, 900);
            });
        }
    }
})();
