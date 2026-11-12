// Adventes kalendāra 2026 saturs (24 durvis). Worker atdod durvju saturu tikai pēc to atvēršanas.
// Tipi: vards | atlaide | quiz | trad | davana | finals. l = valoda (ES/EN/NO/SV) zīmogam un izrunai.
// Atlaižu kodi derīgi tikai tam, kurš atvēris attiecīgās durvis (pārbauda worker/advente.js → parbauditKodu).

export const GADS = 2026;

export const DURVIS = [
  { d: 1, t: 'vards', l: 'ES', ti: 'el Adviento', tr: 'advente', ex: 'En Adviento encendemos una vela cada domingo.', exl: 'Adventē katru svētdienu iededzam sveci.' },
  { d: 2, t: 'atlaide', ti: '−10 % Spāņu A1', b: 'Spāņu valodas pamati A1 — janvāra grupai, kas sākas 11.01.2027.', kods: 'ADV-ES10', derigs: 'Derīgs līdz 15.01.2027' },
  { d: 3, t: 'vards', l: 'EN', ti: 'mistletoe', tr: 'āmulis', ex: 'They kissed under the mistletoe.', exl: 'Viņi noskūpstījās zem āmuļa.' },
  { d: 4, t: 'quiz', ti: 'Divpadsmit vīnogas', q: 'Kurā valstī Jaungada naktī ar katru pulksteņa sitienu apēd vienu vīnogu?', o: ['Spānijā', 'Norvēģijā', 'Anglijā'], ok: 0, why: 'Las doce uvas: tā Spānijā sagaida katru Jauno gadu.' },
  { d: 5, t: 'atlaide', ti: 'Ballītes diena: −20 %', b: 'Visiem klātienes un tiešsaistes grupu kursiem — tikai šodien, 5. decembrī. Empanadillo šodien ar ballītes cepuri.', kods: 'BALLITE20', derigs: 'Derīgs tikai 5.12.2026' },
  { d: 6, t: 'trad', l: 'NO', ti: 'Pepperkakebyen', b: 'Bergenā katru decembri no piparkūkām uzceļ veselu pilsētu ar mājām, kuģiem un vilcienu. Norvēģiski piparkūka ir en pepperkake.' },
  { d: 7, t: 'vards', l: 'SV', ti: 'en pepparkaka', tr: 'piparkūka', ex: 'Vi bakar pepparkakor på söndag.', exl: 'Svētdien cepsim piparkūkas.' },
  { d: 8, t: 'davana', ti: 'Vārdu plakāts', b: 'Izdrukājams plakāts: 24 Ziemassvētku vārdi spāņu un angļu valodā ar latvisko tulkojumu.', saite: 'advente-plakats.html', saiteTeksts: 'Atvērt plakātu' },
  { d: 9, t: 'quiz', l: 'EN', ti: 'Boxing Day', q: 'Kas Lielbritānijā ir Boxing Day (26. decembris)?', o: ['Boksa turnīrs', 'Otrie Ziemassvētki', 'Dāvanu iesaiņošanas diena'], ok: 1, why: 'Nosaukums cēlies no “Christmas box”: dāvanām pastniekiem un kalpotājiem.' },
  { d: 10, t: 'atlaide', ti: '−15 % e-kursam', b: '«Spāņu valodas pamati A1 — pirmie soļi» tiešsaistē, 90 dienu piekļuve.', kods: 'ADV-EK15', derigs: 'Derīgs līdz 15.01.2027' },
  { d: 11, t: 'vards', l: 'NO', ti: 'en nisse', tr: 'rūķis', ex: 'Nissen bor på låven.', exl: 'Rūķis dzīvo šķūnī.' },
  { d: 12, t: 'davana', ti: 'Ziemeļbrieža ragi', b: 'Empanadillo tev visā vietnē rādīsies ar ziemeļbrieža ragiem līdz 6. janvārim. Paskaties apakšējā stūrī!', ragi: true },
  { d: 13, t: 'trad', l: 'SV', ti: 'Luciadagen', b: '13. decembra rītā meitene baltā tērpā ar sveču vainagu nes lussekatter, safrāna maizītes, un visi dzied «Sankta Lucia».' },
  { d: 14, t: 'vards', l: 'ES', ti: 'el turrón', tr: 'turons, mandeļu saldums', ex: '¿Prefieres turrón duro o blando?', exl: 'Tev labāk garšo ciets vai mīksts turons?' },
  { d: 15, t: 'quiz', l: 'NO', ti: 'God jul', q: 'Ko nozīmē “God jul og godt nytt år”?', o: ['Labu ceļu un laimīgu gadu', 'Priecīgus Ziemassvētkus un laimīgu Jauno gadu', 'Labu apetīti svētkos'], ok: 1, why: 'jul = Ziemassvētki, nytt år = Jaunais gads.' },
  { d: 16, t: 'atlaide', ti: 'Nāc ar draugu: −25 %', b: 'Piesakieties divatā vienam grupas kursam — atlaide katram. Draugam arī jāatver šīs durvis un jāievada kods.', kods: 'DIVATA25', derigs: 'Derīgs līdz 15.01.2027' },
  { d: 17, t: 'vards', l: 'EN', ti: 'a stocking', tr: 'Ziemassvētku zeķe', ex: 'Santa filled the stockings with sweets.', exl: 'Salavecis piepildīja zeķes ar saldumiem.' },
  { d: 18, t: 'vards', l: 'ES', ti: 'Tres tristes tigres', tr: 'mēles mežģis', ex: 'Tres tristes tigres tragaban trigo en un trigal.', exl: 'Trīs bēdīgi tīģeri kviešu laukā rija kviešus.' },
  { d: 19, t: 'davana', ti: 'Svētku e-kartīte', b: 'Kartīte ar apsveikumu četrās valodās: ieraksti vārdus un nosūti saiti draugam.', saite: 'advente-kartite.html', saiteTeksts: 'Veidot kartīti' },
  { d: 20, t: 'vards', l: 'SV', ti: 'ett julbord', tr: 'svētku galds, zviedru bufete', ex: 'Julbordet har sill, köttbullar och skinka.', exl: 'Uz svētku galda ir siļķe, kotletes un šķiņķis.' },
  { d: 21, t: 'quiz', ti: 'Ziemas saulgrieži', q: 'Kā spāniski ir “ziemas saulgrieži”?', o: ['el solsticio de invierno', 'la noche de invierno', 'el sol del invierno'], ok: 0, why: 'Angliski winter solstice, norvēģiski vintersolverv, zviedriski vintersolstånd.' },
  { d: 22, t: 'atlaide', ti: '−10 % Angļu A1', b: 'Angļu valodas pamati A1 — un pirmā vieta rindā, tiklīdz būs zināms grafiks.', kods: 'ADV-EN10', derigs: 'Derīgs līdz 15.01.2027' },
  { d: 23, t: 'vards', l: 'NO', ti: 'julaften', tr: 'Ziemassvētku vakars', ex: 'På julaften åpner vi gavene.', exl: 'Ziemassvētku vakarā atveram dāvanas.' },
  { d: 24, t: 'finals', l: 'ES', ti: 'la Nochebuena', tr: 'Svētvakars, “labā nakts”', ex: '¡Feliz Nochebuena y feliz Navidad!', exl: 'Priecīgu Svētvakaru un priecīgus Ziemassvētkus!', b: 'Pēdējās durvis. Ja visas 24 ir atvērtas, zvaigzne eglītes galotnē iedegas: tu saņem −25 % kodu 2027. gadam un piedalies galvenās balvas izlozē 27. decembrī.' },
];

// Atlaižu kodi. kursi: kursu id saraksts | 'grupas' (visi klātienes/grupu kursi) | 'visi'. tikaiDiena: kods derīgs tikai šajā datumā (Rīgas laiks)
export const KODI = {
  'ADV-ES10': { diena: 2, proc: 10, kursi: ['spain-a1'], lidz: '2027-01-15' },
  'BALLITE20': { diena: 5, proc: 20, kursi: 'grupas', tikaiDiena: '2026-12-05' },
  'ADV-EK15': { diena: 10, proc: 15, kursi: ['spanu-a1-ps'], lidz: '2027-01-15' },
  'DIVATA25': { diena: 16, proc: 25, kursi: 'grupas', lidz: '2027-01-15' },
  'ADV-EN10': { diena: 22, proc: 10, kursi: ['english-a1'], lidz: '2027-01-15' },
  'ADV-CEMPIONS25': { cempions: true, proc: 25, kursi: 'visi', lidz: '2027-06-30' },
};
