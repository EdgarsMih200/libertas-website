# -*- coding: utf-8 -*-
# Libertas grāmata "¡Vamos!" — spāņu valoda A1–A2. HTML → Chrome → PDF (divi piegājieni satura rādītājam).
import json, glob, re, os, sys, html, random, subprocess, pathlib
import pymupdf
sys.path.insert(0, os.path.dirname(__file__))
import stasti, extras

HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path(r"C:\Users\Admin\Desktop\Mājaslapa")
SRC = REPO / "e-kursi-saturs"
OUT_HTML = HERE / "gramata.html"
OUT_PDF = HERE / "gramata.pdf"
FULL_HTML = HERE / "full.html"
FULL_PDF = HERE / "full.pdf"
FINAL_PDF = HERE / "Vamos-spanu-valoda-A1-A2.pdf"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
MAX_EX = int(os.environ.get("MAX_EX", "8"))

def E(x): return html.escape(str(x), quote=True)

def svgfile(p):
    s = open(p, encoding="utf8").read()
    return re.sub(r"<\?xml.*?\?>|<!--.*?-->", "", s, flags=re.S)

EMPA = {k: svgfile(HERE / "empa" / f"{k}.svg") for k in ["miera", "vicina", "lasa", "rada", "apjucis", "sveicina", "santa"]}
LOGO = (REPO / "assets" / "libertas.png").as_uri()
LOGO_LIGHT = svgfile(REPO / "assets" / "libertas-light.svg")

# ---------- Markdown ----------
def inline(t):
    t = E(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]\n]{1,24})\]", r'<span class="ipa">[\1]</span>', t)
    t = t.replace("🔊", "")
    return t

def unaudio(s):
    s = s.replace("un atkārto skaļi", "un atkārto").replace("Klausies un atkārto", "Izlasi skaļi un atkārto")
    s = re.sub(r"(Noklausies|Klausies|klausies)", lambda m: "Izlasi skaļi" if m.group(1)[0].isupper() else "izlasi skaļi", s)
    return s.replace("ar 🔊", "").replace("Noklausies", "Izlasi")

def md(s):
    s = unaudio(s)
    out, para, lst, ltype = [], [], [], None
    def flush_p():
        if para: out.append("<p>" + "<br>".join(inline(x) for x in para) + "</p>"); para.clear()
    def flush_l():
        nonlocal ltype
        if lst: out.append(f"<{ltype}>" + "".join(f"<li>{inline(x)}</li>" for x in lst) + f"</{ltype}>"); lst.clear()
        ltype = None
    for line in s.split("\n"):
        l = line.strip()
        m1 = re.match(r"^[-*]\s+(.*)", l)
        m2 = re.match(r"^\d+\.\s+(.*)", l)
        if m1 and not l.startswith("**"):
            flush_p()
            if ltype not in (None, "ul"): flush_l()
            ltype = "ul"; lst.append(m1.group(1))
        elif m2:
            flush_p()
            if ltype not in (None, "ol"): flush_l()
            ltype = "ol"; lst.append(m2.group(1))
        elif not l:
            flush_p(); flush_l()
        else:
            flush_l(); para.append(l)
    flush_p(); flush_l()
    return "".join(out)

# ---------- materiāli ----------
def mat(m):
    t = m["t"]
    if t == "teksts":
        return f'<div class="teksts">{md(m["md"])}</div>'
    if t == "svarigi":
        return f'<div class="svarigi"><div class="empa-mini">{EMPA["rada"]}</div><div><span class="etik">Atceries!</span>{md(m["md"])}</div></div>'
    if t == "piemers":
        rows = "".join(f'<tr><td class="es">{inline(a)}</td><td class="lv">{inline(b)}</td></tr>' for a, b in m["vienumi"])
        intro = f'<div class="piem-intro">{md(m["md"])}</div>' if m.get("md") else ""
        return f'<div class="piemers"><span class="etik">Piemēri</span>{intro}<table>{rows}</table></div>'
    if t == "tabula":
        head = "".join(f"<th>{inline(h)}</th>" for h in m["galva"])
        rows = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in m["rindas"])
        return f'<table class="tab"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'
    if t == "vardnica":
        items = "".join(f'<li><span class="es">{inline(a)}</span><span class="lv">{inline(b)}</span></li>' for a, b in m["vienumi"])
        return f'<div class="vardnica"><span class="etik">Vārdu krājums</span><ul>{items}</ul></div>'
    if t == "zilbes":
        parts = m["vards"].split("|")
        return '<span class="zilbe">' + "<i>·</i>".join(f'<b>{E(p.lower())}</b>' if p.isupper() or (p[:1].isupper() and len(p) > 1 and p == p.upper()) else E(p) for p in parts) + "</span>"
    if t == "burti":
        cells = "".join(f'<div class="burts"><b>{E(a)}</b><span>{E(n)}</span><em>{E(x)}</em></div>' for a, n, x in m["vienumi"])
        return f'<div class="burti">{cells}</div>'
    return ""

def materials(ms):
    out, buf = [], []
    for m in ms:
        if m["t"] == "zilbes": buf.append(mat(m)); continue
        if buf: out.append('<div class="zilbes"><span class="etik">Uzsvērtā zilbe</span>' + "".join(buf) + "</div>"); buf = []
        out.append(mat(m))
    if buf: out.append('<div class="zilbes"><span class="etik">Uzsvērtā zilbe</span>' + "".join(buf) + "</div>")
    return "".join(out)

