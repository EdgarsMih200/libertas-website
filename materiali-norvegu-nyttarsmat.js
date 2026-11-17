/* Norvēģu A1 — Nyttårsmat i Norge (materiali-norvegu-nyttarsmat.html), tikai reģistrētiem (Worker).
   Ilustrācijas zīmē JS (ART/IDA, plakani tēli ar tumšu kontūru); izruna = ierakstīti mp3, rezerve = pārlūka nb-NO balss. */
(function(){
const O='#4a3550';
const C={red:'#e0614f',green:'#5fa37a',blue:'#6fa8dc',gold:'#f2c14e',pink:'#f4a3a8',cream:'#fff6e4',brown:'#c98a52',white:'#ffffff',orange:'#f2a33a'};
const sil=(s,f,w=7)=>`<g fill="${O}" stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${s}</g><g fill="${f}">${s}</g>`;
const eyes=(x,y,s=1,d=7)=>`<circle cx="${x-d*s}" cy="${y}" r="${2.4*s}" fill="${O}"/><circle cx="${x+d*s}" cy="${y}" r="${2.4*s}" fill="${O}"/><circle cx="${x-d*s+.8*s}" cy="${y-.9*s}" r="${.8*s}" fill="#fff"/><circle cx="${x+d*s+.8*s}" cy="${y-.9*s}" r="${.8*s}" fill="#fff"/>`;
const cheeks=(x,y,s=1,d=11)=>`<ellipse cx="${x-d*s}" cy="${y}" rx="${3.4*s}" ry="${2.1*s}" fill="${C.pink}"/><ellipse cx="${x+d*s}" cy="${y}" rx="${3.4*s}" ry="${2.1*s}" fill="${C.pink}"/>`;
const smile=(x,y,s=1)=>`<path d="M${x-3.5*s} ${y} Q${x} ${y+3.8*s} ${x+3.5*s} ${y}" stroke="${O}" stroke-width="${2*s}" fill="none" stroke-linecap="round"/>`;
const face=(x,y,s=1)=>eyes(x,y,s)+cheeks(x,y+4*s,s)+smile(x,y+4*s,s);
const star=(cx,cy,R,r)=>{let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;p.push((cx+q*Math.cos(a)).toFixed(1)+','+(cy+q*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(' ')}"/>`};
const plate=(cy=70,rx=44,ry=18)=>sil(`<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}"/>`,C.white,6)+`<ellipse cx="50" cy="${cy-2}" rx="${rx*.7}" ry="${ry*.6}" fill="#eef4fd"/>`;
const burst=(cx,cy,R,col,n=12)=>{let s='';for(let i=0;i<n;i++){const a=i*2*Math.PI/n,x1=cx+Math.cos(a)*R*.35,y1=cy+Math.sin(a)*R*.35,x2=cx+Math.cos(a)*R,y2=cy+Math.sin(a)*R;s+=`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${R/12}" stroke="none"/>`}return `<g stroke="${col}" fill="${col}" stroke-width="${R/14}" stroke-linecap="round">${s}</g>`};

const ART={
 kalkun(){return plate(74,46,17)
   +sil(`<path d="M22 54Q10 44 14 34Q20 28 28 40Z"/><path d="M78 54Q90 44 86 34Q80 28 72 40Z"/>`,'#c9773a',6)
   +sil(`<circle cx="14" cy="31" r="5"/><circle cx="18" cy="27" r="4.5"/><circle cx="86" cy="31" r="5"/><circle cx="82" cy="27" r="4.5"/>`,C.white,4)
   +sil(`<ellipse cx="50" cy="56" rx="31" ry="21"/>`,'#d98b4f')+`<ellipse cx="42" cy="46" rx="13" ry="6" fill="#efb27a" transform="rotate(-12 42 46)"/>`
   +face(50,58,.75)+`<g fill="${C.red}" stroke="${O}" stroke-width="1.3"><circle cx="16" cy="76" r="3.4"/><circle cx="22" cy="80" r="3.4"/><circle cx="84" cy="76" r="3.4"/></g>`},
 ribbe(){return plate(66,42,20)
   +sil(`<rect x="24" y="40" width="52" height="26" rx="8"/>`,'#d98b5f',6)+`<g stroke="#8a4a2c" stroke-width="2.5" stroke-linecap="round"><path d="M33 44v18M42 44v18M51 44v18M60 44v18M69 44v18"/></g>`
   +`<path d="M24 46h52" stroke="#f3c08a" stroke-width="4"/>`+`<g fill="${C.green}" stroke="${O}" stroke-width="1.5"><circle cx="20" cy="72" r="5"/><circle cx="80" cy="72" r="5"/></g>`},
 pinnekjott(){const st=(a)=>`<g transform="rotate(${a} 50 62)"><rect x="10" y="59" width="80" height="6" rx="3" fill="#f3efe4" stroke="${O}" stroke-width="2"/><g fill="${O}"><rect x="22" y="59" width="5" height="2"/><rect x="44" y="63" width="6" height="2"/><rect x="70" y="59" width="5" height="2"/></g></g>`;
   return plate(68,44,20)+st(-8)+st(8)
   +[30,50,70].map((x,i)=>sil(`<rect x="${x-9}" y="${36+(i%2)*3}" width="18" height="22" rx="6"/>`,'#a8562f',5)+`<rect x="${x-6}" y="${39+(i%2)*3}" width="12" height="7" rx="3" fill="#cf7a45"/><path d="M${x} ${58+(i%2)*3}v8" stroke="#f3efe4" stroke-width="4" stroke-linecap="round"/>`).join('')
   +sil(`<path d="M62 78q4-9 13-6q9-3 11 5q2 6-8 7q-10 1-16-6z"/>`,C.orange,4)+eyes(50,46,.45,4)},
 reker(){const p='M30 72 A24 24 0 1 1 72 62';
   return `<path d="${p}" fill="none" stroke="${O}" stroke-width="27" stroke-linecap="round"/><path d="${p}" fill="none" stroke="#f2836b" stroke-width="20" stroke-linecap="round"/><path d="${p}" fill="none" stroke="#f9b19d" stroke-width="6" stroke-linecap="round" opacity=".8"/>`
   +`<g stroke="#c9503a" stroke-width="2.5" stroke-linecap="round"><path d="M40 28l-2 9M56 26l-1 9M70 34l-5 7M30 42l6 5"/></g>`
   +sil(`<path d="M72 62L88 66L80 76Z"/>`,'#e86a50',5)
   +`<g stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M24 70Q6 66 6 50M26 74Q10 80 6 92"/></g>`+eyes(32,66,.6,5)},
 kransekake(){let s='';[[80,64],[71,54],[62,44],[53,34],[44,24]].forEach(([y,w])=>{let z=`M${50-w/2+4} ${y+4}`;for(let x=50-w/2+4;x<50+w/2-4;x+=6)z+=` q3 5 6 0`;
     s+=sil(`<rect x="${50-w/2}" y="${y}" width="${w}" height="10" rx="5"/>`,'#e4b27a',4)+`<path d="${z}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`});
   return `<path d="M50 44V20" stroke="${O}" stroke-width="2"/><rect x="50" y="20" width="18" height="12" fill="#ba0c2f" stroke="${O}" stroke-width="1.5"/><path d="M50 26h18M56 20v12" stroke="#fff" stroke-width="3.4"/><path d="M50 26h18M56 20v12" stroke="#00205b" stroke-width="1.6"/>`
     +s+eyes(50,84,.55,5)+cheeks(50,87,.55,11)},
 tyttebaer(){const b=[[34,42],[44,36],[56,38],[66,44],[40,48],[52,46],[62,50],[30,52],[72,52],[48,30]];
   return sil(`<path d="M14 52H86Q84 88 50 90Q16 88 14 52Z"/>`,C.blue)
   +b.map(([x,y])=>sil(`<circle cx="${x}" cy="${y}" r="7"/>`,'#d23a3f',3.5)+`<circle cx="${x-2}" cy="${y-2}" r="1.8" fill="#fff" opacity=".8"/>`).join('')
   +sil(`<path d="M58 26Q70 12 82 20Q72 32 58 26Z"/>`,C.green,4)+face(50,70,.75)},
 poteter(){const pt=(x,y,r,a)=>`<g transform="rotate(${a} ${x} ${y})">`+sil(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.75}"/>`,'#dcae6a')+`<g fill="#b98a4a"><circle cx="${x-r*.5}" cy="${y-r*.35}" r="1.6"/><circle cx="${x+r*.55}" cy="${y+r*.2}" r="1.6"/><circle cx="${x+r*.2}" cy="${y-r*.5}" r="1.3"/></g></g>`;
   return pt(36,62,24,-10)+face(36,60,.65)+pt(68,44,19,15)+eyes(68,42,.55,5)+smile(68,46,.55)+`<path d="M60 76q8-4 14 2" stroke="${C.green}" stroke-width="4" fill="none" stroke-linecap="round"/>`},
 rosenkal(){return sil(`<circle cx="50" cy="54" r="33"/>`,'#7fbf5a')
   +`<g fill="none" stroke="#4d8a35" stroke-width="2.6" stroke-linecap="round"><path d="M22 46Q36 30 50 40Q64 30 78 46"/><path d="M24 66Q34 78 50 70Q66 78 76 66"/><path d="M50 22Q44 34 50 40"/></g>`
   +`<path d="M28 34Q40 26 50 30" stroke="#b7e08f" stroke-width="3" fill="none" stroke-linecap="round"/>`+face(50,52,.8)},
 saus(){return `<g stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".5"><path d="M38 30q-4-7 0-13M52 28q-4-7 0-13"/></g>`
   +sil(`<path d="M14 46Q14 76 42 78H62Q80 76 84 58L96 40Q80 44 72 46Z"/>`,C.cream)
   +`<path d="M18 47H72" stroke="#8a4a2c" stroke-width="6" stroke-linecap="round"/>`
   +`<path d="M16 54Q4 54 6 64Q8 72 18 68" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M16 54Q4 54 6 64Q8 72 18 68" fill="none" stroke="${C.cream}" stroke-width="3.5" stroke-linecap="round"/>`
   +sil(`<ellipse cx="46" cy="86" rx="22" ry="5"/>`,C.cream,5)+face(44,60,.7)},
 multekrem(){const mb=(x,y)=>[[0,0],[5,0],[-5,0],[2.5,-4.3],[-2.5,-4.3],[2.5,4.3],[-2.5,4.3]].map(([a,b])=>`<circle cx="${x+a}" cy="${y+b}" r="3.2" fill="${C.orange}" stroke="${O}" stroke-width="1.2"/>`).join('');
   return sil(`<path d="M18 50H82L70 82Q50 90 30 82Z"/><rect x="44" y="82" width="12" height="8"/><ellipse cx="50" cy="92" rx="18" ry="4"/>`,'#e6f2fb')
   +sil(`<path d="M20 50Q18 34 32 34Q34 22 48 26Q58 16 68 28Q84 28 80 50Z"/>`,C.white,5)
   +mb(40,34)+mb(62,32)+`<path d="M60 22q4-6 10-4" stroke="${C.green}" stroke-width="3" fill="none" stroke-linecap="round"/>`+face(50,64,.7)},
 skal(){const g=(x,a,c)=>`<g transform="rotate(${a} ${x} 60)">`+sil(`<path d="M${x-13} 18H${x+13}L${x+9} 52Q${x} 60 ${x-9} 52Z"/><rect x="${x-2}" y="56" width="4" height="26"/><ellipse cx="${x}" cy="84" rx="12" ry="3.5"/>`,'#f4f8fd',5)+`<path d="M${x-11} 28H${x+11}L${x+8.5} 50Q${x} 57 ${x-8.5} 50Z" fill="${c}"/><g fill="#fff"><circle cx="${x-3}" cy="40" r="1.6"/><circle cx="${x+3}" cy="34" r="1.3"/><circle cx="${x}" cy="46" r="1.4"/></g></g>`;
   return g(36,-12,C.gold)+g(64,12,'#f7a8b0')+`<g fill="${C.gold}">${star(50,10,8,3.5)}</g><g stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"><path d="M38 8l-4-4M62 8l4-4"/></g>`},
 brus(){return sil(`<path d="M42 8H58V22Q70 30 70 44V86Q70 92 64 92H36Q30 92 30 86V44Q30 30 42 22Z"/>`,'#e0614f')
   +sil(`<rect x="30" y="50" width="40" height="24"/>`,C.white,4)+`<rect x="42" y="4" width="16" height="7" rx="2" fill="${C.gold}" stroke="${O}" stroke-width="2"/>`
   +face(50,58,.65)+`<g fill="#fff" opacity=".8"><circle cx="38" cy="36" r="2"/><circle cx="44" cy="30" r="1.5"/><circle cx="62" cy="82" r="2"/></g>`},
 fyrverkeri(){return `<rect width="100" height="100" rx="16" fill="#2f3a75"/>`+burst(34,36,22,C.gold,12)+burst(70,30,16,'#f7a8b0',10)+burst(64,68,18,'#8fd3ff',12)+`<g fill="#fff"><circle cx="18" cy="80" r="1.5"/><circle cx="86" cy="86" r="1.5"/></g>`},
 takk(){return sil(`<path d="M10 20H90Q94 20 94 26V64Q94 70 88 70H40L24 86L28 70H12Q6 70 6 64V26Q6 20 10 20Z"/>`,C.white,6)
   +`<text x="50" y="43" text-anchor="middle" font-family="Lora,serif" font-weight="600" font-size="15" fill="${C.red}">Takk</text><text x="50" y="60" text-anchor="middle" font-family="Lora,serif" font-weight="600" font-size="15" fill="${C.red}">for i år!</text>`
   +`<g fill="${C.gold}">${star(86,16,7,3)}</g>`},
 tv(){return sil(`<rect x="12" y="20" width="76" height="54" rx="8"/><rect x="40" y="76" width="20" height="8"/><rect x="28" y="84" width="44" height="6" rx="3"/>`,'#8aa0c8')
   +`<rect x="18" y="26" width="64" height="42" rx="4" fill="#dcecfa"/>`
   +sil(`<path d="M36 46L40 34L46 42L50 30L54 42L60 34L64 46Z"/>`,C.gold,4)+`<rect x="38" y="46" width="24" height="16" rx="6" fill="#fbd9c0" stroke="${O}" stroke-width="2"/>`+eyes(50,53,.45,4)+`<text x="50" y="18" text-anchor="middle" font-family="Lora,serif" font-weight="600" font-size="11" fill="${O}">19:40</text>`},
 forsett(){return sil(`<rect x="20" y="12" width="60" height="78" rx="6"/>`,C.cream)
   +`<g stroke="${O}" stroke-width="2.4" stroke-linecap="round"><path d="M32 34H70M32 48H70M32 62H58"/></g>`
   +`<g fill="none" stroke="${C.green}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 34l3 3 5-6M24 48l3 3 5-6"/></g>`
   +`<text x="50" y="26" text-anchor="middle" font-family="Lora,serif" font-weight="600" font-size="11" fill="${C.red}">2027</text>`+smile(66,78,.8)}
};
const IDA=()=>sil(`<path d="M24 98Q24 66 50 66Q76 66 76 98Z"/>`,C.red)+sil(`<circle cx="50" cy="48" r="20"/>`,'#fbd9c0')
  +sil(`<path d="M28 46Q28 18 50 18Q72 18 72 46Q66 34 50 33Q34 34 28 46Z"/>`,'#c98a52',5)
  +sil(`<path d="M32 22L50 2L68 22Z"/>`,C.gold,5)+`<g fill="${C.red}"><circle cx="44" cy="14" r="2"/><circle cx="56" cy="16" r="2"/><circle cx="50" cy="8" r="1.8"/></g>`
  +sil(`<path d="M38 68L50 76L62 68"/>`,C.gold,4)+face(50,51,.8);

/* ---------- Izruna: ierakstītā balss (assets/materiali/norvegu-nyttarsmat/balss.json), rezerve = pārlūka nb-NO balss ---------- */
const BALSS_MAPE='assets/materiali/norvegu-nyttarsmat/';
let VOICE={};
fetch(BALSS_MAPE+'balss.json').then(r=>r.ok?r.json():{}).then(j=>{VOICE=j}).catch(()=>{});
let voice=null;
function pickVoice(){const v=speechSynthesis.getVoices();voice=v.find(x=>/^nb|^no|^nn/i.test(x.lang))||null}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
let player=null,queue=[],src=null;
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
const runa=(t,lab)=>`<button type="button" class="runat-poga" data-say="${esc(t)}" aria-pressed="false" aria-label="Klausīties: ${esc(lab||t)}">🔊</button>`;

/* ---------- Punkti ---------- */
const score={};let total=0;
function setScore(k,v){score[k]=v;const sum=Object.values(score).reduce((a,b)=>a+b,0);
  document.getElementById('sc').textContent=sum;document.getElementById('barfill').style.width=(100*sum/total)+'%';
  if(sum===total){const f=document.getElementById('nor-beigas');if(f.hidden){f.hidden=false;f.scrollIntoView({behavior:'smooth',block:'center'});say('Gratulerer! Takk for i år og godt nytt år!')}}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const kratit=el=>{el.classList.remove('nor-kluda');void el.offsetWidth;el.classList.add('nor-kluda');setTimeout(()=>el.classList.remove('nor-kluda'),450)};

document.getElementById('ida').innerHTML=IDA();
document.getElementById('finalpic').innerHTML=ART.kransekake();

/* ---------- 1. Vārdi: izvēlies vārdu → spied attēlu ---------- */
const VOCAB=[
 {id:'kalkun',no:'kalkun',art:'en',lv:'tītars'},
 {id:'ribbe',no:'ribbe',art:'en',lv:'cūkgaļas ribiņas'},
 {id:'pinnekjott',no:'pinnekjøtt',art:'et',lv:'žāvētas jēra ribiņas'},
 {id:'reker',no:'reker',art:'',lv:'garneles'},
 {id:'poteter',no:'poteter',art:'',lv:'kartupeļi'},
 {id:'rosenkal',no:'rosenkål',art:'en',lv:'Briseles kāposti'},
 {id:'saus',no:'saus',art:'en',lv:'mērce'},
 {id:'tyttebaer',no:'tyttebær',art:'',lv:'brūklenes'},
 {id:'multekrem',no:'multekrem',art:'en',lv:'lācenes ar putukrējumu'},
 {id:'kransekake',no:'kransekake',art:'en',lv:'vainagkūka'}];
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
 ['Hei! Det er meg, Ida. I dag er det nyttårsaften, 31. desember. Hele familien kommer til oss: bestemor, bestefar, tante Kari og broren min, Ole. Vi sier «Takk for i år!» til hverandre.',
  'Sveiki! Tā esmu es, Ida. Šodien ir Vecgada vakars, 31. decembris. Pie mums atbrauc visa ģimene: vecmāmiņa, vectētiņš, tante Kari un mans brālis Ole. Mēs viens otram sakām: „Paldies par šo gadu!”'],
 ['Klokka seks spiser vi middag. Først spiser vi reker med brød og sitron. Så kommer kalkun med poteter, saus og rosenkål. Jeg liker ikke rosenkål, men jeg elsker tyttebær!',
  'Pulksten sešos mēs vakariņojam. Vispirms mēs ēdam garneles ar maizi un citronu. Tad nāk tītars ar kartupeļiem, mērci un Briseles kāpostiem. Man negaršo Briseles kāposti, bet es dievinu brūklenes!'],
 ['Til dessert har vi multekrem. Og så kommer kransekaka! Den er høy og søt. Vi tar ringene med fingrene.',
  'Desertā mums ir lācenes ar putukrējumu. Un tad nāk vainagkūka! Tā ir augsta un salda. Mēs ņemam riņķus ar pirkstiem.'],
 ['Klokka tolv går vi ut og ser på fyrverkeri. De voksne sier «Skål!», og vi barna drikker brus. Alle sier: «Godt nytt år!»',
  'Pulksten divpadsmitos mēs ejam ārā un skatāmies uguņošanu. Pieaugušie saka: „Priekā!”, un mēs, bērni, dzeram limonādi. Visi saka: „Laimīgu Jauno gadu!”']];
(function(){
  const st=document.getElementById('story');
  STORY.forEach(([no,lv],i)=>{const d=document.createElement('div');d.className='nor-rindkopa';
    d.innerHTML=`<p lang="nb">${no}</p>${runa(no,(i+1)+'. rindkopa')}<p class="nor-tulk">${lv}</p>`;st.appendChild(d)});
  const all=document.getElementById('nor-klausities-visu');
  all.onclick=()=>{if(all.classList.contains('nor-atskan'))stopAll();else sayAll(STORY.map(x=>x[0]),all)};
  document.getElementById('nor-tulkojums').onchange=e=>st.classList.toggle('nor-rada-tulk',e.target.checked);
  const W=[['nyttårsaften','Vecgada vakars'],['hele familien','visa ģimene'],['bestemor / bestefar','vecmāmiņa / vectētiņš'],['til hverandre','viens otram'],['klokka seks','pulksten sešos'],['først','vispirms'],['så','tad'],['brød','maize'],['jeg liker ikke','man nepatīk'],['jeg elsker','es dievinu'],['til dessert','desertā'],['høy og søt','augsta un salda'],['de voksne','pieaugušie'],['brus','limonāde']];
  document.getElementById('words').innerHTML=W.map(([a,b])=>`<li><b lang="nb">${a}</b> – ${b}</li>`).join('');
})();

/* ---------- 3. Tradīcijas + tests ---------- */
const TRAD=[
 {id:'takk',no:'Takk for i år!',when:'31. desember',lv:'„Paldies par šo gadu!” — to saka visu Vecgada dienu: draugiem, kaimiņiem, kolēģiem un pat pārdevējai veikalā. Pēc pusnakts saka <b lang="nb">Godt nytt år!</b>'},
 {id:'tv',no:'Kongens nyttårstale',when:'kl. 19.40',lv:'Vakarā daudzas ģimenes skatās televizorā karaļa Jaungada uzrunu. Tikai pēc tam sākas svētku vakariņas.'},
 {id:'reker',no:'skalldyr',when:'forrett',lv:'Uzkoda — jūras veltes: <b lang="nb">reker</b> (garneles), <b lang="nb">krabbe</b> (krabis) un svētkos pat <b lang="nb">hummer</b> (omārs). Klāt — maize, majonēze un citrons.'},
 {id:'kalkun',no:'kalkun',when:'middag',lv:'Vecgada vakarā ļoti populārs ir cepts tītars ar kartupeļiem, mērci, Briseles kāpostiem un brūklenēm — <b lang="nb">tyttebær</b>.'},
 {id:'pinnekjott',no:'pinnekjøtt',when:'middag',lv:'Sālītas, žāvētas jēra ribiņas, ko tvaicē uz bērza kociņiem — <b lang="nb">pinner</b>. Pie tām ēd <b lang="nb">kålrotstappe</b> — kāļu biezeni.'},
 {id:'kransekake',no:'kransekake',when:'dessert',lv:'Augsts tornis no mandeļu cepumu riņķiem ar baltu glazūru, bieži ar Norvēģijas karodziņiem. Kūku negriež — riņķus lauž ar pirkstiem!'},
 {id:'fyrverkeri',no:'fyrverkeri',when:'kl. 18–02',lv:'Norvēģijā raķetes drīkst šaut tikai Vecgada vakarā — no 18:00 līdz 02:00. Pusnaktī debesis ir pilnas krāsainu ugunīšu!'},
 {id:'forsett',no:'nyttårsforsett',when:'1. januar',lv:'Jaungada apņemšanās. Piemēram: <b lang="nb">Jeg skal lære norsk!</b> — „Es iemācīšos norvēģu valodu!”'}];
const MCQ=[
 ['Ko norvēģi saka 31. decembrī?',['God morgen!','Takk for i år!','Gratulerer med dagen!'],1],
 ['Kas ir kransekake?',['zivju zupa','mandeļu riņķu tornis','kāļu biezenis'],1],
 ['Ko nozīmē pinne vārdā pinnekjøtt?',['kociņš','pīrāgs','pipari'],0],
 ['Kad Norvēģijā drīkst šaut raķetes?',['visu decembri','31. decembrī 18–02','tikai Jāņos'],1],
 ['Ko nozīmē nyttårsforsett?',['Jaungada apņemšanās','Jaungada dāvana','Jaungada kūka'],0]];
total+=MCQ.length;
(function(){
  document.getElementById('trad').innerHTML=TRAD.map(t=>`<li class="nor-trad"><svg viewBox="0 0 100 100" aria-hidden="true">${ART[t.id]()}</svg><span class="nor-kad" lang="nb">${t.when}</span><h3><span lang="nb">${t.no}</span> ${runa(t.no)}</h3><p>${t.lv}</p></li>`).join('');
  const box=document.getElementById('mcq');let pts=0;
  MCQ.forEach(([q,opts,ok],qi)=>{const d=document.createElement('div');d.className='nor-jautajums-bloks';d.setAttribute('role','group');d.setAttribute('aria-labelledby','nor-mc-'+qi);
    d.innerHTML=`<p class="nor-jautajums-teksts" id="nor-mc-${qi}">${qi+1}. ${q}</p><div class="nor-opcijas"></div>`;
    opts.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='nor-opcija';b.textContent=o;
      b.onclick=()=>{if(d.classList.contains('nor-atbildets'))return;d.classList.add('nor-atbildets');
        if(i===ok){b.classList.add('nor-pareizi');pts++;setScore('m',pts)}else{b.classList.add('nor-nepareizi');d.querySelectorAll('.nor-opcija')[ok].classList.add('nor-pareizi')}};
      d.querySelector('.nor-opcijas').appendChild(b)});
    box.appendChild(d)});
})();

/* ---------- 4. Krustvārdu mīkla ---------- */
// [vārds, rinda, kolonna, a = horizontāli / d = vertikāli]
const CW={h:12,w:12,pl:[['SKÅL',7,0,'a'],['FYRVERKERI',1,1,'d'],['ROSENKÅL',0,3,'d'],['SAUS',2,3,'a'],['KALKUN',5,3,'a'],['KRANSEKAKE',2,8,'d'],['BRUS',0,5,'d'],['RIBBE',0,3,'a'],['TYTTEBÆR',11,4,'a'],['POTETER',7,5,'a'],['MULTEKREM',1,11,'d'],['REKER',9,1,'a']]};
const CLUE={KALKUN:['kalkun','tītars'],RIBBE:['ribbe','cūkgaļas ribiņas ar kraukšķīgu ādiņu'],REKER:['reker','garneles'],KRANSEKAKE:['kransekake','mandeļu riņķu tornis'],
 'TYTTEBÆR':['tyttebaer','brūklenes'],POTETER:['poteter','kartupeļi'],'ROSENKÅL':['rosenkal','Briseles kāposti'],SAUS:['saus','mērce'],'SKÅL':['skal','„Priekā!”, saskandinot glāzes'],
 MULTEKREM:['multekrem','lācenes ar putukrējumu'],BRUS:['brus','limonāde'],FYRVERKERI:['fyrverkeri','uguņošana']};
total+=CW.pl.length;
(function(){
  const sec=document.getElementById('krustvardi'),el=document.getElementById('cw');el.style.setProperty('--cols',CW.w);
  const cells={},key=(r,c)=>r+','+c;
  const words=CW.pl.map(([w,r,c,d])=>({w,r,c,d,cells:[...w].map((_,i)=>d==='a'?[r,c+i]:[r+i,c])}));
  words.forEach((wd,wi)=>wd.cells.forEach(([r,c],i)=>{const k=key(r,c);(cells[k]=cells[k]||{ch:wd.w[i],words:{}}).words[wd.d]=wi}));
  const starts=[...new Set(words.map(x=>key(x.r,x.c)))].sort((a,b)=>{const[ar,ac]=a.split(',').map(Number),[br,bc]=b.split(',').map(Number);return ar-br||ac-bc});
  words.forEach(x=>x.n=starts.indexOf(key(x.r,x.c))+1);
  for(let r=0;r<CW.h;r++)for(let c=0;c<CW.w;c++){const d=document.createElement('div');const k=key(r,c);
    if(cells[k]){d.className='nor-kv-suna';const n=starts.indexOf(k);d.innerHTML=(n>=0?`<i class="nor-kv-nr" aria-hidden="true">${n+1}</i>`:'')+`<input maxlength="2" autocomplete="off" autocapitalize="characters" spellcheck="false" lang="nb">`;
      const inp=d.querySelector('input');inp.dataset.k=k;cells[k].inp=inp}
    else d.className='nor-kv-tuksa';
    el.appendChild(d)}
  // uzdevumi (ar attēlu)
  ['a','d'].forEach(dir=>{const box=document.getElementById(dir==='a'?'cla':'cld');
    words.map((x,i)=>[x,i]).filter(([x])=>x.d===dir).sort((a,b)=>a[0].n-b[0].n).forEach(([x,i])=>{const b=document.createElement('button');b.type='button';b.className='nor-kv-uzd';b.dataset.w=i;
      const [art,lv]=CLUE[x.w];b.innerHTML=`<b>${x.n}.</b><svg viewBox="0 0 100 100" aria-hidden="true">${ART[art]()}</svg><span>${lv} <small>(${x.w.length})</small></span>`;
      b.onclick=()=>{dirNow=dir;const k=x.cells.map(([r,c])=>key(r,c)).find(k=>!cells[k].inp.value)||key(x.r,x.c);cells[k].inp.focus()};box.appendChild(b)})});
  // pieejamības nosaukumi
  Object.entries(cells).forEach(([k,c])=>{const ws=Object.entries(c.words).map(([d,wi])=>`${words[wi].n}. ${d==='a'?'horizontāli':'vertikāli'}`);c.inp.setAttribute('aria-label','Rūtiņa: '+ws.join(', '))});
  let dirNow='a',curW=null,lastField=null;const solved=new Set();
  const wordOf=k=>{const ws=cells[k].words;return ws[dirNow]!==undefined?ws[dirNow]:ws[dirNow==='a'?'d':'a']};
  function highlight(){el.querySelectorAll('input.nor-kv-iezime').forEach(i=>i.classList.remove('nor-kv-iezime'));sec.querySelectorAll('.nor-kv-uzd.nor-kv-tagad').forEach(b=>b.classList.remove('nor-kv-tagad'));
    if(curW===null)return;words[curW].cells.forEach(([r,c])=>cells[key(r,c)].inp.classList.add('nor-kv-iezime'));const cb=sec.querySelector(`.nor-kv-uzd[data-w="${curW}"]`);cb&&cb.classList.add('nor-kv-tagad')}
  const fb=document.getElementById('cwfb');
  function check(){words.forEach((x,i)=>{if(solved.has(i))return;if(x.cells.every(([r,c],j)=>cells[key(r,c)].inp.value===x.w[j])){solved.add(i);
      x.cells.forEach(([r,c])=>{const inp=cells[key(r,c)].inp;inp.classList.add('pareizi');inp.classList.remove('nepareizi')});sec.querySelector(`.nor-kv-uzd[data-w="${i}"]`).classList.add('nor-kv-gatavs')}});
    setScore('c',solved.size);if(solved.size===words.length){fb.className='uzd-rezultats visi-pareizi';fb.textContent='Krustvārdu mīkla atrisināta!'}}
  const isLocked=inp=>Object.values(cells[inp.dataset.k].words).some(i=>solved.has(i));
  function move(k,step){const x=words[curW];const idx=x.cells.findIndex(([r,c])=>key(r,c)===k);const n=x.cells[idx+step];if(n)cells[key(n[0],n[1])].inp.focus()}
  el.addEventListener('focusin',e=>{const k=e.target.dataset.k;if(!k)return;lastField=e.target;curW=wordOf(k);dirNow=words[curW].d;highlight()});
  // otrs klikšķis uz tās pašas rūtiņas krustpunktā = maina virzienu
  el.addEventListener('mousedown',e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k||document.activeElement!==e.target)return;const ws=cells[k].words;
    if(ws.a!==undefined&&ws.d!==undefined){dirNow=dirNow==='a'?'d':'a';curW=ws[dirNow];highlight()}});
  function put(inp,ch){if(!isLocked(inp)){inp.value=ch;inp.classList.remove('nepareizi');check()}move(inp.dataset.k,1)}
  el.addEventListener('input',e=>{const inp=e.target,k=inp.dataset.k;if(!k)return;
    const v=(inp.value||'').toUpperCase().replace(/[^A-ZÆØÅ]/g,'').slice(-1);
    if(isLocked(inp))inp.value=cells[k].ch;else inp.value=v;if(v)put(inp,v)});
  el.addEventListener('keydown',e=>{const inp=e.target,k=inp.dataset.k;if(!k)return;
    if(e.key&&e.key.length===1&&/[a-zæøå]/i.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();put(inp,e.key.toUpperCase());return}
    if(e.key==='Backspace'&&!inp.value){e.preventDefault();move(k,-1);const a=document.activeElement;if(a!==inp&&a.dataset.k&&!isLocked(a))a.value=''}
    const arrows={ArrowRight:[0,1,'a'],ArrowLeft:[0,-1,'a'],ArrowDown:[1,0,'d'],ArrowUp:[-1,0,'d']};
    if(arrows[e.key]){e.preventDefault();const[dr,dc,d]=arrows[e.key];const[r,c]=k.split(',').map(Number);const n=cells[key(r+dr,c+dc)];if(n){dirNow=d;n.inp.focus()}}});
  sec.querySelectorAll('.nor-burti [data-l]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{if(lastField)put(lastField,b.dataset.l.toUpperCase())}});
  const hint=document.getElementById('cwhint');hint.onmousedown=e=>e.preventDefault();
  hint.onclick=()=>{let wi=curW;if(wi===null||solved.has(wi))wi=words.findIndex((_,i)=>!solved.has(i));if(wi<0)return;
    const x=words[wi];const j=x.cells.findIndex(([r,c],q)=>cells[key(r,c)].inp.value!==x.w[q]);if(j<0)return;
    const inp=cells[key(x.cells[j][0],x.cells[j][1])].inp;inp.value=x.w[j];inp.classList.remove('nepareizi');dirNow=x.d;inp.focus();check()};
  document.getElementById('cwcheck').onclick=()=>{if(solved.size===words.length)return;let bad=0;Object.values(cells).forEach(c=>{if(c.inp.value&&c.inp.value!==c.ch){c.inp.classList.add('nepareizi');bad++}});
    fb.className='uzd-rezultats'+(bad?' nor-slikti-teksts':' visi-pareizi');fb.textContent=bad?`Sarkanās rūtiņas ir nepareizas (${bad}).`:'Kļūdu nav — turpini!'};
})();

document.getElementById('tot').textContent=total;
document.getElementById('nor-no-jauna').onclick=()=>location.reload();
})();
