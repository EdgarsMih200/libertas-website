# E-kursi: ierakstītā izruna (mp3) visiem tekstiem, ko macibas.js runat() atskaņo.
# Lietošana: python -I riki/ek-audio.py <kurss> [--parrakstit]
#   → e-kursi-saturs/<kurss>/audio/<atslēga>.mp3 + audio/saraksts.json {atslēga: teksts}
# Atslēga = sha1(teksts NFC)[:16] — tieši tas pats teksts, ko saņem runat() (macibas.js audioAtslega()).
# Balsis: Edge neirālās (pakete edge-tts). Kad mp3 gatavi: node riki/ek-audio-augsupladet.mjs <kurss> --remote
# un plans.json jābūt "audio": true (citādi atskaņotājs lieto pārlūka runas sintēzi).
import asyncio, hashlib, json, re, sys, unicodedata
from pathlib import Path

import edge_tts

BALSIS = {  # (sieviete, vīrietis)
    'et': ('et-EE-AnuNeural', 'et-EE-KertNeural'),
    'es': ('es-ES-ElviraNeural', 'es-ES-AlvaroNeural'),
    'en': ('en-GB-SoniaNeural', 'en-GB-RyanNeural'),
}
ATRUMS = '-10%'  # mazliet lēnāk iesācējiem


def atslega(teksts):
    return hashlib.sha1(unicodedata.normalize('NFC', teksts).encode('utf-8')).hexdigest()[:16]


def tirit(t):
    """Teksts runai: bez latviskām piezīmēm iekavās, simboliem un dialoga domuzīmēm."""
    t = re.sub(r'\([^)]*\)', ' ', t)
    t = t.replace('«', '').replace('»', '').replace('…', ',').replace('·', ',').replace(' / ', ', ')
    t = re.sub(r'(^|\s)—\s*', r'\1', t)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s*,(\s*,)+', ',', t)
    t = re.sub(r'([.!?])\s*,', r'\1', t)
    t = re.sub(r'\s+([,.!?])', r'\1', t)
    return t.strip(' ,')


def savakt(sakne):
    """[(teksts, balss_nr)] tādā secībā, kā tos atskaņo atskaņotājs."""
    out = []
    def uzd(u):
        if u.get('tips') == 'klausies' and u.get('runa'):
            out.append((u['runa'], 1))
        if u.get('tips') == 'runat' and u.get('paraugs'):
            p = u['paraugs']
            out.append(('. '.join(p) if isinstance(p, list) else p, 0))
    for f in sorted(sakne.glob('nodarbiba-*.json')):
        n = json.loads(f.read_text('utf-8'))
        for d in n.get('dalas', []):
            for b in d.get('materials', []):
                if b.get('t') in ('piemers', 'vardnica'):
                    dial = 0
                    for v in b.get('vienumi', []):
                        if v and v[0]:
                            if v[0].lstrip().startswith('—'):
                                out.append((v[0], dial % 2)); dial += 1
                            else:
                                out.append((v[0], 0))
                elif b.get('t') == 'burti':
                    for v in b.get('vienumi', []):
                        t = (v[2] if len(v) > 2 and v[2] else v[0])
                        if t: out.append((t, 0))
            for u in d.get('vingrinajumi', []): uzd(u)
        if n.get('prakse'): uzd(n['prakse'])
        for u in (n.get('tests') or {}).get('banka', []): uzd(u)
    eks = sakne / 'eksamens.json'
    if eks.exists():
        for u in json.loads(eks.read_text('utf-8')).get('banka', []): uzd(u)
    return out


async def main():
    if len(sys.argv) < 2:
        sys.exit('Lietošana: python -I riki/ek-audio.py <kurss> [--parrakstit]')
    kurss, parrakstit = sys.argv[1], '--parrakstit' in sys.argv
    sakne = Path('e-kursi-saturs') / kurss
    plans = json.loads((sakne / 'plans.json').read_text('utf-8'))
    balsis = BALSIS.get(plans['valoda'])
    if not balsis:
        sys.exit(f"Nav balss valodai {plans['valoda']} — papildini BALSIS")
    mape = sakne / 'audio'
    mape.mkdir(exist_ok=True)
    saraksts, darbi = {}, []
    for teksts, b in savakt(sakne):
        k = atslega(teksts)
        if k in saraksts: continue
        saraksts[k] = teksts
        runa = tirit(teksts)
        cels = mape / f'{k}.mp3'
        if runa and (parrakstit or not cels.exists()):
            darbi.append((runa, balsis[b], cels))
    sem = asyncio.Semaphore(6)
    gatavi = 0
    async def viens(runa, balss, cels):
        nonlocal gatavi
        async with sem:
            for meg in range(3):
                try:
                    await edge_tts.Communicate(runa, balss, rate=ATRUMS).save(str(cels))
                    gatavi += 1
                    if gatavi % 50 == 0: print(f'  … {gatavi}/{len(darbi)}', flush=True)
                    return
                except Exception as e:
                    if meg == 2: print(f'✗ {cels.name}: {e} — «{runa[:60]}»', flush=True)
                    await asyncio.sleep(2)
    await asyncio.gather(*(viens(*d) for d in darbi))
    for k in [p.stem for p in mape.glob('*.mp3') if p.stem not in saraksts]:
        (mape / f'{k}.mp3').unlink()  # teksts vairs netiek lietots
    (mape / 'saraksts.json').write_text(json.dumps(saraksts, ensure_ascii=False, indent=1), 'utf-8')
    kopa = sum(p.stat().st_size for p in mape.glob('*.mp3'))
    print(f'✓ {len(saraksts)} teksti, jauni {gatavi}, kopā {round(kopa / 1048576, 1)} MB → {mape}')

asyncio.run(main())
