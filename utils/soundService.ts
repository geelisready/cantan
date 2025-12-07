
import { SoundEffectType } from "../types";

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioCtx) {
        // @ts-ignore - Handle older webkit prefix if needed
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    return audioCtx;
};

// Helper to play a tone
const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, volume = 0.1) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
};

const playNoise = (duration: number) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
};

export const playSound = (effect: SoundEffectType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ensure context is running (browser policy often suspends it until interaction)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const now = ctx.currentTime;

    switch (effect) {
        case 'START':
            // Major Arpeggio
            playTone(261.63, 'sine', 0.2, now); // C4
            playTone(329.63, 'sine', 0.2, now + 0.1); // E4
            playTone(392.00, 'sine', 0.4, now + 0.2); // G4
            break;

        case 'DICE':
            // Dice rattle noise
            playNoise(0.1);
            setTimeout(() => playNoise(0.1), 80);
            setTimeout(() => playNoise(0.15), 160);
            break;

        case 'COIN':
            // High ping for getting resources
            playTone(880, 'sine', 0.1, now, 0.05);
            playTone(1760, 'sine', 0.3, now + 0.05, 0.05);
            break;

        case 'BUILD':
            // Construction 'clack' or 'hammer'
            playTone(150, 'square', 0.1, now, 0.1);
            playTone(100, 'square', 0.1, now + 0.05, 0.1);
            break;

        case 'ROBBER':
            // Low alarm/drone
            playTone(100, 'sawtooth', 0.4, now, 0.1);
            playTone(80, 'sawtooth', 0.4, now + 0.2, 0.1);
            break;

        case 'STEAL':
            // Quick slide
            {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(300, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            }
            break;

        case 'TRADE':
            // Cash register / Chime
            playTone(523.25, 'sine', 0.1, now);
            playTone(659.25, 'sine', 0.2, now + 0.1);
            break;

        case 'END_TURN':
            // Descending tone 'bloop-bloop'
            playTone(392.00, 'triangle', 0.15, now); // G4
            playTone(261.63, 'triangle', 0.3, now + 0.15); // C4
            break;

        case 'PLAY_CARD':
            // Quick 'Shwip' / Sparkle
            playTone(1000, 'sine', 0.1, now, 0.05);
            playTone(2000, 'sine', 0.2, now + 0.05, 0.05);
            break;

        case 'ERROR':
            // Low buzz/thud
            playTone(120, 'sawtooth', 0.15, now, 0.1);
            playTone(100, 'sawtooth', 0.2, now + 0.05, 0.1);
            break;

        case 'CLICK':
            // Very short high pip
            playTone(1200, 'sine', 0.05, now, 0.02);
            break;
    }
};
