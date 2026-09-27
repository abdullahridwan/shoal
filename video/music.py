import numpy as np, wave
SR = 44100
BPM = 80
BEAT = 60 / BPM
DUR = 56.5
N = int(SR * DUR)
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

CHORDS = [  # (bass, chord tones) midi
    (50, [62, 66, 69, 73]),  # Dmaj7
    (47, [62, 66, 69, 71]),  # Bm7
    (43, [62, 67, 71, 74]),  # Gmaj7 (add9)
    (45, [64, 69, 71, 76]),  # Asus2
]
BAR = 4 * BEAT
CHORD_LEN = 2 * BAR

def env(n, a, r):
    e = np.ones(n)
    ai = int(a * SR); ri = int(r * SR)
    e[:ai] = np.linspace(0, 1, ai)
    e[-ri:] *= np.linspace(1, 0, ri)
    return e

def add(buf, start, sig):
    s = int(start * SR)
    if s >= N: return
    sig = sig[: N - s]
    buf[s:s + len(sig)] += sig

k = 0
start = 0.0
while start < DUR:
    bass, tones = CHORDS[k % 4]
    n = int((CHORD_LEN + 1.5) * SR)
    tt = np.arange(n) / SR
    e = env(n, 1.4, 2.2)
    for i, m in enumerate(tones):
        f = hz(m)
        for side, det in ((L, -0.8), (R, 0.8)):
            sig = sum((0.5 ** h) * np.sin(2 * np.pi * f * (h + 1) * tt * (1 + det / 1200)) for h in range(3))
            add(side, start, 0.05 * e * sig)
    sub = np.sin(2 * np.pi * hz(bass - 12) * tt) * env(n, 0.3, 1.5)
    add(L, start, 0.12 * sub); add(R, start, 0.12 * sub)
    k += 1
    start += CHORD_LEN

# plucked arpeggio from 6s, eighth notes
rng = np.random.default_rng(3)
step = BEAT / 2
tt = np.arange(int(1.6 * SR)) / SR
i = 0
x = 6.0
while x < DUR - 3:
    bass, tones = CHORDS[int(x // CHORD_LEN) % 4]
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    m = tones[pattern[i % 8]] + 12
    f = hz(m)
    sig = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 5.5)
    sig[:60] *= np.linspace(0, 1, 60)
    pan = 0.5 + 0.35 * np.sin(i * 0.9)
    vel = 0.055 * (1.0 if i % 2 == 0 else 0.7)
    add(L, x, vel * (1 - pan) * sig); add(R, x, vel * pan * sig)
    i += 1; x += step

# soft kick and shaker from 12s
kt = np.arange(int(0.35 * SR)) / SR
kick = np.sin(2 * np.pi * (45 + 70 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 9)
noise = rng.standard_normal(int(0.08 * SR))
shaker = np.diff(np.concatenate([[0], noise])) * np.exp(-np.arange(len(noise)) / SR * 60)
b = 12.0
j = 0
while b < DUR - 4:
    add(L, b, 0.16 * kick); add(R, b, 0.16 * kick)
    add(L, b + BEAT / 2, 0.012 * shaker); add(R, b + BEAT / 2 + 0.004, 0.012 * shaker)
    b += BEAT; j += 1

# reverb: convolve with decaying noise
ir_n = int(2.8 * SR)
irt = np.arange(ir_n) / SR
def reverb(x, seed):
    ir = np.random.default_rng(seed).standard_normal(ir_n) * np.exp(-irt * 2.2)
    ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + ir_n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return 0.72 * x + 0.5 * y
L = reverb(L, 1); R = reverb(R, 2)

fade = env(N, 1.5, 4.0)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
L = L / peak * 0.8; R = R / peak * 0.8
data = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open('public/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('ok', DUR)
