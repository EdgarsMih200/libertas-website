// Builds Google Business Profile images as HTML pages; render.sh screenshots them with headless Edge.
const fs = require('fs'), path = require('path');
const SITE = 'C:/Users/Admin/Desktop/Mājaslapa';
const OUT = __dirname;
const rd = p => fs.readFileSync(path.join(SITE, p), 'utf8');
const sprite = rd('assets/scene/ainava.svg').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const word = rd('assets/libertas-light.svg').replace(/<\?xml[^>]*>/, '').replace(/<title>.*?<\/title>/, '');
const photo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(SITE, 'assets/par-mums/edgars.jpg')).toString('base64');
const empaSrc = 'file:///' + SITE.replace(/ā/g, '%C4%81') + '/empanadillo.js';

const LAYERS = ['sc-sun', 'sc-clouds', 'sc-birds', 'sc-far', 'sc-lake', 'sc-mid', 'sc-near', 'sc-path', 'sc-front'];
const scene = (vb = '0 0 1440 800', par = 'xMidYMax slice', layers = LAYERS) =>
  `<svg class="scene" viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true">${layers.map(l => `<use href="#${l}"/>`).join('')}</svg>`;

const CSS = `
:root{--sc-sky1:#F6F1E8;--sc-sky2:#F4E3D0;--sc-sky3:#F2D3B8;--sc-sun:#F7C9A3;--sc-sun-o:1;--sc-cloud:#FFFDF8;
--sc-far:#C9C5D6;--sc-far2:#B9B6CC;--sc-chalk:#E7E2EA;--sc-landmark:#A39EBA;--sc-lamp:#FFF3E2;
--sc-lake:#D7DEDA;--sc-glint:#FFFFFF;--sc-mid:#8FA3A6;--sc-mid2:#7E9497;
--sc-near:#5F7C6D;--sc-near2:#526E60;--sc-cabin:#486255;--sc-window:#3B5348;--sc-lights-o:0;
--sc-path:#E9D9C2;--sc-front:#2F4A40;--sc-deep:#1E2E29;--sc-snow:#F4F1EA;--sc-snow-o:0;--sc-bunting-o:0;--sc-bird:#6B1D1D;
--bg:#F6F1E8;--surface:#FFFDF8;--ink:#24211E;--muted:#5C554D;--brand:#6B1D1D;--accent:#B4502A;--sage:#DDE5DA;--sage-ink:#34503F;
--forest:#1E2E29;--forest-2:#2B4038;--on-forest:#E9E4D8;--on-forest-muted:#AFB9B0;--sage-bright:#B5CCAE;--glow:#F2C46A;
--ff-d:"Lora",Georgia,serif;--ff-b:"Source Sans 3","Segoe UI",Arial,sans-serif}
.sc-ziema{--sc-sky1:#2A3550;--sc-sky2:#6E5A73;--sc-sky3:#D88A6A;--sc-sun:#F0A27E;--sc-sun-o:.55;--sc-cloud:#9A8AA6;
--sc-far:#6E6C8A;--sc-far2:#615F7D;--sc-chalk:#8F8BA8;--sc-landmark:#4F4D69;--sc-lamp:#F2C46A;
--sc-lake:#7E8399;--sc-glint:#F2C46A;--sc-mid:#4F6070;--sc-mid2:#46566A;
--sc-near:#3A5047;--sc-near2:#33473F;--sc-cabin:#2C3E36;--sc-window:#F2C46A;--sc-lights-o:1;
--sc-path:#C9C1C0;--sc-front:#22332D;--sc-deep:#17231F;--sc-snow-o:1;--sc-bird:#E8A598}
*{box-sizing:border-box;margin:0}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:var(--ff-b);color:var(--ink);background:var(--bg);position:relative}
.empanadillo,.empa--mazs,.bju-poga{display:none!important}
h1,h2,h3{font-family:var(--ff-d);font-weight:600;line-height:1.05;letter-spacing:-.01em}
em{font-style:italic}
.sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--sc-sky1) 0%,var(--sc-sky2) 42%,var(--sc-sky3) 62%,var(--sc-sky3) 100%)}
.scene{position:absolute;display:block}
.word svg{display:block;width:100%;height:auto}
.mascot svg{display:block;width:100%;height:auto}
.eyebrow{font:700 var(--eb,22px)/1 var(--ff-b);letter-spacing:.16em;text-transform:uppercase}
.chip{display:inline-flex;align-items:center;gap:10px;border-radius:999px;font-weight:700}
.url{font:600 28px/1 var(--ff-b);letter-spacing:.02em}
`;

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Source+Sans+3:wght@400;600;700&display=swap">`;

