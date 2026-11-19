// Interaktīvās HTML prezentācijas ģenerēšana grupu kursam no avoti/NN.json (kad īpašniekam ir tikai PDF).
// Dzinējs (fonti, CSS, slaidu renderētāji, navigācija, drukāšana) tiek ņemts no esošas prezentācijas (--dzinejs),
// saturs = avoti/NN.json {head, items, homework, S} + avoti/NN.majasdarbs.json (mājasdarba pārbaudes),
// attēli = avoti/img/NN-title.jpg, NN-thanks.jpg, ov.jpg, bg1..N.jpg (no riki/gk-pdf.py).
// Rezultāts: avoti/NN.html (viens fails, viss iekļauts). Pēc tam: gk-sagatavot.mjs + gk-augsupladet.mjs.
// Lietošana: node riki/gk-prezentacija.mjs <kurss> [nr ...] --dzinejs <prezentacija.html> --kods sva1
//            --nosaukums "Spāņu valoda A1" [--krasa "#c4421a"] [--akcents "#f2a33a"]
import fs from 'fs';
import path from 'path';

const arg = process.argv.slice(2);
const opc = (k, d) => { const i = arg.indexOf(k); return i > -1 ? arg[i + 1] : d; };
const kurss = arg[0];
const dzinejs = opc('--dzinejs');
const kods = opc('--kods', 'gk');
const kNos = opc('--nosaukums', 'Spāņu valoda');
const krasa = opc('--krasa', '#c4421a');
const akcents = opc('--akcents', '#f2a33a');
const vertibas = new Set(['--dzinejs', '--kods', '--nosaukums', '--krasa', '--akcents'].map((k) => opc(k)).filter(Boolean));
const nri = arg.slice(1).filter((a) => /^\d+$/.test(a) && !vertibas.has(a)).map(Number);
if (!kurss || !dzinejs) { console.error('Lietošana: node riki/gk-prezentacija.mjs <kurss> [nr ...] --dzinejs <prezentacija.html> --kods sva1 --nosaukums "…"'); process.exit(1); }

const AVOTI = path.join('grupu-kursi-saturs', kurss, 'avoti');
const IMGD = path.join(AVOTI, 'img');
const jpg = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(IMGD, f)).toString('base64');

