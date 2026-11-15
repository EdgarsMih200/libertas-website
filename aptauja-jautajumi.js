// APTAUJA — jautājumi un iestatījumi (ES modulis). Izmanto aptauja.js (lapa), admin.js (rezultāti) un worker/aptauja.js (BEIGAS).
// Tips: 'epasts' | 'viens' | 'vairaki' | 'skala' (1–5) | 'nps' (0–10) | 'teksts' | 'info' (tikai teksts).
// ja(a) — rāda jautājumu tikai, ja atgriež true (a = līdzšinējās atbildes). Opcija { cits: true } atver teksta lauku (atbilde id + '_cits').
// { vienigais: true } — izvēloties to, pārējās noņem (piem., "Neko"). komentars — papildu teksta lauks (atbilde id + '_k').

// Aptaujas beigas un izloze. TĀDS PATS datums ir script.js (APTAUJAS_BEIGAS) — maini abus.
export const BEIGAS = '2026-12-15T23:59:59+02:00';
export const IZLOZES_DATUMS = '17. decembrī';

const o = (v, t, x) => Object.assign({ v, t }, x || {});
const cits = (t) => o('cits', t || 'Cits', { cits: true });
const izmantojaKursu = (a) => (a.izmantoja || []).some((v) => v === 'grupa' || v === 'tiessaiste');

export const DALAS = { par: 'Par tevi', libertas: 'Libertas', zimols: 'Logo, sauklis un talismans', valodas: 'Valodu mācīšanās', beigas: 'Noslēgums' };

