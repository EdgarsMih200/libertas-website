/* EMPANADILLO — Libertas talismans (maza pikseļu stila empanada), kas sveicina apmeklētājus.
   Stūrī lapas apakšā; pirmajā apmeklējumā sesijā pats pasaka sveicienu.
   Klikšķis uz viņa — pastāsta savu pildījumu (katram apmeklētājam savu), tad nākamās frāzes. Decembrī (html.ziemassvetki) viņam ir Ziemassvētku cepure, bet 5. decembrī — ballītes cepure. */
(function () {
    var svetki = document.documentElement.classList.contains('ziemassvetki');
    // 5. decembrī (saimnieka dzimšanas diena) — ballītes cepure Ziemassvētku cepures vietā.
    // Pārbaudei jebkurā dienā: index.html?ballite=1
    var sodien = new Date();
    var dzimsanasDiena = (sodien.getMonth() === 11 && sodien.getDate() === 5) || /[?&]ballite=1\b/.test(location.search);

    var sveiciens = svetki
        ? '¡Feliz Navidad! Es esmu <b>Empanadillo</b>. Laipni lūdzam Libertas!'
        : '¡Hola! Es esmu <b>Empanadillo</b>. Laipni lūdzam Libertas!';
    var frazes = [
        'Apskati mūsu kursus zemāk: spāņu un angļu valoda A1!',
        'Vai zināji? Spāniski <i>empanar</i> nozīmē „ietīt mīklā”. Tāds esmu es!',
        'Runā, saproti, ceļo, audz! Es palīdzēšu tev sākt.',
        '¡Hasta luego! Uz tikšanos nodarbībās!'
    ];

    // Pikseļu zīmējums: katrs burts = viena krāsa, "." = caurspīdīgs
    var KRASAS = {
        O: '#4A2810', D: '#A8652A', M: '#D9963F', L: '#F0BE62', H: '#FBE3A0', S: '#B8742E',
        W: '#FFFFFF', K: '#2A1A10', P: '#E8796B', R: '#7A1A14', T: '#E0605A', F: '#8A5020',
        X: '#B3261E', B: '#8E1C17', G: '#D6D6D6', Y: '#F2C230', N: '#E85A8C', U: '#3B6FB6'
    };
    var KERMENIS = [
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
        '.OOMDLLSSLMMMMMRTTRMMMMDDDSDDDMMO.',
        '.OMDMLLMMMMMMSMMRRMMDDSDDDDDDMDMO.',
        '.ODMMMMMMMMMMMMMMDDDDDDDDDDDDMMDO.',
        '..OODDDDDDDDDDDDDDDDDDDDDDDDDDOO..',
        '....ODDDDDDDDDDDDDDDDDDDDDDDDO....',
        '.....OOOOOFFFFOOOOOOFFFFOOOOO.....',
        '.........OFFFFFO...OFFFFFO........',
        '..........OOOOO.....OOOOO.........'
    ];
    var ACIS = [
        '.WW........WW.',
        'WKKW......WKKW',
        'WHKW......WHKW',
        'WKKW......WKKW',
        '.WW........WW.'
    ];
    var ROKA_A = ['...OO.', '..OLLO', '..OLMO', '...OMO', '..OMMO', '.OMMO.', 'OMMO..'];
    var ROKA_B = ['......OO', '.....OLLO', '.....OLMO', '....OMMO.', '...OMMO..', '..OMMO...', 'OMMMO....'];
    var CEPURE = [
        '...................OO..',
        '..................OWWO.',
        '...........OOOO..OWWWWO',
        '........OOOXXXXOOOWGWO.',
        '......OOXXXXXXXXXXBOO..',
        '.....OXXXXXXXXXXXBBO...',
        '....OXXXXXXXXXXXBBO....',
        '...OXXXXXXXXXXXXBO.....',
        '..OWWWWWWWWWWWWWWWO....',
        '.OWWWWWWWWWWWWWWGGGO...',
        '..OGGGGGGGGGGGGGGOO....',
        '...OOOOOOOOOOOOOO......'
    ];

    var BALLITES_CEPURE = [
        '.......OO.......',
        '......OYYO......',
        '.....OYYYYO.....',
        '......OYYO......',
        '......ONNO......',
        '.....ONNYYO.....',
        '.....ONYYUO.....',
        '....ONYYUUNO....',
        '....OYYUUNNO....',
        '...OYYUUNNYYO...',
        '...OYUUNNYYUO...',
        '..OYUUNNYYUUNO..',
        '..OUUNNYYUUNNO..',
        '.OUUNNYYUUNNYYO.',
        '..OOOOOOOOOOOO..'
    ];

    // Pārvērš pikseļu rindas SVG taisnstūros (blakus esošus vienas krāsas pikseļus apvieno)
    function pikseli(rindas, ox, oy) {
        var s = '';
        rindas.forEach(function (r, y) {
            var x = 0;
            while (x < r.length) {
                var c = r[x];
                var len = 1;
                while (x + len < r.length && r[x + len] === c) len++;
                if (c !== '.') {
                    s += '<rect x="' + (x + ox) + '" y="' + (y + oy) + '" width="' + len + '" height="1" fill="' + KRASAS[c] + '"/>';
                }
                x += len;
            }
        });
        return s;
    }

    var svg =
        '<svg viewBox="0 -6 39 31" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
        '<g class="empa-roka empa-roka-a">' + pikseli(ROKA_A, 29, 6) + '</g>' +
        '<g class="empa-roka empa-roka-b">' + pikseli(ROKA_B, 29, 6) + '</g>' +
        pikseli(KERMENIS, 0, 0) +
        '<g class="empa-acis">' + pikseli(ACIS, 10, 11) + '</g>' +
        (dzimsanasDiena
            ? '<g class="empa-ballite">' + pikseli(BALLITES_CEPURE, 10, -10) + '</g>'
            : '<g class="empa-cepure">' + pikseli(CEPURE, 6, -6) + '</g>') +
        '</svg>';

    var wrap = document.createElement('div');
    wrap.className = 'empanadillo';
    wrap.innerHTML =
        '<div class="empa-burbulis" role="status" aria-live="polite" hidden>' +
        '<button type="button" class="empa-aizvert" aria-label="Aizvērt">&times;</button>' +
        '<p class="empa-teksts"></p></div>' +
        '<button type="button" class="empa-poga" aria-label="Empanadillo, Libertas talismans: parunāt">' + svg + '</button>';
    document.body.appendChild(wrap);

    var burbulis = wrap.querySelector('.empa-burbulis');
    var teksts = wrap.querySelector('.empa-teksts');
    var poga = wrap.querySelector('.empa-poga');
    var taimeris = null;
    var nakama = 0;

    function maj() {
        wrap.classList.remove('maj');
        void wrap.offsetWidth; // atsāk animāciju
        wrap.classList.add('maj');
    }

    function runat(html) {
        teksts.innerHTML = html;
        burbulis.hidden = false;
        maj();
        clearTimeout(taimeris);
        taimeris = setTimeout(kluset, 9000);
    }

    function kluset() {
        burbulis.hidden = true;
    }

    // Pildījums: katram apmeklētājam savs. Pieteicies lietotājs — pēc lietotāja id (vienmēr tas pats),
    // citiem — nejauši izvēlēts un atcerēts šajā pārlūkā (localStorage).
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

    function pildijumaNr() {
        var me = window.LIB && window.LIB.me;
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

    // Klikšķis: vispirms pastāsta savu pildījumu, tad pārējās frāzes pa kārtai
    poga.addEventListener('click', function () {
        runat(nakama === 0 ? pildijumaFraze() : frazes[nakama - 1]);
        nakama = (nakama + 1) % (frazes.length + 1);
    });
    poga.addEventListener('mouseenter', maj);
    wrap.querySelector('.empa-aizvert').addEventListener('click', kluset);

    // Ienāk lapā; sveicina vienreiz sesijā
    setTimeout(function () {
        wrap.classList.add('ieradies');
        var jauSveicinats = false;
        try { jauSveicinats = sessionStorage.getItem('empaSveiciens') === '1'; } catch (e) {}
        if (!jauSveicinats) {
            setTimeout(function () { runat(sveiciens); }, 700);
            try { sessionStorage.setItem('empaSveiciens', '1'); } catch (e) {}
        }
    }, 800);
})();
