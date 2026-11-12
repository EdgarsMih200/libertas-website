/* BJU — biežāk uzdotie jautājumi ar Empanadillo. Ielādē empanadillo.js (lapās ar galveni).
   - Galvenē pa labi no profila foto: tumši zaļa apaļa poga ar baltu "?" (button.bju-poga).
   - Atverot: izvēlne nedaudz pabīdās pa kreisi (html.bju-atverts), no pogas atveras logs (section.bju-logs),
     no loga apakšas nolaižas un izšūpojas šauras virvju kāpnes (.bju-kapnes) līdz stūra Empanadillo,
     viņš pagriežas (redzams pikseļu dibentiņš), saka "Un momento, por favor…" un uzkāpj logā (.bju-kapejs).
   - ~16 jautājumi (JAUTAJUMI) + brīvs teksts (atslēgvārdu punkti). Nezina -> piedāvā nosūtīt jautājumu Edgaram
     (POST /api/bju, worker/bju.js) ar vārdu, uzvārdu un e-pastu; "Nē" -> "Vai ir vēl kāds jautājums…".
   - Aizverot: logs ieslīd atpakaļ pogā, Empanadillo nolec uz savu vietu stūrī, kāpnes saritinās.
   - prefers-reduced-motion: bez kāpnēm un lēcieniem (logs atveras uzreiz). */
