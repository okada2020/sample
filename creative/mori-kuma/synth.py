"""Original 150 BPM track for the kamishibai motion graphic "森でクマに会ったら".

Not based on any existing song: chords, melody and arrangement are written here.

bar 0   hyoshigi clacks (beats 0, 1), doors open
bar 1   music-box intro + riser
bar 2-3 groove: kick, offbeat bass, hats, arp            (walk)
bar 4   build: snare roll, riser, kick drops out          (gasa-gasa)
bar 5-6 DROP 1: supersaw lead, claps, boom on beat 20     (bear)
bar 7   breakdown: pads + sparkle chime                   (sunglasses)
bar 8-9 DROP 2, key up +2 semitones                       (dance battle)
bar 10  lighter groove                                    (friends)
bar 11  final chord on 44, clacks on 46 and 47            (おしまい)
tail to beat 50
"""
import wave
import numpy as np

SR = 44100
BPM = 150
BEAT = 60 / BPM
TOTAL_BEATS = 50
N = int(SR * BEAT * TOTAL_BEATS)
rng = np.random.default_rng(11)
BUS = {"m": [np.zeros(N), np.zeros(N)], "d": [np.zeros(N), np.zeros(N)]}
duck = np.ones(N)


def at(beat):
    return int(round(beat * BEAT * SR))


def add(sig, beat, gain=1.0, pan=0.0, bus="m"):
    i = at(beat)
    if i >= N:
        return
    j = min(N, i + len(sig))
    s = sig[: j - i] * gain
    BUS[bus][0][i:j] += s * (1 - max(0, pan))
    BUS[bus][1][i:j] += s * (1 + min(0, pan))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def saw(freq, dur, harmonics=16, detune=0.0):
    t = tt(dur)
    f = freq * (1 + detune)
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if f * k > SR / 2 - 1500:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * (2 / np.pi)


def env(n, a=0.004, d=0.2, s=0.0):
    t = np.arange(n) / SR
    return np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))


NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def f(name, shift=0):
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) + shift - 69) / 12)


# ---------- percussion ----------
def kick():
    t = tt(0.3)
    fr = 50 + 140 * np.exp(-t * 45)
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 9)
    click = rng.standard_normal(len(t)) * np.exp(-t * 500) * 0.3
    return np.tanh(2.2 * (body + click))


def hat(open_=False):
    t = tt(0.18 if open_ else 0.05)
    x = np.diff(np.diff(rng.standard_normal(len(t)), prepend=0), prepend=0)
    return x * np.exp(-t * (18 if open_ else 80)) * 0.32


def clap():
    t = tt(0.22)
    x = np.convolve(np.diff(rng.standard_normal(len(t)), prepend=0), np.ones(5) / 5, mode="same")
    e = sum(np.where(t >= o, np.exp(-np.maximum(t - o, 0) * (70 if o < 0.02 else 20)), 0) for o in (0, .01, .02))
    return x * e * 0.95


def snare():
    t = tt(0.1)
    return (np.sin(2 * np.pi * 200 * t) * np.exp(-t * 35) * 0.5
            + np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 30)) * 0.6


def crash(dur=2.0):
    t = tt(dur)
    return np.diff(np.diff(rng.standard_normal(len(t)), prepend=0), prepend=0) * np.exp(-t * 2.0) * 0.22


def boom():
    t = tt(1.2)
    return np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.5) * 0.9


def riser(beats):
    t = tt(beats * BEAT)
    p = t / t[-1]
    x = rng.standard_normal(len(t))
    x = (1 - p) * x * 0.12 + p * np.diff(x, prepend=0) * 0.55
    sweep = np.sin(2 * np.pi * np.cumsum(300 + 2200 * p ** 2) / SR) * 0.12
    return (x + sweep) * p ** 2


