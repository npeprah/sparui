#!/usr/bin/env python3
"""
Generate original synthesized cartoon SFX for the Spar card game.

BUILD TICKET 10 - audio: replace synthetic placeholder SFX.

Every sound produced here is 100% ORIGINAL and algorithmically synthesized from
math primitives (sine / saw / square / noise + envelopes + filters). Nothing is
sampled, recorded, or copied from any third-party library. Because the project
generates and owns these bytes outright, they are inherently license-clean and
commercial-use safe.

Design goals vs the old `generate_placeholder_sounds.py` sine-beeps:
  - Layered tones, ADSR envelopes, pitch sweeps, noise transients and short
    musical stings so the clips have genuine cartoon character.
  - The "toasty" easter-egg byte and the fire-streak "on fire!" sting are
    ORIGINAL SOUNDALIKES that EVOKE the arcade-announcer vibe (Mortal Kombat /
    NBA Jam) WITHOUT sampling or reproducing the trademarked recordings. They
    are generic rising cartoon exclamations built from formant-like tone stacks;
    no attempt is made to match the specific pitch contour, words, or timbre of
    the real recordings.

Output format matches exactly what the frontend already loads
(`frontend/src/services/audioManager.ts`): mono, 44100 Hz, 16-bit PCM WAV.

Dependencies: Python 3 standard library only (wave, struct, math, array,
random). No numpy / scipy / ffmpeg / sox required. Deterministic: the RNG is
seeded per-clip so re-running reproduces byte-identical assets.

Usage:
    python3 scripts/generate_sfx.py

Overwrites the .wav files in-place at their existing paths/keys and additionally
emits the `toasty` easter-egg asset (not yet wired into the loader - see
AUDIO_MANIFEST.json).
"""

import math
import os
import random
import struct
import wave

SAMPLE_RATE = 44100
OUTPUT_BASE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend",
    "public",
    "assets",
    "sounds",
    "sfx",
)

TWO_PI = 2.0 * math.pi


# ---------------------------------------------------------------------------
# Core signal helpers (operate on plain python lists of floats in [-1, 1])
# ---------------------------------------------------------------------------

def n_samples(duration):
    return int(SAMPLE_RATE * duration)


def silence(duration):
    return [0.0] * n_samples(duration)


def sine(freq, duration, amp=1.0, phase=0.0):
    out = [0.0] * n_samples(duration)
    step = TWO_PI * freq / SAMPLE_RATE
    for i in range(len(out)):
        out[i] = amp * math.sin(step * i + phase)
    return out


def sweep(f0, f1, duration, amp=1.0, curve="lin"):
    """Frequency sweep from f0 to f1. curve: 'lin' or 'exp'."""
    count = n_samples(duration)
    out = [0.0] * count
    phase = 0.0
    for i in range(count):
        frac = i / max(1, count - 1)
        if curve == "exp":
            f = f0 * (f1 / f0) ** frac
        else:
            f = f0 + (f1 - f0) * frac
        phase += TWO_PI * f / SAMPLE_RATE
        out[i] = amp * math.sin(phase)
    return out


def saw(freq, duration, amp=1.0, harmonics=12):
    """Band-limited-ish sawtooth via summed harmonics (warm, buzzy)."""
    count = n_samples(duration)
    out = [0.0] * count
    for h in range(1, harmonics + 1):
        step = TWO_PI * freq * h / SAMPLE_RATE
        hamp = amp / h
        for i in range(count):
            out[i] += hamp * math.sin(step * i)
    # normalize the harmonic sum back toward amp
    peak = max((abs(v) for v in out), default=1.0) or 1.0
    return [v * amp / peak for v in out]


def square(freq, duration, amp=1.0, harmonics=9):
    """Square-ish wave via odd harmonics (hollow cartoon 'boop')."""
    count = n_samples(duration)
    out = [0.0] * count
    for h in range(1, harmonics * 2, 2):
        step = TWO_PI * freq * h / SAMPLE_RATE
        hamp = amp / h
        for i in range(count):
            out[i] += hamp * math.sin(step * i)
    peak = max((abs(v) for v in out), default=1.0) or 1.0
    return [v * amp / peak for v in out]