# ---------- vingrinājumi ----------
LETTERS = "abcdefgh"

def shuffled(items, seed):
    r = random.Random(seed); x = list(items)
    for _ in range(10):
        r.shuffle(x)
        if x != list(items) or len(x) < 2: break
    return x

def blankify(t):
    return re.sub(r"_{2,}", '<span class="blank"></span>', inline(t))

def first(a): return a.split("|")[0]

def ex_html(v, num, seed):
    tips = v["tips"]; txt = v.get("teksts", "")
    if tips == "klausies":
        txt = re.sub(r"^(Noklausies|Klausies)( un)?", "Izlasi", txt)
        if v.get("runa"): txt += f' <span class="citat">«{E(v["runa"])}»</span>'
        head = f'<div class="ex-q">{inline(txt) if "citat" not in txt else txt}</div>'
    else:
        head = f'<div class="ex-q">{inline(txt)}</div>'
    body, ans = "", ""
    if tips in ("izvele", "klausies"):
        q = v.get("jautajums")
        if q and tips == "izvele": body += f'<div class="ex-jaut">{blankify(q)}</div>'
        body += '<ol class="opts">' + "".join(f"<li>{inline(o)}</li>" for o in v["varianti"]) + "</ol>"
        ans = f'{LETTERS[v["atbilde"]]}) {inline(v["varianti"][v["atbilde"]])}'
    elif tips == "vairakas":
        q = v.get("jautajums")
        body += '<ul class="checks">' + "".join(f"<li>{inline(o)}</li>" for o in v["varianti"]) + "</ul>"
        ans = ", ".join(inline(v["varianti"][i]) for i in v["atbildes"])
    elif tips == "tuksumi":
        body += f'<div class="ex-jaut">{blankify(v["jautajums"])}</div>'
        ans = " · ".join(inline(first(a)) for a in v["atbildes"])
    elif tips == "ievadi":
        if v.get("jautajums"): body += f'<div class="ex-jaut">{blankify(v["jautajums"])}</div>'
        body += '<div class="line"></div>'
        ans = inline(first(v["atbilde"]))
    elif tips == "pari":
        left = [a for a, b in v["pari"]]; right = shuffled([b for a, b in v["pari"]], seed)
        body += '<div class="pari"><ol>' + "".join(f"<li>{inline(a)} <span class='slot'></span></li>" for a in left) + '</ol><ol class="alpha">' + "".join(f"<li>{inline(b)}</li>" for b in right) + "</ol></div>"
        ans = ", ".join(f'{i+1}–{LETTERS[right.index(b)]}' for i, (a, b) in enumerate(v["pari"]))
    elif tips == "kategorijas":
        cats = v["kategorijas"]; allw = shuffled([w for ws in cats.values() for w in ws], seed)
        body += '<div class="chips">' + "".join(f"<span>{inline(w)}</span>" for w in allw) + "</div>"
        body += '<div class="cats">' + "".join(f'<div><b>{inline(c)}</b><div class="line"></div><div class="line"></div></div>' for c in cats) + "</div>"
        ans = "; ".join(f"<b>{inline(c)}</b>: " + ", ".join(inline(w) for w in ws) for c, ws in cats.items())
    elif tips == "seciba":
        el = v["elementi"]; sh = shuffled(el, seed)
        body += '<div class="chips">' + "".join(f"<span>{inline(w)}</span>" for w in sh) + '</div><div class="line"></div>'
        joiner = "" if all(len(x) <= 2 for x in el) else " "
        ans = inline(joiner.join(el))
    elif tips == "rakstit":
        body += '<div class="line"></div>' * 5
        ans = "Paraugs: " + inline(v.get("paraugs", "").replace("\n", " / "))
    else:
        return None, None
    return f'<div class="ex"><span class="ex-n">{num}</span>{head}{body}</div>', ans

def pick_exercises(d):
    allv = []
    for di, p in enumerate(d["dalas"]):
        for v in p.get("vingrinajumi", []):
            if v["tips"] not in ("runat",) and not (v["tips"] in ("klausies", "izvele") and "varianti" not in v): allv.append((di, v))
    # līdzsvarota izlase: pa daļām pēc kārtas, dažādi tipi
    chosen, used_types = [], {}
    rounds = [[v for v in allv if v[0] == i] for i in range(len(d["dalas"]))]
    k = 0
    while len(chosen) < MAX_EX and any(rounds):
        for r in rounds:
            if not r or len(chosen) >= MAX_EX: continue
            # dod priekšroku tipiem, kas vēl maz lietoti
            r.sort(key=lambda x: (used_types.get(x[1]["tips"], 0) + (1 if x[1]["tips"] == "rakstit" and used_types.get("rakstit") else 0)))
            di, v = r.pop(0)
            chosen.append((di, v)); used_types[v["tips"]] = used_types.get(v["tips"], 0) + 1
    order = {id(v): i for i, (_, v) in enumerate(allv)}
    chosen.sort(key=lambda x: order[id(x[1])])
    return [v for _, v in chosen]

# ---------- nodarbības ----------
ANSWERS = []  # (lesson label, [ (num, html) ], story vf)
GLOSS = {}
TOC = []      # (key, label, title, level)