(function (root) {
    'use strict';

    var E = root.EMPANADILLO;
    var wrap = document.querySelector('.nav-wrapper');
    if (!wrap || !E || document.querySelector('.bju-poga')) return;

    var html = document.documentElement;
    var mazaKustiba = root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EDGARS = 'edgars.libertas@gmail.com';

    // ---------- Jautājumi un atbildes ----------
    // k: atslēgvārdi (vārda sākums, bez garumzīmēm pēc norm()) ar svaru; atbilde, ja punkti ≥ 3
    var JAUTAJUMI = [
        { id: 'kursi', j: 'Kādus kursus jūs piedāvājat?',
          k: { 'piedāvā': 2, 'kursi': 1, 'kursus': 1, 'kādi kursi': 3, 'kādus kursus': 3, 'valodas māc': 2, 'kādas valodas': 3, 'ko jūs māc': 3 },
          a: 'Mums ir <b>grupu kursi tiešsaistē</b>: spāņu valoda A1, A2, B1.1 un B1.2, angļu valoda A1 un A2. ' +
             'Ja gribi mācīties savā tempā, ir arī pašmācības e-kurss «Spāņu valodas pamati A1 — pirmie soļi». ' +
             'Visi kursi vienuviet: <a href="/kursi.html">Kursi</a>.' },
        { id: 'cena', j: 'Cik maksā kursi?',
          k: { 'cen': 3, 'cik maks': 3, 'maksā': 2, 'eur': 2, 'dārg': 3, 'izmaks': 3, 'cik tas': 1 },
          a: 'Grupu kursi <b>A1 un A2 — 280 EUR</b>, <b>B1.1 un B1.2 — 420 EUR</b> par visu kursu (14 nodarbības). ' +
             'Pašmācības e-kurss — <b>140 EUR</b> ar piekļuvi 90 dienas. Ja tev ir atlaides kods, ieraksti to pieteikuma logā.' },
        { id: 'sakums', j: 'Kad sākas nākamā grupa?',
          k: { 'sāk': 2, 'nākam': 2, 'kad': 1, 'datum': 2, 'grafik': 3, 'tuvāk': 2, 'jaun grup': 3, 'grupa': 1 },
          a: nakamasGrupas },
        { id: 'ilgums', j: 'Cik ilgi notiek kurss un cik bieži ir nodarbības?',
          k: { 'ilg': 3, 'cik biež': 3, 'biež': 2, 'stund': 2, 'nedēļ': 2, 'cikos': 3, 'vakar': 2, 'laiks': 1, 'nodarbīb': 1, 'dienās': 2 },
          a: 'Grupu kurss ilgst <b>7 nedēļas</b>: 14 nodarbības (42 stundas), <b>2× nedēļā no 18:00 līdz 21:00</b>. ' +
             'Katrai grupai ir savas dienas — pirmdienas un trešdienas vai otrdienas un ceturtdienas. ' +
             'Ja nodarbība iekrīt svētku dienā, tā pārceļas uz nākamo grupas nodarbības dienu.' },
        { id: 'kur', j: 'Vai nodarbības notiek klātienē vai tiešsaistē?',
          k: { 'tiešsaist': 3, 'klātien': 3, 'online': 3, 'zoom': 3, 'attālināt': 3, 'kur notiek': 3, 'kur ir': 2, 'adrese': 3, 'datorā': 2 },
          a: 'Nodarbības notiek <b>tiešsaistē</b>, nelielā grupā, un mācības notiek latviešu valodā. ' +
             'Vajag tikai datoru (vai planšeti), austiņas ar mikrofonu un stabilu internetu — un vēlmi runāt jau no pirmās dienas!' },
        { id: 'grupa', j: 'Cik cilvēku ir grupā?',
          k: { 'cik cilvēk': 3, 'cilvēk': 2, 'dalībniek': 2, 'cik liel': 3, 'grupas lielum': 3, 'brīvas viet': 3, 'vietas': 1, 'individuāl': 3 },
          a: 'Grupas ir <b>nelielas</b> — tā katram ir laiks runāt, kļūdīties un saņemt atgriezenisko saiti. ' +
             'Ja gribi zināt, cik vietu vēl brīvas konkrētajā grupā, spied «Pajautāt Edgaram» — es viņam nodošu.' },
        { id: 'pieteikties', j: 'Kā pieteikties kursam?',
          k: { 'pieteik': 3, 'pierakst': 2, 'reģistrēt': 2, 'iestāt': 3, 'kā sāk': 2 },
          a: '<ol><li>Atver <a href="/kursi.html">Kursi</a> un izvēlies kursu.</li><li>Spied «Pieteikties» un izvēlies grupu.</li>' +
             '<li>Ienāc ar savu Google kontu.</li></ol>Uzreiz saņemsi apstiprinājuma e-pastu, un pieteikums parādīsies sadaļā ' +
             '<a href="/konts.html#kursi">Mani kursi</a> ar statusu «Gaida apmaksu». Vietu grupā paturam tev līdz apmaksai.' },
        { id: 'apmaksa', j: 'Kā notiek apmaksa?',
          k: { 'apmak': 3, 'samaks': 3, 'rēķin': 3, 'pārskait': 3, 'kart': 1, 'bank': 2, 'kā maks': 3 },
          a: 'Pēc pieteikuma mēs tev atsūtīsim <b>rēķinu uz e-pastu</b>, un to var apmaksāt ar bankas pārskaitījumu ' +
             '(kartes maksājuma vietnē nav). Kad apmaksa saņemta, statuss sadaļā «Mani kursi» mainās uz «Uzņemts».' },
        { id: 'dalas', j: 'Vai var maksāt pa daļām?',
          k: { 'pa daļ': 3, 'daļās': 3, 'daļa': 2, 'dalīt': 3, 'nomaks': 3, 'pakāpenisk': 3 },
          a: 'Jā, to var sarunāt! Rēķinā kursa summu var sadalīt <b>vairākos maksājumos</b> pēc grafika. ' +
             'Piesakies kursam un pasaki Edgaram, ka gribi maksāt pa daļām — vai spied «Pajautāt Edgaram», un es viņam to nodošu.' },
        { id: 'limenis', j: 'Kuru līmeni man izvēlēties?',
          k: { 'līmen': 3, 'iesācēj': 3, 'no nulles': 3, 'nulles': 2, 'nekad nav': 2, 'jau zin': 2, 'proti': 1, 'a1': 1, 'a2': 1, 'b1': 1 },
          a: 'Ja sāc <b>no nulles</b> — izvēlies <b>A1</b>. Ja jau kaut ko proti, atver kursa lapu un apskati tēmas: ' +
             'ja A1 tēmas jau zini, tev der A2 vai augstāk. Secība: A1 → A2 → B1.1 → B1.2. ' +
             'Ja nezini, kur sākt, Edgars palīdzēs izvēlēties.' },
        { id: 'ekurss', j: 'Kas ir pašmācības e-kurss?',
          k: { 'e-kurs': 3, 'ekurs': 3, 'e kurs': 3, 'pašmācīb': 3, 'savā temp': 3, 'pats sav': 2, 'tiešsaistes kurs': 3, 'eksām': 2 },
          a: 'Tas ir kurss, kur mācies <b>savā tempā</b>: 14 nodarbības ar skaidrojumiem un uzdevumiem, pašpārbaudes testi, ' +
             'noslēguma eksāmens un sertifikāts. Piekļuve — <b>90 dienas</b> no apmaksas, cena <b>140 EUR</b>. ' +
             'Pirmais e-kurss — «Spāņu valodas pamati A1 — pirmie soļi»: <a href="/kursi.html#tiessaistes">Kursi → Tiešsaistes kursi</a>.' },
        { id: 'aplieciba', j: 'Vai pēc kursa saņemšu apliecību?',
          k: { 'apliecīb': 3, 'sertifik': 3, 'diplom': 3, 'dokument': 2, 'atzīt': 2 },
          a: 'Pēc grupu kursa saņemsi <b>apliecību par neformālās izglītības programmas apguvi</b>. ' +
             'E-kursā ir <b>sertifikāts</b>, ja noslēguma eksāmenā iegūsti vismaz 80 % — tas atrodams sadaļā «Mani kursi». ' +
             '(E-kursa sertifikāts nav valsts atzīts izglītības dokuments.)' },
        { id: 'atcelt', j: 'Kā atcelt pieteikumu?',
          k: { 'atcel': 3, 'atteik': 3, 'atsauk': 3, 'atmaks': 3, 'naudu atpakaļ': 3, 'pārdomāj': 3, 'nevarēšu': 2 },
          a: 'Kamēr pieteikums nav apmaksāts, atver <a href="/konts.html#kursi">Mani kursi</a> un spied «Atcelt pieteikumu». ' +
             'Ja kurss jau apmaksāts, raksti Edgaram — atteikuma un naudas atmaksas kārtība ir ' +
             '<a href="/noteikumi.html#noteikumi">lietošanas noteikumos</a>.' },
        { id: 'konts', j: 'Kā ienākt savā kontā?',
          k: { 'kont': 2, 'ienākt': 3, 'ieiet': 3, 'ielogot': 3, 'pierakstīties': 1, 'parol': 3, 'google': 3, 'profil': 2 },
          a: 'Atsevišķs konts nav jāveido — spied <b>«Ienākt ar Google»</b> lapas augšā un izmanto savu Google kontu, parole nav vajadzīga. ' +
             'Kontā redzēsi savus kursus un apmaksas statusu, kā arī vari nomainīt foto un tālruni.' },
        { id: 'materiali', j: 'Vai noderīgie materiāli ir bez maksas?',
          k: { 'materiāl': 3, 'bez maks': 3, 'bezmaks': 3, 'drukā': 2, 'darba lap': 3, 'vingrinājum': 2 },
          a: 'Jā! <a href="/materiali.html">Noderīgi materiāli</a> ir bez maksas: tematiskas nodarbības spāņu, angļu, norvēģu ' +
             'un zviedru valodā ar vārdiem, dialogiem, izrunu un uzdevumiem, kā arī darba lapas drukāšanai. ' +
             'Zviedru materiāls atveras, kad esi ienācis savā kontā.' },
        { id: 'libertas', j: 'Kas ir Libertas?',
          k: { 'libertas': 2, 'kas jūs': 3, 'par jums': 3, 'dibin': 3, 'kas ir libertas': 3, 'vārds nozīm': 3 },
          a: 'Libertas ir valodu skola ar moto <i>Runā, saproti, ceļo, audz!</i> To dibināja <b>Edgars Mihovs</b>. ' +
             'Mūsu stāstu, vērtības un to, kā notiek mācības, lasi lapā <a href="/par-mums.html">Par mums</a>.' }
    ];
    // Slēptās atbildes (nav sarakstā, bet atpazīst brīvā tekstā)
    var SLEPTIE = [
        { id: 'kontakti', k: { 'sazin': 3, 'kontakt': 3, 'telefon': 3, 'zvanīt': 3, 'e-past': 2, 'epast': 2, 'rakstīt': 1 },
          a: 'Edgaram var rakstīt uz <a href="mailto:' + EDGARS + '">' + EDGARS + '</a>. ' +
             'Vai arī uzraksti jautājumu šeit — es viņam to nodošu!' },
        { id: 'empa', k: { 'empanad': 3, 'kas tu esi': 3, 'tavs vārds': 3, 'kā tevi sauc': 3 },
          a: 'Es esmu <b>Empanadillo</b> — maza ceļojoša empanada ar mugursomu. Spāniski <i>empanar</i> nozīmē „ietīt mīklā”. ' +
             'Mans darbs — palīdzēt tev atrast ceļu pa Libertas!' },
        { id: 'sveiki', k: { 'sveik': 3, 'hola': 3, 'čau': 3, 'labdien': 3, 'labvakar': 3, 'labrīt': 3, 'hello': 3 },
          a: '¡Hola! Prieks tevi redzēt. Ko vēlies uzzināt?' },
        { id: 'paldies', k: { 'paldies': 3, 'gracias': 3, 'thanks': 3, 'thank': 3 },
          a: '¡De nada! Ja vēl kas interesē — jautā droši.' }
    ];

    var POPULARI = ['kursi', 'cena', 'sakums', 'pieteikties'];

    var T = {
        sveiciens: '¡Ya estoy! Uzkāpu. Izvēlies jautājumu no saraksta vai uzraksti savu.',
        momento: 'Un momento, por favor, es tūliņ atbildēšu uz visiem taviem jautājumiem',
        espera: 'Hmm… uz šo jautājumu es diemžēl nezinu atbildi. Espera — es to pierakstīšu un pajautāšu ' +
                'savam priekšniekam Edgaram. Vai Tev nav nekas pret, ka es nosūtīšu viņam e-pastu ar tavu ' +
                'kontaktinformāciju, lai viņš var Tev atbildēt?',
        velviens: 'Vai ir vēl kāds jautājums uz kuru varu atbildēt?'
    };

    // ---------- Palīgi ----------
    function norm(s) {
        return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9@\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    [JAUTAJUMI, SLEPTIE].forEach(function (saraksts) {
        saraksts.forEach(function (q) {
            q.kn = Object.keys(q.k).map(function (v) { return [norm(v), q.k[v]]; });
        });
    });

    function atrast(teksts) {
        var t = ' ' + norm(teksts);
        var labakais = null, punkti = 0;
        JAUTAJUMI.concat(SLEPTIE).forEach(function (q) {
            var p = 0;
            q.kn.forEach(function (k) { if (t.indexOf(' ' + k[0]) >= 0) p += k[1]; });
            if (p > punkti) { punkti = p; labakais = q; }
        });
        return punkti >= 3 ? labakais : null;
    }

    function el(tag, cls, txt) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (txt !== undefined) e.textContent = txt;
        return e;
    }

    function gaidit(ms) { return new Promise(function (r) { setTimeout(r, mazaKustiba ? 0 : ms); }); }

    var grafiksP = null;
    function nakamasGrupas() {
        if (!grafiksP) grafiksP = import('/grafiks.js').catch(function () { return null; });
        return grafiksP.then(function (G) {
            var beigas = ' Angļu valodas grupu datumi vēl tiek precizēti. Pieteikties var lapā <a href="/kursi.html">Kursi</a>.';
            if (!G) return 'Spāņu valodas grupas sākas sešas reizes gadā; tuvāko datumu redzi pie katra kursa lapā <a href="/kursi.html">Kursi</a>.' + beigas;
            var rindas = [['spain-a1', 'A1'], ['spain-a2', 'A2'], ['spain-b1-1', 'B1.1'], ['spain-b1-2', 'B1.2']].map(function (k) {
                var p = G.periodi(k[0], { skaits: 1 })[0];
                if (!p) return '';
                var d = p.dienasTeksts ? ' · ' + p.dienasTeksts.charAt(0).toLowerCase() + p.dienasTeksts.slice(1) : '';
                return '<li><b>' + k[1] + '</b> — no ' + G.datums(p.sakums) + d + '</li>';
            }).join('');
            return 'Tuvākās <b>spāņu valodas</b> grupas:<ul>' + rindas + '</ul>' + beigas;
        });
    }

    // ---------- Poga galvenē ----------
    var poga = el('button', 'bju-poga');
    poga.type = 'button';
    poga.setAttribute('aria-label', 'Biežāk uzdotie jautājumi — pajautā Empanadillo');
    poga.setAttribute('aria-expanded', 'false');
    poga.setAttribute('aria-controls', 'bju-logs');
    poga.innerHTML = '<span class="bju-poga-zime" aria-hidden="true">?</span>';
    wrap.appendChild(poga);

    // ---------- Logs ----------
    var logs = el('section', 'bju-logs');
    logs.id = 'bju-logs';
    logs.hidden = true;
    logs.setAttribute('role', 'dialog');
    logs.setAttribute('aria-labelledby', 'bju-virsraksts');
    logs.innerHTML =
        '<span class="bju-aste" aria-hidden="true"></span>' +
        '<header class="bju-galva">' +
            '<span class="bju-avatars" aria-hidden="true">' + E.svg('sveicina', { mazais: true, hat: E.cepure, shadow: false }) + '</span>' +
            '<div class="bju-galva-teksts"><h2 class="bju-virsraksts" id="bju-virsraksts">Empanadillo atbild</h2>' +
            '<p class="bju-apakssvirsraksts">Biežāk uzdotie jautājumi</p></div>' +
            '<button type="button" class="bju-aizvert" aria-label="Aizvērt jautājumu logu">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '</header>' +
        '<ol class="bju-saruna" aria-live="polite"></ol>' +
        '<form class="bju-ievade" autocomplete="off">' +
            '<label class="sr-only" for="bju-jautajums">Tavs jautājums</label>' +
            '<input id="bju-jautajums" class="bju-lauks" type="text" maxlength="300" placeholder="Uzraksti savu jautājumu…">' +
            '<button type="submit" class="bju-sutit" aria-label="Jautāt"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M4 12h14M13 6l6 6-6 6"/></svg></button>' +
        '</form>';
    document.body.appendChild(logs);

    var saruna = logs.querySelector('.bju-saruna');
    var ievade = logs.querySelector('.bju-ievade');
    var lauks = logs.querySelector('.bju-lauks');
    var aste = logs.querySelector('.bju-aste');

    // Kāpnes un kāpējs (Empanadillo, kas kāpj/lec; stūra palīgs tikmēr paslēpts)
    var kapnes = el('div', 'bju-kapnes');
    kapnes.setAttribute('aria-hidden', 'true');
    var kapejs = el('div', 'bju-kapejs empa empa--mazs');
    kapejs.setAttribute('aria-hidden', 'true');
    var c = E.cepure;
    kapejs.innerHTML =
        '<div class="bju-kapeja-figura">' +
        '<div class="bju-kapeja-burbulis empa-burbulis" hidden></div>' +
        '<span class="bju-k bju-k--prieksa">' + E.svg('sveicina', { mazais: true, hat: c }) + '</span>' +
        '<span class="bju-k bju-k--mugura">' + E.svg('mugura', { mazais: true, hat: c }) + '</span>' +
        '<span class="bju-k bju-k--kapj">' + E.svg('kapj', { mazais: true, hat: c, animate: true, shadow: false }) + '</span>' +
        '<span class="bju-k bju-k--lec">' + E.svg('lec', { mazais: true, hat: c, shadow: false }) + '</span>' +
        '</div>';
    document.body.appendChild(kapnes);
    document.body.appendChild(kapejs);
    var kBurbulis = kapejs.querySelector('.bju-kapeja-burbulis');
    var kFigura = kapejs.querySelector('.bju-kapeja-figura');
    kapejs.setAttribute('data-poza', 'prieksa'); // izmēram (izkartot mēra kāpēju)

    // ---------- Saruna ----------
    var rinda = Promise.resolve();
    var ieradiesP = null, ieradiesAtrisinat = null;
    var pedejais = '';

    // garš bloks (saraksts, forma): rāda tā sākumu kopā ar iepriekšējo ziņu; citādi — līdz apakšai
    function ritinat(li) {
        li = li || saruna.lastElementChild;
        if (li && li.offsetHeight > saruna.clientHeight * 0.55) {
            var ieprieks = li.previousElementSibling;
            saruna.scrollTop = (ieprieks ? ieprieks.offsetTop : li.offsetTop) - 12;
        } else {
            saruna.scrollTop = saruna.scrollHeight;
        }
    }

    function zina(kas, saturs) {
        var li = el('li', 'bju-zina bju-zina--' + kas);
        var b = el('div', 'bju-zina-teksts');
        if (typeof saturs === 'string') b.innerHTML = saturs; else b.appendChild(saturs);
        if (kas === 'empa') li.appendChild(el('span', 'sr-only', 'Empanadillo: '));
        else li.appendChild(el('span', 'sr-only', 'Tu: '));
        li.appendChild(b);
        saruna.appendChild(li);
        ritinat();
        return li;
    }

    // Empanadillo "raksta" (punktiņi), tad parāda ziņu; viss iet pa rindai
    function empa(saturs, pec) {
        rinda = rinda.then(function () { return ieradiesP; }).then(function () {
            var raksta = el('li', 'bju-zina bju-zina--empa bju-zina--raksta');
            raksta.innerHTML = '<div class="bju-zina-teksts"><span></span><span></span><span></span></div>';
            raksta.setAttribute('aria-hidden', 'true');
            saruna.appendChild(raksta);
            ritinat();
            return Promise.all([typeof saturs === 'function' ? saturs() : saturs, gaidit(550)]).then(function (r) {
                var garums = typeof r[0] === 'string' ? r[0].replace(/<[^>]+>/g, '').length : 40;
                return gaidit(Math.min(900, garums * 4)).then(function () {
                    raksta.remove();
                    var li = zina('empa', r[0]);
                    if (pec) pec(li);
                });
            });
        });
        return rinda;
    }

    function pogas(saraksts) {
        rinda = rinda.then(function () {
            var li = el('li', 'bju-zina bju-zina--pogas');
            saraksts.forEach(function (p) {
                var b = el('button', 'bju-izvele' + (p.galvena ? ' bju-izvele--galvena' : ''), p.t);
                b.type = 'button';
                b.addEventListener('click', function () {
                    [].forEach.call(li.querySelectorAll('button'), function (x) { x.disabled = true; });
                    b.classList.add('bju-izvele--izveleta');
                    p.f();
                });
                li.appendChild(b);
            });
            saruna.appendChild(li);
            ritinat();
        });
    }

    function saraksts() {
        rinda = rinda.then(function () {
            var li = el('li', 'bju-zina bju-zina--saraksts');
            var ul = el('ul', 'bju-jautajumi');
            ul.setAttribute('aria-label', 'Biežāk uzdotie jautājumi');
            function pievienot(q) {
                var i = el('li');
                var b = el('button', 'bju-jautajums', q.j);
                b.type = 'button';
                b.addEventListener('click', function () { jautat(q.j, q); });
                i.appendChild(b);
                ul.appendChild(i);
                return b;
            }
            // sākumā tikai populārākie (mazāks logs, garākas kāpnes); pārējie — ar pogu
            var galvenie = JAUTAJUMI.filter(function (q) { return POPULARI.indexOf(q.id) >= 0; });
            var citi = JAUTAJUMI.filter(function (q) { return POPULARI.indexOf(q.id) < 0; });
            galvenie.forEach(pievienot);
            li.appendChild(ul);
            var vel = el('button', 'bju-izvele bju-vel', 'Rādīt vēl ' + citi.length + ' jautājumus');
            vel.type = 'button';
            vel.addEventListener('click', function () {
                vel.remove();
                var pirmais = null;
                citi.forEach(function (q) { var b = pievienot(q); if (!pirmais) pirmais = b; });
                if (pirmais) pirmais.focus({ preventScroll: true });
                ritinat(li);
            });
            li.appendChild(vel);
            saruna.appendChild(li);
            ritinat();
        });
    }

    function velViens() {
        empa(T.velviens);
        pogas([{ t: 'Rādīt jautājumus', f: function () { saraksts(); } }]);
    }

    function jautat(teksts, q) {
        teksts = String(teksts).trim();
        if (!teksts) return;
        zina('es', el('span', '', teksts));
        pedejais = teksts;
        q = q || atrast(teksts);
        if (!q) { nezina(teksts); return; }
        empa(q.a);
        if (q.id === 'sveiki' || q.id === 'paldies') return;
        pogas([
            { t: 'Citi jautājumi', f: function () { saraksts(); } },
            { t: 'Pajautāt Edgaram', f: function () { zina('es', el('span', '', 'Gribu pajautāt Edgaram')); nezina(teksts); } }
        ]);
    }

    function nezina(teksts) {
        empa(T.espera);
        pogas([
            { t: 'Jā, sūti', galvena: true, f: function () { zina('es', el('span', '', 'Jā, sūti')); forma(teksts); } },
            { t: 'Nē, paldies', f: function () { zina('es', el('span', '', 'Nē, paldies')); velViens(); } }
        ]);
    }

    function forma(teksts) {
        empa('Lieliski! Ieraksti, kā tevi sauc un kur Edgars var tev atbildēt:', function (li) {
            var me = root.LIB && root.LIB.me && root.LIB.me.user;
            var vardi = me && me.name ? me.name.trim().split(/\s+/) : [];
            var f = el('form', 'bju-forma');
            f.noValidate = true;
            var n = Date.now();
            f.innerHTML =
                '<div class="bju-forma-rinda">' +
                '<p class="bju-forma-lauks"><label for="bju-v-' + n + '">Vārds</label><input id="bju-v-' + n + '" name="vards" class="lauks" autocomplete="given-name" maxlength="60" required></p>' +
                '<p class="bju-forma-lauks"><label for="bju-u-' + n + '">Uzvārds</label><input id="bju-u-' + n + '" name="uzvards" class="lauks" autocomplete="family-name" maxlength="60" required></p>' +
                '</div>' +
                '<p class="bju-forma-lauks"><label for="bju-e-' + n + '">E-pasts</label><input id="bju-e-' + n + '" name="epasts" type="email" class="lauks" autocomplete="email" maxlength="120" required></p>' +
                '<p class="bju-forma-lauks"><label for="bju-j-' + n + '">Jautājums</label><textarea id="bju-j-' + n + '" name="jautajums" class="lauks" rows="3" maxlength="1500" required></textarea></p>' +
                '<p class="bju-slazds" aria-hidden="true"><label>Neaizpildi<input name="viltus" tabindex="-1" autocomplete="off"></label></p>' +
                '<p class="bju-forma-piezime">Dati tiks izmantoti tikai, lai atbildētu uz jautājumu. <a href="/noteikumi.html#privatums">Privātuma politika</a></p>' +
                '<p class="bju-forma-kluda" role="alert" hidden></p>' +
                '<div class="bju-forma-pogas"><button type="submit" class="btn-cta bju-forma-sutit">Nosūtīt Edgaram</button>' +
                '<button type="button" class="btn-link bju-forma-atcelt">Tomēr nē</button></div>';
            f.vards.value = vardi[0] || '';
            f.uzvards.value = vardi.slice(1).join(' ');
            f.epasts.value = (me && me.email) || '';
            f.jautajums.value = teksts;
            var kluda = f.querySelector('.bju-forma-kluda');
            var sutit = f.querySelector('.bju-forma-sutit');

            function bloket() { [].forEach.call(f.elements, function (x) { x.disabled = true; }); }
            function radit(t, lauksEl) {
                kluda.textContent = t; kluda.hidden = false;
                [].forEach.call(f.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
                if (lauksEl) { lauksEl.setAttribute('aria-invalid', 'true'); lauksEl.focus(); }
            }

            f.querySelector('.bju-forma-atcelt').addEventListener('click', function () {
                bloket();
                zina('es', el('span', '', 'Tomēr nē'));
                velViens();
            });
            f.addEventListener('submit', function (ev) {
                ev.preventDefault();
                var d = { vards: f.vards.value.trim(), uzvards: f.uzvards.value.trim(), epasts: f.epasts.value.trim(),
                    jautajums: f.jautajums.value.trim(), viltus: f.viltus.value, lapa: location.pathname };
                if (!d.vards) return radit('Ieraksti vārdu.', f.vards);
                if (!d.uzvards) return radit('Ieraksti uzvārdu.', f.uzvards);
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.epasts)) return radit('Pārbaudi e-pasta adresi.', f.epasts);
                if (d.jautajums.length < 3) return radit('Ieraksti jautājumu.', f.jautajums);
                kluda.hidden = true;
                sutit.disabled = true;
                sutit.textContent = 'Sūta…';
                fetch('/api/bju', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
                    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Kļūda'); return j; }); })
                    .then(function () {
                        bloket();
                        sutit.textContent = 'Nosūtīts ✓';
                        var e = el('span'); e.textContent = d.epasts;
                        empa('¡Listo! Nosūtīju Edgaram. Viņš tev atbildēs uz <b>' + e.innerHTML + '</b>.');
                        velViens();
                    })
                    .catch(function (err) {
                        sutit.disabled = false;
                        sutit.textContent = 'Nosūtīt Edgaram';
                        radit('¡Ay! Neizdevās nosūtīt (' + err.message + '). Pamēģini vēlreiz vai raksti Edgaram: ' + EDGARS);
                    });
            });
            li.querySelector('.bju-zina-teksts').appendChild(f);
            li.classList.add('bju-zina--forma');
            (f.vards.value ? f.jautajums : f.vards).focus({ preventScroll: true });
            ritinat(li);
        });
    }

    ievade.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var t = lauks.value;
        lauks.value = '';
        jautat(t);
    });

    // ---------- Izkārtojums (logs, aste, kāpnes) ----------
    var geo = null;
    var KOMPAKTS_MIN = 240;

    function izkartot() {
        var vw = document.documentElement.clientWidth, vh = root.innerHeight;
        var saurs = vw <= 768;
        var hdr = document.querySelector('.site-header');
        var augsa = (hdr ? hdr.getBoundingClientRect().bottom : 70) + 12;
        var pr = poga.getBoundingClientRect();
        var pCx = pr.left + pr.width / 2;

        // kāpēja vieta = stūra palīga vieta (bez transformācijām; dažās lapās tas pacelts)
        var st = document.querySelector('.empanadillo');
        if (st) { var cs = getComputedStyle(st); kapejs.style.right = cs.right; kapejs.style.bottom = cs.bottom; }
        var kr = kapejs.getBoundingClientRect();
        var kCx = kr.left + kr.width / 2;

        var platums = Math.min(400, vw - 20);
        var labaMala;
        if (saurs) labaMala = vw - 10;
        else labaMala = Math.min(vw - 12, Math.max(pr.right + 10, Math.min(kCx + 48, pr.right + platums - 70)));
        var kreisa = labaMala - platums;
        var brivs = vh - augsa - (kr.height + 90);
        var kompakts = brivs < KOMPAKTS_MIN;
        var augstums = kompakts ? vh - augsa - 10 : Math.min(468, brivs);

        logs.style.left = kreisa + 'px';
        logs.style.top = augsa + 'px';
        logs.style.width = platums + 'px';
        logs.style.height = augstums + 'px';
        var asteX = Math.max(22, Math.min(platums - 22, pCx - kreisa));
        aste.style.left = asteX + 'px';
        logs.style.transformOrigin = asteX + 'px -10px';

        // kāpnes: no loga apakšas līdz Empanadillo paceltajām rokām
        var s = kr.width / 32;              // sprite mērogs (viewBox 32 plats)
        var T = { x: Math.max(kreisa + 26, Math.min(labaMala - 26, kCx)), y: augsa + augstums - 8 };
        var B = { x: kCx, y: kr.top + 6 * s };
        var dx = B.x - T.x, dy = B.y - T.y;
        var garums = Math.max(0, Math.hypot(dx, dy));
        var lenkis = -Math.atan2(dx, dy) * 180 / Math.PI;
        kapnes.style.left = (T.x - 11) + 'px';
        kapnes.style.top = T.y + 'px';
        kapnes.style.height = garums + 'px';
        kapnes.style.setProperty('--bju-lenkis', lenkis + 'deg');
        geo = { T: T, B: B, garums: garums, kr: kr, s: s, kompakts: kompakts || garums < 30 };
    }

    // ---------- Atvēršana / aizvēršana ----------
    var stav = 'aizverts';
    var taimeri = [];
    var anim = [];
    function velak(f, ms) { taimeri.push(setTimeout(f, ms)); }
    function apturet() {
        taimeri.forEach(clearTimeout); taimeri = [];
        anim.forEach(function (a) { try { a.cancel(); } catch (e) {} }); anim = [];
    }
    function kapejaPoza(p) { kapejs.setAttribute('data-poza', p); }

    function ieradies() {
        if (ieradiesAtrisinat) { ieradiesAtrisinat(); ieradiesAtrisinat = null; }
        logs.classList.add('bju-logs--klat');
        var g = saruna.querySelector('.bju-gaida');
        if (g) g.remove();
        kapejs.classList.remove('redzams');
        kBurbulis.hidden = true;
        if (stav === 'atver') stav = 'atverts';
    }

    function atvert() {
        if (stav !== 'aizverts') return;
        stav = 'atver';
        var mob = document.querySelector('.izvelnes-poga[aria-expanded="true"]');
        if (mob) mob.click();
        if (E.kluset) E.kluset();
        apturet();

        ieradiesP = new Promise(function (r) { ieradiesAtrisinat = r; });
        html.classList.add('bju-atverts');
        poga.setAttribute('aria-expanded', 'true');
        kapejs.className = 'bju-kapejs empa empa--mazs';
        kapejaPoza('prieksa');
        kapnes.className = 'bju-kapnes';
        izkartot();
        logs.hidden = false;
        void logs.offsetWidth;
        logs.classList.add('redzams');
        setTimeout(function () { lauks.focus({ preventScroll: true }); }, mazaKustiba ? 0 : 250);

        if (!saruna.children.length) {
            empa(T.sveiciens);
            saraksts();
        }

        if (mazaKustiba || geo.kompakts) { ieradies(); return; }

        if (!saruna.querySelector('.bju-gaida')) {
            var g = el('li', 'bju-gaida', 'Empanadillo kāpj augšā pa kāpnēm…');
            saruna.appendChild(g);
            ritinat();
        }

        // 1) Empanadillo stūrī (tā pati vieta, kur stūra palīgs), 2) kāpnes nolaižas un izšūpojas
        kapejaPoza('prieksa');
        kapejs.classList.add('redzams');
        velak(function () { kapnes.classList.add('nolaistas'); }, 280);
        // 3) pagriežas — pikseļu dibentiņš — un saka "Un momento…"
        velak(function () {
            kapejs.classList.add('griezas');
            velak(function () { kapejaPoza('mugura'); }, 130);
            velak(function () {
                kapejs.classList.remove('griezas');
                kapejs.classList.add('luncina');
                kBurbulis.textContent = T.momento;
                kBurbulis.hidden = false;
            }, 280);
        }, 1500);
        // 4) kāpj augšā pa kāpnēm un pazūd logā
        velak(function () {
            kapejs.classList.remove('luncina');
            kapejaPoza('kapj');
            var g = geo;
            var ux = (g.T.x - g.B.x) / (g.garums || 1), uy = (g.T.y - g.B.y) / (g.garums || 1);
            var vajag = (g.kr.bottom - g.T.y + 6) / Math.max(0.3, -uy); // līdz kājas paslēpjas aiz loga
            var ilgums = Math.max(1400, Math.min(3200, vajag * 7));
            var a = kFigura.animate([
                { transform: 'translate(0, 0)' },
                { transform: 'translate(' + (ux * vajag) + 'px,' + (uy * vajag) + 'px)' }
            ], { duration: ilgums, easing: 'linear', fill: 'forwards' });
            anim.push(a);
            velak(function () { kBurbulis.hidden = true; }, ilgums * 0.62);
            // taimeris, nevis onfinish: fona cilnē animācijas var apstāties, bet logam jāatveras
            velak(function () { if (stav === 'atver') ieradies(); }, ilgums + 30);
        }, 3300);
    }

    function aizvert() {
        if (stav !== 'atverts' && stav !== 'atver') return;
        var bijaKlat = stav === 'atverts' || logs.classList.contains('bju-logs--klat');
        var m = new DOMMatrixReadOnly(getComputedStyle(kFigura).transform === 'none' ? undefined : getComputedStyle(kFigura).transform);
        stav = 'aizver';
        apturet();
        if (ieradiesAtrisinat) { ieradiesAtrisinat(); ieradiesAtrisinat = null; }
        var fokussIeksa = logs.contains(document.activeElement);
        logs.classList.remove('redzams', 'bju-logs--klat');
        poga.setAttribute('aria-expanded', 'false');
        kBurbulis.hidden = true;

        function beigas() {
            logs.hidden = true;
            kapnes.className = 'bju-kapnes';
            kapejs.className = 'bju-kapejs empa empa--mazs';
            kFigura.style.transform = '';
            html.classList.remove('bju-atverts');
            if (E.pamaj) E.pamaj();
            stav = 'aizverts';
        }
        if (fokussIeksa) poga.focus();

        if (mazaKustiba || !geo || geo.kompakts) { setTimeout(beigas, mazaKustiba ? 0 : 220); return; }

        // Empanadillo parādās pie kāpņu augšas (rokas augšā) un nolec uz savu vietu stūrī
        var g = geo;
        var sakX, sakY;
        if (bijaKlat) {
            sakX = g.T.x - (g.kr.left + g.kr.width / 2);
            sakY = g.T.y - 3 * g.s - g.kr.top; // rokas pie kāpņu augšas
        } else {
            // vēl kāpa: lec no turienes, kur ir
            sakX = m.m41; sakY = m.m42;
        }
        kapejs.classList.add('redzams');
        kapejaPoza('lec');
        var kadri = [];
        var N = 18, augstums = Math.min(70, 30 + Math.abs(sakY) * 0.15);
        for (var i = 0; i <= N; i++) {
            var t = i / N;
            var tt = Math.pow(t, 1.35);           // krītot paātrinās
            var x = sakX * (1 - t);
            var y = sakY * (1 - tt) - augstums * 4 * t * (1 - t);
            kadri.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)', offset: t });
        }
        var ilgums = Math.max(650, Math.min(1100, 500 + Math.abs(sakY) * 0.8));
        var a = kFigura.animate(kadri, { duration: ilgums, easing: 'linear', fill: 'forwards' });
        anim.push(a);
        velak(function () { kapnes.classList.remove('nolaistas'); kapnes.classList.add('sarullejas'); }, 120);
        velak(function () {
            kapejaPoza('prieksa');
            kFigura.style.transform = 'none';
            a.cancel();
            kapejs.classList.add('piezemejas');
            velak(beigas, 260);
        }, ilgums + 30);
        velak(function () { logs.hidden = true; }, 260);
    }

    poga.addEventListener('click', function () { if (stav === 'aizverts') atvert(); else aizvert(); });
    logs.querySelector('.bju-aizvert').addEventListener('click', aizvert);
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && (stav === 'atverts' || stav === 'atver')) {
            if (logs.contains(document.activeElement) || document.activeElement === poga || document.activeElement === document.body) aizvert();
        }
    });
    var rTaim = null;
    root.addEventListener('resize', function () {
        if (stav !== 'atverts') return;
        clearTimeout(rTaim);
        rTaim = setTimeout(izkartot, 80);
    });
})(window);
