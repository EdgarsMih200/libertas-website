// Adventes kalendārs (advente.html): eglīte ar 24 rotājumiem, pastkartītes, progress.
// Dati no /api/advente (datums tiek pārbaudīts serverī). Pārbaudei administratoram: advente.html?advente=0..25 (0 = pirms 1.12., 25 = pēc 24.12.).
(function () {
    var L = window.LIB || {};
    var svg = document.querySelector('[data-adv-egle]');
    if (!svg || !L.api) return;
    var g = svg.querySelector('[data-adv-rotajumi]');
    var kartesVieta = document.querySelector('[data-adv-karte]');
    var statuss = document.querySelector('[data-adv-statuss]');
    var NS = 'http://www.w3.org/2000/svg';
    var GADS = 2026;
    var SAKUMS = Date.UTC(GADS, 10, 30, 22, 0, 0); // 1.12. 00:00 Rīgā (UTC+2)

    var sim = (location.search.match(/[?&]advente=(\d{1,2})\b/) || [])[1];
    var q = sim !== undefined ? '?diena=' + sim : '';
    var mazaKustiba = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Telefonā apgriež ainavu līdz eglītei, lai rotājumi būtu lielāki (vieglāk trāpīt)
    var sauri = window.matchMedia ? matchMedia('(max-width: 640px)') : { matches: false };
    function skats() { svg.setAttribute('viewBox', sauri.matches ? '110 20 580 560' : '0 0 800 620'); }
    skats();
    if (sauri.addEventListener) sauri.addEventListener('change', skats);
    function paraditKarti() {
        if (!sauri.matches) return;
        var r = kartesVieta.getBoundingClientRect();
        if (r.top > innerHeight - 120) kartesVieta.scrollIntoView({ behavior: mazaKustiba ? 'auto' : 'smooth', block: 'start' });
    }

    var TIPI = {
        vards: 'Vārds', atlaide: 'Atlaide', quiz: 'Viktorīna', trad: 'Tradīcija', davana: 'Dāvana', finals: 'Fināls'
    };
    var ZIMOGI = { ES: 'España', EN: 'England', NO: 'Norge', SV: 'Sverige' };
    var RUNA = { ES: 'es-ES', EN: 'en-GB', NO: 'nb-NO', SV: 'sv-SE' };

    // Rotājumu vietas: 5 rindas pa zariem (3+4+5+6+6), numuri sajaukti kā īstā kalendārā
    var RINDAS = [[175, 3, 55], [270, 4, 95], [370, 5, 135], [450, 6, 140], [512, 6, 205]];
    var SECIBA = [14, 3, 21, 9, 1, 17, 6, 24, 11, 4, 19, 8, 15, 2, 22, 12, 5, 18, 23, 7, 13, 20, 10, 16];

    var D = null;          // pēdējā /api/advente atbilde
    var viesaAtvertas = {}; // viesis: šodienas durvis atvērtas tikai šajā lapā
    var izveleta = null;

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }
    function sel(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

    // ---------- Eglīte ----------
    var rotajumi = {};
    var k = 0;
    RINDAS.forEach(function (r) {
        for (var i = 0; i < r[1]; i++) {
            var n = SECIBA[k++];
            var x = 400 - r[2] + i * (2 * r[2] / (r[1] - 1));
            var y = r[0] + (i % 2 ? 6 : -4);
            var b = sel('g', { class: 'adv-rotajums', tabindex: '0', role: 'button', 'data-n': n, transform: 'translate(' + x.toFixed(1) + ' ' + y + ')' });
            b.appendChild(sel('line', { x1: 0, y1: -18, x2: 0, y2: -30, class: 'adv-aukla' }));
            b.appendChild(sel('circle', { class: 'adv-gredzens', r: 18 }));
            b.appendChild(sel('rect', { x: -4, y: -22, width: 8, height: 5, rx: 1.5, class: 'adv-cilpa' }));
            var c = sel('g', { class: 'adv-lode-g' });
            c.appendChild(sel('circle', { class: 'adv-lode', r: 18 }));
            var t = sel('text', { x: 0, y: 1 }); t.textContent = n; c.appendChild(t);
            b.appendChild(c);
            (function (n, b) {
                b.addEventListener('click', function () { klikskis(n, b); });
                b.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); klikskis(n, b); }
                });
            })(n, b);
            g.appendChild(b);
            rotajumi[n] = b;
        }
    });

    function atverts(n) { return !!(D && (D.atverts.indexOf(n) >= 0 || viesaAtvertas[n])); }
    function stavoklis(n) {
        if (atverts(n)) return 'atverts';
        if (!D || D.diena < 1) return 'slegts';
        if (D.diena > 24) return 'beidzies';
        if (n === D.diena) return 'sodien';
        return n < D.diena ? 'nokavets' : 'slegts';
    }
    var ARIA = { atverts: 'atvērts', sodien: 'šodien — atvērt', nokavets: 'nokavēts — vēl var atvērt', slegts: 'vēl slēgts', beidzies: 'netika atvērts' };

    function zimet() {
        for (var n = 1; n <= 24; n++) {
            var b = rotajumi[n], s = stavoklis(n);
            b.setAttribute('class', 'adv-rotajums adv-rotajums--' + s + (izveleta === n ? ' adv-rotajums--izvelets' : '') +
                (s === 'atverts' && D.durvis[n] ? ' adv-tips--' + D.durvis[n].t : ''));
            b.setAttribute('aria-label', n + '. decembris, ' + ARIA[s]);
            b.setAttribute('aria-pressed', izveleta === n ? 'true' : 'false');
        }
        svg.classList.toggle('adv-egle--pilna', !!(D && D.cempions));
        progress();
    }

    // ---------- Statusa rinda un progress ----------
    function lvDienas(n) { return n % 10 === 1 && n % 100 !== 11 ? 'diena' : 'dienas'; }
    var taimeris = null;
    function atskaite() {
        var s = Math.max(0, Math.floor((SAKUMS - Date.now()) / 1000));
        if (sim !== undefined) s = Math.max(s, 9 * 86400 + 3723); // simulācija: parādīt skaitītāju arī pēc 1.12.
        var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sek = s % 60;
        statuss.textContent = 'Kalendārs atvērsies pēc ' + d + ' ' + (d % 10 === 1 && d % 100 !== 11 ? 'dienas' : 'dienām') + ', ' + h + ' st. ' + m + ' min. ' + sek + ' sek.';
        if (s === 0 && sim === undefined) { clearInterval(taimeris); ielade(); }
    }

    function statusaTeksts() {
        clearInterval(taimeris);
        statuss.textContent = '';
        if (D.diena < 1) { atskaite(); taimeris = setInterval(atskaite, 1000); return; }
        var t;
        if (D.diena > 24) t = 'Kalendārs ir noslēdzies. Atvērtās pastkartītes vari pārlasīt jebkurā laikā.';
        else if (!D.lietotajs) t = 'Šodien ir ' + D.diena + '. decembris. Šodienas durvis vari atvērt arī bez konta — lai saglabātu progresu un saņemtu atlaižu kodus, ienāc ar Google.';
        else if (D.cempions) t = 'Visas 24 durvis atvērtas — zvaigzne deg!' + (D.izlozei ? ' Tu piedalies balvas izlozē.' : '');
        else t = 'Šodien ir ' + D.diena + '. decembris. ' + (D.atverts.indexOf(D.diena) >= 0 ? 'Šodienas durvis jau atvērtas — atgriezies rīt!' : 'Atver šodienas durvis — tās mirdz uz eglītes.');
        statuss.appendChild(document.createTextNode(t + ' '));
        if (!D.lietotajs && D.diena <= 24) {
            var a = el('a', 'adv-statuss-saite', 'Ienākt ar Google');
            a.href = L.signInUrl ? L.signInUrl() : '/auth/google';
            statuss.appendChild(a);
        }
    }

    var virtene = document.querySelector('[data-adv-virtene]');
    for (var i = 1; i <= 24; i++) virtene.appendChild(el('i', 'adv-spuldze'));
    function progress() {
        var sk = D ? D.atverts.length : 0;
        [].forEach.call(virtene.children, function (s, i) { s.classList.toggle('adv-spuldze--deg', i < sk); });
        document.querySelector('[data-adv-progress-virsraksts]').textContent = sk + ' no 24 iedegtas';
        var t = document.querySelector('[data-adv-progress-teksts]');
        t.textContent = '';
        if (!D) return;
        if (!D.lietotajs) { t.textContent = 'Progress tiek saglabāts tikai pēc ienākšanas ar Google kontu (bez maksas).'; return; }
        if (D.cempions) {
            t.appendChild(document.createTextNode('Tavs kods 2027. gadam: '));
            t.appendChild(el('kbd', 'adv-kods adv-kods--maz', D.cempionaKods));
            if (!D.izlozei) t.appendChild(document.createTextNode(' Izlozē piedalās tikai tie, kas katras durvis atvēra tieši savā dienā.'));
            else t.appendChild(document.createTextNode(D.izloze.notikusi ? (D.izloze.es ? ' Tu uzvarēji galveno balvu — drīz sazināsimies!' : ' Izloze ir notikusi — paldies, ka piedalījies!') : ' Izloze 27. decembrī.'));
        } else if (D.diena >= 1 && D.diena <= 24) {
            var palikusas = 24 - sk;
            t.textContent = 'Vēl ' + palikusas + ' durvis līdz zvaigznei. Nokavētās vari atvērt līdz 24. decembrim (kods 2027. gadam būs, bet izlozē piedalās tikai tie, kas katras durvis atvēra tieši savā dienā).';
        } else if (D.diena > 24) t.textContent = 'Šogad atvērtas ' + sk + ' durvis. Paldies, ka biji kopā ar mums!';
    }

    // ---------- Pastkartīte ----------
    function tuksaKarte(virsr, teksts, poga) {
        var c = el('div', 'adv-pastkarte adv-pastkarte--tuksa');
        c.appendChild(el('p', 'adv-pk-virsraksts', virsr));
        c.appendChild(el('p', '', teksts));
        if (poga) c.appendChild(poga);
        kartesVieta.textContent = '';
        kartesVieta.appendChild(c);
    }

    function ienaktPoga(teksts) {
        var a = el('a', 'btn-cta', teksts || 'Ienākt ar Google');
        a.href = L.signInUrl ? L.signInUrl(location.pathname + location.search + '#' + (izveleta || '')) : '/auth/google';
        return a;
    }

    function varRunat(l) {
        if (!('speechSynthesis' in window) || !RUNA[l]) return false;
        var v = speechSynthesis.getVoices();
        return !v.length || v.some(function (x) { return x.lang && x.lang.replace('_', '-').toLowerCase().indexOf(RUNA[l].slice(0, 2).toLowerCase()) === 0; });
    }
    // Zviedru/norvēģu vārdiem — ierakstīts mp3 (lielākajā daļā datoru nav šo valodu sistēmas balss)
    var IERAKSTI = { 7: 1, 11: 1, 20: 1, 23: 1 };
    var audio = null;
    function runat(teksts, l, n) {
        if (IERAKSTI[n]) {
            try { speechSynthesis.cancel(); } catch (e) {}
            if (audio) audio.pause();
            audio = new Audio('assets/advente/durvis-' + (n < 10 ? '0' : '') + n + '.mp3');
            audio.play().catch(function () {});
            return;
        }
        try {
            var u = new SpeechSynthesisUtterance(teksts);
            u.lang = RUNA[l]; u.rate = .9;
            var v = speechSynthesis.getVoices().filter(function (x) { return x.lang && x.lang.replace('_', '-').indexOf(RUNA[l]) === 0; })[0];
            if (v) u.voice = v;
            speechSynthesis.cancel(); speechSynthesis.speak(u);
        } catch (e) {}
    }

    function radit(n) {
        var x = D.durvis[n];
        if (!x) return;
        var c = el('article', 'adv-pastkarte adv-tips--' + x.t);
        c.setAttribute('aria-labelledby', 'adv-pk-' + n);
        var zimogs = el('div', 'adv-zimogs');
        zimogs.setAttribute('aria-hidden', 'true');
        zimogs.appendChild(el('b', '', x.l || 'LV'));
        zimogs.appendChild(el('small', '', x.l ? ZIMOGI[x.l] : 'Libertas'));
        c.appendChild(zimogs);
        c.appendChild(el('span', 'adv-zimogs-datums', 'Libertas · ' + (n < 10 ? '0' : '') + n + '.12.' + GADS));
        c.appendChild(el('span', 'adv-pk-tips', n + '. durvis · ' + TIPI[x.t]));
        var h = el('h2', 'adv-pk-virsraksts', x.ti); h.id = 'adv-pk-' + n;
        if (x.l) h.lang = RUNA[x.l].slice(0, 2);
        c.appendChild(h);
        if (x.tr) c.appendChild(el('p', 'adv-pk-tulkojums', x.tr));
        if (x.ex) {
            var ex = el('div', 'adv-pk-piemers');
            var ei = el('i', '', x.ex); if (x.l) ei.lang = RUNA[x.l].slice(0, 2);
            ex.appendChild(ei);
            ex.appendChild(el('span', '', x.exl));
            c.appendChild(ex);
        }
        if (x.l && x.t !== 'trad' && x.t !== 'quiz' && (IERAKSTI[n] || varRunat(x.l))) {
            var sp = el('button', 'adv-pk-runat');
            sp.type = 'button';
            sp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Klausīties';
            sp.addEventListener('click', function () { runat(x.ti + (x.ex ? '. ' + x.ex : ''), x.l, n); });
            c.appendChild(sp);
        }
        if (x.b) c.appendChild(el('p', 'adv-pk-teksts', x.b));
        if (x.kods) {
            var kr = el('div', 'adv-pk-kods');
            kr.appendChild(el('kbd', 'adv-kods', x.kods));
            var kp = el('button', 'btn-secondary adv-kopet', 'Kopēt');
            kp.type = 'button';
            kp.addEventListener('click', function () {
                var ok = function () { kp.textContent = 'Nokopēts'; setTimeout(function () { kp.textContent = 'Kopēt'; }, 2000); };
                if (navigator.clipboard) navigator.clipboard.writeText(x.kods).then(ok, function () {});
            });
            kr.appendChild(kp);
            c.appendChild(kr);
            c.appendChild(el('p', 'adv-pk-sikums', (x.derigs || '') + '. Ievadi kodu pieteikuma logā lapā «Kursi».'));
        } else if (x.kodsSlepts) {
            c.appendChild(el('p', 'adv-pk-sikums', 'Atlaides kods ir personīgs — ienāc ar Google, lai to saņemtu un saglabātu progresu.'));
            c.appendChild(ienaktPoga('Ienākt un saņemt kodu'));
        }
        if (x.q) {
            c.appendChild(el('p', 'adv-pk-jautajums', x.q));
            var opts = el('div', 'adv-pk-atbildes');
            var why = el('p', 'adv-pk-skaidrojums', x.why); why.hidden = true;
            x.o.forEach(function (o, i) {
                var b = el('button', 'adv-pk-atbilde', o); b.type = 'button';
                b.addEventListener('click', function () {
                    if (i === x.ok) {
                        b.classList.add('adv-pk-atbilde--pareizi');
                        b.setAttribute('aria-label', o + ' — pareizi');
                        why.hidden = false;
                        [].forEach.call(opts.children, function (z) { z.disabled = true; });
                    } else {
                        b.classList.add('adv-pk-atbilde--nepareizi');
                        b.setAttribute('aria-label', o + ' — nepareizi');
                        b.disabled = true;
                    }
                });
                opts.appendChild(b);
            });
            c.appendChild(opts);
            c.appendChild(why);
        }
        if (x.saite) {
            var a = el('a', 'btn-cta adv-pk-poga', x.saiteTeksts || 'Atvērt');
            a.href = x.saite;
            c.appendChild(a);
        }
        if (x.t === 'finals' && D.cempions) {
            var f = el('div', 'adv-pk-kods');
            f.appendChild(el('kbd', 'adv-kods', D.cempionaKods));
            c.appendChild(el('p', 'adv-pk-sikums', 'Zvaigzne deg! Tavs −25 % kods jebkuram kursam, derīgs līdz 30.06.2027:'));
            c.appendChild(f);
        }
        c.appendChild(el('p', 'adv-pk-paraksts', '— Empanadillo'));
        kartesVieta.textContent = '';
        kartesVieta.appendChild(c);
    }

    // ---------- Darbības ----------
    function zvans() {
        if (mazaKustiba) return;
        try {
            var A = window.AudioContext || window.webkitAudioContext;
            var ctx = zvans.ctx || (zvans.ctx = new A());
            [1318.5, 1568, 2093].forEach(function (f, i) {
                var o = ctx.createOscillator(), gn = ctx.createGain(), t = ctx.currentTime + i * .09;
                o.type = 'sine'; o.frequency.value = f;
                gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(.08, t + .01); gn.gain.exponentialRampToValueAtTime(.0001, t + .9);
                o.connect(gn); gn.connect(ctx.destination); o.start(t); o.stop(t + 1);
            });
        } catch (e) {}
    }

    function kratit(b) {
        b.classList.remove('adv-krata'); void b.getBoundingClientRect(); b.classList.add('adv-krata');
    }

    function izvelies(n) {
        izveleta = n;
        if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + n);
        zimet();
    }

    function klikskis(n, b) {
        if (!D) return;
        var s = stavoklis(n);
        if (s === 'atverts') { izvelies(n); radit(n); paraditKarti(); return; }
        if (s === 'slegts') {
            kratit(b);
            if (D.diena < 1) tuksaKarte('¡Paciencia!', 'Kalendārs atvērsies 1. decembrī. Šīs durvis — ' + n + '. decembrī.');
            else tuksaKarte('¡Paciencia!', 'Šīs durvis atvērsies ' + n + '. decembrī.' + (n - D.diena === 1 ? ' Jau rīt!' : ' Vēl ' + (n - D.diena) + ' ' + lvDienas(n - D.diena) + '.'));
            return;
        }
        if (s === 'beidzies') { kratit(b); tuksaKarte('Kalendārs ir noslēdzies', 'Šīs durvis palika neatvērtas. Uz tikšanos nākamajā adventē!'); return; }
        if (!D.lietotajs) {
            if (n === D.diena && D.durvis[n]) { viesaAtvertas[n] = true; zvans(); izvelies(n); radit(n); paraditKarti(); return; }
            izveleta = n; zimet();
            tuksaKarte('Nokavētās durvis', 'Lai atvērtu nokavētās durvis un saglabātu progresu, ienāc ar Google kontu. Tas ir bez maksas.', ienaktPoga());
            return;
        }
        b.classList.add('adv-gaida');
        L.api('POST', '/api/advente/' + n + q).then(function (d) {
            D = d; zvans(); izvelies(n); radit(n); statusaTeksts(); saglabatEmpa(); paraditKarti();
        }).catch(function (e) {
            if (e.status === 401) tuksaKarte('Sesija beigusies', 'Lūdzu, ienāc vēlreiz.', ienaktPoga());
            else if (L.toast) L.toast(e.message || 'Neizdevās atvērt durvis', true);
        }).then(function () { b.classList.remove('adv-gaida'); });
    }

    // Empanadillo ragi (12. durvis) / zelta cepure (24/24) līdz 6. janvārim — empanadillo.js nolasa localStorage
    function saglabatEmpa() {
        if (!D || !D.lietotajs) return;
        var v = D.cempions ? 'zelts' : D.ragi ? 'ragi' : '';
        try { if (v) localStorage.setItem('adventeEmpa', v); else localStorage.removeItem('adventeEmpa'); } catch (e) {}
    }

    function sakumaKarte() {
        var h = parseInt(location.hash.slice(1), 10);
        if (h >= 1 && h <= 24 && atverts(h)) { izvelies(h); radit(h); return; }
        if (D.diena < 1) { tuksaKarte('Drīzumā!', 'Eglīte jau gaida. Katru dienu no 1. līdz 24. decembrim šeit varēs atvērt vienu rotājumu.'); return; }
        if (D.diena > 24) {
            var pedeja = D.atverts[D.atverts.length - 1];
            if (pedeja) { izvelies(pedeja); radit(pedeja); }
            else tuksaKarte('Kalendārs ir noslēdzies', 'Paldies visiem, kas piedalījās! Uz tikšanos nākamajā adventē.');
            return;
        }
        if (atverts(D.diena)) { izvelies(D.diena); radit(D.diena); return; }
        tuksaKarte('Šodienas durvis gaida', 'Spied uz mirdzošā rotājuma ar numuru ' + D.diena + '.');
    }

    function ielade() {
        return L.api('GET', '/api/advente' + q).then(function (d) {
            D = d;
            if (d.simulets) document.documentElement.classList.add('adv-simulets');
            zimet(); statusaTeksts(); sakumaKarte(); saglabatEmpa();
        }).catch(function () {
            statuss.textContent = 'Kalendāru neizdevās ielādēt. Pārlādē lapu vai mēģini vēlāk.';
        });
    }
    ielade();
})();