def noise(duration, amp=1.0, seed=None):
    if seed is not None:
        random.seed(seed)
    count = n_samples(duration)
    return [amp * (random.random() * 2.0 - 1.0) for _ in range(count)]


def formant_voice(f0_start, f0_end, formants, duration, amp=1.0, curve="exp"):
    """A cartoon vocal-ish 'blip': a swept buzzy source shaped by fixed formant
    resonances. Evokes a spoken exclamation without being a recording."""
    count = n_samples(duration)
    src = [0.0] * count
    phase = 0.0
    # buzzy glottal-ish source: a few harmonics of a swept fundamental
    for i in range(count):
        frac = i / max(1, count - 1)
        if curve == "exp":
            f = f0_start * (f0_end / f0_start) ** frac
        else:
            f = f0_start + (f0_end - f0_start) * frac
        phase += TWO_PI * f / SAMPLE_RATE
        # sum first 4 harmonics -> buzzy source
        s = (
            math.sin(phase)
            + 0.5 * math.sin(2 * phase)
            + 0.33 * math.sin(3 * phase)
            + 0.25 * math.sin(4 * phase)
        )
        src[i] = s
    # shape source through parallel resonant bandpass filters (formants)
    out = [0.0] * count
    for (fc, gain) in formants:
        band = _bandpass(src, fc, q=6.0)
        for i in range(count):
            out[i] += gain * band[i]
    peak = max((abs(v) for v in out), default=1.0) or 1.0
    return [v * amp / peak for v in out]


# ---------------------------------------------------------------------------
# Filters (simple, dependency-free)
# ---------------------------------------------------------------------------

def lowpass(sig, cutoff):
    """One-pole low-pass."""
    if not sig:
        return sig
    dt = 1.0 / SAMPLE_RATE
    rc = 1.0 / (TWO_PI * cutoff)
    alpha = dt / (rc + dt)
    out = [0.0] * len(sig)
    out[0] = sig[0] * alpha
    for i in range(1, len(sig)):
        out[i] = out[i - 1] + alpha * (sig[i] - out[i - 1])
    return out


def highpass(sig, cutoff):
    """One-pole high-pass."""
    if not sig:
        return sig
    dt = 1.0 / SAMPLE_RATE
    rc = 1.0 / (TWO_PI * cutoff)
    alpha = rc / (rc + dt)
    out = [0.0] * len(sig)
    out[0] = sig[0]
    for i in range(1, len(sig)):
        out[i] = alpha * (out[i - 1] + sig[i] - sig[i - 1])
    return out


def _bandpass(sig, fc, q=6.0):
    """Biquad band-pass (constant skirt gain)."""
    w0 = TWO_PI * fc / SAMPLE_RATE
    alpha = math.sin(w0) / (2.0 * q)
    cos_w0 = math.cos(w0)
    b0 = alpha
    b1 = 0.0
    b2 = -alpha
    a0 = 1.0 + alpha
    a1 = -2.0 * cos_w0
    a2 = 1.0 - alpha
    b0, b1, b2 = b0 / a0, b1 / a0, b2 / a0
    a1, a2 = a1 / a0, a2 / a0
    out = [0.0] * len(sig)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(len(sig)):
        x0 = sig[i]
        y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        out[i] = y0
        x2, x1 = x1, x0
        y2, y1 = y1, y0
    return out


# ---------------------------------------------------------------------------
# Envelope / mixing helpers
# ---------------------------------------------------------------------------

def adsr(sig, attack=0.01, decay=0.05, sustain=0.7, release=0.1):
    """Apply an ADSR amplitude envelope in seconds."""
    count = len(sig)
    a = int(SAMPLE_RATE * attack)
    d = int(SAMPLE_RATE * decay)
    r = int(SAMPLE_RATE * release)
    a = min(a, count)
    d = min(d, max(0, count - a))
    r = min(r, max(0, count - a - d))
    s_len = max(0, count - a - d - r)
    out = list(sig)
    idx = 0
    for i in range(a):
        out[idx] *= (i / a) if a else 1.0
        idx += 1
    for i in range(d):
        out[idx] *= 1.0 + (sustain - 1.0) * (i / d) if d else sustain
        idx += 1
    for _ in range(s_len):
        out[idx] *= sustain
        idx += 1
    for i in range(r):
        out[idx] *= sustain * (1.0 - i / r) if r else 0.0
        idx += 1
    return out