def hyoshigi():
    """Wooden clapper: a dry knock with two bright partials."""
    t = tt(0.16)
    noise = np.convolve(np.diff(rng.standard_normal(len(t)), prepend=0), np.ones(3) / 3, mode="same")
    tone = (np.sin(2 * np.pi * 1850 * t) + 0.6 * np.sin(2 * np.pi * 2780 * t) + 0.3 * np.sin(2 * np.pi * 4100 * t))
    return (noise * np.exp(-t * 180) * 0.9 + tone * np.exp(-t * 55) * 0.55)


def bell(freq, dur=0.5):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 5) * 0.16


def chime():
    """Sparkle for the sunglasses 'キラーン'."""
    out = np.zeros(int(1.4 * SR))
    for i, fr in enumerate([f("C6"), f("E6"), f("G6"), f("C7"), f("E7"), f("G7")]):
        b = bell(fr, 1.0) * 1.3
        k = int(i * 0.045 * SR)
        out[k:k + len(b)] += b[: len(out) - k]
    t = tt(0.5)
    gl = np.sin(2 * np.pi * np.cumsum(1500 + 3500 * (t / t[-1])) / SR) * np.exp(-t * 6) * 0.08
    out[: len(gl)] += gl
    return out


# ---------- harmony ----------
# I - V - vi - IV in C major
PROG = [("C4", "E4", "G4"), ("B3", "D4", "G4"), ("C4", "E4", "A4"), ("C4", "F4", "A4")]
ROOT = ["C2", "G1", "A1", "F1"]
# top melody over one chord bar: (beat, length, note)
MELODY = [
    [(0, 1.5, "G5"), (1.5, .5, "E5"), (2, 1, "C6"), (3, 1, "B5")],
    [(0, 1.5, "D6"), (1.5, .5, "B5"), (2, 2, "G5")],
    [(0, 1.5, "C6"), (1.5, .5, "A5"), (2, 1, "E6"), (3, 1, "D6")],
    [(0, 1, "C6"), (1, 1, "A5"), (2, 1, "F5"), (3, 1, "G5")],
]


def supersaw(freqs, dur, gain=0.055, bright=16):
    L = np.zeros(int(dur * SR)); R = np.zeros_like(L)
    for fr in freqs:
        for d, side in ((-.006, "l"), (-.002, "b"), (.003, "b"), (.007, "r")):
            v = saw(fr, dur, bright, d)
            if side in "lb":
                L += v
            if side in "rb":
                R += v
    e = env(len(L), a=.003, d=dur * .8, s=.4)
    return L * e * gain, R * e * gain


def lead(freq, dur):
    s = saw(freq, dur, 18, -.004) + saw(freq, dur, 18, .004) + 0.5 * np.sin(2 * np.pi * freq * 2 * tt(dur))
    return s * env(len(s), a=.005, d=.25, s=.55) * 0.075


def pluck(freq, dur=0.16):
    s = saw(freq, dur, 10)
    return s * env(len(s), a=.002, d=.06) * .15


def bass(freq, dur):
    s = saw(freq * 2, dur, 8) * .55 + np.sin(2 * np.pi * freq * tt(dur)) * .85
    return s * env(len(s), a=.003, d=.1, s=.5) * .5


def kick_at(beat, g=1.0):
    add(kick(), beat, g, bus="d")
    i = at(beat); j = min(N, i + int(.2 * SR))
    duck[i:j] = np.minimum(duck[i:j], np.linspace(.2, 1, j - i) ** 1.5)


# ---------- arrangement ----------
# bar 0: two clacks, then the doors
add(hyoshigi(), 0, 2.2, bus="d")
add(hyoshigi(), 1, 2.2, bus="d")

# bar 1: music-box intro
for k, n in enumerate(["C5", "E5", "G5", "C6", "G5", "E5", "G5", "C6"]):
    add(bell(f(n)), 4 + k * .5, 1.0, pan=.2 if k % 2 else -.2)
add(riser(4), 4, .7, bus="d")

