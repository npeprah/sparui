#!/usr/bin/env python3
"""
Generate Placeholder Audio Sounds for Spar Card Game
Creates 16 placeholder sounds (OGG format) for immediate testing
These are TEMPORARY and must be replaced with quality assets before production
"""

import numpy as np
from scipy.io import wavfile
import os
import subprocess
import sys

# Configuration
SAMPLE_RATE = 44100  # 44.1kHz
OUTPUT_BASE = "frontend/public/assets/sounds/sfx"

def create_directories():
    """Create output directories if they don't exist"""
    os.makedirs(f"{OUTPUT_BASE}/cards", exist_ok=True)
    os.makedirs(f"{OUTPUT_BASE}/game_events", exist_ok=True)
    print("✓ Created directory structure")

def generate_tone(frequency, duration, amplitude=0.5):
    """Generate a sine wave tone"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    wave = amplitude * np.sin(2 * np.pi * frequency * t)
    return wave

def generate_chirp(start_freq, end_freq, duration, amplitude=0.5):
    """Generate a frequency sweep (chirp)"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    freq_sweep = np.linspace(start_freq, end_freq, len(t))
    phase = 2 * np.pi * np.cumsum(freq_sweep) / SAMPLE_RATE
    wave = amplitude * np.sin(phase)
    return wave

def generate_noise(duration, noise_type='white', amplitude=0.3):
    """Generate noise (white or pink)"""
    samples = int(SAMPLE_RATE * duration)
    if noise_type == 'white':
        wave = amplitude * np.random.randn(samples)
    elif noise_type == 'pink':
        # Simplified pink noise approximation
        white = np.random.randn(samples)
        # Apply simple low-pass filter for pink noise effect
        wave = amplitude * np.convolve(white, np.ones(10)/10, mode='same')
    return wave

def apply_fade(wave, fade_in_ms=0, fade_out_ms=0):
    """Apply fade in/out to wave"""
    fade_in_samples = int(SAMPLE_RATE * fade_in_ms / 1000)
    fade_out_samples = int(SAMPLE_RATE * fade_out_ms / 1000)

    if fade_in_samples > 0:
        fade_in = np.linspace(0, 1, fade_in_samples)
        wave[:fade_in_samples] *= fade_in

    if fade_out_samples > 0:
        fade_out = np.linspace(1, 0, fade_out_samples)
        wave[-fade_out_samples:] *= fade_out

    return wave

def apply_low_pass(wave, cutoff_freq=3000):
    """Simple low-pass filter approximation"""
    from scipy import signal
    b, a = signal.butter(4, cutoff_freq / (SAMPLE_RATE / 2), btype='low')
    return signal.filtfilt(b, a, wave)

def apply_high_pass(wave, cutoff_freq=500):
    """Simple high-pass filter approximation"""
    from scipy import signal
    b, a = signal.butter(4, cutoff_freq / (SAMPLE_RATE / 2), btype='high')
    return signal.filtfilt(b, a, wave)

def normalize(wave, target_db=-3):
    """Normalize audio to target dB"""
    peak = np.max(np.abs(wave))
    if peak > 0:
        target_amplitude = 10 ** (target_db / 20)
        wave = wave * (target_amplitude / peak)
    return wave

def save_sound(wave, filename, category):
    """Save wave to WAV and convert to OGG"""
    # Ensure wave is in int16 range
    wave = normalize(wave)
    wave_int16 = (wave * 32767).astype(np.int16)

    # Save as WAV first
    wav_path = f"{OUTPUT_BASE}/{category}/{filename}.wav"
    wavfile.write(wav_path, SAMPLE_RATE, wave_int16)

    # Convert to OGG using ffmpeg if available
    ogg_path = f"{OUTPUT_BASE}/{category}/{filename}.ogg"
    try:
        subprocess.run([
            'ffmpeg', '-i', wav_path, '-acodec', 'libvorbis',
            '-q:a', '7', ogg_path, '-y'
        ], capture_output=True, check=True)
        os.remove(wav_path)  # Remove WAV after conversion
        print(f"  ✓ {filename}.ogg")
    except (subprocess.CalledProcessError, FileNotFoundError):
        # ffmpeg not available, keep WAV
        print(f"  ✓ {filename}.wav (ffmpeg not found, using WAV)")