def fade(sig, fade_in=0.0, fade_out=0.0):
    out = list(sig)
    fin = int(SAMPLE_RATE * fade_in)
    fout = int(SAMPLE_RATE * fade_out)
    for i in range(min(fin, len(out))):
        out[i] *= i / fin
    for i in range(min(fout, len(out))):
        out[len(out) - 1 - i] *= i / fout
    return out


def gain(sig, g):
    return [v * g for v in sig]


def tremolo(sig, rate, depth=0.5):
    out = list(sig)
    step = TWO_PI * rate / SAMPLE_RATE
    for i in range(len(out)):
        out[i] *= 1.0 - depth * (0.5 + 0.5 * math.sin(step * i))
    return out


def mix(*signals):
    """Sum signals of possibly different lengths (zero-padded)."""
    length = max((len(s) for s in signals), default=0)
    out = [0.0] * length
    for s in signals:
        for i in range(len(s)):
            out[i] += s[i]
    return out


def concat(*signals):
    out = []
    for s in signals:
        out.extend(s)
    return out


def delay_mix(sig, delay_s, feedback=0.35, taps=3):
    """Simple echo/reverb-ish tail."""
    d = int(SAMPLE_RATE * delay_s)
    out = list(sig)
    if d <= 0:
        return out
    total = len(sig) + d * taps
    out = out + [0.0] * (total - len(out))
    for t in range(1, taps + 1):
        amp = feedback ** t
        shift = d * t
        for i in range(len(sig)):
            out[i + shift] += sig[i] * amp
    return out


def normalize(sig, target_db=-1.5):
    peak = max((abs(v) for v in sig), default=0.0)
    if peak == 0:
        return sig
    target = 10 ** (target_db / 20.0)
    scale = target / peak
    return [v * scale for v in sig]


def soft_clip(sig):
    """tanh-style soft clip to keep transients musical, never harsh."""
    return [math.tanh(v) for v in sig]


# ---------------------------------------------------------------------------
# WAV writer (16-bit PCM mono, matches existing assets)
# ---------------------------------------------------------------------------

def save(sig, category, name):
    sig = normalize(sig)
    path = os.path.join(OUTPUT_BASE, category, name + ".wav")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    frames = bytearray()
    for v in sig:
        s = max(-1.0, min(1.0, v))
        frames += struct.pack("<h", int(s * 32767))
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(bytes(frames))
    dur = len(sig) / SAMPLE_RATE
    print(f"  wrote {category}/{name}.wav ({dur:.2f}s)")
    return round(dur, 3)


# ---------------------------------------------------------------------------
# CARD SOUNDS
# ---------------------------------------------------------------------------

def card_shuffle():
    """Riffle shuffle: a run of short filtered-noise ticks."""
    out = []
    for k in range(11):
        tick = noise(0.028, amp=0.8, seed=1000 + k)
        tick = bandlimit_click(tick, 1800 + (k % 3) * 400)
        tick = fade(tick, 0.001, 0.02)
        gap = silence(0.018 + 0.004 * (k % 2))
        out = concat(out, tick, gap)
    out = lowpass(out, 5000)
    return fade(out, 0.01, 0.05)


def bandlimit_click(sig, cutoff):
    return highpass(lowpass(sig, cutoff), 400)


def card_deal():
    """Quick paper 'whoosh + tick': a short noise swish plus a pitched blip."""
    swish = noise(0.16, amp=0.5, seed=2001)
    swish = bandlimit_click(swish, 3500)
    swish = fade(swish, 0.01, 0.12)
    blip = sweep(520, 300, 0.12, amp=0.5, curve="exp")
    blip = adsr(blip, 0.002, 0.03, 0.4, 0.08)
    body = mix(swish, blip)
    return fade(body, 0.002, 0.05)


