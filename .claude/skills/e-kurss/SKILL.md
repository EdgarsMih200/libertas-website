---
name: e-kurss
description: Izveido vai labo Libertas pašmācības e-kursu (tiešsaistes kurss ar nodarbībām, pašpārbaudes testiem, noslēguma eksāmenu un sertifikātu) no īpašnieka materiāliem (PDF/DOCX) vai atvērtiem avotiem, pēc vienas veidnes un ar minimālu tokenu patēriņu. Lieto, kad lūdz izveidot jaunu e-kursu, pievienot/labot nodarbību, eksāmenu vai resursus, vai pārbaudīt e-kursa saturu.
---

# E-kursa izstrāde (Libertas)

Saturs top **latviski** (piemēri mērķvalodā), pēc vienas veidnes. Struktūra: `docs/e-kursi/struktura.md`,
process: `docs/e-kursi/pipeline.md` (neatver, ja nevajag — viss būtiskais ir šeit). Datu formāts: [shema.md](shema.md) — **izlasi pirms jebkura JSON rakstīšanas**.

## Zelta likumi
1. **Repo ir publisks.** Saturs un atbildes dzīvo tikai `e-kursi-saturs/` (gitignored). Nekad nekopē saturu uz `docs/`, HTML vai commit.
   Git nonāk tikai šifrētā kopija `e-kursi-rezerve/*.enc`.
2. **Skripti dara visu deterministisko** (izvilkšana, pārbaude, rezerve). Neskaiti, neatkārto un nesalīdzini ar roku.
3. **Viena nodarbība = viens konteksts.** Pirms nodarbības N lasi tikai: `plans.json`, `kanons.json`, `teksts/nodarbiba-NN.md`,
   iepriekšējo nodarbību `kopsavilkums` (ar `node -e` izvilkumu, ne visu failu). Citas nodarbības un PDF attēlus nelasi.
4. **Labo punktveidā** (Edit pēc `id`), nevis pārraksti failu. Pēc labojuma palaid pārbaudi tikai tai nodarbībai.
5. **Apstāšanās punkti:** pēc plāna (2) un pēc priekšskatījuma (6) gaidi īpašnieka apstiprinājumu.
6. Nodarbība ~60–90 min = 3–4 **daļas pa ~20 min** (15–25). Kursa nodarbības balstās viena uz otru un nerunā pretī (kanons).
7. Eksāmens **neatkārto** testu un vingrinājumu uzdevumus — atsevišķa banka ar jauniem piemēriem.

## Soļi
Kursa id: `<valoda>-<limenis>-<īss>` (piem. `spanu-a1-ps`). Mape: `e-kursi-saturs/<id>/`.

