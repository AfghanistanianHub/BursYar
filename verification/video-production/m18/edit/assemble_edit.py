#!/usr/bin/env python3
# M18 assembly: 8 authentic clips + 37 narration cues + labels -> 179.5s film.
# Run: python3 edit/assemble_edit.py [--out PATH]
# Requires: imageio-ffmpeg binary (FFMPEG env or default path below).
import json, os, subprocess, sys, textwrap
PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _ffmpeg():
    # $FFMPEG wins; else the imageio-ffmpeg install for THIS python
    # (portable across machines/venvs); else PATH; else the proven path.
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    import shutil
    return shutil.which('ffmpeg') or '/Library/Frameworks/Python.framework/Versions/3.14/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v9.0.2'
FF = _ffmpeg()
OUT = sys.argv[sys.argv.index('--out')+1] if '--out' in sys.argv else os.path.join(PROD, 'edit', 'draft-m18.mp4')
FILM = 179.5
tl = json.load(open(os.path.join(PROD, 'audio', 'timeline.json')))
# ---- shots: (clip, ss, to, crop[x,y,w,h] or None) ----
# Heads trimmed past load/scroll per measured first-content frames (02:1.2 03:0.4
# 01:0.4 04:0.8 05:1.0 06:1.2 07:0.8 08:0.6); freeze pads preserve 179.5s.
shots = [
  ('02-discovery', 1.2, 11.56, None), ('03-source-gate', 0.4, 10.04, None),
  ('01-landing', 0.4, 10.84, None), ('02-discovery', 2.0, 11.56, (560, 360)),
  ('03-source-gate', 2.7, 11.08, None), ('08-source', 0.6, 9.92, None), ('07-documents', 0.8, 13.1, None),
  ('06-analysis', 1.2, 15.8, None), ('06-analysis', 6.0, 15.8, (560, 330)),
  ('FZ06', 0, 5.6, None),
  ('04-eligibility', 0.8, 12.56, None), ('06-analysis', 10.0, 15.8, (560, 280)),
  ('04-eligibility', 6.0, 12.56, (560, 250)), ('FZ04', 0, 5.88, None),
  ('05-languages', 1.0, 12.48, None), ('07-documents', 4.0, 10.0, (560, 100)),
  ('06-analysis', 8.0, 14.0, (560, 330)), ('FZ06B', 0, 1.52, None),
  ('01-landing', 0.4, 10.84, None), ('02-discovery', 1.2, 9.26, (560, 360)), ('01-landing', 4.84, 10.84, None),
]
clips = ['01-landing', '02-discovery', '03-source-gate', '04-eligibility', '05-languages', '06-analysis', '07-documents', '08-source']
cidx = {c: i for i, c in enumerate(clips)}
FZ = {'FZ06': ('frames/fz06.png', 5.6), 'FZ04': ('frames/fz04.png', 5.88), 'FZ06B': ('frames/fz06b.png', 1.52)}
# ---- inputs ----
args = [FF, '-hide_banner', '-loglevel', 'warning', '-y']
for c in clips:
    args += ['-i', os.path.join(PROD, 'footage', c + '.webm')]
for c in tl:
    args += ['-i', os.path.join(PROD, 'audio', c['file'])]
fz_input = {}
n_vid = len(clips); n_aud = len(tl)
fz_base = n_vid + n_aud
for j, (k, (f, d)) in enumerate(FZ.items()):
    args += ['-loop', '1', '-framerate', '30', '-t', str(d), '-i', os.path.join(PROD, f)]
    fz_input[k] = fz_base + j
labels = ['chip-live.png', 'chip-rehearsal.png', 'chip-fixture.png', 'chip-runs.png', 'endcard.png']
lab_base = fz_base + len(FZ)
for j, l in enumerate(labels):
    args += ['-loop', '1', '-framerate', '30', '-t', str(FILM), '-i', os.path.join(PROD, 'labels', l)]
# ---- video graph ----
g = []
seg = []
for i, (c, ss, to, crop) in enumerate(shots):
    if c in FZ:
        frames = int(round((to) * 30))
        g.append(f"[{fz_input[c]}:v]fps=30,scale=1920:1080,setsar=1,zoompan=z='1+0.05*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,trim=0:{to:.2f},setpts=PTS-STARTPTS[v{i}]")
    else:
        cr = f",crop=1280:720:{crop[0]}:{crop[1]},scale=1920:1080" if crop else ""
        g.append(f"[{cidx[c]}:v]trim={ss:.2f}:{to:.2f},setpts=PTS-STARTPTS,fps=30{cr},setsar=1[v{i}]")
    seg.append(f"[v{i}]")
g.append(''.join(seg) + f"concat=n={len(seg)}:v=1:a=0,fade=t=in:st=0:d=0.5,fade=t=out:st={FILM-0.5}:d=0.5[vcat]")
# label windows (shot boundaries computed from durs)
bounds, t = [], 0.0
for (_, ss, to, _) in shots:
    bounds.append((round(t, 2), round(t + (to - ss), 2))); t += to - ss