def card_flip():
    """A crisp 'fwip': upward blip with a noise transient."""
    tick = noise(0.02, amp=0.6, seed=2100)
    tick = bandlimit_click(tick, 4000)
    tick = fade(tick, 0.0, 0.018)
    tone = sweep(360, 720, 0.14, amp=0.5, curve="exp")
    tone = adsr(tone, 0.004, 0.02, 0.35, 0.09)
    return fade(mix(tick, tone), 0.002, 0.04)


def card_play():
    """Signature 'thwack': a low thump body + bright click transient + quick
    pitch drop. The most-played card sound, so it gets the most polish."""
    thump = sweep(220, 90, 0.16, amp=0.9, curve="exp")
    thump = adsr(thump, 0.002, 0.05, 0.3, 0.09)
    click = noise(0.02, amp=0.7, seed=2200)
    click = bandlimit_click(click, 5200)
    click = fade(click, 0.0, 0.02)
    ring = sine(440, 0.1, amp=0.25)
    ring = adsr(ring, 0.001, 0.03, 0.2, 0.06)
    body = mix(thump, click, ring)
    return soft_clip(fade(body, 0.001, 0.05))


def card_collect():
    """Cards raked in: an upward sparkle sweep with a couple of bright pings."""
    swish = noise(0.35, amp=0.35, seed=2300)
    swish = bandlimit_click(swish, 4200)
    swish = tremolo(swish, 22, 0.4)
    swish = fade(swish, 0.02, 0.2)
    sweep_up = sweep(300, 900, 0.4, amp=0.4, curve="exp")
    sweep_up = adsr(sweep_up, 0.02, 0.1, 0.6, 0.15)
    ping1 = adsr(sine(1046, 0.18, 0.3), 0.001, 0.05, 0.3, 0.12)
    ping2 = adsr(sine(1318, 0.16, 0.28), 0.001, 0.05, 0.3, 0.1)
    body = mix(swish, sweep_up, concat(silence(0.12), ping1), concat(silence(0.24), ping2))
    return fade(body, 0.01, 0.12)


def card_hover():
    """Subtle UI blip - gentle, high, short."""
    tone = sine(880, 0.09, amp=0.3)
    tone = mix(tone, sine(1320, 0.09, amp=0.12))
    tone = adsr(tone, 0.008, 0.02, 0.4, 0.05)
    return fade(tone, 0.005, 0.03)


# ---------------------------------------------------------------------------
# GAME EVENT SOUNDS
# ---------------------------------------------------------------------------

def _ping(freq, duration, amp):
    p = mix(sine(freq, duration, amp), sine(freq * 2, duration, amp * 0.25))
    return adsr(p, 0.003, 0.08, 0.5, duration * 0.5)


def round_win():
    """Bright ascending major arpeggio ding (C-E-G-C)."""
    notes = [523.25, 659.25, 783.99, 1046.5]
    out = []
    for i, f in enumerate(notes):
        out = concat(out, _ping(f, 0.16, 0.5))
    out = delay_mix(out, 0.09, feedback=0.3, taps=2)
    return fade(out, 0.005, 0.15)


def round_loss():
    """Descending 'wah-wah' two-tone let-down."""
    a = square(330, 0.28, amp=0.5)
    a = adsr(a, 0.01, 0.05, 0.6, 0.12)
    bend = sweep(330, 247, 0.3, amp=0.5, curve="exp")
    bend = adsr(bend, 0.01, 0.06, 0.5, 0.18)
    b = square(196, 0.4, amp=0.5)
    b = sweep(220, 150, 0.4, amp=0.5, curve="exp")
    b = adsr(b, 0.01, 0.08, 0.5, 0.25)
    out = concat(mix(a, bend), b)
    return fade(out, 0.01, 0.25)


def game_victory():
    """Triumphant fanfare: rising arpeggio then a held major chord stab."""
    arp = []
    for f in [392.0, 523.25, 659.25, 783.99]:
        arp = concat(arp, _ping(f, 0.14, 0.45))
    chord = mix(
        sine(523.25, 0.9, 0.35),
        sine(659.25, 0.9, 0.32),
        sine(783.99, 0.9, 0.3),
        sine(1046.5, 0.9, 0.25),
        saw(261.63, 0.9, 0.15),
    )
    chord = adsr(chord, 0.01, 0.15, 0.7, 0.5)
    sparkle = concat(silence(0.05), _ping(1568, 0.4, 0.2))
    out = concat(arp, mix(chord, sparkle))
    out = delay_mix(out, 0.11, feedback=0.3, taps=2)
    return fade(out, 0.005, 0.3)


