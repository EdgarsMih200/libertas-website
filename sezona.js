/* SEZONA — svētku klases uz <html> visās publiskajās lapās (ielādē <head>, lai nebūtu mirgošanas).
   html.ziemassvetki — tikai decembrī (ziemas vakara aina, lampiņu virtene, zvaniņi, kupena kājenē);
   html.svetku-dienas — tikai 22.–26. decembrī (sveiciens "Priecīgus Ziemassvētkus!");
   html.ballite — 5. decembrī (īpašnieka dzimšanas diena: karodziņu virtene sākumlapas ainavā).
   html.advente-gaida — 15.–30. novembrī (sākumlapā atskaite līdz adventes kalendāram);
   html.advente — 1.–24. decembrī (sākumlapā "Atver N. durvis" + saite uz egli, izvēlnē saite "Adventes kalendārs"), data-advente-diena = N.
   Pārbaudei jebkurā dienā: ?ziemassvetki=1, ?sveiciens=1 (rotājumi + sveiciens), ?ballite=1, ?advente=0 (atskaite) / ?advente=1..24.
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

    var adv = q.match(/[?&]advente=(\d{1,2})\b/);
    var advDiena = adv ? +adv[1] : (menesis === 11 && diena <= 24 ? diena : 0);
    if (adv ? advDiena === 0 : (menesis === 10 && diena >= 15)) html.classList.add('advente-gaida');
    if (advDiena >= 1 && advDiena <= 24) {
        html.classList.add('advente', 'ziemassvetki');
        html.setAttribute('data-advente-diena', advDiena);
        document.addEventListener('DOMContentLoaded', function () {
            var nav = document.querySelector('.main-nav');
            if (!nav || nav.querySelector('.adv-izvelne')) return;
            var a = document.createElement('a');
            a.href = '/advente.html';
            a.className = 'adv-izvelne';
            a.textContent = 'Adventes kalendārs';
            if (/\/advente(\.html)?$/.test(location.pathname)) a.setAttribute('aria-current', 'page');
            nav.appendChild(a);
        });
    }
})();