export const JAUTAJUMI = [
  // 1. Par tevi
  { id: 'epasts', nr: '1.1.', dala: 'par', tips: 'epasts', teksts: 'Tavs e-pasts',
    apaksa: 'Nav obligāts. Norādi to tikai tad, ja vēlies piedalīties izlozē.' },
  { id: 'vecums', nr: '1.2.', dala: 'par', tips: 'viens', teksts: 'Tavs vecums',
    opc: [o('lidz18', 'Līdz 18'), o('18-24', '18–24'), o('25-34', '25–34'), o('35-44', '35–44'), o('45-54', '45–54'), o('55+', '55+')] },
  { id: 'regions', nr: '1.3.', dala: 'par', tips: 'viens', teksts: 'Kur tu dzīvo?',
    opc: [o('riga', 'Rīga'), o('pieriga', 'Pierīga'), o('kurzeme', 'Kurzeme'), o('zemgale', 'Zemgale'), o('vidzeme', 'Vidzeme'), o('latgale', 'Latgale'), o('arzemes', 'Ārpus Latvijas')] },
  { id: 'nodarbosanas', nr: '1.4.', dala: 'par', tips: 'viens', teksts: 'Ar ko tu nodarbojies?',
    opc: [o('skolens', 'Skolēns'), o('students', 'Students'), o('strada', 'Strādāju'), o('uznemejs', 'Uzņēmējs'), o('majas', 'Esmu mājās ar bērniem'), o('pensionars', 'Pensionārs'), cits()] },

  // 2. Libertas
  { id: 'dzirdejis', nr: '2.1.', dala: 'libertas', tips: 'viens', teksts: 'Vai tev ir dzirdēts nosaukums “Libertas”?',
    opc: [o('ja', 'Jā'), o('ne', 'Nē / neesmu pārliecināts')] },

  { id: 'kur_dzirdeja', nr: '2A.1.', dala: 'libertas', tips: 'viens', teksts: 'Kur tu dzirdēji par Libertas?', ja: (a) => a.dzirdejis === 'ja',
    opc: [o('draugi', 'Draugi vai ieteikums'), o('soc', 'Instagram / Facebook'), o('google', 'Google'), o('reklama', 'Reklāma'), cits()] },
  { id: 'majaslapa', nr: '2A.2.', dala: 'libertas', tips: 'viens', teksts: 'Vai tu kādreiz apmeklēji mājaslapu libertas.study?', ja: (a) => a.dzirdejis === 'ja',
    opc: [o('ja', 'Jā'), o('ne', 'Nē')] },
  { id: 'registracija', nr: '2A.3.', dala: 'libertas', tips: 'viens', teksts: 'Vai tu reģistrējies mājaslapā?', ja: (a) => a.dzirdejis === 'ja' && a.majaslapa === 'ja',
    opc: [o('ja', 'Jā'), o('ne', 'Nē, neredzēju vajadzību'), o('neizdevas', 'Mēģināju, bet neizdevās', { cits: true, citsVieta: 'Kas traucēja?' })] },
  { id: 'navigacija', nr: '2A.4.', dala: 'libertas', tips: 'skala', teksts: 'Cik viegli mājaslapā bija atrast vajadzīgo?', ja: (a) => a.dzirdejis === 'ja' && a.majaslapa === 'ja',
    galas: ['Ļoti grūti', 'Ļoti viegli'] },
  { id: 'problemas', nr: '2A.5.', dala: 'libertas', tips: 'teksts', teksts: 'Vai kaut kas bija neskaidrs vai nestrādāja?', ja: (a) => a.dzirdejis === 'ja' && a.majaslapa === 'ja',
    apaksa: 'Nav obligāti.' },
  { id: 'izmantoja', nr: '2A.6.', dala: 'libertas', tips: 'vairaki', teksts: 'Ko no Libertas piedāvājuma tu izmantoji?', apaksa: 'Vari izvēlēties vairākus.', ja: (a) => a.dzirdejis === 'ja',
    opc: [o('grupa', 'Grupas kurss'), o('tiessaiste', 'Tiešsaistes kurss'), o('materiali', 'Bezmaksas materiāli'), o('uzdevumi', 'Uzdevumi / izrunas rīks'), o('advente', 'Adventes kalendārs'), o('neko', 'Neko', { vienigais: true })] },
  { id: 'kursa_vertejums', nr: '2A.7.', dala: 'libertas', tips: 'skala', teksts: 'Cik apmierināts biji ar kursu kopumā?', ja: (a) => a.dzirdejis === 'ja' && izmantojaKursu(a),
    galas: ['Nemaz', 'Ļoti apmierināts'], komentars: 'Ko varam uzlabot? (nav obligāti)' },
  { id: 'ieteiktu', nr: '2A.8.', dala: 'libertas', tips: 'nps', teksts: 'Cik ticami ir, ka tu ieteiktu Libertas draugam?', ja: (a) => a.dzirdejis === 'ja',
    galas: ['Noteikti neieteiktu', 'Noteikti ieteiktu'] },

  { id: 'minejums', nr: '2B.1.', dala: 'libertas', tips: 'viens', teksts: 'Kā tev šķiet, ar ko nodarbojas uzņēmums ar nosaukumu “Libertas”?', ja: (a) => a.dzirdejis === 'ne',
    opc: [o('valodas', 'Valodu skola vai izglītība'), o('celojumi', 'Ceļojumu aģentūra'), o('juridiski', 'Juridiskie pakalpojumi'), o('finanses', 'Finanses vai apdrošināšana'), o('mode', 'Apģērbu vai modes zīmols'), o('bezpelnas', 'Bezpeļņas vai sabiedriska organizācija'), o('kafejnica', 'Kafejnīca vai restorāns'), o('nezinu', 'Nav ne jausmas'), cits()] },
  { id: 'skaidrojums', nr: '2B.2.', dala: 'libertas', tips: 'info', ja: (a) => a.dzirdejis === 'ne', virsraksts: 'Paldies par minējumu!',
    teksts: '**Libertas** ir **valodu skola**. Mēs mācām spāņu un angļu valodu gan grupās ar pasniedzēju, gan tiešsaistes kursos savā tempā. Nosaukums nāk no latīņu valodas un nozīmē “brīvība”, jo valoda dod brīvību runāt, saprast un ceļot.' },

  // 3. Logo, sauklis, talismans
  { id: 'logo_emocijas', nr: '3.1.', dala: 'zimols', tips: 'vairaki', max: 3, attels: 'logo', teksts: 'Kādas emocijas tev rada šis logo?', apaksa: 'Izvēlies līdz 3.',
    opc: [o('miers', 'Miers'), o('prieks', 'Prieks'), o('briviba', 'Brīvība'), o('uzticiba', 'Uzticība'), o('zinkare', 'Ziņkāre'), o('iedvesma', 'Iedvesma'), o('siltums', 'Siltums'), o('nopietniba', 'Nopietnība'), o('neko', 'Neko īpašu', { vienigais: true }), cits()] },
  { id: 'logo_asociacijas', nr: '3.2.', dala: 'zimols', tips: 'vairaki', max: 3, attels: 'logo', teksts: 'Ar ko tev asociējas logo?', apaksa: 'Izvēlies līdz 3.',
    opc: [o('kalni', 'Kalni'), o('daba', 'Daba'), o('celojumi', 'Ceļojumi'), o('piedzivojumi', 'Piedzīvojumi'), o('briviba', 'Brīvība'), o('izglitiba', 'Izglītība'), o('izaugsme', 'Izaugsme'), o('latvija', 'Latvija'), o('elegance', 'Elegance'), cits()] },
  { id: 'sauklis_nozime', nr: '3.3.', dala: 'zimols', tips: 'viens', attels: 'sauklis', teksts: 'Ko, tavuprāt, nozīmē frāze “Runā, saproti, ceļo, audz!”?',
    opc: [o('valodas', 'Valodu mācīšanos'), o('celosana', 'Ceļošanu un piedzīvojumus'), o('izaugsme', 'Personīgo izaugsmi'), o('sazina', 'Saziņu ar citiem cilvēkiem un kultūrām'), o('parliecina', 'Pārliecību par sevi'), o('neskaidrs', 'Nav skaidrs'), cits()] },
  { id: 'logo_patik', nr: '3.4.', dala: 'zimols', tips: 'skala', attels: 'logo', teksts: 'Cik ļoti tev patīk logo?', galas: ['Nemaz', 'Ļoti patīk'] },
  { id: 'sauklis_patik', nr: '3.5.', dala: 'zimols', tips: 'skala', attels: 'sauklis', teksts: 'Cik ļoti tev patīk sauklis “Runā, saproti, ceļo, audz!”?', galas: ['Nemaz', 'Ļoti patīk'] },
  { id: 'empa_patik', nr: '3.6.', dala: 'zimols', tips: 'skala', attels: 'empa', teksts: 'Iepazīsties ar mūsu talismanu Empanadillo! Cik ļoti tev viņš patīk?', galas: ['Nemaz', 'Ļoti patīk'] },
  { id: 'empa_emocijas', nr: '3.7.', dala: 'zimols', tips: 'vairaki', max: 3, attels: 'empa', teksts: 'Kādas emocijas tev rada Empanadillo?', apaksa: 'Izvēlies līdz 3.',
    opc: [o('prieks', 'Prieks'), o('jautriba', 'Jautrība'), o('siltums', 'Siltums'), o('miligums', 'Mīlīgums'), o('zinkare', 'Ziņkāre'), o('energija', 'Enerģija'), o('neko', 'Neko īpašu', { vienigais: true }), o('nepatik', 'Nepatīk', { vienigais: true }), cits()] },

  // 4. Valodu mācīšanās
  { id: 'macas', nr: '4.1.', dala: 'valodas', tips: 'viens', teksts: 'Vai tu šobrīd mācies kādu svešvalodu?',
    opc: [o('ja', 'Jā'), o('ne_gribu', 'Nē, bet gribētu'), o('ne', 'Nē, un neplānoju')] },
  { id: 'valodas', nr: '4.2.', dala: 'valodas', tips: 'vairaki', teksts: 'Kuru valodu tu mācies?', apaksa: 'Vari izvēlēties vairākas.', ja: (a) => a.macas === 'ja',
    opc: [o('anglu', 'Angļu'), o('spanu', 'Spāņu'), o('vacu', 'Vācu'), o('francu', 'Franču'), o('italu', 'Itāļu'), o('portugalu', 'Portugāļu'), o('krievu', 'Krievu'), o('skandinavu', 'Skandināvu (zviedru, norvēģu, dāņu)'), o('azijas', 'Āzijas (ķīniešu, japāņu, korejiešu)'), cits('Cita')] },
  { id: 'materiali', nr: '4.3.', dala: 'valodas', tips: 'vairaki', teksts: 'Kādus materiālus vai rīkus tu izmanto?', apaksa: 'Vari izvēlēties vairākus.', ja: (a) => a.macas === 'ja',
    opc: [o('lietotnes', 'Mobilās lietotnes (piem., Duolingo)'), o('youtube', 'YouTube'), o('gramatas', 'Mācību grāmatas'), o('podkasti', 'Podkāsti'), o('filmas', 'Filmas un seriāli'), o('sarunas', 'Sarunas ar dzimtās valodas runātājiem'), o('kursi', 'Kursi ar pasniedzēju'), o('ai', 'Mākslīgais intelekts (ChatGPT u. c.)'), cits()] },
  { id: 'formats', nr: '4.4.', dala: 'valodas', tips: 'viens', teksts: 'Kā tev patīk mācīties vislabāk?', ja: (a) => a.macas === 'ja',
    opc: [o('klat_grupa', 'Klātienē grupā ar pasniedzēju'), o('klat_indiv', 'Klātienē individuāli ar pasniedzēju'), o('tiess_grupa', 'Tiešsaistē grupā ar pasniedzēju'), o('tiess_indiv', 'Tiešsaistē individuāli ar pasniedzēju'), o('pasmaciba', 'Tiešsaistē patstāvīgi, savā tempā'), o('kombineti', 'Kombinēti')] },
  { id: 'traucekli', nr: '4.5.', dala: 'valodas', tips: 'vairaki', teksts: 'Kas tevi visvairāk attur no valodu mācīšanās?', apaksa: 'Vari izvēlēties vairākus.', ja: (a) => a.macas === 'ne_gribu' || a.macas === 'ne',
    opc: [o('laiks', 'Laika trūkums'), o('cena', 'Cena'), o('motivacija', 'Motivācijas trūkums'), o('sakums', 'Nezinu, ar ko sākt'), o('bailes', 'Bail kļūdīties vai runāt'), o('pieredze', 'Slikta iepriekšējā pieredze'), o('piedavajums', 'Nav piemērota piedāvājuma'), o('vajadziba', 'Neredzu vajadzību'), cits()] },
  { id: 'cena', nr: '4.6.', dala: 'valodas', tips: 'viens', teksts: 'Kāda cena mēnesī par valodu kursu tev šķistu saprātīga?',
    opc: [o('lidz30', 'Līdz 30 €'), o('30-50', '30–50 €'), o('50-80', '50–80 €'), o('80+', 'Vairāk par 80 €')] },

  // 5. Noslēgums
  { id: 'noslegums', nr: '5.', dala: 'beigas', tips: 'info', ja: (a) => a.dzirdejis === 'ne', virsraksts: 'Paldies, ka dalījies savā pieredzē!',
    teksts: 'Libertas palīdz iemācīties spāņu un angļu valodu tā, kā tev ērtāk: grupā ar pasniedzēju vai tiešsaistē savā tempā. Mājaslapā **libertas.study** ir pieejami arī bezmaksas materiāli, uzdevumi un izrunas rīks.' },
  { id: 'interese', nr: '5.1.', dala: 'beigas', tips: 'viens', teksts: 'Vai tev būtu interese izmēģināt kādu no mūsu kursiem?', ja: (a) => !izmantojaKursu(a),
    opc: [o('spanu', 'Jā, spāņu'), o('anglu', 'Jā, angļu'), o('velak', 'Varbūt vēlāk'), o('ne', 'Nē')] },
  { id: 'komentars', nr: '5.2.', dala: 'beigas', tips: 'teksts', teksts: 'Vai vēlies vēl kaut ko mums pateikt?', apaksa: 'Nav obligāti.' },
];