for bar in range(2, 11):
    b0 = bar * 4
    shift = 2 if bar in (8, 9) else 0          # key change for drop 2
    ci = (bar - 2) % 4
    chord = [f(n, shift) for n in PROG[ci]]
    root = f(ROOT[ci], shift)
    drop = bar in (5, 6, 8, 9)

    if bar == 7:                                # breakdown: pads only
        L, R = supersaw(chord, BEAT * 4, .05, 8)
        add(L, b0, 1, .3); add(R, b0, 1, -.3)
        add(chime(), b0 + 1.5, 1.2)
        add(riser(2), b0 + 2, .9, bus="d")
        continue

    # drums
    for k in range(4):
        if bar == 4 and k == 3:
            break                               # drop the last kick of the build
        kick_at(b0 + k, 1.0)
        add(hat(open_=drop), b0 + k + .5, .9, pan=.25, bus="d")
        if drop or bar == 10:
            add(hat(), b0 + k + .25, .3, pan=-.25, bus="d")
            add(hat(), b0 + k + .75, .3, pan=-.25, bus="d")
    if bar >= 3:
        add(clap(), b0 + 1, .75, bus="d"); add(clap(), b0 + 3, .75, bus="d")

    # bass on the offbeats
    for k in range(4):
        add(bass(root, BEAT * .42), b0 + k + .5, 1)

    # 16th arp over the chord
    arp = [chord[0] * 2, chord[1] * 2, chord[2] * 2, chord[1] * 2]
    for s16 in range(16):
        add(pluck(arp[s16 % 4]), b0 + s16 * .25, 1.1 if drop else .8, pan=.2 if s16 % 2 else -.2)

    # chords: offbeat stabs in drops, sustained otherwise
    if drop:
        for k in range(4):
            L, R = supersaw(chord, BEAT * .45)
            add(L, b0 + k + .5, 1.2, .35); add(R, b0 + k + .5, 1.2, -.35)
        for (st, ln, n) in MELODY[ci]:
            add(lead(f(n, shift), BEAT * ln * .95), b0 + st, 1.0)
    else:
        L, R = supersaw(chord, BEAT * 4, .035, 10)
        add(L, b0, 1, .3); add(R, b0, 1, -.3)

# build (bar 4): snare roll + riser
roll = [16 + i * .5 for i in range(4)] + [18 + i * .25 for i in range(4)] + [19 + i * .125 for i in range(8)]
for i, b in enumerate(roll):
    add(snare(), b, .3 + .7 * i / len(roll), bus="d")
add(riser(4), 16, 1.0, bus="d")

# impacts
add(crash(), 20, 1.3, bus="d"); add(boom(), 20, 1.0, bus="d")
add(crash(), 32, 1.3, bus="d"); add(boom(), 32, 1.0, bus="d")

# ending: final chord, then two clacks
kick_at(44, 1.1)
L, R = supersaw([f("C4"), f("E4"), f("G4"), f("C5")], BEAT * 2.5, .06)
add(L, 44, 1.4, .3); add(R, 44, 1.4, -.3)
add(bass(f("C2"), BEAT * 2), 44, 1)
add(crash(), 44, 1.0, bus="d")
add(hyoshigi(), 46, 2.0, bus="d")
add(hyoshigi(), 47, 2.0, bus="d")

# ---------- mix ----------
side = .3 + .7 * duck
mixL = BUS["d"][0] + BUS["m"][0] * side * 1.5
mixR = BUS["d"][1] + BUS["m"][1] * side * 1.5
fade = np.ones(N); tail = int(.5 * SR); fade[-tail:] = np.linspace(1, 0, tail) ** 2
mixL *= fade; mixR *= fade
peak = max(np.abs(mixL).max(), np.abs(mixR).max())
mixL = np.tanh(1.4 * mixL / peak) / np.tanh(1.4)
mixR = np.tanh(1.4 * mixR / peak) / np.tanh(1.4)
out = np.stack([mixL, mixR], 1) * .89
with wave.open("music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(f"music.wav {N / SR:.2f}s {BPM}BPM")