function page(name, w, h, body, css = '', needsEmpa = false) {
  const html = `<!doctype html><html lang="lv"><head><meta charset="utf-8">${FONTS}
<style>${CSS}:root{--w:${w}px;--h:${h}px}${css}</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs>${sprite}</defs></svg>
${body}
${needsEmpa ? `<script src="${empaSrc}"></script><script>
document.querySelectorAll('[data-m]').forEach(el=>{el.innerHTML=EMPANADILLO.svg(el.dataset.m,{scale:+el.dataset.s||6,hat:el.dataset.hat||undefined,shadow:true})});
</script>` : ''}</body></html>`;
  fs.writeFileSync(path.join(OUT, name + '.html'), html);
  return { name, w, h };
}

const out = [];

/* 1. LOGO 720x720 (Google crops to a circle: keep the mark in the middle 70%) */
out.push(page('01-logo', 720, 720, `
<div class="logo"><div class="word">${word}</div></div>`, `
body{background:#6B1D1D}
.logo{position:absolute;inset:0;display:grid;place-items:center}
.logo .word{width:430px}`));

/* 2. COVER 2120x1192 (16:9) */
out.push(page('02-cover', 2120, 1192, `
<div class="sky"></div>
${scene('0 -100 1440 900', 'xMidYMax slice')}
<div class="txt">
  <div class="eyebrow">Libertas · valodu skola</div>
  <h1>Runā, saproti, ceļo, <em>audz!</em></h1>
  <p>Spāņu un angļu valodas kursi tiešsaistē · nelielas grupas · A1–B1</p>
</div>
<div class="mascot" data-m="sveicina" data-s="9"></div>`, `
.scene{inset:0;width:100%;height:100%}
.txt{position:absolute;left:0;right:0;top:120px;text-align:center;display:grid;gap:28px;justify-items:center}
.txt .eyebrow{--eb:30px;color:var(--brand)}
.txt h1{font-size:150px;color:var(--ink)}
.txt h1 em{color:var(--brand)}
.txt p{font-size:44px;color:var(--muted);font-weight:600}
.mascot{position:absolute;left:calc(50% - 540px);bottom:104px;width:250px}`, true));

/* shared "post" layout 1200x900 */
const POST_CSS = `
.card{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr}
.pic{position:relative;overflow:hidden}
.pic .scene{inset:0;width:100%;height:100%}
.copy{padding:76px 70px 64px;display:flex;flex-direction:column;gap:26px}
.copy h2{font-size:76px}
.copy p{font-size:30px;line-height:1.35}
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}
.foot .word{width:190px}
.facts{list-style:none;padding:0;display:grid;gap:14px;font-size:28px;font-weight:600}
.facts li{display:flex;gap:14px;align-items:center}
.facts li::before{content:"";width:14px;height:14px;border-radius:50%;background:currentColor;opacity:.55;flex:none}
`;

