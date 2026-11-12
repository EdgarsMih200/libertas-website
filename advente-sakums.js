// Sākumlapa: adventes kalendāra zīme zem hero pogām (.adv-sakums). Klases liek sezona.js:
// html.advente-gaida — atskaite līdz 1.12. 00:00 Rīgā; html.advente — "atver N. durvis".
(function () {
    var html = document.documentElement;
    var zime = document.querySelector('.adv-sakums');
    if (!zime) return;
    if (html.classList.contains('advente')) {
        var n = html.getAttribute('data-advente-diena');
        var b = zime.querySelector('[data-adv-sodien]');
        if (b && n) b.textContent = n + '.';
        zime.href = 'advente.html' + (/[?&]advente=\d+/.test(location.search) ? location.search.match(/[?&](advente=\d+)/)[0].replace('&', '?') : '');
        return;
    }
    if (!html.classList.contains('advente-gaida')) return;
    var SAKUMS = Date.UTC(2026, 10, 30, 22, 0, 0); // 1.12.2026 00:00 Rīgā
    var vieta = zime.querySelector('[data-adv-atskaite]');
    function pad(x) { return (x < 10 ? '0' : '') + x; }
    function dienas(d) { return d % 10 === 1 && d % 100 !== 11 ? 'dienas' : 'dienām'; }
    function tick() {
        var s = Math.max(0, Math.floor((SAKUMS - Date.now()) / 1000));
        var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sek = s % 60;
        vieta.textContent = (d ? d + ' ' + dienas(d) + ' ' : '') + pad(h) + ':' + pad(m) + ':' + pad(sek);
        zime.setAttribute('aria-label', 'Adventes kalendārs atvērsies pēc ' + d + ' ' + dienas(d) + ' un ' + h + ' stundām');
        if (s === 0) { clearInterval(t); location.reload(); }
    }
    var t = setInterval(tick, 1000);
    tick();
})();