def mk(key): return f'<span class="mk">@@{key}@@</span>'

def lesson(d, lvl, idx, story):
    nr = d["nr"]; key = f"{lvl}-{nr:02d}"; label = f"{lvl} · {nr}"
    TOC.append((key, f"{nr}.", d["nosaukums"], lvl))
    goals = "".join(f"<li>{inline(g)}</li>" for g in d["merki"])
    warm = "".join(f"<li>{inline(q)}</li>" for q in d["iesildisanas"]["jautajumi"])
    out = [f'<section class="lesson {lvl.lower()}" id="{key}">']
    out.append(f'''<header class="opener">{mk(key)}
      <div class="op-top"><div class="op-num">{nr:02d}</div><div class="op-title"><span class="op-kicker">{lvl} · {nr}. nodarbība</span><h2>{E(d["nosaukums"])}</h2></div></div>
      <div class="op-grid"><div><h4>Šajā nodarbībā tu iemācīsies</h4><ul class="goals">{goals}</ul></div>
      <div class="warm"><h4>Iesildīšanās</h4><ul>{warm}</ul></div></div></header>''')
    for i, p in enumerate(d["dalas"]):
        out.append(f'<section class="dala"><h3><span class="dnum">{nr}.{i+1}</span>{E(p["nosaukums"])}</h3>{materials(p["materials"])}</section>')
        for m in p["materials"]:
            if m["t"] == "vardnica":
                for a, b in m["vienumi"]:
                    GLOSS.setdefault(a.strip(), (b.strip(), f"{lvl}·{nr}"))
    # vingrinājumi
    exs = pick_exercises(d); ans = []; items = []
    for j, v in enumerate(exs):
        h, a = ex_html(v, j + 1, f"{key}-{j}")
        if h: items.append(h); ans.append((len(items), a))
    out.append(f'<section class="vingr"><h3 class="vh"><span class="ico">✎</span>Vingrinājumi</h3><div class="excols">{"".join(items)}</div></section>')
    # stāsts
    sn = idx
    sps = [f'<div class="sp"><div class="es">{"<br>".join(inline(x) for x in es.split(chr(10)))}</div><div class="lv">{"<br>".join(inline(x) for x in lv.split(chr(10)))}</div></div>' for es, lv in story["p"]]
    vardi = "".join(f'<li><b>{inline(a)}</b> — {inline(b)}</li>' for a, b in story["vardi"])
    vf = "".join(f'<li><span>{inline(q)}</span><span class="vfbox">V</span><span class="vfbox">F</span></li>' for q, _ in story["vf"])
    out.append(f'''<section class="story">
      <div class="st-keep"><div class="st-head"><span class="st-kicker">Stāsts · Līgas gads Valensijā · {sn}. daļa</span>
      <h3 class="st-title">{E(story["es"])}</h3><div class="st-lv">{E(story["lv"])}</div></div>
      <div class="st-cols-head"><span>Español</span><span>Latviski</span></div>
      {sps[0]}</div>{"".join(sps[1:])}
      <div class="st-foot"><div class="st-vardi"><span class="etik">Vārdi no stāsta</span><ul>{vardi}</ul></div>
      <div class="st-vf"><span class="etik">¿Verdadero o falso? Patiesi (V) vai nepatiesi (F)?</span><ol>{vf}</ol></div></div>
      <div class="fakts"><span class="sun"></span><div><span class="etik">¿Sabías que…? Vai zināji?</span><p>{inline(story["fakts"])}</p></div></div>
    </section>''')
    # runāšana
    pr = d.get("prakse")
    if pr:
        par = pr.get("paraugs")
        par = " ".join(par) if isinstance(par, list) else (par or "")
        chk = "".join(f"<li>{inline(c)}</li>" for c in pr.get("parbaude", []))
        out.append(f'''<section class="runa"><div class="runa-ico">{EMPA["vicina"]}</div><div><h3 class="vh">Runā! <small>Mutiskā prakse</small></h3>
          <p>{inline(pr["uzdevums"].replace("Vispirms noklausies paraugu.", "").replace("Ieraksti sevi", "Ieraksti sevi telefonā").strip())}</p>
          {f'<div class="paraugs"><span class="etik">Paraugs</span>{inline(par)}</div>' if par else ""}
          {f'<div class="parb"><span class="etik">Pārbaudi sevi</span><ul class="checks">{chk}</ul></div>' if chk else ""}</div></section>''')
    ks = d["kopsavilkums"]
    pts = "".join(f"<li>{inline(x)}</li>" for x in ks["punkti"])
    can = "".join(f"<li>{inline(x)}</li>" for x in ks["var_darit"])
    out.append(f'''<section class="kops"><h3 class="vh">Kopsavilkums</h3><div class="kgrid"><ul class="kp">{pts}</ul>
      <div class="can"><span class="etik">Es protu…</span><ul class="checks">{can}</ul></div></div></section>''')
    out.append("</section>")
    ANSWERS.append((key, f"{lvl} · {nr}. nodarbība — {d['nosaukums']}", ans, [(q, a) for q, a in story["vf"]]))
    return "".join(out)

