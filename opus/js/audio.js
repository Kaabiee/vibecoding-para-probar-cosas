// ─── Audio System (Web Audio API) ────────────────────────────────────────────

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(type, startFreq, endFreq, duration, volume = 0.15, delay = 0) {
    if (!SaveData.settings.soundEnabled || !audioCtx) return;
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration);
}

const Audio = {
    eat() {
        playTone('sine', 400, 800, 0.08, 0.12);
    },
    eatBonus() {
        playTone('sine', 500, 900, 0.08, 0.12);
        playTone('sine', 700, 1100, 0.08, 0.12, 0.07);
    },
    gameOver() {
        playTone('sawtooth', 400, 100, 0.5, 0.1);
    },
    purchase() {
        playTone('square', 800, 1200, 0.06, 0.08);
        playTone('sine', 1200, 1600, 0.1, 0.1, 0.06);
    },
    equip() {
        playTone('square', 600, 600, 0.05, 0.08);
    },
    menuTick() {
        playTone('square', 500, 500, 0.03, 0.05);
    },
    achievement() {
        playTone('sine', 523, 523, 0.1, 0.1);
        playTone('sine', 659, 659, 0.1, 0.1, 0.1);
        playTone('sine', 784, 784, 0.15, 0.1, 0.2);
    },
    powerup() {
        playTone('triangle', 300, 900, 0.2, 0.1);
    },
};