assert abs(t - FILM) < 0.01, t
live_idx = [0, 1, 2, 3, 4, 10, 12, 13, 14, 18, 19, 20]
rehe_idx = [5, 6, 7, 8, 9, 11, 15, 16, 17]
bw = lambda idxs: '+'.join(f"between(t,{bounds[i][0]},{bounds[i][1]})" for i in idxs)
runs_cue = [c for c in tl if c['text'].startswith('Two live runs')][0]
runs_next = tl[tl.index(runs_cue) + 1]
runs_win = f"between(t,{runs_cue['start']-0.3:.2f},{runs_next['start']+runs_next['dur']+0.5:.2f})"
L = lab_base
g.append(f"[vcat][{L}:v]overlay=60:860:enable='{bw(live_idx)}'[o1]")
g.append(f"[o1][{L+1}:v]overlay=60:860:enable='{bw(rehe_idx)}'[o2]")
g.append(f"[o2][{L+2}:v]overlay=W-w-60:860:enable='between(t,{bounds[6][0]},{bounds[6][1]})+between(t,{bounds[15][0]},{bounds[15][1]})'[o3]")
g.append(f"[o3][{L+3}:v]overlay=W-w-60:120:enable='{runs_win}'[o4]")
g.append(f"[{L+4}:v]format=rgba,fade=t=in:st=174:d=0.8:alpha=1[end]")
ass_path = os.path.join(PROD, 'edit', 'captions.ass')
g.append(f"[o4]drawbox=y=300:h=430:c=black@0.45:t=fill:enable='between(t,174,179.5)'[o4d]")
g.append(f"[o4d][end]overlay=(W-w)/2:330:enable='between(t,174,179.5)',subtitles='{ass_path}':fontsdir=/System/Library/Fonts/Supplemental,format=yuv420p[vout]")
# ---- captions ASS ----
def srt_time(s):
    h, m = int(s // 3600), int(s % 3600 // 60)
    return f"{h}:{m:02d}:{s % 60:06.3f}".replace('.', ',')
def ass_time(s):
    return f"{int(s//3600)}:{int(s%3600//60):02d}:{s%60:05.2f}"
def wrap(text):
    if len(text) <= 42: return [text]
    for sep in [' — ', ', ', ' ']:
        parts = text.split(sep)
        if len(parts) > 1:
            best, acc = None, ''
            for p in parts:
                t = (acc + sep + p).strip() if acc else p
                if len(t) <= 44: acc = t
                else: break
            rest = text[len(acc):].lstrip(' —,')
            if acc and rest and len(rest) <= 60: return [acc, rest]
    return textwrap.wrap(text, 44)[:2]
ass = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080", "",
       "[V4+ Styles]", "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
       "Style: Narration,Arial,52,&H00FFFFFF,&H000019FF,&H80000000,&HCC000000,0,0,0,0,100,100,0,0,3,2,0,2,60,60,40,1", "",
       "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
def norm(t):
    return ' '.join(t.split())
def greedy_lines(text):
    # Mission 19: wrap WITHOUT dropping words (wrap() truncates past 2 lines).
    lines, cur = [], ''
    for w in text.split(' '):
        t = (cur + ' ' + w).strip()
        if len(t) <= 44: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines
srt = []
srt_n = 0
for i, c in enumerate(tl):
    end = min(c['start'] + c['dur'] + 0.24, (tl[i+1]['start'] - 0.05) if i + 1 < len(tl) else FILM)
    first = wrap(c['text'])
    if norm(' '.join(first)) == norm(c['text']):
        groups = [first]  # fits: keep the original line breaks byte-identical
    else:
        flat = greedy_lines(c['text'])
        groups = [flat[j:j+2] for j in range(0, len(flat), 2)]
        assert norm(' '.join(l for g in groups for l in g)) == norm(c['text']), c['file']
    total = sum(sum(len(l) for l in g) for g in groups)
    t0 = c['start']
    for k, lines in enumerate(groups):
        frac = sum(len(l) for l in lines) / total
        t1 = end if k == len(groups) - 1 else t0 + (end - c['start']) * frac
        if i < len(tl) - 1:  # burned captions skip the final line: the end card shows it
            ass.append("Dialogue: 0,%s,%s,Narration,,0,0,0,,%s" % (ass_time(t0), ass_time(t1), '\\N'.join(lines)))
        srt_n += 1
        srt.append(f"{srt_n}\n{srt_time(t0)} --> {srt_time(t1)}\n" + '\n'.join(lines) + '\n')
        t0 = t1
open(os.path.join(PROD, 'edit', 'captions.ass'), 'w').write('\n'.join(ass) + '\n')
open(os.path.join(PROD, 'BursYar-Meta-Hackathon-Demo.srt'), 'w').write('\n'.join(srt))
# ---- audio graph ----
ag = []
for j, c in enumerate(tl):
    ms = int(round(c['start'] * 1000))
    ag.append(f"[{n_vid+j}:a]atrim=start={c['trim0']:.3f}:duration={c['dur']:.3f},asetpts=PTS-STARTPTS,aresample=48000,adelay={ms}[a{j}]")
ag.append(''.join(f"[a{j}]" for j in range(len(tl))) + f"amix=inputs={len(tl)}:normalize=0,apad=whole_dur={FILM},atrim=0:{FILM},aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.3,afade=t=out:st={FILM-0.3}:d=0.3[aout]")
args += ['-filter_complex', ';'.join(g + ag),
         '-map', '[vout]', '-map', '[aout]',
         '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30',
         '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-t', str(FILM), '-movflags', '+faststart', OUT]
print('rendering', OUT)
r = subprocess.run(args, capture_output=True, text=True)
print(('FAIL HEAD:\n' + r.stderr[:2500] + '\nFAIL TAIL:\n' + r.stderr[-800:]) if r.returncode else 'OK')
sys.exit(r.returncode)