/* 3. SPĀŅU KURSI */
out.push(page('03-spanu-kursi', 1200, 900, `
<div class="card">
  <div class="pic"><div class="sky"></div>${scene('110 220 400 600', 'xMidYMax slice')}
    <div class="price"><small>no</small>280 €</div></div>
  <div class="copy">
    <div class="eyebrow">Spāņu valoda</div>
    <h2>Ceļš no <em>¡Hola!</em> līdz B1</h2>
    <ol class="trail"><li><b>A1</b><span>pamati</span></li><li><b>A2</b><span>pamati</span></li><li><b>B1.1</b><span>vidējais</span></li><li><b>B1.2</b><span>vidējais</span></li></ol>
    <ul class="facts"><li>14 nodarbības · 7 nedēļas</li><li>2× nedēļā, 18:00–21:00</li><li>Tiešsaistē, nelielā grupā</li></ul>
    <div class="foot"><span class="url">libertas.study</span><div class="word">${word}</div></div>
  </div>
</div>`, POST_CSS + `
body{background:var(--forest);color:var(--on-forest)}
.copy .eyebrow{color:var(--sage-bright)}
.copy h2 em{color:var(--glow)}
.facts{color:var(--on-forest)}
.url{color:var(--on-forest-muted)}
.trail{list-style:none;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative;margin:6px 0 4px}
.trail::before{content:"";position:absolute;left:30px;right:30px;top:30px;border-top:4px dashed rgba(233,228,216,.4)}
.trail li{display:grid;justify-items:center;gap:8px;position:relative}
.trail b{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:var(--forest-2);border:3px solid var(--sage-bright);font:600 19px/1 var(--ff-b)}
.trail li:first-child b{background:var(--glow);border-color:var(--glow);color:var(--forest)}
.trail span{font-size:20px;color:var(--on-forest-muted)}
.price{position:absolute;left:44px;top:44px;width:190px;height:190px;border-radius:50%;background:var(--brand);color:#FBF1E6;display:grid;place-content:center;text-align:center;font:600 54px/1 var(--ff-d);transform:rotate(-8deg);box-shadow:0 10px 30px rgba(0,0,0,.25)}
.price small{font:700 22px/1.4 var(--ff-b);letter-spacing:.12em;text-transform:uppercase;color:#E4B9A8}`));

/* 4. ANGĻU KURSI */
out.push(page('04-anglu-kursi', 1200, 900, `
<div class="card">
  <div class="copy">
    <div class="eyebrow">Angļu valoda</div>
    <h2>Angļu valoda <em>bez stresa</em></h2>
    <p>Pamati A1 un A2 nelielā grupā: sarunas, ceļošana, darbs. Kļūdas šeit ir daļa no ceļa.</p>
    <ul class="facts"><li>A1 un A2 · 280 € kurss</li><li>14 nodarbības · 7 nedēļas</li><li>Tiešsaistē ar pasniedzēju</li></ul>
    <div class="foot"><span class="url">libertas.study</span><div class="word dark">${word}</div></div>
  </div>
  <div class="pic"><div class="sky sc-rits"></div>${scene('880 250 600 600', 'xMidYMax slice')}
    <div class="tag">Hello!</div></div>
</div>`, POST_CSS + `
.sc-rits{--sc-sky1:#EFEDE6;--sc-sky2:#F3E7D8;--sc-sky3:#F2DBC3}
body{background:var(--surface)}
.copy .eyebrow{color:var(--accent)}
.copy h2 em{color:var(--brand)}
.copy p{color:var(--muted)}
.facts{color:var(--ink)}
.url{color:var(--sage-ink)}
.word.dark{width:170px;background:var(--forest);padding:14px 20px;border-radius:14px;box-sizing:content-box}
.tag{position:absolute;right:48px;top:56px;background:var(--surface);color:var(--brand);font:600 italic 50px/1 var(--ff-d);padding:22px 30px;border-radius:28px 28px 28px 6px;box-shadow:0 10px 30px rgba(36,33,30,.15)}`));