// ---------- dzinējs ----------
const D = fs.readFileSync(dzinejs, 'utf8');
const sc = D.lastIndexOf('<script>');
let galva = D.slice(0, sc)
  .replace(/--blue:#[0-9a-f]{6}/i, '--blue:' + krasa)
  .replace(/--accent:#[0-9a-f]{6}/i, '--accent:' + akcents)
  .replace(/rgba\(1,39,118,\.08\)/g, 'rgba(196,66,26,.08)');
let js = D.slice(D.indexOf('/* ================= HELPERS', sc));
const aizvietot = (no, lidz, jauns) => {
  const i = js.indexOf(no), j = js.indexOf(lidz, i + no.length);
  if (i < 0 || j < 0) throw new Error('Dzinējā nav atrasts: ' + no);
  js = js.slice(0, i) + jauns + js.slice(j);
};
js = js.replace(/"svb1_"/, 'KODS');
// mājasdarbs: teksts un pārbaudes no HW (tās pašas kā kursa telpā, kursa-telpa.js parbauditMd)
aizvietot(' homework(s){', '\n};\n\n/* ================= BUILD', ` homework(s){
   const ch = HW.parbaudes || [];
   return {html:\`<div class="body" style="font-size:22px;line-height:1.35"><div class="hw">
   <div style="display:flex;flex-direction:column;gap:10px;min-height:0"><p style="margin:0">\${esc(HW.teksts||"")} Raksti šeit – prasības tiek pārbaudītas automātiski!</p>
   <textarea spellcheck="false" lang="es" placeholder="\${esc(HW.piemers||"Escribe aquí...")}"></textarea></div>
   <div><ul class="chk">\${ch.map(x=>\`<li data-c="\${x.id}">\${esc(x.teksts)} <span class="cv"></span></li>\`).join("")}</ul>
     <div class="actions" style="position:static;margin-top:10px;font-size:18px"><button class="btn sec" data-act="copy" style="font-size:18px;padding:8px 18px">Kopēt tekstu</button><span class="hint copied"></span></div>
   </div></div></div>\`,
   init(el){
     const ta=$("textarea",el), L="a-záéíóúüñ";
     const re=(r,g)=>new RegExp(r.replace(/⟨/g,"(?<!["+L+"])").replace(/⟩/g,"(?!["+L+"])"),g||"g");
     const vardi=k=>{ const kopa=new RegExp(k); return [...new Set(S.filter(b=>b.type==="vocab"&&b.id&&kopa.test(b.id)).flatMap(b=>b.pairs.map(p=>b.dir==="es"?p[0]:p[1]))
       .flatMap(y=>y.replace(/\\([^)]*\\)/g,"").split("/")).map(y=>y.trim().toLowerCase().replace(/^(el|la|los|las|un|una)\\s+/,"")).filter(y=>y.length>2))]; };
     const run = () => {
       const t=ta.value, low=t.toLowerCase(); store.set("hw", t);
       ch.forEach(x=>{ let v=0, ok=false, warn=false;
         if(x.tips==="teikumi"){ v=t.split(/[.!?…]+/).map(y=>y.trim()).filter(y=>y.split(/\\s+/).length>=3).length; ok=v>=x.min&&v<=(x.max||999); }
         else if(x.tips==="vardi"){ v=vardi(x.kopas).filter(w=>re("⟨"+w.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\$&")+"⟩","").test(low)).length; ok=v>=x.min; }
         else if(x.tips==="skaits"){ v=((x.originals?t:low).match(re(x.re))||[]).length; ok=v>=x.min; if(x.min===1) v=ok?"✓":"–"; }
         else if(x.tips==="nav"){ warn=re(x.re,"i").test(low); ok=!warn; v=""; }
         const li=$(\`[data-c="\${x.id}"]\`,el); li.classList.toggle("done",ok); li.classList.toggle("warn",warn);
         li.firstChild.textContent=(warn&&x.bridinajums?x.bridinajums:x.teksts)+" "; $(".cv",li).textContent=v!==""?\`(\${v})\`:""; });
     };
     ta.value = store.get("hw",""); ta.addEventListener("input", run); run();
     $("[data-act=copy]",el).onclick=()=>{ ta.select(); try{ navigator.clipboard.writeText(ta.value).then(()=>$(".copied",el).textContent="Nokopēts!"); }catch(e){ document.execCommand("copy"); $(".copied",el).textContent="Nokopēts!"; } };
   }};
 }`);
aizvietot('} else if(t==="homework"){', '} else {', `} else if(t==="homework"){
      page(i,H(s)+\`<div class="body"><p>\${esc(HW.teksts||"")}</p><ol class="ex">\${(HW.parbaudes||[]).map(x=>\`<li>\${esc(x.teksts)}</li>\`).join("")}</ol></div>\`);
    `);

// ---------- viena nodarbība ----------
function izveidot(nr) {
  const nn = String(nr).padStart(2, '0');
  const av = JSON.parse(fs.readFileSync(path.join(AVOTI, nn + '.json'), 'utf8'));
  const fMd = path.join(AVOTI, nn + '.majasdarbs.json');
  const md = fs.existsSync(fMd) ? JSON.parse(fs.readFileSync(fMd, 'utf8')) : {};
  const HW = { teksts: md.teksts || av.homework?.teksts || '', piemers: md.piemers || '', parbaudes: md.parbaudes || [] };
  // garus vārdu sarakstus slaidā sadala (tā pati loģika kā dzinēja pairsHTML: 2 kolonnas, ja pāri īsi)
  const S = av.S.flatMap((s) => {
    if (s.type !== 'vocab') return [s];
    const divas = s.pairs.length > 9 && Math.max(...s.pairs.map((p) => p[0].length + p[1].length)) <= 36;
    const max = divas ? 18 : 10;
    if (s.pairs.length <= max) return [s];
    const n = Math.ceil(s.pairs.length / max), k = Math.ceil(s.pairs.length / n);
    return Array.from({ length: n }, (_, i) => ({ ...s, title: `${s.title} (${i + 1})`, pairs: s.pairs.slice(i * k, (i + 1) * k), ...(i < n - 1 ? { note: undefined } : {}) }));
  });
  if (av.homework && !S.some((s) => s.type === 'homework')) S.push({ type: 'homework', title: 'Mājasdarbs' });
  S.unshift({ type: 'img', img: 'title', title: kNos }, { type: 'overview', title: `${nr}. nodarbība`, head: av.head, items: av.items || [] });
  S.push({ type: 'img', img: 'thanks', title: '¡Gracias!' });
  const bg = fs.readdirSync(IMGD).filter((f) => /^bg\d+\.jpg$/.test(f)).sort();
  const saturs = `<script>
const IMG = {title:"${jpg(nn + '-title.jpg')}", thanks:"${jpg(nn + '-thanks.jpg')}", ov:"${jpg('ov.jpg')}"};
const BG = [${bg.map((f) => `"${jpg(f)}"`).join(',')}];
const KODS = ${JSON.stringify(kods + '_' + nn + '_')};
const HW = ${JSON.stringify(HW)};

/* ================= CONTENT ================= */
const S = ${JSON.stringify(S, null, 1)};

`;
  const html = galva.replace(/<title>[^<]*<\/title>/, `<title>${kods.toUpperCase()} · ${nr}. nodarbība</title>`) + saturs + js;
  fs.writeFileSync(path.join(AVOTI, nn + '.html'), html);
  console.log(`✓ ${nn}.html · ${S.length} slaidi · ${(html.length / 1024).toFixed(0)} KB`);
}

const visi = fs.readdirSync(AVOTI).map((f) => f.match(/^(\d{2})\.json$/)).filter(Boolean).map((m) => Number(m[1]));
for (const nr of (nri.length ? nri : visi.sort((a, b) => a - b))) izveidot(nr);