# ---------- ilustrācijas ----------
def scene(variant="cover"):
    # plakana slāņota ainava: saule, kalni, Valensijas siluets, palmas, jūra
    sky = {"cover": ("#F6E1D5", "#F2C9A8", "#E9A27A"), "a1": ("#F6E1D5", "#F2C9A8", "#E9A27A"), "a2": ("#DDE5DA", "#C7D6C6", "#9DB8A4")}[variant]
    return f'''<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="sky-{variant}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky[0]}"/><stop offset=".6" stop-color="{sky[1]}"/><stop offset="1" stop-color="{sky[2]}"/></linearGradient></defs>
<rect width="1000" height="700" fill="url(#sky-{variant})"/>
<circle cx="720" cy="300" r="150" fill="#F2C46A" opacity=".35"/><circle cx="720" cy="300" r="105" fill="#F2C46A" opacity=".9"/>
<g fill="#FFFDF8" opacity=".7"><ellipse cx="200" cy="200" rx="70" ry="14"/><ellipse cx="250" cy="186" rx="40" ry="12"/><ellipse cx="860" cy="150" rx="55" ry="11"/></g>
<path d="M0 430 L120 360 L210 400 L330 320 L450 390 L560 340 L700 400 L820 350 L1000 410 V700 H0Z" fill="#C98F7A" opacity=".55"/>
<g fill="#B4502A">
 <path d="M0 470 Q150 430 300 455 T600 450 T1000 440 V700 H0Z"/>
</g>
<g fill="#963F20">
 <rect x="380" y="330" width="34" height="140"/><path d="M372 330 h50 l-25 -40z"/><rect x="390" y="350" width="14" height="22" fill="#F2C46A"/>
 <path d="M440 470 v-70 a45 45 0 0 1 90 0 v70z"/><rect x="478" y="345" width="14" height="20"/>
 <rect x="560" y="410" width="60" height="60"/><rect x="630" y="395" width="44" height="75"/><rect x="250" y="410" width="80" height="60"/><rect x="190" y="425" width="50" height="45"/>
 <path d="M690 470 q60 -110 160 -70 q-60 10 -90 70z"/>
</g>
<path d="M0 520 Q250 480 500 510 T1000 500 V700 H0Z" fill="#6B1D1D"/>
<path d="M0 590 Q300 560 600 585 T1000 575 V700 H0Z" fill="#2B4038"/>
<g stroke="#1E2E29" stroke-width="7" fill="none" stroke-linecap="round"><path d="M110 600 q10 -90 -5 -170"/><path d="M880 595 q-6 -80 10 -150"/></g>
<g fill="#1E2E29"><path d="M105 432 q-60 -10 -85 25 q50 -20 85 -20z"/><path d="M105 432 q50 -30 95 0 q-55 -12 -95 3z"/><path d="M105 432 q-20 -45 -60 -50 q40 25 58 52z"/><path d="M105 432 q25 -45 70 -40 q-45 15 -66 42z"/>
<path d="M890 447 q-55 -8 -80 22 q45 -18 80 -18z"/><path d="M890 447 q50 -25 90 3 q-50 -10 -90 1z"/><path d="M890 447 q-15 -40 -50 -48 q32 22 48 50z"/><path d="M890 447 q25 -40 62 -36 q-40 15 -60 38z"/></g>
<path d="M0 640 Q500 610 1000 640 V700 H0Z" fill="#1E2E29"/>
</svg>'''

# ---------- priekšlapas ----------
def cover():
    return f'''<section class="cover">
  <div class="cv-art">{scene("cover")}</div>
  <div class="cv-top"><img class="cv-logo" src="{LOGO}" alt="Libertas"><span class="cv-pill">A1 – A2 · mācību grāmata</span></div>
  <div class="cv-title"><h1>¡Vamos!</h1><p class="cv-sub">Spāņu valoda<br>no pirmā vārda līdz A2</p>
    <ul class="cv-feat"><li>27 nodarbības</li><li>27 stāsti ar tulkojumu</li><li>160+ vingrinājumu ar atbildēm</li></ul></div>
  <div class="cv-empa">{EMPA["sveicina"]}</div>
  <div class="cv-bottom">Runā, saproti, ceļo, <em>audz!</em></div>
</section>'''

def owner():
    return f'''<section class="plain owner"><div class="own-box"><div class="own-empa">{EMPA["lasa"]}</div>
  <p class="own-k">Este libro es de</p><p class="own-lv">Šī grāmata pieder</p><div class="own-line"></div>
  <p class="own-k2">Empecé a estudiar español el</p><p class="own-lv">Spāņu valodu sāku mācīties</p><div class="own-line short"></div>
  <p class="own-k2">Mi objetivo</p><p class="own-lv">Mans mērķis (piemēram: sarunāties ceļojumā, strādāt Spānijā…)</p><div class="own-line"></div><div class="own-line"></div></div></section>'''

def title_page():
    return f'''<section class="plain titlep"><img src="{LOGO}" class="tp-logo" alt="Libertas">
  <div class="tp-mid"><span class="tp-k">Mācību grāmata latviešiem</span><h1>¡Vamos!</h1><p>Spāņu valoda A1–A2</p>
  <p class="tp-d">Gramatika · vārdu krājums · vingrinājumi · stāsti ar paralēlo tulkojumu · atbildes</p></div>
  <div class="tp-bot">Valodu skola Libertas · libertas.study · 2026</div></section>'''

