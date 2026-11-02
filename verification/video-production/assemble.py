#!/usr/bin/env python3
"""Assemble the BursYar hackathon demo cut (Mission 09 timeline, Mission 10 home).

Deterministic: same inputs produce the same duration, layout and captions
(x264 byte output may differ run to run; duration and streams are stable).

Inputs (repo-relative):
  verification/artifacts/m09/01-landing.webm ... 08-source.webm
    from verification/record-submission-demo.mjs (production, read-only)
    and verification/record-rehearsal-demo.mjs (local mocked stack)
  verification/artifacts/m09/cards/*.png
    from verification/video-production/render-cards.mjs

Output: --out (default verification/artifacts/m09/bursyar-demo-3min-provisional.mp4)

Tool discovery: $FFMPEG, else imageio-ffmpeg, else PATH ffmpeg.
Font: $VIDEO_FONT, else macOS Arial, else DejaVu Sans.
No credentials, paid APIs, or student data are used or needed.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
M09 = REPO / 'verification' / 'artifacts' / 'm09'
CARDS = M09 / 'cards'
TMP = M09 / 'build'


def find_ffmpeg():
    for cand in [os.environ.get('FFMPEG')]:
        if cand and Path(cand).exists():
            return cand
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    found = shutil.which('ffmpeg')
    if found:
        return found
    sys.exit('ffmpeg not found: set $FFMPEG, pip install imageio-ffmpeg, or install ffmpeg')


def find_font():
    for cand in [os.environ.get('VIDEO_FONT'),
                 '/System/Library/Fonts/Supplemental/Arial.ttf',
                 '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if cand and Path(cand).exists():
            return cand
    sys.exit('No caption font found: set $VIDEO_FONT to a .ttf path')


FF = find_ffmpeg()
FONT = find_font()


def run(*args):
    r = subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', *args],
                       capture_output=True, text=True)
    assert r.returncode == 0, f'ffmpeg failed: {args}\n{r.stderr}'
    return r


def main(out_name):
    for need in ['01-landing', '02-discovery', '03-source-fetch', '04-eligibility',
                 '05-languages', '06-analysis', '07-documents', '08-source']:
        assert (M09 / f'{need}.webm').exists(), f'missing input: run the recorders first ({need})'
    for need in ['card-problem', 'card-meta', 'card-impact']:
        assert (CARDS / f'{need}.png').exists(), f'missing card: run render-cards.mjs ({need})'
    TMP.mkdir(parents=True, exist_ok=True)
    run('-ss', '13.5', '-i', str(M09 / '06-analysis.webm'), '-frames:v', '1', str(TMP / 'frz06.png'))
    run('-ss', '10.0', '-i', str(M09 / '04-eligibility.webm'), '-frames:v', '1', str(TMP / 'frz04.png'))
    run('-ss', '10.5', '-i', str(M09 / '07-documents.webm'), '-frames:v', '1', str(TMP / 'frz07.png'))
    for text, name in [('READ THE OFFICIAL SOURCE', 'i1.mp4'),
                       ('AI INTERPRETS — EVIDENCE DECIDES', 'i2.mp4'),
                       ('MET · NOT MET · UNKNOWN', 'i3.mp4'),
                       ('ENGLISH · DARI · PASHTO', 'i4.mp4')]:
        run('-f', 'lavfi', '-i', 'color=c=0xf5f7fb:s=1920x1080:d=5:r=30',
            '-vf', f"drawtext=fontfile={FONT}:text='{text}':fontsize=64:fontcolor=0x26364a:x=(w-text_w)/2:y=(h-text_h)/2",
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(TMP / name))
    SEGS = [
        ('img', str(CARDS / 'card-problem.png'), 22.0, 'Afghan students navigate foreign systems in a second language|h-102', ''),
        ('vid', str(M09 / '01-landing.webm'), 9.3, 'BursYar, live — guided from possibility to a plan', 'LIVE · bursyar.vercel.app'),
        ('vid', str(M09 / '02-discovery.webm'), 9.9, 'Discovery: historical leads, honestly labeled', 'LIVE · bursyar.vercel.app'),
        ('vid', str(TMP / 'i1.mp4'), 5.0, '', ''),
        ('cut', f'{M09 / "03-source-fetch.webm"}|7.0|5.0', 5.0, 'Signed-out visitors meet a clear sign-in gate', 'LIVE · bursyar.vercel.app'),
        ('vid', str(M09 / '08-source.webm'), 7.6, 'URL-first retrieval with explicit approval', 'REHEARSAL · SIMULATED SERVICES'),
        ('vid', str(TMP / 'i2.mp4'), 5.0, '', ''),
        ('img', str(CARDS / 'card-meta.png'), 20.0, 'Two recorded Muse Spark runs — metadata shown, nothing invented|h-102', 'RECORDED RUNS · METADATA ONLY'),
        ('vid', str(M09 / '06-analysis.webm'), 14.2, 'Illustrative analysis UI — simulated response', 'REHEARSAL · SIMULATED SERVICES'),
        ('img', str(TMP / 'frz06.png'), 4.0, 'Every claim bound to an exact quotation', 'REHEARSAL · SIMULATED SERVICES'),
        ('vid', str(TMP / 'i3.mp4'), 5.0, '', ''),
        ('vid', str(M09 / '04-eligibility.webm'), 10.7, 'Conservative verdicts — unknown is never a guess', 'LIVE · bursyar.vercel.app'),
        ('img', str(TMP / 'frz04.png'), 4.0, 'What-if scenarios leave real facts unchanged', 'LIVE · bursyar.vercel.app'),
        ('vid', str(M09 / '07-documents.webm'), 11.2, 'Consent-based review — synthetic records only', 'REHEARSAL · SIMULATED SERVICES'),
        ('img', str(TMP / 'frz07.png'), 4.0, 'Private storage · reviewed, never verified', 'REHEARSAL · SIMULATED SERVICES'),
        ('vid', str(TMP / 'i4.mp4'), 5.0, '', ''),
        ('vid', str(M09 / '05-languages.webm'), 10.0, 'Full right-to-left experience in Dari and Pashto', 'LIVE · bursyar.vercel.app'),
        ('img', str(CARDS / 'card-impact.png'), 28.0, '', ''),
    ]
    parts = []
    for i, (kind, src, dur, cap, env) in enumerate(SEGS):
        out = str(TMP / f'seg{i:02d}.mp4')
        if kind == 'img':
            run('-loop', '1', '-framerate', '30', '-t', str(dur), '-i', src,
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', out)
        elif kind == 'cut':
            path, ss, t = src.split('|')
            run('-ss', ss, '-t', t, '-i', path, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', out)
        else:
            run('-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', out)
        parts.append(out)
    (TMP / 'list.txt').write_text(''.join(f"file '{p}'\n" for p in parts))
    run('-f', 'concat', '-safe', '0', '-i', str(TMP / 'list.txt'), '-c', 'copy', str(TMP / 'master.mp4'))
    total = sum(d for _, _, d, _, _ in SEGS)
    print(f'timeline total: {total:.1f}s')

    def esc(s):
        return s.replace("'", "'\\''").replace(':', '\\:')

    vf = []
    t = 0.0
    for kind, src, dur, cap, env in SEGS:
        if cap:
            text, _, ypos = cap.partition('|')
            vf.append(f"drawtext=fontfile={FONT}:text='{esc(text)}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y={ypos or 'h-150'}:box=1:boxcolor=0x243F5B@0.88:boxborderw=26:enable='between(t,{t:.2f},{t+dur:.2f})'")
        if env:
            vf.append(f"drawtext=fontfile={FONT}:text='{esc(env)}':fontsize=28:fontcolor=white:x=w-text_w-56:y=56:box=1:boxcolor=0x243F5B@0.88:boxborderw=18:enable='between(t,{t:.2f},{t+dur:.2f})'")
        t += dur
    vf.append(f'fade=t=in:st=0:d=0.6:color=white,fade=t=out:st={total-0.8:.2f}:d=0.8:color=white')
    run('-i', str(TMP / 'master.mp4'), '-vf', ','.join(vf), '-c:v', 'libx264', '-preset', 'medium',
        '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out_name)
    print('DONE', out_name)


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--out', default=str(M09 / 'bursyar-demo-3min-provisional.mp4'))
    main(p.parse_args().out)