# ============================================================================
# CARD SOUNDS
# ============================================================================

def generate_card_shuffle():
    """1. Card shuffle - white noise with low-pass filter"""
    wave = generate_noise(1.5, 'white', 0.3)
    wave = apply_low_pass(wave, 3000)
    wave = apply_fade(wave, fade_in_ms=200, fade_out_ms=300)
    save_sound(wave, 'card_shuffle', 'cards')

def generate_card_deal():
    """2. Card deal - tone with pitch slide down"""
    wave = generate_chirp(400, 320, 0.5, 0.4)  # 400 Hz to 80% = ~320 Hz
    wave = apply_fade(wave, fade_out_ms=150)
    save_sound(wave, 'card_deal', 'cards')

def generate_card_flip():
    """3. Card flip - short tone with pitch change"""
    wave = generate_tone(600, 0.3, 0.5)
    wave = apply_fade(wave, fade_in_ms=10, fade_out_ms=100)
    save_sound(wave, 'card_flip', 'cards')

def generate_card_play():
    """4. Card play - signature sound (MOST IMPORTANT)"""
    wave = generate_tone(300, 0.4, 0.6)
    wave = apply_fade(wave, fade_out_ms=150)
    save_sound(wave, 'card_play', 'cards')

def generate_card_collect():
    """5. Card collect - upward chirp"""
    wave = generate_chirp(400, 800, 0.7, 0.5)
    wave = apply_fade(wave, fade_in_ms=50, fade_out_ms=200)
    save_sound(wave, 'card_collect', 'cards')

def generate_card_hover():
    """6. Card hover - subtle high tone"""
    wave = generate_tone(523, 0.15, 0.2)  # C5 note
    wave = apply_fade(wave, fade_in_ms=40, fade_out_ms=80)
    save_sound(wave, 'card_hover', 'cards')

# ============================================================================
# GAME EVENT SOUNDS
# ============================================================================

def generate_round_win():
    """7. Round win - upward chirp with reverb effect"""
    wave = generate_chirp(300, 600, 1.2, 0.5)
    # Simple reverb approximation: mix with delayed/attenuated version
    delay_samples = int(SAMPLE_RATE * 0.05)  # 50ms delay
    delayed = np.pad(wave, (delay_samples, 0), mode='constant')[:-delay_samples]
    wave = wave + 0.3 * delayed
    save_sound(wave, 'round_win', 'game_events')

def generate_round_loss():
    """8. Round loss - downward chirp"""
    wave = generate_chirp(300, 150, 1.2, 0.5)
    wave = apply_fade(wave, fade_out_ms=400)
    save_sound(wave, 'round_loss', 'game_events')

def generate_game_victory():
    """9. Game victory - big upward sweep (CLIMACTIC)"""
    wave = generate_chirp(200, 800, 2.5, 0.7)
    # Add reverb effect
    delay_samples = int(SAMPLE_RATE * 0.08)
    delayed = np.pad(wave, (delay_samples, 0), mode='constant')[:-delay_samples]
    wave = wave + 0.4 * delayed
    save_sound(wave, 'game_victory', 'game_events')

def generate_game_defeat():
    """10. Game defeat - low sustained tone"""
    wave = generate_tone(150, 2.0, 0.6)
    wave = apply_fade(wave, fade_in_ms=300, fade_out_ms=800)
    save_sound(wave, 'game_defeat', 'game_events')