def game_defeat():
    """Deflating descending 'doom' - low tones sliding down with a sad chord."""
    slide = sweep(196, 65, 1.4, amp=0.6, curve="exp")
    slide = adsr(slide, 0.05, 0.2, 0.6, 0.8)
    chord = mix(
        saw(130.81, 1.6, 0.3),
        saw(155.56, 1.6, 0.26),   # minor third-ish, dour
        sine(98.0, 1.6, 0.3),
    )
    chord = adsr(chord, 0.1, 0.3, 0.5, 1.0)
    out = mix(slide, chord)
    return fade(out, 0.05, 0.5)


def dry_declaration():
    """Cheeky descending square 'boing' - a playful hollow declaration."""
    boop = sweep(500, 300, 0.3, amp=0.55, curve="exp")
    # render as square-ish by adding odd harmonic partners
    third = sweep(1500, 900, 0.3, amp=0.18, curve="exp")
    fifth = sweep(2500, 1500, 0.3, amp=0.08, curve="exp")
    body = mix(boop, third, fifth)
    body = adsr(body, 0.006, 0.05, 0.6, 0.18)
    tail = concat(silence(0.18), _ping(660, 0.18, 0.25))
    return fade(mix(body, tail), 0.004, 0.12)


def show_dry_declaration():
    """Brighter reveal: ascending square + a confident sparkle (face-up show)."""
    up = sweep(420, 780, 0.34, amp=0.5, curve="exp")
    third = sweep(1260, 2340, 0.34, amp=0.16, curve="exp")
    body = mix(up, third)
    body = adsr(body, 0.006, 0.05, 0.65, 0.2)
    sparkle = concat(silence(0.2), _ping(1318, 0.24, 0.3))
    out = mix(body, sparkle)
    out = delay_mix(out, 0.07, feedback=0.25, taps=2)
    return fade(out, 0.004, 0.14)


def fire_streak():
    """FIRE STREAK - the 'on fire!' sting.

    ORIGINAL SOUNDALIKE that EVOKES an arcade announcer hype moment WITHOUT
    sampling or copying the trademarked 'He's on fire!' recording. Ingredients:
      - a hot crackle (high-passed noise, tremolo'd) = flames,
      - a rising confident sweep = the announcer's lift,
      - a bright triumphant chord stab = the payoff,
      - a short formant 'exclamation' blip (generic rising vowel-ish shape).
    No words, no pitch-contour matching of any real recording."""
    crackle = noise(1.1, amp=0.4, seed=3300)
    crackle = highpass(crackle, 1200)
    crackle = tremolo(crackle, 30, 0.6)
    crackle = fade(crackle, 0.03, 0.4)
    riser = sweep(200, 900, 0.9, amp=0.45, curve="exp")
    riser = adsr(riser, 0.05, 0.1, 0.7, 0.3)
    exclaim = formant_voice(300, 620, [(700, 1.0), (1150, 0.7), (2600, 0.4)], 0.55, amp=0.5)
    exclaim = adsr(exclaim, 0.02, 0.08, 0.7, 0.25)
    stab = mix(
        sine(659.25, 0.5, 0.3),
        sine(830.61, 0.5, 0.28),
        sine(987.77, 0.5, 0.26),
    )
    stab = adsr(stab, 0.005, 0.1, 0.6, 0.35)
    out = mix(
        crackle,
        riser,
        concat(silence(0.25), exclaim),
        concat(silence(0.55), stab),
    )
    out = delay_mix(out, 0.09, feedback=0.28, taps=2)
    return soft_clip(fade(out, 0.01, 0.3))


