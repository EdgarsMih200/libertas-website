# ¡Vamos! Spāņu valoda A1–A2 — drukājama grāmata

`Vamos-spanu-valoda-A1-A2.pdf` — 156 lpp., A4, abpusējai drukai (lappušu skaits dalās ar 4).

Saturs nāk no `e-kursi-saturs/spanu-a1-ps` un `spanu-a2-ps` (nodarbības, tabulas, vārdnīcas, vingrinājumi, kopsavilkumi, kanona termini).
Stāsti «Līgas gads Valensijā» un kultūras fakti — `stasti.py`; darbības vārdu tabulas, sarunvārdnīca, varoņi — `extras.py`; dizains — `book.css`.

Pārbūvēt (vajag Python + pymupdf + Google Chrome):

    MAX_EX=6 python build.py

Divi piegājieni: 1) HTML → Chrome PDF, atrod lapu numurus satura rādītājam; 2) pārbūvē ar numuriem. Vāks, daļu lapas un aizmugure
renderējas atsevišķi (`full.html`, bez malām) un tiek ielikti vietturu lapās. `MAX_EX` = vingrinājumu skaits nodarbībā.
