"""Original 128 BPM house loop for the follower motion graphic.

8 bars + a 2-beat tail. Everything is synthesized here, so there is no
third-party audio in the output.

bar 0      intro   : kick, offbeat hats, soft chords
bar 1      build   : + bass, noise riser into the drop
bar 2-5    drop    : full groove, lead arp, clap on 2 & 4
bar 5      (2nd half) snare roll into the 500 moment
bar 6      hit     : crash on beat 1, full groove
bar 7      outro   : full groove
beat 32    final stab, rings out to beat 34
"""
import wave
import numpy as np

SR = 44100
BPM = 128
BEAT = 60 / BPM
TOTAL_BEATS = 34
N = int(SR * BEAT * TOTAL_BEATS)
rng = np.random.default_rng(7)

BUS = {"m": [np.zeros(N), np.zeros(N)], "d": [np.zeros(N), np.zeros(N)]}
duck = np.ones(N)  # sidechain envelope applied to pads/bass/lead


def at(beat):
    return int(round(beat * BEAT * SR))


def add(sig, beat, gain=1.0, pan=0.0, bus="m"):
    i = at(beat)
    j = min(N, i + len(sig))
    if i >= N:
        return
    s = sig[: j - i] * gain
    BUS[bus][0][i:j] += s * (1 - max(0, pan))
    BUS[bus][1][i:j] += s * (1 + min(0, pan))


def saw(freq, dur, harmonics=14, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    f = freq * (1 + detune)
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if f * k > SR / 2 - 1000:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * (2 / np.pi)


def env(n, a=0.005, d=0.2, s=0.0, total=None):
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    return e


# ---------- drums ----------
def kick():
    n = int(0.38 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(n) * np.exp(-t * 400) * 0.25
    return np.tanh(1.8 * (body + click))


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    x = rng.standard_normal(n)
    x = np.diff(np.diff(x, prepend=0), prepend=0)  # crude high-pass
    t = np.arange(n) / SR
    return x * np.exp(-t * (14 if open_ else 70)) * 0.35


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = np.diff(rng.standard_normal(n), prepend=0)
    x = np.convolve(x, np.ones(6) / 6, mode="same")  # soften the top
    e = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        tt = t - off
        e += np.where(tt >= 0, np.exp(-np.maximum(tt, 0) * (60 if off < 0.02 else 18)), 0)
    return x * e * 0.9


def snare():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    x = np.diff(rng.standard_normal(n), prepend=0) * np.exp(-t * 28)
    return (tone + x) * 0.6


def crash():
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    x = np.diff(np.diff(rng.standard_normal(n), prepend=0), prepend=0)
    return x * np.exp(-t * 1.9) * 0.22


def riser(beats):
    n = int(beats * BEAT * SR)
    t = np.arange(n) / SR
    p = t / t[-1]
    x = rng.standard_normal(n)
    hp = np.diff(x, prepend=0)
    x = (1 - p) * x * 0.15 + p * hp * 0.6  # brighter as it rises
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * p ** 2) / SR) * 0.15
    return (x + sweep) * p ** 2


# ---------- harmony ----------
# vi - IV - I - V in C major (Am F C G), one chord per bar
CHORDS = [
    (220.00, 261.63, 329.63),  # Am
    (174.61, 220.00, 261.63),  # F
    (261.63, 329.63, 392.00),  # C
    (196.00, 246.94, 293.66),  # G
]
ROOTS = [55.00, 43.65, 65.41, 49.00]


def chord_stab(freqs, dur, bright=14):
    out_l = np.zeros(int(dur * SR))
    out_r = np.zeros_like(out_l)
    for f in freqs:
        for d, side in ((-0.004, "l"), (0.0, "b"), (0.005, "r")):
            v = saw(f, dur, bright, d)
            if side in ("l", "b"):
                out_l += v
            if side in ("r", "b"):
                out_r += v
    e = env(len(out_l), a=0.004, d=dur * 0.9, s=0.35)
    return out_l * e * 0.07, out_r * e * 0.07


def bass_note(f, dur):
    s = saw(f * 2, dur, 8) * 0.6 + np.sin(2 * np.pi * f * np.arange(int(dur * SR)) / SR) * 0.8
    return s * env(len(s), a=0.003, d=0.12, s=0.5) * 0.55