/* 5. MATERIĀLI */
out.push(page('05-materiali', 1200, 900, `
<div class="wrap">
  <div class="top">
    <div class="eyebrow">Bezmaksas</div>
    <h2>Noderīgi <em>materiāli</em></h2>
    <p>Svētku tēmas četrās valodās: vārdi ar izrunu, dialogi, gramatika un uzdevumi, kas pārbauda paši sevi. Katrai tēmai ir arī darba lapa drukāšanai.</p>
    <div class="langs"><span class="chip">Spāņu</span><span class="chip">Angļu</span><span class="chip">Norvēģu</span><span class="chip">Zviedru</span></div>
  </div>
  <div class="cards">
    <div class="vc"><div class="f">la Navidad</div><div class="b">Ziemassvētki</div></div>
    <div class="vc r"><div class="f">el árbol</div><div class="b">egle</div></div>
    <div class="vc g"><div class="f">julgran</div><div class="b">eglīte · SV</div></div>
  </div>
  <div class="mascot" data-m="lasa" data-s="7"></div>
  <div class="bottom"><span class="url">libertas.study/materiali</span><div class="word">${word}</div></div>
</div>`, `
body{background:var(--sage)}
.wrap{position:absolute;inset:0;padding:76px 80px 60px}
.top{width:640px;display:grid;gap:24px}
.top .eyebrow{color:var(--accent)}
.top h2{font-size:84px}
.top h2 em{color:var(--brand)}
.top p{font-size:30px;line-height:1.38;color:var(--sage-ink)}
.langs{display:flex;gap:12px;flex-wrap:wrap}
.langs .chip{background:var(--surface);color:var(--ink);font-size:24px;padding:12px 20px}
.cards{position:absolute;right:70px;top:60px;width:390px;height:640px}
.vc{position:absolute;width:320px;border-radius:22px;background:var(--surface);box-shadow:0 14px 34px rgba(30,46,41,.18);overflow:hidden;right:0;top:0;transform:rotate(5deg)}
.vc .f{font:600 italic 46px/1 var(--ff-d);padding:40px 30px;text-align:center;color:var(--brand)}
.vc .b{background:var(--forest);color:var(--on-forest);font:700 22px/1 var(--ff-b);padding:20px;text-align:center;letter-spacing:.06em;text-transform:uppercase}
.vc.r{top:215px;right:60px;transform:rotate(-6deg)}
.vc.g{top:430px;right:10px;transform:rotate(3deg)}
.vc.g .f{color:var(--sage-ink)}
.mascot{position:absolute;left:640px;bottom:120px;width:180px}
.bottom{position:absolute;left:80px;right:80px;bottom:56px;display:flex;justify-content:space-between;align-items:center}
.bottom .url{color:var(--sage-ink)}
.bottom .word{width:180px;background:var(--forest);padding:14px 20px;border-radius:14px;box-sizing:content-box}`, true));

/* 6. PAR MUMS (real photo) */
out.push(page('06-par-mums', 1200, 900, `
<div class="wrap">
  <figure class="ph"><span class="tape"></span><img src="${photo}" alt=""><figcaption>Edgars Mihovs, Libertas dibinātājs un pasniedzējs</figcaption></figure>
  <div class="copy">
    <div class="eyebrow">Par mums</div>
    <blockquote>Apgūt valodu ir ceļojums uz sevi un pasauli. Libertas palīdz atrast īsto <em>ceļojuma maršrutu</em>.</blockquote>
    <ul class="vals"><li><b>Mazas grupas</b>katram ir laiks runāt</li><li><b>Spēles un sarunas</b>mācīties var ar prieku</li><li><b>A1 → B1</b>spāņu un angļu valoda</li></ul>
    <div class="foot"><span class="url">libertas.study</span><div class="word">${word}</div></div>
  </div>
</div>`, `
body{background:var(--forest);color:var(--on-forest)}
.wrap{position:absolute;inset:0;display:grid;grid-template-columns:470px 1fr;gap:70px;padding:80px 80px 64px;align-items:center}
.ph{position:relative;background:#FFFDF8;padding:18px 18px 70px;transform:rotate(-3deg);box-shadow:0 18px 40px rgba(0,0,0,.35)}
.ph img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover}
.ph figcaption{position:absolute;left:18px;right:18px;bottom:18px;font:500 italic 22px/1.2 var(--ff-d);color:#5C554D;text-align:center}
.tape{position:absolute;top:-18px;left:50%;width:150px;height:40px;background:rgba(221,229,218,.85);transform:translateX(-50%) rotate(4deg)}
.copy{display:flex;flex-direction:column;gap:34px;height:100%;padding-top:20px}
.copy .eyebrow{color:var(--sage-bright)}
blockquote{font:500 54px/1.18 var(--ff-d)}
blockquote em{color:var(--glow)}
.vals{list-style:none;padding:0;display:grid;gap:16px;font-size:24px;color:var(--on-forest-muted)}
.vals b{display:block;color:var(--on-forest);font-size:28px}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center}
.foot .word{width:180px}
.url{color:var(--on-forest-muted)}`));

