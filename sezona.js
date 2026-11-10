/* SEZONA — svētku klases uz <html> visās publiskajās lapās (ielādē <head>, lai nebūtu mirgošanas).
   html.ziemassvetki — tikai decembrī (ziemas vakara aina, lampiņu virtene, zvaniņi, kupena kājenē);
   html.svetku-dienas — tikai 22.–26. decembrī (sveiciens "Priecīgus Ziemassvētkus!");
   html.ballite — 5. decembrī (īpašnieka dzimšanas diena: karodziņu virtene sākumlapas ainavā).
   Pārbaudei jebkurā dienā: ?ziemassvetki=1, ?sveiciens=1 (rotājumi + sveiciens), ?ballite=1.
   Sniegs ir atsevišķi (snow.js, tikai sākumlapā, nov.–febr., ?sniegs=1). */
(function () {
    var sodien = new Date();
    var menesis = sodien.getMonth(); // 0 = janvāris
    var diena = sodien.getDate();
    var q = location.search;
    var html = document.documentElement;
    var sveiciens = (menesis === 11 && diena >= 22 && diena <= 26) || /[?&]sveiciens=1\b/.test(q);
    if (menesis === 11 || sveiciens || /[?&]ziemassvetki=1\b/.test(q)) html.classList.add('ziemassvetki');
    if (sveiciens) html.classList.add('svetku-dienas');
    if ((menesis === 11 && diena === 5) || /[?&]ballite=1\b/.test(q)) html.classList.add('ballite');
})();