def imprint():
    return f'''<section class="plain imprint"><div class="imp">
  <p><b>¡Vamos! Spāņu valoda A1–A2.</b> Mācību grāmata pašmācībai un darbam grupā.</p>
  <p>Grāmatas pamatā ir valodu skolas Libertas kursu «Spāņu valodas pamati A1» un «Spāņu valodas pamati A2» materiāli. Stāstu sērija «Līgas gads Valensijā», kultūras fakti, pielikumi un dizains veidoti speciāli šim izdevumam.</p>
  <p>Talismans Empanadillo — Libertas ceļotājs, kurš grāmatā atgādina svarīgāko.</p>
  <p>© 2026 Libertas. Visas tiesības aizsargātas. Grāmatu drīkst izdrukāt personīgai lietošanai un mācībām Libertas kursos. Pārpublicēšana vai izplatīšana bez atļaujas aizliegta.</p>
  <p>libertas.study</p>
  <p class="imp-ver">1. izdevums · 2026. gada novembris · A4 formāts, drukājams abpusēji</p></div></section>'''

def toc_page(pages):
    def row(key, num, title, lvl, cls=""):
        pg = pages.get(key, "")
        return f'<li class="{cls}"><span class="tn">{E(num)}</span><span class="tt">{E(title)}</span><span class="dots"></span><span class="tp">{pg}</span></li>'
    a1 = [t for t in TOC if t[3] == "A1"]; a2 = [t for t in TOC if t[3] == "A2"]
    front = [("howto", "", "Kā mācīties ar šo grāmatu"), ("varoni", "", "Iepazīsties: stāsta varoņi"), ("progress", "", "Mans progress")]
    back = [("verbi", "A", "Darbības vārdu tabulas"), ("termini", "B", "Gramatikas terminu skaidrojumi"), ("frazes", "C", "Ceļotāja sarunvārdnīca"),
            ("vardnica", "D", "Spāņu–latviešu vārdnīca"), ("atbildes", "E", "Atbildes"), ("diploms", "", "Apliecinājums")]
    h = '<section class="plain toc"><h2 class="pg-h">Saturs <small>Índice</small></h2><div class="toc-cols"><div>'
    h += '<ul class="toc-l">' + "".join(row(k, n, t, "", "fm") for k, n, t in front) + "</ul>"
    h += f'<h4 class="toc-part a1">{mk("x")[:0]}1. daļa · A1 · Pirmie soļi</h4><ul class="toc-l">' + "".join(row(*t) for t in a1) + "</ul></div><div>"
    h += '<h4 class="toc-part a2">2. daļa · A2 · Tālāk ceļā</h4><ul class="toc-l">' + "".join(row(*t) for t in a2) + "</ul>"
    h += '<h4 class="toc-part">Pielikumi</h4><ul class="toc-l">' + "".join(row(k, n, t, "") for k, n, t in back) + "</ul></div></div></section>"
    return h

def howto():
    icons = [
        ("op", "Nodarbības sākums", "Mērķi un iesildīšanās jautājumi — pārdomā tos, pirms sāc."),
        ("svarigi", "Atceries!", "Empanadillo rāda svarīgāko likumu. Ja atceries tikai vienu lietu — šo."),
        ("piemers", "Piemēri", "Spāniski kreisajā pusē, tulkojums labajā. Aizsedz labo kolonnu un pārbaudi sevi."),
        ("vardnica", "Vārdu krājums", "Jaunie vārdi. Visi tie apkopoti arī vārdnīcā grāmatas beigās."),
        ("ex", "Vingrinājumi", "Raksti tieši grāmatā. Atbildes — E pielikumā."),
        ("story", "Stāsts", "Līgas gads Valensijā: lasi spāniski, tad salīdzini ar tulkojumu."),
        ("runa", "Runā!", "Mutiskā prakse. Saki skaļi vai ieraksti sevi telefonā."),
        ("kops", "Kopsavilkums", "Atzīmē ✓ pie «Es protu…», kad tiešām to vari."),
    ]
    li = "".join(f'<li><span class="hi hi-{k}"></span><div><b>{t}</b><p>{d}</p></div></li>' for k, t, d in icons)
    return f'''<section class="plain howto">{mk("howto")}<h2 class="pg-h">Kā mācīties ar šo grāmatu <small>Cómo usar este libro</small></h2>
  <div class="ht-intro"><div class="ht-empa">{EMPA["vicina"]}</div><div><p class="lead">¡Hola! Esmu <b>Empanadillo</b> — Libertas ceļotājs. Kopā mēs nonāksim no pirmā spāņu vārda līdz A2 līmenim: tu spēsi runāt par sevi, iepirkties, pastāstīt, ko darīji vakar un ko darīsi rīt.</p>
  <p>Grāmatā ir <b>divas daļas</b>: A1 (14 nodarbības) un A2 (13 nodarbības). Katra nodarbība ir veidota pēc viena plāna — tāpēc vienmēr zināsi, kas sekos.</p></div></div>
  <ul class="ht-list">{li}</ul>
  <div class="ht-tips"><h4>Pieci padomi labākam rezultātam</h4><ol>
   <li><b>Maz, bet bieži.</b> 20 minūtes katru dienu ir labāk nekā 3 stundas reizi nedēļā.</li>
   <li><b>Lasi skaļi.</b> Spāņu valoda ir fonētiska — ko redzi, to saki. Izruna nostiprinās tikai runājot.</li>
   <li><b>Atkārto.</b> Pirms jaunas nodarbības pārlasi iepriekšējās kopsavilkumu.</li>
   <li><b>Izlasi stāstu divreiz:</b> vispirms tikai spāniski, tad ar tulkojumu.</li>
   <li><b>Nebaidies kļūdīties.</b> ¡Equivocarse es aprender! — Kļūdīties nozīmē mācīties!</li></ol></div>
</section>'''