def freeze_effect():
    """Icy freeze: crystalline high shimmer descending with a glassy tremolo."""
    shimmer = sweep(2600, 1200, 1.0, amp=0.4, curve="exp")
    shimmer = tremolo(shimmer, 18, 0.5)
    glass = mix(
        sine(1975, 0.9, 0.2),
        sine(2637, 0.9, 0.16),
        sine(3136, 0.9, 0.12),
    )
    glass = tremolo(glass, 24, 0.4)
    glass = adsr(glass, 0.02, 0.15, 0.5, 0.5)
    body = mix(shimmer, glass)
    body = highpass(body, 900)
    out = delay_mix(body, 0.08, feedback=0.3, taps=3)
    return fade(out, 0.01, 0.35)


def invalid_move():
    """Rejection buzz.

    REPURPOSED (Ticket 10): off-suit plays are now legal (flag-policed), so this
    is NO LONGER a 'wrong suit' sound. It is the pre-leader rejection: a follower
    trying to open a trick before the leader has led. A short, firm, dissonant
    'denied' buzz - clearly negative but not harsh."""
    buzz = square(150, 0.18, amp=0.5)
    buzz2 = square(159, 0.18, amp=0.4)  # slight beating -> dissonant 'nnt'
    body = mix(buzz, buzz2)
    body = adsr(body, 0.002, 0.02, 0.8, 0.06)
    body = lowpass(body, 2200)
    # two short pulses: "nnt-nnt"
    out = concat(body, silence(0.04), gain(body, 0.85))
    return fade(out, 0.002, 0.03)


def phase_transition():
    """A swelling whoosh sweep marking a new phase."""
    up = noise(0.7, amp=0.4, seed=3600)
    up = lowpass(up, 1800)
    up = fade(up, 0.25, 0.35)
    swell = sweep(180, 500, 0.7, amp=0.3, curve="exp")
    swell = adsr(swell, 0.2, 0.1, 0.7, 0.3)
    out = mix(up, swell)
    return fade(out, 0.05, 0.25)


# ---------------------------------------------------------------------------
# EASTER-EGG: "toasty"
# ---------------------------------------------------------------------------

def toasty():
    """'TOASTY' easter-egg byte.

    ORIGINAL SOUNDALIKE: a quick, high, rising vocal-ish blip that EVOKES the
    surprise arcade shout WITHOUT sampling or reproducing the trademarked
    recording. Built from a swept formant stack (a generic rising vowel), a tiny
    noise onset and a bright tail ping. No words, no timbre/pitch matching of any
    real clip.

    Not wired into the loader yet (see AUDIO_MANIFEST.json for the intended
    trigger). Emitted as an asset so the easter-egg can be wired in later."""
    onset = noise(0.015, amp=0.4, seed=3700)
    onset = bandlimit_click(onset, 4000)
    voice = formant_voice(420, 1050, [(950, 1.0), (1700, 0.6), (3000, 0.35)], 0.4, amp=0.55, curve="exp")
    voice = adsr(voice, 0.01, 0.05, 0.7, 0.18)
    ping = concat(silence(0.32), _ping(1568, 0.16, 0.22))
    out = mix(onset, voice, ping)
    out = delay_mix(out, 0.06, feedback=0.2, taps=1)
    return fade(out, 0.004, 0.1)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

CARD_SOUNDS = {
    "card_shuffle": card_shuffle,
    "card_deal": card_deal,
    "card_flip": card_flip,
    "card_play": card_play,
    "card_collect": card_collect,
    "card_hover": card_hover,
}

GAME_EVENT_SOUNDS = {
    "round_win": round_win,
    "round_loss": round_loss,
    "game_victory": game_victory,
    "game_defeat": game_defeat,
    "dry_declaration": dry_declaration,
    "show_dry_declaration": show_dry_declaration,
    "fire_streak": fire_streak,
    "freeze_effect": freeze_effect,
    "invalid_move": invalid_move,
    "phase_transition": phase_transition,
    "toasty": toasty,
}


def main():
    print("Generating original synthesized cartoon SFX for Spar...")
    print("Card sounds:")
    for name, fn in CARD_SOUNDS.items():
        save(fn(), "cards", name)
    print("Game event sounds:")
    for name, fn in GAME_EVENT_SOUNDS.items():
        save(fn(), "game_events", name)
    print("Done. All assets are original, project-owned, commercial-use safe.")


if __name__ == "__main__":
    main()
