/* EMPANADILLO CEĻOTĀJS — Libertas talismans (pikseļu empanada ar mugursomu un spieķi), kas sveicina apmeklētājus.
   Sprites: docs/redesign/mascot-final (sprites.js + usage.md). Katrs burts = viena krāsa no KRASAS, "." = caurspīdīgs.
   - Stūra palīgs (mazais, fiksēts apakšā pa labi) visās publiskajās lapās.
   - Sākumlapā lielais ceļotājs stāv hero ainavā ([data-empa-hero]); kamēr viņš redzams, stūra palīgs ir paslēpts
     (vienā ekrānā tikai viens Empanadillo).
   - Sveicina vienreiz sesijā (sessionStorage empaSveiciens). Klikšķis — vispirms savs pildījums (PILDIJUMI: pēc lietotāja
     id hash vai nejauši un atcerēts localStorage empaPildijums), tad frāzes. Hover/fokuss — māj.
   - Decembrī (html.ziemassvetki) Ziemassvētku cepure, 5. decembrī (vai ?ballite=1) — ballītes cepure tās vietā.
   - prefers-reduced-motion: statisks (bez ieslīdēšanas, šūpošanās, mirkšķināšanas, māšanas). */
(function (root) {
    'use strict';

    var KRASAS = {
        O: '#4A2810', F: '#8A5020', D: '#A8652A', S: '#B8742E', M: '#D9963F', L: '#F0BE62', H: '#FBE3A0',
        W: '#FFFDF8', K: '#2A1A10', P: '#E8796B', R: '#6B1D1D', A: '#6E3F27', V: '#A9BFA8',
        Z: '#A9C9DA', X: '#B23A2A', B: '#7E2620', G: '#D9CFC0', Y: '#F2C46A'
    };

    // ---- Lielais ķermenis (34×25) ----
    var KERMENIS_AUGSA = [
        '..................................',
        '..................................',
        '..................................',
        '............OOOOOOOOOO............',
        '..........OOHLDHLLHDLLOO..........',
        '........OODHLDHLDDLHDLLDOO........',
        '.......OLDHLDHLDHHDLLDLLDLO.......',
        '......OLDHLDHLLLLLLLLLDLLDMO......',
        '.....OLDHLDLLLLLLLLLLLLDLLDMO.....',
        '....OLDHLLHSSLLLLLLLLSSLLLMDMO....',
        '...OLDHLLHHLLLLLLLLLLLLLLLMMDMO...',
        '...ODHLDLLLLLLLLLLLLLLLLLLDMMDO...',
        '..ODHLDLLLLLLLLLLLLLLLLLMMMDMMDO..',
        '..OHLDLLLLLLLLLLLLLLLLLLMMMMDMMO..',
        '.OOLDLLLLLLLLLLLLLMMLLLLMMMMMDMMO.',
        'OLMOLLLLPPLLLLRMMMMRMLLMPPMMDMDMO.',
        'OMDOLLLLLLLLMMMRRRRMMMMMMSDDDMMDO.',
        '.OOMDLLSSLMMMMMRPPRMMMMDDDSDDDMMO.',
        '.OMDMLLMMMMMMSMMRRMMDDSDDDDDDMDMO.',
        '.ODMMMMMMMMMMMMMMDDDDDDDDDDDDMMDO.',
        '..OODDDDDDDDDDDDDDDDDDDDDDDDDDOO..',
        '....ODDDDDDDDDDDDDDDDDDDDDDDDO....',
        '.....OOOOOFFFFOOOOOOFFFFOOOOO.....'
    ];
    var KAJAS = ['.........OFFFFFO...OFFFFFO........', '..........OOOOO.....OOOOO.........'];
    var KAJAS_SOLIS_A = ['..........OOOOO....OFFFFFO........', '....................OOOOO.........'];
    var KAJAS_SOLIS_B = ['.........OFFFFFO....OOOOO.........', '..........OOOOO...................'];
    var KERMENIS = KERMENIS_AUGSA.concat(KAJAS);

    var ACIS = ['.WW........WW.', 'WKKW......WKKW', 'WHKW......WHKW', 'WKKW......WKKW', '.WW........WW.'];
    var ACIS_LEJA = ['.WW........WW.', 'WWWW......WWWW', 'WHKW......WHKW', 'WKKW......WKKW', '.KK........KK.'];
    var ACIS_PA_LABI = ['.WW........WW.', 'WWKK......WWKK', 'WWHK......WWHK', 'WWKK......WWKK', '.WW........WW.'];
    var UZACIS_APJUKUSI = ['.F........F.', 'FL........LF'];
    var MUTE_O = ['LMMMMM', 'MMRRMM', 'MRPPRM', 'MMRRMM'];

    var ROKA_A = ['...OO.', '..OLLO', '..OLMO', '...OMO', '..OMMO', '.OMMO.', 'OMMO..'];
    var ROKA_B = ['......OO', '.....OLLO', '.....OLMO', '....OMMO.', '...OMMO..', '..OMMO...', 'OMMMO....'];
    var ROKA_MIERS = ['.OO..', 'OMMO.', 'OMMO.', '.OMMO', '.OLLO', '..OO.'];
    var ROKA_RADA = ['..OOOO....', '.OMMMLOOO.', 'OMMMMLLLLO', 'OMMMMLLOO.', '.OOOOOO...'];

    var MUGURSOMA = [
        '.OOOOOOOOOO.', 'OVVAVVVVAVVO', 'OVVAVVVVAVVO', '.OOOOOOOOOO.', '.OFFFFFFFO..', '.OFFFFFFFO..',
        '.OOOOLOOOO..', '.OAAALAAAO..', '.OAAAAAAAO..', '.OAAAAAAAO..', '.OAAAAAAAO..', '.OAAAAAAAO..',
        '.OAAAAAAAO..', '.OAAAAAAAO..', '.OAAAAAAAO..', '.OAAAAAAAO..', '.OAAAAAAAO..', '..OAAAAAO...', '...OOOOO....'
    ];
    var SIKSNA = ['.........AA', '........AA.', '.......AA..', '......AA...', '.....LA....',
        '....AL.....', '...AA......', '..AA.......', '.AA........', 'AA.........'];
    var NUJA = ['OOO', 'OHO', 'OVO', 'OVO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO',
        'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'OOO'];
    var ROKA_K = ['.OOO.......', 'OLLLO......', 'OLMMO......', 'OMMMMO.....', '.OOMMMO....',
        '...OMMMO...', '....OMMMO..', '.....OMMMO.', '......OMMMO', '.......OOOO'];
    var KARTE = [
        'OOOOOOOOOOOOOOOOOOOO', 'OWVVWWWWWGWWWWWRWRWO', 'OVVVWWWRRGWRRWWWRWWO',
        'OWVWWRRWWGWWWVVRWRWO', 'OWWRRWWWWGWWVVVVWWWO', 'OOOOOOOOOOOOOOOOOOOO'
    ];
    var KEPAS_KARTE = ['.OO..................OO.', 'OLLO................OLLO', 'OMMO................OMMO', '.OO..................OO.'];
    var SVIEDRI = ['.O..', 'OZO.', 'OZZO', 'OWZO', '.OO.'];
    var JAUTAJUMS = ['.RRR.', 'R...R', '....R', '..RR.', '..R..', '.....', '..R..'];

    var CEPURE = [
        '...................OO..', '..................OWWO.', '...........OOOO..OWWWWO', '........OOOXXXXOOOWGWO.',
        '......OOXXXXXXXXXXBOO..', '.....OXXXXXXXXXXXBBO...', '....OXXXXXXXXXXXBBO....', '...OXXXXXXXXXXXXBO.....',
        '..OWWWWWWWWWWWWWWWO....', '.OWWWWWWWWWWWWWWGGGO...', '..OGGGGGGGGGGGGGGOO....', '...OOOOOOOOOOOOOO......'
    ];
    var BALLITES_CEPURE = [
        '.......OO.......', '......OYYO......', '.....OYYYYO.....', '......OYYO......', '......OPPO......',
        '.....OPPYYO.....', '.....OPYYVO.....', '....OPYYVVPO....', '....OYYVVPPO....', '...OYYVVPPYYO...',
        '...OYVVPPYYVO...', '..OYVVPPYYVVPO..', '..OVVPPYYVVPPO..', '.OVVPPYYVVPPYYO.', '..OOOOOOOOOOOO..'
    ];

    // ---- Mazais (30×19) stūra pogai ----
    var MAZAIS_KERMENIS = [
        '..........OOOOOOOOOO..........', '........OOHLDHLLHDLLOO........', '......OODHLDHLDDLHDLLDOO......',
        '.....OLDHLDHLLLLLLLDLLDMO.....', '....OLDHLDLLLLLLLLLLDLLDMO....', '...OLDHLHSSLLLLLLLLSSLLMDMO...',
        '..OLDHLLHLLLLLLLLLLLLLLMMDMO..', '..ODHLDLLLLLLLLLLLLLLLMDMMDO..', '.ODHLDLLLLLLLLLLLLLLLLMMMDMDO.',
        '.OOLDLLLLLLLLLLLLLLLLMMMMDMMO.', 'OLMOLLLLLLLLLLLLLLLLLMMMDMDMO.', 'OMDOLLPPLLLLRMMMMRMMMMPPMDMDO.',
        '.OOMDLLLLLLLMRRRRMMMMMMSDDDMO.', '.OMDMLSSLMMMMRPPRMMMMDDDSDDMO.', '.ODMMMMMMMMMMMRRMMDDDDDDDMMDO.',
        '..OODDDDDDDDDDDDDDDDDDDDDDOO..', '....OOOOOFFFFOOOOFFFFOOOOO....', '........OFFFFFO.OFFFFFO.......',
        '.........OOOOO...OOOOO........'
    ];
    var MAZA_ROKA_A = ['..OO.', '.OLLO', '.OLMO', '.OMO.', '.OMO.', 'OMMO.'];
    var MAZA_ROKA_B = ['...OO.', '..OLLO', '..OLMO', '.OMMO.', 'OMMO..', 'OMO...'];
    var MAZA_SOMA = ['.OOOOO.', 'OVAVVAO', 'OVAVVAO', '.OOOOO.', '.OAAAO.', '.OAAO..', '.OAAO..', '.OAO...', '..O....'];
    var MAZA_SIKSNA = ['.......AA', '......AA.', '.....AA..', '....LA...', '...AL....', '..AA.....', '.AA......', 'AA.......'];
    var MAZA_CEPURE = [
        '................OO.', '.........OOO...OWWO', '......OOOXXXOOOWGWO', '....OOXXXXXXXXBOOO.',
        '...OXXXXXXXXXBBO...', '..OXXXXXXXXXXBO....', '.OWWWWWWWWWWWWWO...', 'OWWWWWWWWWWWWGGGO..', '.OOOOOOOOOOOOOOO...'
    ];
    var MAZA_BALLITE = [
        '.....OO.....', '....OYYO....', '....OPPO....', '....OYVO....', '...OYVVPO...',
        '...OVVPPO...', '..OVPPYYVO..', '..OPPYYVVO..', '.OPYYVVPPYO.', '..OOOOOOOO..'
    ];

    // ---- Slāņi: [režģis, x, y, klase], zīmēšanas secībā (aizmugure -> priekša) ----
    var SOMA = [MUGURSOMA, -6, 1, 'empa-soma'];
    var NUJA_S = [NUJA, -9, 3, 'empa-nuja'];
    var ROKA_K_S = [ROKA_K, -10, 8, 'empa-roka-k'];
    var SIKSNA_S = [SIKSNA, 3, 4, 'empa-siksna'];
    var KERM = [KERMENIS, 0, 0];
    var ACIS_S = [ACIS, 10, 11, 'empa-acis'];
    var MIERS = [ROKA_MIERS, 31, 13, 'empa-roka empa-roka-miers'];
    var VICINA_A = [ROKA_A, 29, 6, 'empa-roka empa-roka-a'];
    var VICINA_B = [ROKA_B, 29, 6, 'empa-roka empa-roka-b'];

    var POZAS = {
        miera: [[SOMA, NUJA_S, ROKA_K_S, MIERS, KERM, SIKSNA_S, ACIS_S]],
        vicina: [[SOMA, NUJA_S, ROKA_K_S, VICINA_A, KERM, SIKSNA_S, ACIS_S],
                 [SOMA, NUJA_S, ROKA_K_S, VICINA_B, KERM, SIKSNA_S, ACIS_S]],
        lasa: [[SOMA, KERM, SIKSNA_S, [ACIS_LEJA, 10, 11, 'empa-acis'], [KARTE, 7, 18, 'empa-karte'], [KEPAS_KARTE, 5, 19]]],
        rada: [[SOMA, NUJA_S, ROKA_K_S, [ROKA_RADA, 30, 12, 'empa-roka'], KERM, SIKSNA_S, [ACIS_PA_LABI, 10, 11, 'empa-acis']]],
        apjucis: [[SOMA, NUJA_S, ROKA_K_S, MIERS, KERM, SIKSNA_S, ACIS_S,
            [UZACIS_APJUKUSI, 11, 8], [MUTE_O, 14, 15], [SVIEDRI, 29, 4], [JAUTAJUMS, 34, -4, 'empa-jautajums']]],
        ielade: [
            [SOMA, [NUJA, -9, 2, 'empa-nuja'], [ROKA_K, -10, 7, 'empa-roka-k'], MIERS, [KERMENIS_AUGSA, 0, 0], [KAJAS_SOLIS_A, 0, 23], SIKSNA_S, ACIS_S],
            [SOMA, NUJA_S, ROKA_K_S, MIERS, [KERMENIS_AUGSA, 0, 0], [KAJAS_SOLIS_B, 0, 23], SIKSNA_S, ACIS_S]
        ],
        // vietnei: miera roka + abi māšanas kadri vienā zīmējumā (CSS pārslēdz ar .maj)
        sveicina: [[SOMA, NUJA_S, ROKA_K_S, MIERS, VICINA_A, VICINA_B, KERM, SIKSNA_S, ACIS_S]]
    };

    var M_SOMA = [MAZA_SOMA, -2, 1, 'empa-soma'];
    var M_KERM = [MAZAIS_KERMENIS, 0, 0];
    var M_ACIS = [ACIS, 8, 7, 'empa-acis'];
    var M_SIKSNA = [MAZA_SIKSNA, 3, 1, 'empa-siksna'];
    var M_A = [MAZA_ROKA_A, 23, 0, 'empa-roka empa-roka-a'];
    var M_B = [MAZA_ROKA_B, 24, 0, 'empa-roka empa-roka-b'];
    var MAZAIS = {
        vicina: [[M_SOMA, M_A, M_KERM, M_SIKSNA, M_ACIS], [M_SOMA, M_B, M_KERM, M_SIKSNA, M_ACIS]],
        sveicina: [[M_SOMA, M_A, M_B, M_KERM, M_SIKSNA, M_ACIS]]
    };

    var CEPURES = { santa: [CEPURE, 6, -6, 'empa-cepure'], ballite: [BALLITES_CEPURE, 10, -10, 'empa-ballite'] };
    var MAZAS_CEPURES = { santa: [MAZA_CEPURE, 6, -6, 'empa-cepure'], ballite: [MAZA_BALLITE, 9, -8, 'empa-ballite'] };

    var VIEWBOX = [-11, -10, 52, 35];       // lielais: ×2 = 104 px, ×3 = 156, ×4 = 208
    var VIEWBOX_MAZAIS = [-2, -8, 32, 27];  // mazais: ×2 = 64 px, ×3 = 96
    var ENA = { lielais: [14, 24.7, 22, 1.6], mazais: [14.5, 18.7, 13, 1.2] };

    // Pārvērš pikseļu rindas SVG taisnstūros (blakus esošus vienas krāsas pikseļus apvieno)
    function pikseli(rindas, ox, oy) {
        var s = '';
        rindas.forEach(function (r, y) {
            var x = 0;
            while (x < r.length) {
                var c = r[x], len = 1;
                while (x + len < r.length && r[x + len] === c) len++;
                if (c !== '.') s += '<rect x="' + (x + ox) + '" y="' + (y + oy) + '" width="' + len + '" height="1" fill="' + KRASAS[c] + '"/>';
                x += len;
            }
        });
        return s;
    }

    function slanis(l) {
        var r = pikseli(l[0], l[1], l[2]);
        return l[3] ? '<g class="' + l[3] + '">' + r + '</g>' : r;
    }

    /* svg(poza, { mazais, frame, animate, hat: 'santa'|'ballite', shadow, label, scale }) -> '<svg …>' */
    function svg(poza, o) {
        o = o || {};
        var kadri = (o.mazais ? MAZAIS : POZAS)[poza] || POZAS.miera;
        var cepure = o.hat && (o.mazais ? MAZAS_CEPURES : CEPURES)[o.hat];
        function kadrs(slani) {
            slani = slani.slice();
            if (cepure) slani.push(cepure);
            return slani.map(slanis).join('');
        }
        var vb = o.mazais ? VIEWBOX_MAZAIS : VIEWBOX;
        var e = ENA[o.mazais ? 'mazais' : 'lielais'];
        var ena = o.shadow === false ? '' :
            '<ellipse class="empa-ena" cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] +
            '" fill="#1E2E29" opacity=".16" shape-rendering="geometricPrecision"/>';
        var saturs = o.animate && kadri.length > 1
            ? kadri.map(function (k, i) { return '<g class="empa-kadrs empa-kadrs-' + i + '">' + kadrs(k) + '</g>'; }).join('')
            : kadrs(kadri[(o.frame || 0) % kadri.length]);
        var izm = o.scale ? ' width="' + vb[2] * o.scale + '" height="' + vb[3] * o.scale + '"' : '';
        return '<svg viewBox="' + vb.join(' ') + '"' + izm + ' shape-rendering="crispEdges"' +
            (o.label ? ' role="img" aria-label="' + o.label + '"' : ' aria-hidden="true" focusable="false"') + '>' +
            ena + '<g class="empa-figura">' + saturs + '</g></svg>';
    }

    root.EMPANADILLO = { KRASAS: KRASAS, POZAS: POZAS, MAZAIS: MAZAIS, svg: svg };

    // ================= Uzvedība lapā =================
    var html = document.documentElement;
    var q = location.search;
    var sodien = new Date();
    var dzimsanasDiena = (sodien.getMonth() === 11 && sodien.getDate() === 5) || /[?&]ballite=1\b/.test(q);
    var cepure = dzimsanasDiena ? 'ballite' : 'santa'; // Santa redzama tikai zem html.ziemassvetki (CSS)
    var mazaKustiba = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var platsEkrans = window.matchMedia ? matchMedia('(min-width: 900px)') : { matches: true };

    var sveiciens = html.classList.contains('ziemassvetki')
        ? '¡Feliz Navidad! Es esmu <b>Empanadillo</b>. Laipni lūdzam Libertas!'
        : '¡Hola! Es esmu <b>Empanadillo</b>. Laipni lūdzam Libertas!';
    var frazes = [
        'Apskati mūsu kursus: spāņu un angļu valoda!',
        'Vai zināji? Spāniski <i>empanar</i> nozīmē „ietīt mīklā”. Tāds esmu es!',
        'Runā, saproti, ceļo, audz! Es palīdzēšu tev sākt.',
        '¡Hasta luego! Uz tikšanos nodarbībās!'
    ];

    var PILDIJUMI = [
        ['carne', 'sulīga liellopu gaļa ar sīpoliem un olīvām'],
        ['pollo', 'vista ar sarkano papriku'],
        ['jamón y queso', 'šķiņķis un kūstošs siers'],
        ['espinaca', 'spināti ar rikotas sieru'],
        ['humita', 'saldā kukurūza ar baltu mērci'],
        ['atún', 'tunzivs ar tomātiem un olu'],
        ['champiñones', 'sēnes ar sieru un ķiplokiem'],
        ['dulce de leche', 'saldais karamelizētais piena krēms']
    ];

    // Pildījums: pieteicies lietotājs — pēc id (vienmēr tas pats), citiem — nejaušs un atcerēts šajā pārlūkā
    function pildijumaNr() {
        var me = root.LIB && root.LIB.me;
        var id = me && me.user && (me.user.id || me.user.email);
        if (id) {
            var h = 0;
            String(id).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
            return h % PILDIJUMI.length;
        }
        var nr = null;
        try { nr = parseInt(localStorage.getItem('empaPildijums'), 10); } catch (e) {}
        if (!(nr >= 0 && nr < PILDIJUMI.length)) {
            nr = Math.floor(Math.random() * PILDIJUMI.length);
            try { localStorage.setItem('empaPildijums', String(nr)); } catch (e) {}
        }
        return nr;
    }

    function pildijumaFraze() {
        var p = PILDIJUMI[pildijumaNr()];
        return 'Gribi zināt, kas man iekšā? Tev es esmu <b>empanada de ' + p[0] + '</b>: ' + p[1] + '!';
    }

    // Viens Empanadillo (poga + runas burbulis). veids: 'sturis' | 'hero'
    function izveidot(veids) {
        var liels = veids === 'hero';
        var el = document.createElement('div');
        el.className = liels ? 'empa empa--liels' : 'empanadillo empa empa--mazs';
        el.innerHTML =
            '<div class="empa-burbulis" role="status" aria-live="polite" hidden>' +
            '<button type="button" class="empa-aizvert" aria-label="Aizvērt">&times;</button>' +
            '<p class="empa-teksts"></p></div>' +
            '<button type="button" class="empa-poga" aria-label="Empanadillo — Libertas talismans: parunāt">' +
            svg('sveicina', { mazais: !liels, hat: cepure, scale: liels ? 4 : 3 }) + '</button>';
        var e = {
            el: el,
            poga: el.querySelector('.empa-poga'),
            burbulis: el.querySelector('.empa-burbulis'),
            teksts: el.querySelector('.empa-teksts'),
            taimeris: null
        };
        e.poga.addEventListener('click', function () { runat(e, nakamaFraze()); });
        e.poga.addEventListener('mouseenter', function () { maj(e); });
        e.poga.addEventListener('focus', function () { maj(e); });
        el.querySelector('.empa-aizvert').addEventListener('click', function () { kluset(e); e.poga.focus(); });
        return e;
    }

    var nakama = 0;
    function nakamaFraze() {
        var t = nakama === 0 ? pildijumaFraze() : frazes[nakama - 1];
        nakama = (nakama + 1) % (frazes.length + 1);
        return t;
    }

    function maj(e) {
        if (mazaKustiba) return;
        e.el.classList.remove('maj');
        void e.el.offsetWidth; // atsāk animāciju
        e.el.classList.add('maj');
    }

    function runat(e, teksts) {
        [sturis, hero].forEach(function (c) { if (c && c !== e) kluset(c); });
        e.teksts.innerHTML = teksts;
        e.burbulis.hidden = false;
        maj(e);
        clearTimeout(e.taimeris);
        e.taimeris = setTimeout(function () { kluset(e); }, 9000);
    }

    function kluset(e) {
        if (!e) return;
        e.burbulis.hidden = true;
        clearTimeout(e.taimeris);
    }

    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') { kluset(sturis); kluset(hero); }
    });

    var sturis = izveidot('sturis');
    document.body.appendChild(sturis.el);

    var heroVieta = document.querySelector('[data-empa-hero]');
    var hero = heroVieta ? izveidot('hero') : null;
    var heroRedzams = false;
    if (hero) {
        heroVieta.appendChild(hero.el);
        heroRedzams = true; // līdz pirmajam IntersectionObserver ziņojumam (hero ir lapas augšā)
    }

    var ieradies = false;
    var jaSveicina = false;
    try { jaSveicina = sessionStorage.getItem('empaSveiciens') !== '1'; } catch (e) {}

    function sveicinat(e) {
        if (!jaSveicina) return;
        jaSveicina = false;
        try { sessionStorage.setItem('empaSveiciens', '1'); } catch (x) {}
        setTimeout(function () { runat(e, sveiciens); }, mazaKustiba ? 0 : 700);
    }

    // Stūra palīgs redzams tikai tad, kad hero ceļotājs nav ekrānā
    function atjaunot() {
        var radit = ieradies && !heroRedzams;
        sturis.el.classList.toggle('ieradies', radit);
        if (!radit) kluset(sturis);
        if (!ieradies) return;
        if (heroRedzams) {
            if (platsEkrans.matches) sveicinat(hero); // šaurā ekrānā sveiciens gaida stūra palīgu
        } else {
            sveicinat(sturis);
        }
    }

    if (hero && 'IntersectionObserver' in root) {
        new IntersectionObserver(function (ieraksti) {
            heroRedzams = ieraksti[0].isIntersecting;
            if (!heroRedzams) kluset(hero);
            atjaunot();
        }).observe(heroVieta);
    } else if (hero) {
        heroRedzams = false; // vecs pārlūks: rāda abus, bet sveic stūrī
    }

    setTimeout(function () {
        ieradies = true;
        if (hero) maj(hero); // ceļotājs pamāj, ierodoties (vicina -> miera)
        atjaunot();
    }, mazaKustiba ? 0 : 800);
})(window);
