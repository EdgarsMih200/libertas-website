# E-kursu datu formāts (līgums starp Claude, `riki/ek-parbaudit.mjs` un atskaņotāju)

Visi faili: `e-kursi-saturs/<kurss>/`, UTF-8 JSON, 2 atstarpju atkāpe. Teksti latviski; mērķvalodas piemēri — mērķvalodā.
`md` lauki = vienkāršs Markdown (**trekns**, *slīpraksts*, saraksti), bez HTML.

## plans.json
```json
{ "id": "spanu-a1-ps", "nosaukums": "Spāņu valoda A1 — pirmie soļi", "valoda": "es", "limenis": "A1",
  "apraksts": "2–3 teikumi kartītei un apraksta lapai", "stundas": 8,
  "prasmes": [{ "id": "izruna", "nosaukums": "Izruna" }, { "id": "klausisanas", "nosaukums": "Klausīšanās" }],
  "nodarbibas": [{ "nr": 1, "nosaukums": "Alfabēts, izruna un uzsvars",
      "merki": ["nosaukt spāņu alfabēta burtus"], "temas": ["alfabēts", "digrafi", "uzsvars"],
      "dalas": [{ "nosaukums": "Alfabēts", "ilgums_min": 20 }],
      "papildinats": ["ko pievienojām ārpus avotiem un kāpēc"],
      "prasmes_izlaist": { "runasana": "pamatojums, ja prasmi šajā nodarbībā nevar trenēt" } }],
  "eksamens": { "jautajumi": 40, "slieksnis": 80 },
  "avoti": [{ "nosaukums": "SVA1 prezentācijas 1–5 (Libertas)" }, { "nosaukums": "Plan Curricular del Instituto Cervantes, A1", "url": "https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/" }] }
```
Prasmju `id`: mazie burti bez garumzīmēm (`vardu_krajums`, `gramatika`, `lasisana`, `klausisanas`, `rakstisana`, `runasana`, `izruna`).

## kanons.json — vienīgais patiesības avots visām nodarbībām
```json
{ "termini": { "artikul": { "nr": 3, "definicija": "Artikuls — vārdiņš pirms lietvārda, kas rāda dzimti un skaitli." } },
  "likumi": [{ "id": "uzsvars-1", "nr": 1, "formulejums": "Ja vārds beidzas ar patskani, -n vai -s, uzsvars ir uz priekšpēdējās zilbes." }],
  "vardi": { "perro": 1, "casa": 2, "el": 3 },
  "konvencijas": ["Izrunu rakstām kvadrātiekavās latviešu burtiem: [ače]", "Uzsvērto zilbi rakstām ar LIELAJIEM: pa|LA|bra"] }
```
- `termini` atslēga = **vārda sakne** (`artikul` atrod *artikuls, artikuli, artikulu*). `nr` = nodarbība, kurā termins ieviests.
- `vardi` = mērķvalodas vārdi → nodarbība, kurā tie ieviesti. Pārbaudītājs kļūdās, ja vārds/termins parādās agrākā nodarbībā.
  Vispārīgi vārdi, kas vajadzīgi piemēros jau no sākuma (*sí, no, y*), → `nr: 1`.
- Nodarbībās likumus formulē **tieši tāpat** kā `likumi[].formulejums` (drīkst saīsināt, nedrīkst mainīt saturu).

## nodarbiba-NN.json
```json
{ "nr": 1, "nosaukums": "Alfabēts, izruna un uzsvars", "ilgums_min": 90,
  "saites": { "balstas": [], "sagatavo": ["2. nodarbībā lietvārdu galotnes — vajadzēs uzsvara likumus"] },
  "merki": ["nosaukt spāņu alfabēta 27 burtus un 5 digrafus", "…"],
  "iesildisanas": { "jautajumi": ["Kuras spāņu skaņas tev šķiet neparastas?"] },
  "dalas": [{ "id": "d1", "nosaukums": "Alfabēts", "ilgums_min": 20,
      "materials": [ { "t": "teksts", "md": "…" } ],
      "vingrinajumi": [ { "id": "v-01", "tips": "klausies", "prasme": "klausisanas", "…": "skat. uzdevumi" } ] }],
  "prakse": { "tips": "runat", "prasme": "runasana", "uzdevums": "Ieraksti sevi…", "paraugs": ["chocolate", "llave"], "parbaude": ["ch skan kā [č]", "…"] },
  "tests": { "jautajumi": 12, "banka": [ { "id": "t-01", "…": "tikai automātiski pārbaudāmi tipi" } ] },
  "kopsavilkums": { "punkti": ["5 galvenās domas"], "var_darit": ["Es protu … (pašvērtējumam)"] } }
```
Iesildīšanās atkārtojumu no iepriekšējām nodarbībām atskaņotājs ņem pats no to testu bankām — **neraksti tos**.

