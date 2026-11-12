/* Norvēģu A1 — Vinter og jul (materiali-norvegu-ziemassvetki.html).
   Ilustrācijas zīmē JS (ART/TART/IDA, plakani tēli ar tumšu kontūru); izruna = ierakstīti mp3, rezerve = pārlūka nb-NO balss. */
(function(){
const O='#4a3550';
const C={red:'#e0614f',green:'#5fa37a',blue:'#6fa8dc',gold:'#f2c14e',pink:'#f4a3a8',cream:'#fff6e4',brown:'#c98a52',white:'#ffffff'};
// thick outline behind shapes, then fill on top = one clean silhouette
const sil=(s,f,w=7)=>`<g fill="${O}" stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${s}</g><g fill="${f}">${s}</g>`;
const eyes=(x,y,s=1,d=7)=>`<circle cx="${x-d*s}" cy="${y}" r="${2.4*s}" fill="${O}"/><circle cx="${x+d*s}" cy="${y}" r="${2.4*s}" fill="${O}"/><circle cx="${x-d*s+.8*s}" cy="${y-.9*s}" r="${.8*s}" fill="#fff"/><circle cx="${x+d*s+.8*s}" cy="${y-.9*s}" r="${.8*s}" fill="#fff"/>`;
const cheeks=(x,y,s=1,d=11)=>`<ellipse cx="${x-d*s}" cy="${y}" rx="${3.4*s}" ry="${2.1*s}" fill="${C.pink}"/><ellipse cx="${x+d*s}" cy="${y}" rx="${3.4*s}" ry="${2.1*s}" fill="${C.pink}"/>`;
const smile=(x,y,s=1)=>`<path d="M${x-3.5*s} ${y} Q${x} ${y+3.8*s} ${x+3.5*s} ${y}" stroke="${O}" stroke-width="${2*s}" fill="none" stroke-linecap="round"/>`;
const face=(x,y,s=1)=>eyes(x,y,s)+cheeks(x,y+4*s,s)+smile(x,y+4*s,s);
const star=(cx,cy,R,r)=>{let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;p.push((cx+q*Math.cos(a)).toFixed(1)+','+(cy+q*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(' ')}"/>`};

const ART={
 sno(){let a='';for(let i=0;i<6;i++)a+=`<g transform="rotate(${i*60} 50 50)"><path d="M50 50V14M50 27L41 19M50 27L59 19"/></g>`;
   return `<g stroke="${O}" stroke-width="8" stroke-linecap="round" fill="none">${a}</g><g stroke="#bfe0fb" stroke-width="3.5" stroke-linecap="round" fill="none">${a}</g>`+sil(`<circle cx="50" cy="50" r="13"/>`,C.white,5)+eyes(50,48,.6,6)+smile(50,52,.6)+`<circle cx="18" cy="82" r="3" fill="#fff"/><circle cx="84" cy="20" r="2.5" fill="#fff"/><circle cx="82" cy="84" r="2" fill="#fff"/>`},
 snomann(){return sil(`<circle cx="50" cy="72" r="21"/><circle cx="50" cy="40" r="15"/>`,C.white)
   +`<circle cx="50" cy="66" r="2.3" fill="${O}"/><circle cx="50" cy="76" r="2.3" fill="${O}"/><circle cx="50" cy="86" r="2.3" fill="${O}"/>`
   +sil(`<path d="M36 52Q50 60 64 52L64 57Q50 65 36 57Z"/><rect x="55" y="56" width="8" height="15" rx="3"/>`,C.red,5)
   +sil(`<rect x="39" y="12" width="22" height="16" rx="3"/><rect x="33" y="26" width="34" height="5" rx="2.5"/>`,'#5b4762',5)+`<rect x="39" y="21" width="22" height="4" fill="${C.red}"/>`
   +eyes(50,37,.7,6)+`<path d="M50 41L62 43L50 45Z" fill="#f29a4a" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`+cheeks(50,44,.7,13)},
 ski(){return `<g transform="rotate(-10 36 52)">`+sil(`<path d="M30 92V22Q30 8 36 8Q42 8 42 22V92Z"/>`,C.red,6)+`<path d="M36 24V88" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 5"/><rect x="28" y="52" width="16" height="9" rx="2" fill="${O}"/></g>`
   +`<g transform="rotate(10 64 52)">`+sil(`<path d="M58 92V22Q58 8 64 8Q70 8 70 22V92Z"/>`,C.blue,6)+`<path d="M64 24V88" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 5"/><rect x="56" y="52" width="16" height="9" rx="2" fill="${O}"/></g>`
   +`<g transform="rotate(10 64 52)">${eyes(64,36,.5,4)}</g><g transform="rotate(-10 36 52)">${eyes(36,36,.5,4)}</g>`},
 juletre(){return sil(`<rect x="44" y="82" width="12" height="12" rx="2"/>`,'#9b6a45',6)
   +sil(`<path d="M50 14L71 40H62L79 63H67L84 86H16L33 63H21L38 40H29Z"/>`,C.green)
   +`<g fill="${C.red}" stroke="${O}" stroke-width="1.5"><circle cx="37" cy="47" r="3.5"/><circle cx="66" cy="72" r="3.5"/></g><g fill="${C.gold}" stroke="${O}" stroke-width="1.5"><circle cx="62" cy="50" r="3.5"/><circle cx="31" cy="76" r="3.5"/></g><circle cx="50" cy="78" r="3.5" fill="${C.blue}" stroke="${O}" stroke-width="1.5"/>`
   +face(50,58,.7)+sil(star(50,13,11,5),C.gold,5)},
 pepperkake(){return sil(`<circle cx="50" cy="24" r="15"/><rect x="31" y="36" width="38" height="36" rx="13"/><rect x="14" y="40" width="72" height="15" rx="7.5"/><rect x="33" y="58" width="15" height="33" rx="7.5"/><rect x="52" y="58" width="15" height="33" rx="7.5"/>`,C.brown)
   +`<g stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M20 43q3 4 0 9M80 43q-3 4 0 9M36 85h9M55 85h9"/></g><g fill="#fff"><circle cx="50" cy="47" r="2.6"/><circle cx="50" cy="57" r="2.6"/></g><g fill="${C.red}"><circle cx="50" cy="66" r="2.6"/></g>`
   +eyes(50,22,.75,6)+cheeks(50,27,.75,11)+smile(50,27,.75)},
 lys(){return `<circle cx="50" cy="26" r="20" fill="${C.gold}" opacity=".3"/>`+sil(`<ellipse cx="50" cy="87" rx="28" ry="7"/>`,C.gold,6)
   +sil(`<rect x="35" y="40" width="30" height="47" rx="6"/>`,C.cream)+`<path d="M38 41Q38 50 42 50Q45 50 45 43" fill="${C.cream}" stroke="${O}" stroke-width="2"/>`
   +`<path d="M50 40V34" stroke="${O}" stroke-width="2.5"/>`+sil(`<path d="M50 12Q61 26 50 35Q39 26 50 12Z"/>`,'#f7a84a',4)+`<path d="M50 21Q55 28 50 32Q45 28 50 21Z" fill="${C.gold}"/>`
   +face(50,60,.75)},
 gave(){return sil(`<rect x="18" y="44" width="64" height="44" rx="5"/><rect x="13" y="33" width="74" height="15" rx="4"/>`,C.red)
   +`<rect x="60" y="33" width="10" height="55" fill="${C.gold}" stroke="${O}" stroke-width="2"/>`
   +sil(`<ellipse cx="56" cy="24" rx="11" ry="7" transform="rotate(-25 56 24)"/><ellipse cx="75" cy="24" rx="11" ry="7" transform="rotate(25 75 24)"/><circle cx="65" cy="30" r="5"/>`,C.gold,5)
   +`<g fill="#ffd0c8"><circle cx="28" cy="80" r="2"/><circle cx="76" cy="52" r="2"/><circle cx="78" cy="80" r="2"/></g>`+face(39,64,.75)},
 nisse(){return sil(`<path d="M22 94Q22 62 50 62Q78 62 78 94Z"/>`,C.red)+sil(`<circle cx="50" cy="47" r="17"/>`,'#fbd9c0')
   +sil(`<circle cx="38" cy="62" r="9"/><circle cx="50" cy="68" r="10"/><circle cx="62" cy="62" r="9"/>`,C.white,5)
   +sil(`<path d="M33 40Q37 14 63 8Q56 24 68 40Z"/>`,C.red)+sil(`<circle cx="64" cy="9" r="6"/><rect x="30" y="36" width="40" height="9" rx="4.5"/>`,C.white,5)
   +eyes(50,51,.7,6)+cheeks(50,55,.7,13)+`<circle cx="50" cy="56" r="3" fill="#ef8f8f"/>`},
 votter(){const m=(fill)=>sil(`<path d="M10 64V32Q10 12 24 12Q38 12 38 32V64Z"/><ellipse cx="9" cy="40" rx="7" ry="10"/>`,fill)+sil(`<rect x="8" y="60" width="32" height="12" rx="3"/>`,C.white,5)+`<g fill="#fff"><circle cx="24" cy="30" r="2.5"/><circle cx="18" cy="42" r="2"/><circle cx="30" cy="42" r="2"/><circle cx="24" cy="52" r="2.5"/></g>`;
   return `<path d="M30 86Q50 98 70 86" stroke="${O}" stroke-width="2.5" fill="none"/><g transform="translate(8,14) rotate(-8 24 40)">${m(C.blue)}</g><g transform="translate(92,14) scale(-1,1) rotate(-8 24 40)">${m(C.red)}</g>`},
 kakao(){return `<g stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"><path d="M36 28q-5-6 0-12t0-12M50 26q-5-6 0-12M64 28q-5-6 0-12t0-12"/></g>`
   +`<path d="M66 50q17 0 17 14t-17 14" fill="none" stroke="${O}" stroke-width="10"/><path d="M66 50q17 0 17 14t-17 14" fill="none" stroke="${C.blue}" stroke-width="4"/>`
   +sil(`<rect x="22" y="38" width="48" height="50" rx="9"/>`,C.blue)+`<ellipse cx="46" cy="40" rx="21" ry="5" fill="#8a5a3c" stroke="${O}" stroke-width="2"/>`
   +`<g fill="#fff" stroke="${O}" stroke-width="1.5"><rect x="34" y="33" width="9" height="8" rx="2.5"/><rect x="47" y="31" width="9" height="8" rx="2.5" transform="rotate(15 51 35)"/></g>`
   +face(46,62,.75)+`<path d="M58 78c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z" fill="#fff"/>`}
};
const IDA=()=>sil(`<path d="M24 98Q24 66 50 66Q76 66 76 98Z"/>`,C.green)+sil(`<circle cx="50" cy="48" r="20"/>`,'#fbd9c0')
  +sil(`<path d="M28 46Q28 18 50 18Q72 18 72 46Q66 34 50 33Q34 34 28 46Z"/>`,'#c98a52',5)
  +sil(`<path d="M29 36Q32 10 50 10Q68 10 71 36Z"/>`,C.red,5)+sil(`<circle cx="50" cy="8" r="6"/><rect x="27" y="31" width="46" height="9" rx="4.5"/>`,C.white,5)
  +`<g fill="#fff"><circle cx="40" cy="22" r="2"/><circle cx="60" cy="22" r="2"/><circle cx="50" cy="18" r="2"/></g>`
  +sil(`<path d="M34 64Q50 74 66 64L66 71Q50 80 34 71Z"/><rect x="56" y="68" width="8" height="18" rx="3"/>`,C.gold,5)+face(50,51,.8);
const TRAD=[
 {id:'risgrot',no:'risgrøt',when:'24. desember',lv:'Rīsu putra ar sviestu, cukuru un kanēli. Vecā tradīcija: bļodiņu ar putru noliek ārā rūķim — <b>nissen</b>, lai viņš visu gadu būtu labs un nedarītu blēņas.'},
 {id:'ribbe',no:'ribbe',when:'julaften',lv:'Galvenais Ziemassvētku vakara ēdiens — cūkgaļas ribiņas ar kraukšķīgu ādiņu. Rietumnorvēģijā daudzi ēd <b>pinnekjøtt</b> — sālītas un žāvētas jēra ribiņas.'},
 {id:'pepperkakebyen',no:'Pepperkakebyen',when:'Bergen',lv:'Bergenā katru gadu bērni, skolas un uzņēmumi kopā uzceļ veselu piparkūku pilsētiņu ar mājām, vilcieniem un kuģiem. To var apmeklēt!'},
 {id:'lussekatt',no:'lussekatter',when:'13. desember',lv:'Lūcijas dienā bērni baltos tērpos ar svecēm dzied dziesmas. Tad ēd dzeltenas safrāna bulciņas S formā ar rozīnēm — <b>lussekatter</b>.'},
 {id:'sjuslag',no:'sju slag',when:'advent',lv:'Tradīcija: līdz Ziemassvētkiem izcept septiņu (<b>sju</b>) veidu cepumus — piparkūkas, krumkaker, sandkaker un citus.'},
 {id:'julenek',no:'julenek',when:'jul',lv:'Labības kūlis putniem. Norvēģi to piestiprina pie staba vai pie mājas, lai arī putniņiem būtu svētki. 🐦'},
 {id:'rundt',no:'rundt juletreet',when:'julaften',lv:'Ziemassvētku vakarā ģimene sadodas rokās, iet apkārt eglītei un dzied dziesmas. Tikai pēc tam atver dāvanas!'},
 {id:'kransekake',no:'kransekake',when:'nyttårsaften',lv:'Tornis no mandeļu cepumu gredzeniem ar baltu glazūru. Bieži to rotā ar mazām Norvēģijas karodziņiem.'}];
const TART={
 risgrot(){return `<path d="M30 30q-4-8 2-14M50 26q-4-8 2-14M70 30q-4-8 2-14" stroke="${O}" stroke-width="2.5" fill="none" opacity=".45" stroke-linecap="round"/>`
   +sil(`<path d="M12 48H88Q86 86 50 88Q14 86 12 48Z"/>`,C.blue)+`<ellipse cx="50" cy="48" rx="38" ry="9" fill="#fffaf0" stroke="${O}" stroke-width="2.5"/>`
   +`<rect x="44" y="42" width="11" height="8" rx="2" fill="${C.gold}" stroke="${O}" stroke-width="1.5"/><g fill="#a0663c"><circle cx="30" cy="48" r="1.4"/><circle cx="66" cy="46" r="1.4"/><circle cx="72" cy="50" r="1.4"/><circle cx="36" cy="51" r="1.4"/></g>`
   +`<ellipse cx="62" cy="49" rx="4" ry="2.4" fill="#e8c9a0" stroke="${O}" stroke-width="1.2"/>`+face(50,68,.75)},
 ribbe(){return sil(`<ellipse cx="50" cy="66" rx="42" ry="20"/>`,C.white,6)+`<ellipse cx="50" cy="64" rx="30" ry="12" fill="#eef4fd"/>`
   +sil(`<rect x="24" y="40" width="52" height="26" rx="8"/>`,'#d98b5f',6)+`<g stroke="#8a4a2c" stroke-width="2.5" stroke-linecap="round"><path d="M33 44v18M42 44v18M51 44v18M60 44v18M69 44v18"/></g>`
   +`<path d="M24 46h52" stroke="#f3c08a" stroke-width="4"/>`+`<g fill="${C.green}" stroke="${O}" stroke-width="1.5"><circle cx="20" cy="72" r="5"/><circle cx="80" cy="72" r="5"/></g>`},
 pepperkakebyen(){const h=(x,y,w,c)=>sil(`<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="3"/><path d="M${x-4} ${y+2}L${x+w/2} ${y-w*.6}L${x+w+4} ${y+2}Z"/>`,c,5)
   +`<path d="M${x-2} ${y+1}L${x+w/2} ${y-w*.55}L${x+w+2} ${y+1}" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="3 3"/><rect x="${x+w*.35}" y="${y+w*.45}" width="${w*.3}" height="${w*.55}" rx="2" fill="${C.red}"/><circle cx="${x+w*.25}" cy="${y+w*.25}" r="2.5" fill="${C.gold}"/><circle cx="${x+w*.75}" cy="${y+w*.25}" r="2.5" fill="${C.gold}"/>`;
   return `<path d="M4 88H96" stroke="${O}" stroke-width="3"/><ellipse cx="50" cy="90" rx="46" ry="5" fill="#fff"/>`+h(10,56,30,C.brown)+h(54,46,40,'#b97a45')+`<g fill="#fff"><circle cx="40" cy="20" r="2"/><circle cx="22" cy="30" r="1.5"/><circle cx="84" cy="14" r="2"/></g>`},
 lussekatt(){const S='M22 30Q22 14 36 14Q50 14 50 30V70Q50 86 64 86Q78 86 78 70Q78 58 66 58';const S2='M78 70';
   const path=`M58 30Q66 20 56 15Q40 10 32 24Q26 40 50 50Q74 60 68 76Q62 90 44 86Q32 82 40 70`;
   return `<path d="${path}" fill="none" stroke="${O}" stroke-width="21" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#f3b93c" stroke-width="14" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#f9d977" stroke-width="5" stroke-linecap="round"/>`
   +`<g fill="#5b2f3a" stroke="${O}" stroke-width="1.2"><ellipse cx="50" cy="26" rx="4.5" ry="5"/><ellipse cx="49" cy="76" rx="4.5" ry="5"/></g>`
   +eyes(50,49,.5,4.5)+smile(50,53,.5)},
 sjuslag(){const cs=[[50,50,C.brown],[30,42,'#e8c48f'],[70,42,'#f3d9a8'],[24,62,C.brown],[76,62,'#e8c48f'],[40,70,'#f3d9a8'],[60,70,'#d99a5f']];
   return sil(`<ellipse cx="50" cy="58" rx="44" ry="26"/>`,C.white,6)+cs.map(([x,y,c],i)=>sil(i%2?`<circle cx="${x}" cy="${y}" r="9"/>`:`<rect x="${x-8}" y="${y-8}" width="16" height="16" rx="4" transform="rotate(20 ${x} ${y})"/>`,c,4)).join('')
   +`<g fill="#fff"><circle cx="50" cy="50" r="2"/><circle cx="30" cy="42" r="1.5"/><circle cx="76" cy="62" r="1.5"/></g><text x="50" y="24" text-anchor="middle" font-family="Fredoka,sans-serif" font-size="20" fill="${O}">× 7</text>`},
 julenek(){return `<path d="M50 96V40" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M50 96V40" stroke="#9b6a45" stroke-width="3" stroke-linecap="round"/>`
   +sil(`<path d="M50 44L30 14L38 12L50 36L54 10L62 12L56 38L72 16L78 22L54 46Z"/>`,C.gold,5)
   +`<rect x="44" y="40" width="12" height="7" rx="2" fill="${C.red}" stroke="${O}" stroke-width="2"/>`
   +`<g transform="translate(70,58)">`+sil(`<circle cx="0" cy="0" r="10"/><path d="M8 -2L16 0L8 3Z"/>`,'#c4613f',5)+`<circle cx="-2" cy="4" r="6" fill="#f0a77f"/>${eyes(0,-3,.45,3)}</g>`
   +`<g transform="translate(26,72) scale(-1,1)">`+sil(`<circle cx="0" cy="0" r="9"/><path d="M7 -2L14 0L7 3Z"/>`,'#7a8fb0',5)+`<circle cx="-2" cy="4" r="5" fill="#dfe8f5"/>${eyes(0,-3,.4,3)}</g>`},
 rundt(){const kid=(x,c)=>sil(`<circle cx="${x}" cy="78" r="7"/><rect x="${x-6}" y="84" width="12" height="12" rx="5"/>`,'#fbd9c0',4)+`<rect x="${x-6}" y="85" width="12" height="11" rx="5" fill="${c}"/>`+eyes(x,77,.35,3);
   return `<g transform="translate(14,0) scale(.72)">${ART.juletre()}</g><path d="M14 88H86" stroke="${O}" stroke-width="2.5"/>`+kid(16,C.red)+kid(50,C.blue)+kid(84,C.green)},
 kransekake(){let s='';[[80,64],[71,54],[62,44],[53,34],[44,24]].forEach(([y,w])=>{let z=`M${50-w/2+4} ${y+4}`;for(let x=50-w/2+4;x<50+w/2-4;x+=6)z+=` q3 5 6 0`;
     s+=sil(`<rect x="${50-w/2}" y="${y}" width="${w}" height="10" rx="5"/>`,'#e4b27a',4)+`<path d="${z}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`});
   return `<path d="M50 44V20" stroke="${O}" stroke-width="2"/><rect x="50" y="20" width="18" height="12" fill="#ba0c2f" stroke="${O}" stroke-width="1.5"/><path d="M50 26h18M56 20v12" stroke="#fff" stroke-width="3.4"/><path d="M50 26h18M56 20v12" stroke="#00205b" stroke-width="1.6"/>`
     +s+eyes(50,84,.55,5)+cheeks(50,87,.55,11)}
};

/* ---------- Izruna: ierakstītā balss (assets/materiali/norvegu-ziemassvetki/balss.json), rezerve = pārlūka nb-NO balss ---------- */
const BALSS_MAPE='assets/materiali/norvegu-ziemassvetki/';
let VOICE={};
fetch(BALSS_MAPE+'balss.json').then(r=>r.ok?r.json():{}).then(j=>{VOICE=j}).catch(()=>{});
let voice=null;
function pickVoice(){const v=speechSynthesis.getVoices();voice=v.find(x=>/^nb|^no|^nn/i.test(x.lang))||null}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
let player=null,queue=[],src=null;
/* jebkura skaņas poga: 1. klikšķis atskaņo, 2. aptur; joslā apakšā "Apturēt" aptur visu */
function playing(on,btn){document.body.classList.toggle('nor-skan',on);document.querySelectorAll('.nor-atskan').forEach(b=>{b.classList.remove('nor-atskan');b.setAttribute('aria-pressed','false')});
  if(on&&btn){btn.classList.add('nor-atskan');btn.setAttribute('aria-pressed','true')}if(!on)src=null}
function stopAll(){queue=[];if(player){player.onended=null;player.pause();player=null}if('speechSynthesis' in window)speechSynthesis.cancel();playing(false)}
function next(){if(queue.length)say(queue.shift(),1,src);else playing(false)}
function say(t,keep,btn){if(!keep)queue=[];if(player){player.onended=null;player.pause();player=null}
  if('speechSynthesis' in window)speechSynthesis.cancel();src=btn||null;playing(true,btn);
  if(VOICE[t]){player=new Audio(BALSS_MAPE+VOICE[t]);player.onended=next;player.play().catch(()=>playing(false));return}
  if(!('speechSynthesis' in window))return playing(false);const u=new SpeechSynthesisUtterance(t);u.lang='nb-NO';if(voice)u.voice=voice;u.rate=.85;u.onend=next;speechSynthesis.speak(u)}
function sayAll(list,btn){say(list[0],0,btn);queue=list.slice(1)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(!b)return;if(b.classList.contains('nor-atskan'))stopAll();else say(b.dataset.say,0,b)});
document.getElementById('nor-apturet').addEventListener('click',stopAll);
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
/* skaļruņa poga vietnes stilā (.runat-poga: SVG maska, 🔊 = rezerve) */
const runa=(t,lab)=>`<button type="button" class="runat-poga" data-say="${esc(t)}" aria-pressed="false" aria-label="Klausīties: ${esc(lab||t)}">🔊</button>`;

/* ---------- Punkti ---------- */
const score={};let total=0;
function setScore(k,v){score[k]=v;const sum=Object.values(score).reduce((a,b)=>a+b,0);
  document.getElementById('sc').textContent=sum;document.getElementById('barfill').style.width=(100*sum/total)+'%';
  if(sum===total){const f=document.getElementById('nor-beigas');if(f.hidden){f.hidden=false;f.scrollIntoView({behavior:'smooth',block:'center'});say('Gratulerer! God jul og godt nytt år!')}}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const kratit=el=>{el.classList.remove('nor-kluda');void el.offsetWidth;el.classList.add('nor-kluda');setTimeout(()=>el.classList.remove('nor-kluda'),450)};

/* Ilustrācijas lapā */
document.getElementById('ida').innerHTML=IDA();
document.getElementById('finalpic').innerHTML=ART.juletre();

/* ---------- 1. Vārdi: izvēlies vārdu → spied attēlu ---------- */
const VOCAB=[
 {id:'sno',no:'snø',art:'',lv:'sniegs'},
 {id:'snomann',no:'snømann',art:'en',lv:'sniegavīrs'},
 {id:'ski',no:'ski',art:'',lv:'slēpes'},
 {id:'juletre',no:'juletre',art:'et',lv:'Ziemassvētku eglīte'},
 {id:'pepperkake',no:'pepperkake',art:'en',lv:'piparkūka'},
 {id:'lys',no:'lys',art:'et',lv:'svece'},
 {id:'gave',no:'gave',art:'en',lv:'dāvana'},
 {id:'nisse',no:'nisse',art:'en',lv:'Ziemassvētku rūķis'},
 {id:'votter',no:'votter',art:'',lv:'dūraiņi'},
 {id:'kakao',no:'kakao',art:'',lv:'kakao'}];
total+=VOCAB.length;
(function(){
  const chips=document.getElementById('chips'),grid=document.getElementById('grid');let sel=null,got=0;
  shuffle(VOCAB).forEach(v=>{const b=document.createElement('button');b.type='button';b.className='nor-vards';b.lang='nb';b.textContent=v.no;b.dataset.id=v.id;b.setAttribute('aria-pressed','false');
    b.onclick=()=>{chips.querySelectorAll('.nor-vards').forEach(c=>c.setAttribute('aria-pressed','false'));sel=v.id;b.setAttribute('aria-pressed','true')};chips.appendChild(b)});
  shuffle(VOCAB).forEach(v=>{const d=document.createElement('div');d.className='nor-attels';
    d.innerHTML=`<button type="button" class="nor-attels-poga" aria-label="Attēls: ${v.lv}"><svg viewBox="0 0 100 100" aria-hidden="true">${ART[v.id]()}</svg></button><div class="nor-attels-nosaukums"><span class="nor-jautajums" aria-hidden="true">?</span></div>`;
    const btn=d.querySelector('.nor-attels-poga'),lab=d.querySelector('.nor-attels-nosaukums');
    btn.onclick=()=>{if(d.classList.contains('nor-atrasts'))return;
      if(!sel){lab.innerHTML='<span class="nor-maza">Vispirms izvēlies vārdu</span>';return}
      if(sel===v.id){d.classList.add('nor-atrasts');btn.disabled=true;
        lab.innerHTML=`<span class="nor-attels-no" lang="nb">${v.art?'<span class="nor-art">'+v.art+'</span> ':''}${v.no}</span><span class="nor-attels-lv">${v.lv}</span>${runa(v.no)}`;
        chips.querySelector(`[data-id="${v.id}"]`).remove();sel=null;say(v.no);setScore('v',++got)}
      else kratit(d)};
    grid.appendChild(d)});
})();

/* ---------- 2. Teksts ---------- */
const STORY=[
 ['Hei! Jeg heter Ida. Jeg bor i Tromsø, i Nord-Norge. Nå er det vinter. Det er kaldt og mørkt. Sola kommer ikke opp i desember. Men det er ikke kjedelig! Jeg liker snø. Jeg går på ski med pappa, og jeg lager en snømann med broren min, Ole. Etterpå drikker vi varm kakao.',
  'Sveiki! Mani sauc Ida. Es dzīvoju Tromsē, Ziemeļnorvēģijā. Tagad ir ziema. Ir auksti un tumšs. Decembrī saule neuzlec. Bet nav garlaicīgi! Man patīk sniegs. Es slēpoju kopā ar tēti, un mēs ar brāli Oli taisām sniegavīru. Pēc tam mēs dzeram karstu kakao.'],
 ['I desember har vi advent. Hver søndag tenner vi et lys. Vi baker pepperkaker sammen. Det lukter godt i hele huset!',
  'Decembrī mums ir Advente. Katru svētdienu mēs iededzam vienu sveci. Mēs kopā cepam piparkūkas. Visā mājā tik labi smaržo!'],
 ['Julaften er 24. desember. Vi pynter juletreet, og vi spiser ribbe. Til dessert spiser vi riskrem. Den som finner mandelen, får en marsipangris. Om kvelden åpner vi gaver. Kanskje kommer nissen også?',
  'Ziemassvētku vakars ir 24. decembrī. Mēs izrotājam eglīti un ēdam ceptas cūkgaļas ribiņas. Desertā mēs ēdam rīsu krēmu. Kas atrod mandeli, saņem marcipāna sivēntiņu. Vakarā mēs atveram dāvanas. Varbūt atnāks arī rūķis?'],
 ['Nyttårsaften er 31. desember. Vi ser på fyrverkeri og sier: «Godt nytt år!»',
  'Vecgada vakars ir 31. decembrī. Mēs skatāmies salūtu un sakām: „Laimīgu Jauno gadu!”']];
(function(){
  const st=document.getElementById('story');
  STORY.forEach(([no,lv],i)=>{const d=document.createElement('div');d.className='nor-rindkopa';
    d.innerHTML=`<p lang="nb">${no}</p>${runa(no.replace(/"/g,''),(i+1)+'. rindkopa')}<p class="nor-tulk">${lv}</p>`;st.appendChild(d)});
  const all=document.getElementById('nor-klausities-visu');
  all.onclick=()=>{if(all.classList.contains('nor-atskan'))stopAll();else sayAll(STORY.map(x=>x[0]),all)};
  document.getElementById('nor-tulkojums').onchange=e=>st.classList.toggle('nor-rada-tulk',e.target.checked);
  const W=[['det er kaldt','ir auksti'],['mørkt','tumšs'],['sola','saule'],['kjedelig','garlaicīgi'],['broren min','mans brālis'],['etterpå','pēc tam'],['hver søndag','katru svētdienu'],['tenner','iededz'],['pynter','rotā'],['julaften','Ziemassvētku vakars'],['om kvelden','vakarā'],['kanskje','varbūt'],['nyttårsaften','Vecgada vakars'],['fyrverkeri','salūts']];
  document.getElementById('words').innerHTML=W.map(([a,b])=>`<li><b lang="nb">${a}</b> – ${b}</li>`).join('');
})();

/* ---------- 3. Tradīcijas + tests ---------- */
const MCQ=[
 ['Ko norvēģi atstāj rūķim (nissen)?',['risgrøt','ribbe','kransekake'],0],
 ['Kurā datumā ir Lūcijas diena?',['24. desember','13. desember','31. desember'],1],
 ['Kurā pilsētā ir Pepperkakebyen?',['Oslo','Tromsø','Bergen'],2],
 ['Kam ir julenek?',['putniem','rūķim','bērniem'],0],
 ['Cik veidu cepumu ir „sju slag”?',['3','7','10'],1]];
total+=MCQ.length;
(function(){
  document.getElementById('trad').innerHTML=TRAD.map(t=>`<li class="nor-trad"><svg viewBox="0 0 100 100" aria-hidden="true">${TART[t.id]()}</svg><span class="nor-kad" lang="nb">${t.when}</span><h3><span lang="nb">${t.no}</span> ${runa(t.no)}</h3><p>${t.lv}</p></li>`).join('');
  const box=document.getElementById('mcq');let pts=0;
  MCQ.forEach(([q,opts,ok],qi)=>{const d=document.createElement('div');d.className='nor-jautajums-bloks';d.setAttribute('role','group');d.setAttribute('aria-labelledby','nor-mc-'+qi);
    d.innerHTML=`<p class="nor-jautajums-teksts" id="nor-mc-${qi}">${qi+1}. ${q}</p><div class="nor-opcijas"></div>`;
    opts.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='nor-opcija';b.textContent=o;
      b.onclick=()=>{if(d.classList.contains('nor-atbildets'))return;d.classList.add('nor-atbildets');
        if(i===ok){b.classList.add('nor-pareizi');pts++;setScore('m',pts)}else{b.classList.add('nor-nepareizi');d.querySelectorAll('.nor-opcija')[ok].classList.add('nor-pareizi')}};
      d.querySelector('.nor-opcijas').appendChild(b)});
    box.appendChild(d)});
})();

/* ---------- 4. Riktig eller galt ---------- */
const TF=[
 ['Ida bor i Oslo.',false,'Ida bor i Tromsø.'],
 ['I desember er det mørkt i Tromsø.',true],
 ['Ida lager en snømann med Ole.',true],
 ['Etterpå drikker de kald melk.',false,'De drikker varm kakao.'],
 ['Julaften er 25. desember.',false,'Julaften er 24. desember.'],
 ['Den som finner mandelen, får en marsipangris.',true]];
total+=TF.length;
(function(){
  const box=document.getElementById('tf');let pts=0;
  TF.forEach(([s,ans,fix])=>{const d=document.createElement('li');d.className='nor-pp';
    d.innerHTML=`<span class="nor-pp-teikums"><span lang="nb">${s}</span> ${runa(s)}</span><span class="nor-opcijas"><button type="button" class="nor-opcija" data-v="1" lang="nb">riktig</button><button type="button" class="nor-opcija" data-v="0" lang="nb">galt</button></span><p class="nor-atsauksme" aria-live="polite"></p>`;
    d.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{if(d.classList.contains('nor-atbildets'))return;d.classList.add('nor-atbildets');
      const ok=(b.dataset.v==='1')===ans,fb=d.querySelector('.nor-atsauksme');b.classList.add(ok?'nor-pareizi':'nor-nepareizi');
      if(ok){pts++;setScore('t',pts);fb.className='nor-atsauksme nor-ok';fb.textContent='Pareizi!'+(fix?' '+fix:'')}
      else{fb.className='nor-atsauksme nor-slikti';fb.textContent='Nepareizi. '+(fix?'Pareizi: '+fix:'Šis teikums ir patiess (riktig).')}});
    box.appendChild(d)});
})();

/* ---------- 5. Trūkstošie vārdi ---------- */
const GAPS=[['Det er kaldt og','mørkt','.'],['Jeg går på','ski','med pappa.'],['Vi baker','pepperkaker','sammen.'],['Hver søndag tenner vi et','lys','.'],['Julaften er 24.','desember','.'],['Om kvelden åpner vi','gaver','.']];
total+=GAPS.length;
(function(){
  document.getElementById('bank').innerHTML=shuffle(GAPS.map(g=>g[1])).map(w=>`<li lang="nb">${w}</li>`).join('');
  const box=document.getElementById('gaps');let last=null;
  GAPS.forEach(([a,w,b],i)=>{const p=document.createElement('li');p.lang='nb';p.innerHTML=`${a} <input class="uzd-lauks uzd-lauks--m" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${i+1}. teikuma trūkstošais vārds" data-a="${w}"> ${b}`;box.appendChild(p)});
  box.addEventListener('focusin',e=>{if(e.target.tagName==='INPUT')last=e.target});
  document.querySelectorAll('[data-l]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const i=last||box.querySelector('input:not([readonly])')||box.querySelector('input');if(i.readOnly)return;const p=i.selectionStart??i.value.length;i.value=i.value.slice(0,p)+b.dataset.l+i.value.slice(i.selectionEnd??p);i.focus();i.setSelectionRange(p+1,p+1);i.classList.remove('pareizi','nepareizi')}});
  box.addEventListener('input',e=>e.target.classList.remove('pareizi','nepareizi'));
  document.getElementById('gapcheck').onclick=()=>{let n=0;box.querySelectorAll('input').forEach(i=>{const ok=i.value.trim().toLowerCase().replace(/\s+/g,' ')===i.dataset.a;i.classList.toggle('pareizi',ok);i.classList.toggle('nepareizi',!ok&&i.value.trim()!=='');if(ok){n++;i.readOnly=true}});
    setScore('g',n);const fb=document.getElementById('gapfb');fb.className='uzd-rezultats'+(n===GAPS.length?' visi-pareizi':'');fb.textContent=n===GAPS.length?'Viss pareizi!':`Pareizi: ${n} no ${GAPS.length}. Izlabo sarkanos!`};
})();

/* ---------- 6. Saliec teikumu ---------- */
const ORD=[
 {w:['Jeg','liker','snø'],ok:['jeg liker snø'],end:'.'},
 {w:['Vi','baker','pepperkaker','sammen'],ok:['vi baker pepperkaker sammen','sammen baker vi pepperkaker'],end:'.'},
 {w:['Etterpå','drikker','vi','varm','kakao'],ok:['etterpå drikker vi varm kakao','vi drikker varm kakao etterpå'],end:'.'},
 {w:['Om','kvelden','åpner','vi','gaver'],ok:['om kvelden åpner vi gaver','vi åpner gaver om kvelden'],end:'.'}];
total+=ORD.length;
(function(){
  const box=document.getElementById('order');const done=new Set();
  ORD.forEach((o,i)=>{const d=document.createElement('li');d.className='nor-teikums';
    d.innerHTML=`<div class="nor-atbilde" lang="nb" aria-label="Tavs teikums"></div><div class="nor-krajums" lang="nb"></div><div class="uzd-darbibas"><button type="button" class="btn-cta uzd-parbaudit">Pārbaudīt</button><button type="button" class="mat-poga-maza">Sākt no jauna</button><span class="uzd-rezultats" aria-live="polite"></span></div>`;
    const ans=d.querySelector('.nor-atbilde'),pool=d.querySelector('.nor-krajums'),[chk,rst]=d.querySelectorAll('.uzd-darbibas button'),fb=d.querySelector('.uzd-rezultats');
    const fill=()=>{ans.innerHTML='';pool.innerHTML='';let s=shuffle(o.w);if(s.join()===o.w.join())s=s.reverse();
      s.forEach(t=>{const b=document.createElement('button');b.type='button';b.className='nor-vards';b.textContent=t;b.onclick=()=>{if(done.has(i))return;(b.parentNode===pool?ans:pool).appendChild(b);ans.classList.remove('nor-ok','nor-slikti');fb.textContent=''};pool.appendChild(b)})};
    fill();
    chk.onclick=()=>{if(done.has(i))return;const got=[...ans.children].map(b=>b.textContent).join(' ').toLowerCase();
      if(pool.children.length){fb.className='uzd-rezultats nor-slikti-teksts';fb.textContent='Izmanto visus vārdus!';return}
      if(o.ok.includes(got)){done.add(i);ans.classList.add('nor-ok');const t=got[0].toUpperCase()+got.slice(1);ans.insertAdjacentHTML('beforeend',`<b>${o.end}</b> ${runa(t)}`);fb.className='uzd-rezultats visi-pareizi';fb.textContent='Pareizi!';chk.disabled=rst.disabled=true;say(t);setScore('o',done.size)}
      else{ans.classList.add('nor-slikti');fb.className='uzd-rezultats nor-slikti-teksts';fb.textContent='Vēl nav gluži — mēģini vēlreiz!'}};
    rst.onclick=()=>{if(!done.has(i)){fill();fb.textContent='';ans.classList.remove('nor-slikti')}};
    box.appendChild(d)});
})();

/* ---------- 7. Spēle: Idas ziemas diena ---------- */
const SCENES=[
 {bg:'out',no:'Det er morgen. Det er kaldt ute. Ida tar på seg votter.',lv:'Ir rīts. Ārā ir auksti. Ida uzvelk dūraiņus.',a:'votter',d:['kakao','lys']},
 {bg:'out',no:'Ida og Ole lager en stor snømann.',lv:'Ida un Ole taisa lielu sniegavīru.',a:'snomann',d:['gave','pepperkake']},
 {bg:'out',no:'Etterpå går Ida på ski med pappa.',lv:'Pēc tam Ida ar tēti slēpo.',a:'ski',d:['juletre','votter']},
 {bg:'in',no:'Hjemme baker mamma pepperkaker. Mmm!',lv:'Mājās mamma cep piparkūkas. Mmm!',a:'pepperkake',d:['snomann','ski']},
 {bg:'in',no:'Det er søndag. Ida tenner et lys.',lv:'Ir svētdiena. Ida iededz sveci.',a:'lys',d:['sno','nisse']},
 {bg:'in',no:'Det er julaften! Vi pynter juletreet.',lv:'Ir Ziemassvētku vakars! Mēs rotājam eglīti.',a:'juletre',d:['ski','kakao']},
 {bg:'in',no:'Hvem er det? Det er nissen!',lv:'Kas tur ir? Tas ir rūķis!',a:'nisse',d:['snomann','lys']},
 {bg:'in',no:'Nissen har en gave til Ida.',lv:'Rūķim ir dāvana Idai.',a:'gave',d:['votter','pepperkake']},
 {bg:'night',no:'Nå drikker Ida varm kakao. God natt, Ida!',lv:'Tagad Ida dzer karstu kakao. Arlabunakti, Ida!',a:'kakao',d:['ski','sno']}];
total+=SCENES.length;
(function(){
  const stage=document.getElementById('stage'),dots=document.getElementById('dots'),picks=document.getElementById('picks'),txt=document.getElementById('gtxt'),lv=document.getElementById('glv'),nextBtn=document.getElementById('gnext');
  let cur=0,pts=0,tries=0;const placed=[];
  const BG={
   out:`<rect width="400" height="220" fill="#cfe6fb"/><circle cx="350" cy="40" r="20" fill="${C.gold}"/>${eyes(350,38,.7,6)}${smile(350,43,.7)}<path d="M0 150Q100 120 200 145T400 135V220H0Z" fill="#eef4fd"/><path d="M0 175Q120 150 240 172T400 165V220H0Z" fill="#fff"/>`,
   in:`<rect width="400" height="220" fill="#f8e6d4"/><rect y="170" width="400" height="50" fill="#d9b48f"/><path d="M0 170H400" stroke="${O}" stroke-width="3"/><g transform="translate(270,30)">${sil('<rect width="90" height="70" rx="6"/>','#33407a',5)}<path d="M45 0V70M0 35H90" stroke="${O}" stroke-width="4"/><circle cx="20" cy="18" r="2" fill="#fff"/><circle cx="68" cy="50" r="2" fill="#fff"/><circle cx="70" cy="14" r="2" fill="#fff"/></g><g fill="${C.red}" opacity=".35"><circle cx="30" cy="30" r="4"/><circle cx="90" cy="60" r="4"/><circle cx="150" cy="25" r="4"/><circle cx="210" cy="70" r="4"/></g>`,
   night:`<rect width="400" height="220" fill="#2f3a75"/><rect y="170" width="400" height="50" fill="#5a4a6a"/><path d="M0 70Q120 20 220 60T400 40" stroke="#7be0b0" stroke-width="22" opacity=".3" fill="none"/><g fill="#fff"><circle cx="40" cy="30" r="2"/><circle cx="120" cy="90" r="1.5"/><circle cx="300" cy="100" r="2"/><circle cx="360" cy="25" r="1.5"/></g><circle cx="330" cy="55" r="18" fill="#fff6c8"/>`};
  const POS=[[70,105,.62],[150,95,.7],[300,110,.6],[40,120,.55],[110,118,.5],[300,95,.75],[230,110,.65],[95,125,.5],[175,125,.55]];
  const NOS=Object.fromEntries(VOCAB.map(v=>[v.id,v.lv]));
  SCENES.forEach(()=>dots.insertAdjacentHTML('beforeend','<li></li>'));
  function draw(showNew){
    const s=SCENES[cur];let g=BG[s.bg];
    // atrastie priekšmeti tajā pašā vietā paliek attēlā
    placed.forEach((p,i)=>{if(SCENES[i].bg===s.bg||(s.bg==='night'&&SCENES[i].bg==='in')){const [x,y,k]=POS[i];g+=`<g transform="translate(${x},${y}) scale(${k})"><g class="${showNew&&i===cur?'nor-paradas':''}">${ART[p]()}</g></g>`}});
    g+=`<g transform="translate(190,92) scale(.85)">${IDA()}</g>`;
    if(!placed[cur])g+=`<g transform="translate(250,40)">${sil('<path d="M0 0H60Q70 0 70 10V36Q70 46 60 46H22L8 58L12 46H10Q0 46 0 36V10Q0 0 10 0Z"/>','#fff',5)}<text x="35" y="33" text-anchor="middle" font-family="Lora,serif" font-size="30" fill="${O}">?</text></g>`;
    stage.innerHTML=`<svg viewBox="0 0 400 220" role="img" aria-label="${cur+1}. aina no ${SCENES.length}">${g}</svg>`;
  }
  function show(){
    const s=SCENES[cur];tries=0;txt.textContent=s.no;txt.classList.remove('nor-redzams');lv.textContent='';nextBtn.hidden=true;
    dots.querySelectorAll('li').forEach((d,i)=>d.className=i<cur?'nor-gatavs':i===cur?'nor-tagad':'');
    draw(false);picks.innerHTML='';
    shuffle([s.a,...s.d]).forEach(id=>{const b=document.createElement('button');b.type='button';b.className='nor-izvele-attels';b.setAttribute('aria-label',NOS[id]);b.innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true">${ART[id]()}</svg>`;
      b.onclick=()=>{if(placed[cur])return;
        if(id===s.a){b.classList.add('nor-pareizi');placed[cur]=id;if(tries===0){pts++;setScore('s',pts)}txt.classList.add('nor-redzams');lv.textContent=s.lv;draw(true);
          const v=VOCAB.find(x=>x.id===id);setTimeout(()=>say(v.no),200);
          if(cur<SCENES.length-1)nextBtn.hidden=false;else{lv.textContent=s.lv+' — Slutt! Stāsts beidzies.';dots.querySelectorAll('li').forEach(d=>d.className='nor-gatavs')}}
        else{tries++;kratit(b)}};
      picks.appendChild(b)});
  }
  const gplay=document.getElementById('gplay');
  gplay.onclick=()=>{if(gplay.classList.contains('nor-atskan'))stopAll();else say(SCENES[cur].no,0,gplay)};
  document.getElementById('gshow').onclick=()=>{txt.classList.add('nor-redzams');lv.textContent=SCENES[cur].lv};
  nextBtn.onclick=()=>{cur++;show();say(SCENES[cur].no)};
  show();
})();

document.getElementById('tot').textContent=total;
document.getElementById('nor-no-jauna').onclick=()=>location.reload();
})();