def generate_dry_declaration():
    """11. Dry declaration - square-ish wave"""
    # Approximate square wave with harmonics
    wave = generate_tone(400, 0.8, 0.5)
    wave += 0.33 * generate_tone(1200, 0.8, 0.5)  # Add 3rd harmonic
    wave = apply_fade(wave, fade_out_ms=200)
    save_sound(wave, 'dry_declaration', 'game_events')

def generate_show_dry_declaration():
    """12. Show dry declaration - square-ish wave with reverb"""
    wave = generate_tone(500, 1.0, 0.6)
    wave += 0.33 * generate_tone(1500, 1.0, 0.6)
    # Add reverb
    delay_samples = int(SAMPLE_RATE * 0.06)
    delayed = np.pad(wave, (delay_samples, 0), mode='constant')[:-delay_samples]
    wave = wave + 0.4 * delayed
    wave = apply_fade(wave, fade_out_ms=400)
    save_sound(wave, 'show_dry_declaration', 'game_events')

def generate_fire_streak():
    """13. Fire streak - rising pink noise"""
    wave = generate_noise(1.5, 'pink', 0.4)
    wave = apply_high_pass(wave, 500)
    # Simulate pitch rise by modulating amplitude
    t = np.linspace(1, 1.5, len(wave))
    wave = wave * t
    save_sound(wave, 'fire_streak', 'game_events')

def generate_freeze_effect():
    """14. Freeze effect - falling high tone"""
    wave = generate_chirp(2000, 1000, 1.2, 0.5)  # Falls to 50%
    # Add reverb
    delay_samples = int(SAMPLE_RATE * 0.06)
    delayed = np.pad(wave, (delay_samples, 0), mode='constant')[:-delay_samples]
    wave = wave + 0.6 * delayed
    save_sound(wave, 'freeze_effect', 'game_events')

def generate_invalid_move():
    """15. Invalid move - gentle downward tone"""
    wave = generate_chirp(300, 210, 0.3, 0.4)  # Falls to 70%
    wave = apply_fade(wave, fade_out_ms=100)
    save_sound(wave, 'invalid_move', 'game_events')

def generate_phase_transition():
    """16. Phase transition - filtered white noise"""
    wave = generate_noise(1.0, 'white', 0.3)
    wave = apply_low_pass(wave, 2000)
    wave = apply_fade(wave, fade_in_ms=200, fade_out_ms=300)
    save_sound(wave, 'phase_transition', 'game_events')

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("\n🎵 Generating Placeholder Audio Sounds for Spar\n")
    print("=" * 60)

    # Create directories
    create_directories()

    print("\n📁 PART 1: Card Sounds (6 sounds)")
    print("-" * 60)
    generate_card_shuffle()
    generate_card_deal()
    generate_card_flip()
    generate_card_play()
    generate_card_collect()
    generate_card_hover()

    print("\n📁 PART 2: Game Event Sounds (10 sounds)")
    print("-" * 60)
    generate_round_win()
    generate_round_loss()
    generate_game_victory()
    generate_game_defeat()
    generate_dry_declaration()
    generate_show_dry_declaration()
    generate_fire_streak()
    generate_freeze_effect()
    generate_invalid_move()
    generate_phase_transition()

    print("\n" + "=" * 60)
    print("✅ ALL PLACEHOLDER SOUNDS GENERATED!")
    print("=" * 60)

    print("\n📍 Location: frontend/public/assets/sounds/sfx/")
    print("   ├── cards/ (6 sounds)")
    print("   └── game_events/ (10 sounds)")

    print("\n⚠️  IMPORTANT: These are PLACEHOLDER sounds for testing only!")
    print("   Must be replaced with quality assets before production.")
    print("\n📖 Next: See AUDIO_INTEGRATION_GUIDE.md for frontend integration")
    print("\n")

if __name__ == "__main__":
    try:
        main()
    except ImportError as e:
        print(f"\n❌ Error: Missing required library: {e}")
        print("\n💡 Install with: pip3 install numpy scipy")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
