# Grupu kursa PDF prezentāciju sagatavošana kursa telpai (KV vērtība ≤ 25 MB).
# 1) Saspiež PDF: katra lapa → JPEG + neredzams teksta slānis (meklēšanai/kopēšanai).
# 2) Izgriež attēlus interaktīvajai HTML prezentācijai (riki/gk-prezentacija.mjs) mapē <mērķis>/img:
#    NN-title.jpg (1. lapa), NN-thanks.jpg (pēdējā lapa); ar --ov/--fons arī kopīgos ov.jpg un bg1..N.jpg
#    (lapas bez teksta: satura slaida fons un teksta slaidu fons).
# Lietošana: python -I riki/gk-pdf.py <avota.pdf> <mērķa mape> <nr> [--ov 4] [--fons 5,36,73,87] [--platums 1600] [--kvalitate 72]
import sys, os, re, io
import pymupdf

src, out, nr = sys.argv[1], sys.argv[2], int(sys.argv[3])
arg = sys.argv[4:]
PLAT = int(arg[arg.index('--platums') + 1]) if '--platums' in arg else 1600
KV = int(arg[arg.index('--kvalitate') + 1]) if '--kvalitate' in arg else 72
nn = f'{nr:02d}'
os.makedirs(os.path.join(out, 'img'), exist_ok=True)
FONTS = [r'C:\Windows\Fonts\arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
FONT = next((f for f in FONTS if os.path.exists(f)), None)

d = pymupdf.open(src)
W = d[0].rect.width


def jpeg(page, platums, kval, bez_teksta=False):
    if bez_teksta:
        t = pymupdf.open()
        t.insert_pdf(d, from_page=page.number, to_page=page.number)
        p = t[0]
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    if s['text'].strip():
                        p.add_redact_annot(pymupdf.Rect(s['bbox']) + (-2, -2, 2, 2))
        p.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
        page = p
    pix = page.get_pixmap(matrix=pymupdf.Matrix(platums / W, platums / W), alpha=False)
    return pix.tobytes('jpeg', jpg_quality=kval)


def saglabat(nos, data):
    with open(os.path.join(out, 'img', f'{nn}-{nos}.jpg'), 'wb') as f:
        f.write(data)


# --- attēli prezentācijai ---
saglabat('title', jpeg(d[0], 1440, 80))
saglabat('thanks', jpeg(d[-1], 1440, 80))
# kopīgie attēli visām kursa nodarbībām (vienreiz, no izvēlētām lapām): --ov <lpp> --fons <lpp,lpp,…>
if '--ov' in arg:
    with open(os.path.join(out, 'img', 'ov.jpg'), 'wb') as f:
        f.write(jpeg(d[int(arg[arg.index('--ov') + 1]) - 1], 1440, 80, True))
if '--fons' in arg:
    for j, i in enumerate(arg[arg.index('--fons') + 1].split(','), 1):
        with open(os.path.join(out, 'img', f'bg{j}.jpg'), 'wb') as f:
            f.write(jpeg(d[int(i) - 1], 1440, 78, True))

# --- saspiests PDF ---
o = pymupdf.open()
for p in d:
    np_ = o.new_page(width=p.rect.width, height=p.rect.height)
    np_.insert_image(np_.rect, stream=jpeg(p, PLAT, KV))
    if FONT:
        np_.insert_font(fontname='F0', fontfile=FONT)
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    if s['text'].strip():
                        try:
                            np_.insert_text(s['origin'], s['text'], fontname='F0', fontsize=max(s['size'], 1), render_mode=3)
                        except Exception:
                            pass
o.set_metadata({'title': os.path.splitext(os.path.basename(src))[0]})
o.save(os.path.join(out, f'{nn}.pdf'), garbage=4, deflate=True)
print(f'{nn}: {len(d)} lpp. · {os.path.getsize(os.path.join(out, nn + ".pdf")) / 1e6:.1f} MB')