def varoni():
    cards = "".join(f'<div class="var"><div class="av" style="background:{c}">{E(i)}</div><div><b>{E(n)}</b><p class="es">{E(es)}</p><p class="lv">{E(lv)}</p></div></div>' for n, i, c, es, lv in extras.VARONI)
    return f'''<section class="plain varoni">{mk("varoni")}<h2 class="pg-h">Iepazīsties: stāsta varoņi <small>Los personajes</small></h2>
  <p class="lead">Katras nodarbības beigās tevi gaida stāsts no sērijas <b>«Līgas gads Valensijā»</b>. Līga no Rīgas pārceļas uz Valensiju — un katrā nodarbībā viņa, tāpat kā tu, iemācās ko jaunu. Pirmie stāsti ir pavisam vienkārši, pēdējie — jau īsta A2 līmeņa valoda.</p>
  <div class="var-grid">{cards}</div>
  <div class="map"><svg viewBox="0 0 600 220"><rect width="600" height="220" rx="16" fill="#EDE5D8"/>
   <path d="M60 170 q40 -60 120 -50 q60 -40 120 0 q30 30 0 60 q-70 20 -140 10 q-80 0 -100 -20z" fill="#DDE5DA" stroke="#34503F" stroke-width="2"/>
   <circle cx="250" cy="150" r="7" fill="#B4502A"/><text x="262" y="155" font-family="Source Sans 3" font-size="15" fill="#24211E">Valencia</text>
   <circle cx="168" cy="128" r="5" fill="#6B1D1D"/><text x="120" y="118" font-family="Source Sans 3" font-size="13" fill="#5C554D">Madrid</text>
   <path d="M430 70 q20 -25 60 -20 q40 10 50 40 q-10 30 -60 30 q-40 -5 -50 -50z" fill="#DDE5DA" stroke="#34503F" stroke-width="2"/>
   <circle cx="470" cy="80" r="7" fill="#B4502A"/><text x="482" y="78" font-family="Source Sans 3" font-size="15" fill="#24211E">Rīga</text>
   <path d="M470 90 C 420 190, 320 200, 258 150" fill="none" stroke="#6B1D1D" stroke-width="2.5" stroke-dasharray="7 7"/>
   <text x="330" y="205" font-family="Lora" font-style="italic" font-size="15" fill="#6B1D1D">~ 3000 km · 4 h ar lidmašīnu</text>
   <text x="70" y="40" font-family="Lora" font-size="18" fill="#6B1D1D">España</text><text x="440" y="40" font-family="Lora" font-size="18" fill="#6B1D1D">Letonia</text></svg></div>
</section>'''

def progress():
    rows = ""
    for k, n, t, lvl in TOC:
        rows += f'<tr class="{lvl.lower()}"><td class="pl">{lvl}</td><td>{E(n)}</td><td class="pt">{E(t)}</td><td class="box"></td><td class="box"></td><td class="box"></td><td class="dt"></td></tr>'
    return f'''<section class="plain progress">{mk("progress")}<h2 class="pg-h">Mans progress <small>Mi progreso</small></h2>
  <p class="lead">Atzīmē katru soli. Kad visas rūtiņas ir pilnas — tu esi sasniedzis A2 līmeni! <span class="muted">(Izlasīts · Vingrinājumi · Stāsts · Datums)</span></p>
  <table class="prog"><thead><tr><th></th><th>Nr.</th><th>Nodarbība</th><th>📖</th><th>✎</th><th>★</th><th>Datums</th></tr></thead><tbody>{rows}</tbody></table></section>'''

def part(lvl, title, sub, lessons):
    li = "".join(f"<li><span>{d['nr']}</span>{E(d['nosaukums'])}</li>" for d in lessons)
    return f'''<section class="partp {lvl.lower()}"><div class="pp-art">{scene(lvl.lower())}</div>
  <div class="pp-txt"><span class="pp-k">{"1" if lvl=="A1" else "2"}. daļa</span><h1>{lvl}</h1><p class="pp-t">{E(title)}</p><p class="pp-s">{E(sub)}</p><ol class="pp-list">{li}</ol></div></section>'''

# ---------- pielikumi ----------
def appendix_verbs():
    cards = ""
    for v in extras.VERBI:
        t = extras.tabula(v)
        rows = "".join(f"<tr><td class='p'>{E(p)}</td><td>{E(a)}</td><td>{E(b)}</td><td>{E(c)}</td><td>{E(d)}</td></tr>" for p, a, b, c, d in t["rows"])
        cards += f'''<div class="vcard"><div class="vh2"><b>{E(t["inf"])}</b> <span>{E(t["noz"])}</span>{f'<em>{E(t["piez"])}</em>' if t["piez"] else ""}</div>
         <table><thead><tr><th></th><th>Tagadne</th><th>Vienk. pagātne</th><th>Nepab. pagātne</th><th>Nākotne</th></tr></thead><tbody>{rows}</tbody></table>
         <div class="vfoot">Ģerundijs: <b>{E(t["ger"])}</b> · Divdabis: <b>{E(t["part"])}</b> → he {E(t["part"])}</div></div>'''
    return f'''<section class="plain app">{mk("verbi")}<h2 class="pg-h"><span class="appl">A</span>Darbības vārdu tabulas <small>Los verbos</small></h2>
  <p class="lead">Galvenie laiki vienuviet. <b>Tagadne</b> (presente) — 6.–7. nod.; <b>saliktā tagadne</b> (he hablado) — A2 3. nod.; <b>vienkāršā pagātne</b> (indefinido) — A2 7. nod.; <b>nepabeigtā pagātne</b> (imperfecto) — A2 13. nod.; <b>nākotne</b> (futuro) — A2 11. nod.</p>
  <div class="vgrid">{cards}</div></section>'''