### Materiāla bloki (`materials[]`)
| t | lauki | lietojums |
|---|---|---|
| `teksts` | `md` (≤ 250 vārdi) | skaidrojums |
| `svarigi` | `md` | viens galvenais likums (no kanona) |
| `piemers` | `vienumi: [[mērķvalodā, tulkojums]]`, `md?` | piemēri ar 🔊 |
| `vardnica` | `vienumi: [[vārds, tulkojums]]` | vārdu kartītes ar 🔊 |
| `burti` | `vienumi: [[burts, nosaukums, piemērs]]` | alfabēts/skaņas |
| `zilbes` | `vards: "pa\|LA\|bra"` | zilbes, LIELIE = uzsvērtā |
| `tabula` | `galva: []`, `rindas: [[]]` | locīšana, salīdzinājumi |
| `attels` | `src`, `alt` | tikai, ja bez attēla nevar |

### Uzdevumi (vingrinājumi, tests, eksāmens)
Kopīgie lauki: `id` (unikāls failā: `v-01`, `t-01`, `e-001`), `tips`, `prasme`, `teksts` (norāde latviski, var atkārtoties),
`jautajums` (konkrētais saturs, kas atšķiras katram uzdevumam), `fragments?` (lasāmteksts), `skaidrojums` (kāpēc tā — 1–2 teikumi, ar atsauci uz likumu),
`saite?` (daļas `id`, uz kuru sūtīt atkārtot). Eksāmenā vēl `nodarbibas: [nr, …]`.

| tips | papildu lauki | piezīme |
|---|---|---|
| `izvele` | `varianti[]`, `atbilde` (indekss) | 3–4 varianti, ticami maldinātāji |
| `vairakas` | `varianti[]`, `atbildes[]` | |
| `ievadi` | `atbilde` ("soy\|yo soy") | `\|` = alternatīvas; reģistru un pieturzīmes neņem vērā |
| `tuksumi` | `jautajums` ar `___`, `atbildes[]` | viena atbilde katram `___` |
| `pari` | `pari: [[a, b]]` (≥ 3) | atskaņotājs sajauc |
| `seciba` | `elementi[]` pareizā secībā (≥ 3) | teikums vai darbību secība |
| `kategorijas` | `kategorijas: { "el": ["libro"], "la": ["mesa"] }` | |
| `klausies` | `runa` (ko atskaņot) + `varianti`/`atbilde` vai `atbilde` teksts | runa ar Web Speech, `valoda` no plāna |
| `rakstit` | `paraugs`, `parbaude[]` | **tikai** vingrinājumos/praksē, pašpārbaude |
| `runat` | `paraugs`, `parbaude[]` | **tikai** vingrinājumos/praksē, ieraksts ar mikrofonu |

## eksamens.json
```json
{ "banka": [ { "id": "e-001", "tips": "tuksumi", "prasme": "gramatika", "nodarbibas": [2, 3],
    "teksts": "Ieraksti artikulu un lietvārda daudzskaitli.", "jautajums": "___ reloj → dos ___", "atbildes": ["el", "relojes"], "skaidrojums": "…" } ] }
```
Uzdevumu skaits ≥ 1,5 × `plans.eksamens.jautajumi`. Atskaņotājs katram mēģinājumam izvēlas komplektu proporcionāli prasmēm un nodarbībām.
**Nekādu atkārtojumu** no testiem/vingrinājumiem: jauni teikumi, jauni piemēru vārdi (no kanona), cits formāts. ≥ 25 % uzdevumu apvieno vairākas nodarbības.

## resursi.json — pēdējā sadaļa «Ko darīt tālāk»
```json
{ "ievads": "…", "celi": [ { "nosaukums": "Turpini ar A2", "apraksts": "…", "soli": ["…"],
    "resursi": [ { "nosaukums": "…", "url": "https://…", "tips": "vārdnīca|podkāsts|grāmata|lietotne|video|kurss", "bezmaksas": true, "apraksts": "kāpēc noderēs" } ] } ] }
```
≥ 2 ceļi (piem., «Turpini nākamajā līmenī», «Mācies ikdienā pats», «Libertas grupu kurss»). Tikai uzticami, pastāvīgi avoti; URL pārbaudi.