| # | Darbs | Komanda / izvade |
|---|---|---|
| 0 | Avoti | Īpašnieks ieliek PDF/TXT/MD `avoti/` (vai norāda mapi). DOCX → lūdz saglabāt kā PDF. |
| 1 | Izvilkšana | `node riki/ek-izvilkt.mjs <id> [--no <mape>] [--tikai 1,2]` → `teksts/nodarbiba-NN.md`, `teksts/parskats.md`. Lasi `parskats.md`; lapas bez teksta skaties (`Read` ar `pages`) tikai, ja tēmai trūkst satura. |
| 2 | Plāns + kanons | Izlasi visus `teksts/*.md` **vienreiz** un uzraksti `plans.json` + `kanons.json`. Salīdzini ar CEFR/līmeņa inventāru, papildini trūkstošo (`papildinats`). Parādi īpašniekam īsu tabulu (nodarbība · daļas · mērķi · prasmes) un **gaidi «jā»**. |
| 3 | Nodarbības | Pa vienai: uzraksti `nodarbiba-NN.json`, tad `node riki/ek-parbaudit.mjs <id> --nodarbiba N`, izlabo kļūdas. Jauni vārdi/termini → vispirms kanonā. |
| 4a | Saskaņotība | Kad visas gatavas: izvelc tikai `kanons` + visu `kopsavilkums` + `saites` un pārbaudi pretrunas, robus, atkārtojumus. Labo punktveidā. |
| 5 | Eksāmens + resursi | `eksamens.json` (≥ 1,5 × jautājumi, ≥ 25 % vairāku nodarbību), `resursi.json`. `node riki/ek-parbaudit.mjs <id>` — pārklāšanās ar testiem = kļūda → pārraksti. |
| 6 | Priekšskatījums | `npx wrangler dev` → `macibas.html?k=<id>&preview`. Īpašnieka piezīmes formā «N. nodarbība, uzd. v-07: …» → punktveida labojumi. **Gaidi apstiprinājumu.** |
| 7 | Publicēšana | Vispirms lokāli: `node riki/ek-augsupladet.mjs <id> --local` + `npx wrangler dev` → `macibas.html?k=<id>` (admins redz visu). Tad `node riki/ek-augsupladet.mjs <id> --remote` (pievieno arī neaktīvu `courses` rindu). Kartīte `kursi.html#tiessaistes` un apraksts `ek-kurss.html?k=<id>` veidojas automātiski no API — HTML nav jāraksta. Kursu ieslēdz, cenu/termiņu maina īpašnieks: admin → E-kursi. `context.md` (pilotkursa statuss) + commit. |
| 8 | Rezerve | Īpašnieks pats palaiž (parole nav jāredz Claude): `node riki/ek-rezerve.mjs <id>` → commit `e-kursi-rezerve/<id>.enc`. Atjaunot: `--atjaunot`. |

Bez īpašnieka materiāliem (0. solis tukšs): plānu balsti uz atvērtiem uzticamiem avotiem un ieraksti tos `plans.avoti`
(CEFR apraksti — Eiropas Padome; spāņu — Plan Curricular del Instituto Cervantes; angļu — English Profile, British Council LearnEnglish;
citām tēmām — OER mācību grāmatas: OpenStax, LibreTexts). Tekstu raksti pats, nekopē.

## Metodika (katrā nodarbībā)
- **Mērķi** 3–4 «Pēc nodarbības tu varēsi…» (novērojamas darbības). **Iesildīšanās**: 1–2 jautājumi par iepriekšzināto.
- **Daļa** = materiāls (īsi bloki ≤ 250 vārdi, vispirms piemērs → likums → «Svarīgi!») + 3–6 vingrinājumi uzreiz pēc tā, no vieglākā uz grūtāko
  (atpazīt → izvēlēties → ražot). Katram — `skaidrojums` ar atsauci uz likumu; maldinātāji = tipiskas latviešu runātāju kļūdas.
- **Visas kursa prasmes katrā nodarbībā** (vingrinājumi + prakse + tests). Valodu kursos: klausīšanās (`klausies`), izruna/runāšana (`runat`),
  lasīšana (`fragments`), rakstīšana (`rakstit`/`ievadi`), vārdu krājums, gramatika. Ja nevar — `prasmes_izlaist` ar pamatojumu.
- **Prakse**: viens produktīvs uzdevums (runāt/rakstīt) ar paraugu un 3–5 pašpārbaudes punktiem.
- **Tests**: 10–15 jautājumi, banka ≥ 1,5×, tikai automātiski tipi, pa visām daļām un prasmēm; ≥ 80 % atver nākamo nodarbību.
- **Kopsavilkums**: 5 galvenās domas + «Es protu…» pašvērtējumam.
- Valoda: vienkārša, uzrunā «tu», dzimtes neitrāla (ne «esi pabeidzis», bet «nodarbība pabeigta»). Latviešu garumzīmes obligātas.

## Atbildes stils īpašniekam
Īss: kas izdarīts, pārbaudes rezultāta pēdējā rinda, kas jāizlemj. Bez failu satura izdrukas.