def appendix_terms():
    seen = {}
    for c in ["spanu-a1-ps", "spanu-a2-ps"]:
        d = json.load(open(SRC / c / "kanons.json", encoding="utf8"))
        for k, v in d["termini"].items():
            dfn = v["definicija"]; name = dfn.split(" — ")[0] if " — " in dfn else dfn.split(" (")[0]
            seen.setdefault(name.lower(), dfn)
    items = "".join(f"<li>{inline(v)}</li>" for k, v in sorted(seen.items(), key=lambda x: x[0]))
    return f'''<section class="plain app">{mk("termini")}<h2 class="pg-h"><span class="appl">B</span>Gramatikas terminu skaidrojumi <small>Términos</small></h2>
  <p class="lead">Ja kāds termins nodarbībā šķiet svešs — atrodi to šeit.</p><ul class="terms">{items}</ul></section>'''

def appendix_phrases():
    blocks = "".join(f'<div class="phb"><h4>{E(t)}</h4><table>' + "".join(f"<tr><td class='es'>{E(a)}</td><td class='lv'>{E(b)}</td></tr>" for a, b in ps) + "</table></div>" for t, ps in extras.SARUNVARDNICA)
    return f'''<section class="plain app">{mk("frazes")}<h2 class="pg-h"><span class="appl">C</span>Ceļotāja sarunvārdnīca <small>Frases útiles</small></h2>
  <p class="lead">Svarīgākās frāzes ceļojumam — vari izgriezt un ņemt līdzi!</p><div class="phgrid">{blocks}</div></section>'''

def sort_key(w):
    w = re.sub(r"^(el|la|los|las|un|una|el / la|¿|¡)\s+", "", w.lower().lstrip("¿¡"))
    tr = str.maketrans("áéíóúüñ", "aeiouun")
    return w.translate(tr)

def appendix_gloss():
    items = sorted(GLOSS.items(), key=lambda x: sort_key(x[0]))
    out, cur = [], None
    for es, (lv, src) in items:
        L = sort_key(es)[:1].upper()
        if L != cur:
            cur = L; out.append(f'<li class="gl-l">{E(L)}</li>')
        out.append(f'<li><b>{E(es)}</b> {E(lv)}</li>')
    return f'''<section class="plain app">{mk("vardnica")}<h2 class="pg-h"><span class="appl">D</span>Spāņu–latviešu vārdnīca <small>Vocabulario</small></h2>
  <p class="lead">{len(items)} vārdi un frāzes no visām nodarbībām alfabēta secībā (artikulus el, la, un, una kārtojot neņem vērā).</p><ul class="gloss">{"".join(out)}</ul></section>'''

def appendix_answers():
    blocks = ""
    for key, title, ans, vf in ANSWERS:
        a = "".join(f"<li><b>{n}.</b> {h}</li>" for n, h in ans)
        v = " · ".join(f"{i+1}. {'V' if x else 'F'}" for i, (q, x) in enumerate(vf))
        blocks += f'<div class="ansb"><h4>{E(title)}</h4><ul>{a}</ul><p class="vfans"><b>Stāsts:</b> {v}</p></div>'
    return f'''<section class="plain app answers">{mk("atbildes")}<h2 class="pg-h"><span class="appl">E</span>Atbildes <small>Soluciones</small></h2>
  <p class="lead">Rakstīšanas uzdevumiem dots paraugs — tava atbilde var atšķirties un tomēr būt pareiza.</p><div class="anscols">{blocks}</div></section>'''

def diploma():
    return f'''<section class="plain diploma">{mk("diploms")}<div class="dp-frame">
  <img src="{LOGO}" class="dp-logo" alt="Libertas"><div class="dp-empa">{EMPA["sveicina"]}</div>
  <p class="dp-k">Apliecinājums</p><h2>¡Enhorabuena!</h2><p class="dp-lv">Apsveicam!</p>
  <div class="dp-line"></div><p class="dp-small">vārds, uzvārds</p>
  <p class="dp-txt">ir izgājis(-usi) visas 27 grāmatas «¡Vamos! Spāņu valoda A1–A2» nodarbības un sasniedzis(-usi) <b>A2 līmeni</b> spāņu valodā.</p>
  <div class="dp-sign"><div><div class="dp-line"></div><p class="dp-small">datums</p></div><div><div class="dp-line"></div><p class="dp-small">paraksts</p></div></div>
  <p class="dp-next">Gatavs turpināt? Nākamais solis — Libertas kurss <b>Spāņu valoda B1</b>. libertas.study</p></div></section>'''