def pluck(f, dur=0.22):
    s = saw(f, dur, 10)
    return s * env(len(s), a=0.002, d=0.09) * 0.18


# lead arp pattern over chord tones, eighth notes
ARP = [0, 1, 2, 1, 3, 2, 1, 2]  # index into (root, 3rd, 5th, octave)


def arp_freqs(chord):
    r, th, fi = chord
    return [r * 2, th * 2, fi * 2, r * 4]


for bar in range(8):
    b0 = bar * 4
    ci = bar % 4
    chord = CHORDS[ci]

    # kick: four on the floor (bar 0 too, so it hits from frame 1)
    for k in range(4):
        add(kick(), b0 + k, 1.0, bus="d")
        i = at(b0 + k)
        j = min(N, i + int(0.24 * SR))
        ramp = np.linspace(0.25, 1.0, j - i) ** 1.5
        duck[i:j] = np.minimum(duck[i:j], ramp)

    # hats on the offbeat, open hat from the drop
    for k in range(4):
        add(hat(open_=bar >= 2), b0 + k + 0.5, 0.9, pan=0.25, bus="d")
        if bar >= 2:
            add(hat(), b0 + k + 0.25, 0.35, pan=-0.25, bus="d")
            add(hat(), b0 + k + 0.75, 0.35, pan=-0.25, bus="d")

    # clap on 2 & 4 from the drop
    if bar >= 2:
        add(clap(), b0 + 1, 0.8, bus="d")
        add(clap(), b0 + 3, 0.8, bus="d")

    # chords: soft pad in the intro, offbeat stabs from the drop
    if bar < 2:
        cl, cr = chord_stab(chord, BEAT * 4, bright=6)
        add(cl, b0, 0.8, pan=0.3)
        add(cr, b0, 0.8, pan=-0.3)
    else:
        for k in range(4):
            cl, cr = chord_stab(chord, BEAT * 0.45, bright=14)
            add(cl, b0 + k + 0.5, 1.1, pan=0.35)
            add(cr, b0 + k + 0.5, 1.1, pan=-0.35)

    # bass on the offbeats from bar 1
    if bar >= 1:
        for k in range(4):
            add(bass_note(ROOTS[ci], BEAT * 0.45), b0 + k + 0.5, 1.0)

    # lead arp in the drop and after the hit
    if bar >= 2:
        fr = arp_freqs(chord)
        for e8 in range(8):
            add(pluck(fr[ARP[e8]]), b0 + e8 * 0.5, 1.0, pan=0.15 if e8 % 2 else -0.15)

# build into the drop
add(riser(4), 4, 1.0, bus="d")
add(crash(), 8, 1.0, bus="d")

# snare roll into the 500 moment (bar 5, beats 22-24), accelerating
roll = [22 + i * 0.25 for i in range(4)] + [23 + i * 0.125 for i in range(8)]
for i, b in enumerate(roll):
    add(snare(), b, 0.35 + 0.65 * i / len(roll), bus="d")
add(riser(2), 22, 0.8, bus="d")
add(crash(), 24, 1.3, bus="d")

# final stab on beat 32, rings out
add(kick(), 32, 1.1, bus="d")
cl, cr = chord_stab(CHORDS[2], BEAT * 2, bright=14)
add(cl, 32, 1.6, pan=0.3)
add(cr, 32, 1.6, pan=-0.3)
add(crash(), 32, 1.0, bus="d")

# ---------- mix ----------
# sidechain: only the melodic bus pumps against the kick
side = 0.3 + 0.7 * duck
mix_l = BUS["d"][0] + BUS["m"][0] * side * 1.4
mix_r = BUS["d"][1] + BUS["m"][1] * side * 1.4
fade = np.ones(N)
tail = int(0.6 * SR)
fade[-tail:] = np.linspace(1, 0, tail) ** 2
mix_l *= fade
mix_r *= fade
peak = max(np.abs(mix_l).max(), np.abs(mix_r).max())
mix_l = np.tanh(1.3 * mix_l / peak) / np.tanh(1.3)
mix_r = np.tanh(1.3 * mix_r / peak) / np.tanh(1.3)
out = np.stack([mix_l, mix_r], axis=1) * 0.89

with wave.open("music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())

print(f"music.wav  {N / SR:.2f}s  {BPM} BPM  beat={BEAT:.5f}s")