/* 7. JANVĀRA GRUPAS (winter evening) */
out.push(page('07-janvara-grupas', 1200, 900, `
<div class="sky sc-ziema"></div>
<div class="sc-ziema">${scene('300 -60 1000 860', 'xMidYMax slice')}</div>
<div class="txt">
  <div class="eyebrow">Jaunas grupas 2027</div>
  <h2>Sāc gadu <em>spāniski</em></h2>
  <div class="dates">
    <div class="d"><b>11.01.</b><span>Spāņu A1<br>pirmd. un trešd.</span></div>
    <div class="d"><b>12.01.</b><span>Spāņu B1.2<br>otrd. un ceturtd.</span></div>
  </div>
  <p>18:00–21:00 · tiešsaistē · 280 € / 420 €</p>
</div>
<div class="mascot" data-m="vicina" data-s="7" data-hat="santa"></div>
<div class="word">${word}</div>`, `
.sc-ziema .scene,.scene{inset:0;width:100%;height:100%}
.sc-ziema{position:absolute;inset:0}
.txt{position:absolute;left:80px;top:80px;width:720px;display:grid;gap:26px;color:#F3EEE3}
.txt .eyebrow{color:var(--glow)}
.txt h2{font-size:96px}
.txt h2 em{color:var(--glow)}
.dates{display:flex;gap:18px}
.d{background:rgba(23,35,31,.7);border:2px solid rgba(242,196,106,.5);border-radius:20px;padding:20px 26px;display:grid;gap:8px}
.d b{font:600 52px/1 var(--ff-d);color:var(--glow)}
.d span{font-size:24px;line-height:1.3;color:#E9E4D8}
.txt p{justify-self:start;font-size:28px;font-weight:600;color:#E9E4D8;background:rgba(23,35,31,.7);padding:12px 22px;border-radius:999px}
.mascot{position:absolute;right:250px;bottom:70px;width:130px}
.word{position:absolute;right:70px;top:70px;width:200px}`, true));

/* 8. ADVENTES KALENDĀRS */
out.push(page('08-adventes-kalendars', 1200, 900, `
<div class="wrap">
  <div class="copy">
    <div class="eyebrow">1.–24. decembris</div>
    <h2>Adventes <em>kalendārs</em></h2>
    <p>Katru dienu atveras vienas durvis: vārds spāņu, angļu, norvēģu vai zviedru valodā, viktorīna, tradīcija vai atlaide kursam.</p>
    <p class="prize">Visas 24 durvis savā dienā = iespēja laimēt vietu Spāņu A1 grupā.</p>
    <span class="url">libertas.study/advente</span>
  </div>
  <div class="grid">${Array.from({ length: 24 }, (_, i) => `<span class="${[0, 4, 11, 18, 23].includes(i) ? 'on' : ''}">${i + 1}</span>`).join('')}</div>
</div>
<div class="word">${word}</div>`, `
body{background:linear-gradient(160deg,#2A3550 0%,#3A3550 45%,#6B1D1D 100%);color:#F3EEE3}
.wrap{position:absolute;inset:0;display:grid;grid-template-columns:1fr 470px;gap:60px;padding:80px;align-items:center}
.copy{display:grid;gap:26px}
.copy .eyebrow{color:var(--glow)}
.copy h2{font-size:92px}
.copy h2 em{color:var(--glow)}
.copy p{font-size:29px;line-height:1.38;color:#E9E4D8}
.copy .prize{font-weight:700;color:#FBF1E6;border-left:5px solid var(--glow);padding-left:20px}
.url{color:#E4B9A8}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.grid span{aspect-ratio:1;border-radius:16px;display:grid;place-items:center;font:600 34px/1 var(--ff-d);background:rgba(255,253,248,.08);border:2px solid rgba(242,196,106,.35);color:#F3EEE3}
.grid span.on{background:var(--glow);color:#521515;border-color:var(--glow)}
.word{position:absolute;left:80px;bottom:60px;width:170px}`));

fs.writeFileSync(path.join(OUT, 'list.txt'), out.map(o => `${o.name} ${o.w} ${o.h}`).join('\n') + '\n');
console.log('built', out.length);