def notes(n):
    return "".join('<section class="plain notes"><h2 class="pg-h">Piezīmes <small>Notas</small></h2><div class="nlines"></div></section>' for _ in range(n))

def back_cover():
    return f'''<section class="backc"><div class="bc-art">{scene("cover")}</div><div class="bc-txt">
  <h2>¡Vamos!</h2><p class="bc-lead">Mācību grāmata latviešiem, kas vēlas runāt spāniski — no pirmā vārda līdz A2 līmenim.</p>
  <ul><li>27 nodarbības ar skaidru gramatiku latviešu valodā</li><li>Stāstu sērija «Līgas gads Valensijā» ar paralēlo tulkojumu</li>
  <li>Vingrinājumi, mutiskā prakse un atbildes</li><li>Darbības vārdu tabulas, vārdnīca un ceļotāja frāzes</li></ul>
  <div class="bc-logo">{LOGO_LIGHT}</div><p class="bc-url">libertas.study</p></div></section>'''

# ---------- salikšana ----------
def build(pages, n_notes=1):
    global ANSWERS, GLOSS, TOC
    ANSWERS, GLOSS, TOC = [], {}, []
    a1 = [json.load(open(f, encoding="utf8")) for f in sorted(glob.glob(str(SRC / "spanu-a1-ps" / "nodarbiba-*.json")))]
    a2 = [json.load(open(f, encoding="utf8")) for f in sorted(glob.glob(str(SRC / "spanu-a2-ps" / "nodarbiba-*.json")))]
    body_a1 = "".join(lesson(d, "A1", i + 1, stasti.A1[i]) for i, d in enumerate(a1))
    body_a2 = "".join(lesson(d, "A2", 14 + i + 1, stasti.A2[i]) for i, d in enumerate(a2))
    ph = lambda k: f'<section class="ph">{mk("PH-" + k)}</section>'
    fulls = [cover(), part("A1", "Pirmie soļi", "Izruna, lietvārdi, tagadne, ser un estar, skaitļi, ēdiens, ģimene un ceļš.", a1),
             part("A2", "Tālāk ceļā", "Pagātne, nākotne, salīdzināšana, ikdiena, svētki un pie ārsta.", a2), back_cover()]
    parts = [ph("0"), owner(), title_page(), imprint(), toc_page(pages), howto(), varoni(), progress(),
             ph("1"), body_a1, ph("2"), body_a2,
             appendix_verbs(), appendix_terms(), appendix_phrases(), appendix_gloss(), appendix_answers(), diploma(), notes(n_notes), ph("3")]
    css = open(HERE / "book.css", encoding="utf8").read()
    fonts = re.sub(r"url\((f\w+\.woff2)\)", lambda m: "url(data:font/woff2;base64," + __import__("base64").b64encode((HERE / "fonts" / m.group(1)).read_bytes()).decode() + ")", open(HERE / "fonts" / "fonts.css", encoding="utf8").read())
    doc = f'''<!doctype html><html lang="lv"><head><meta charset="utf-8"><title>¡Vamos! Spāņu valoda A1–A2 — Libertas</title>
<style>{fonts}</style><style>{css}</style></head><body>{"".join(parts)}</body></html>'''
    OUT_HTML.write_text(doc, encoding="utf8")
    fdoc = doc.split("<body>")[0].replace("</head>", "<style>@page{size:A4;margin:0 !important}</style></head>") + "<body>" + "".join(fulls) + "</body></html>"
    FULL_HTML.write_text(fdoc, encoding="utf8")

def render(src=None, dst=None):
    src = src or OUT_HTML; dst = dst or OUT_PDF
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
                    f"--user-data-dir={HERE / 'chrome-prof'}", f"--print-to-pdf={dst}", src.as_uri()], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL, timeout=240); print('rendered', dst.name, flush=True)

def find_pages():
    doc = pymupdf.open(OUT_PDF); res = {}
    for i, p in enumerate(doc):
        for m in re.findall(r"@@([\w-]+)@@", p.get_text()):
            res.setdefault(m, i + 1)
    return res, len(doc)

if __name__ == "__main__":
    build({}); render(); pages, n = find_pages()
    print("pass1 pages", n)
    extra = (4 - (n % 4)) % 4  # kopējais lappušu skaits — dalāms ar 4 (bukletam)
    build(pages, 1 + extra); render(); pages2, n2 = find_pages()
    if pages2 != pages:
        build(pages2, 1 + extra); render(); pages2, n2 = find_pages()
    render(FULL_HTML, FULL_PDF)
    fin = pymupdf.open(OUT_PDF); full = pymupdf.open(FULL_PDF)
    phs = [(i, int(m.group(1))) for i in range(len(fin)) for m in [re.search(r"@@PH-(\d)@@", fin[i].get_text())] if m]
    for i, k in phs:
        fin.insert_pdf(full, from_page=k, to_page=k, start_at=i); fin.delete_page(i + 1)
    fin.set_metadata({"title": "¡Vamos! Spāņu valoda A1–A2", "author": "Libertas", "subject": "Spāņu valodas mācību grāmata latviešiem, A1–A2", "creator": "Libertas"})
    fin.save(FINAL_PDF, garbage=3, deflate=True)
    print("full pages", len(full))
    print("final pages", n2, {k: v for k, v in pages2.items() if not k.startswith("A")})
