// Web Audio API — Procedurally generated SFX
// No audio files needed — pure synthesis

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio not available:', e);
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  // ---- SFX Generators ----

  playIntro() {
    if (!this.initialized) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Brass-like synth parameters
    const playNote = (freq, time, dur) => {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc2.type = 'square';
      
      osc.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 0.5, time); // sub-octave

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.05); // quick attack
      gain.gain.linearRampToValueAtTime(0.1, time + dur * 0.8);
      gain.gain.linearRampToValueAtTime(0, time + dur); // release

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(time);
      osc2.start(time);
      osc.stop(time + dur + 0.1);
      osc2.stop(time + dur + 0.1);
    };

    // The classic Avengers Theme (da ... da da da da ... da ... daaa)
    // Notes: G4, G4, A4, C5, B4, G4, E4
    const G4 = 392.00;
    const A4 = 440.00;
    const B4 = 493.88;
    const C5 = 523.25;
    const E4 = 329.63;

    playNote(G4, t + 0.1, 0.4); // da
    
    playNote(G4, t + 1.2, 0.2); // da
    playNote(A4, t + 1.45, 0.2); // da
    playNote(C5, t + 1.7, 0.2); // da
    playNote(B4, t + 1.95, 0.4); // da
    
    playNote(G4, t + 2.5, 0.4); // da
    playNote(E4, t + 3.0, 1.2); // ovv (long)

    // Impact hit at end
    setTimeout(() => this.playImpact(), 3000);
  }

  playCharacterSelect(characterId) {
    if (!this.initialized) return;
    this.resume();
    const configs = {
      ironman: { freq: 440, type: 'sawtooth', dur: 0.3 },
      spiderman: { freq: 330, type: 'square', dur: 0.25 },
      thor: { freq: 220, type: 'sine', dur: 0.5 },
      venom: { freq: 80, type: 'sawtooth', dur: 0.6 },
    };
    const c = configs[characterId] || configs.ironman;
    this._tone(c.freq, c.type, 0.15, c.dur);
  }

  playDwellTick() {
    if (!this.initialized) return;
    this._tone(880, 'sine', 0.05, 0.05);
  }

  playPinchConfirm() {
    if (!this.initialized) return;
    this.resume();
    [440, 554, 659].forEach((f, i) => {
      setTimeout(() => this._tone(f, 'sine', 0.2, 0.15), i * 80);
    });
  }

  playLoadingTransition(characterId) {
    if (!this.initialized) return;
    this.resume();
    const t = this.ctx.currentTime;

    if (characterId === 'ironman') {
      // Tech boot-up sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 2);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 2.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 2.3);
    } else if (characterId === 'thor') {
      // Thunder rumble
      this._noise(0.3, 0.5);
      setTimeout(() => this._noise(0.4, 0.8), 500);
    } else if (characterId === 'venom') {
      // Low growl
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.setValueAtTime(40, t + 1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0, t + 2.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 2.6);
    } else {
      // Spider-Man: web thwip
      [600, 400, 600].forEach((f, i) => {
        setTimeout(() => this._tone(f, 'square', 0.15, 0.1), i * 150);
      });
    }
  }

  playSuitPieceSnap() {
    if (!this.initialized) return;
    this._tone(660, 'sine', 0.18, 0.12);
    setTimeout(() => this._noise(0.1, 0.08), 50);
  }

  playImpact() {
    if (!this.initialized) return;
    this.resume();
    this._noise(0.5, 0.3);
    this._tone(120, 'sine', 0.3, 0.25);
  }

  playPowerActivate(characterId) {
    if (!this.initialized) return;
    this.resume();
    if (characterId === 'ironman') {
      // Repulsor charge
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.7);
    } else if (characterId === 'thor') {
      this._noise(0.6, 0.8);
      [110, 220, 330, 440].forEach((f, i) => {
        setTimeout(() => this._tone(f, 'sawtooth', 0.2, 0.1), i * 60);
      });
    } else if (characterId === 'venom') {
      this._noise(0.4, 0.6);
      this._tone(50, 'sawtooth', 0.4, 0.8);
    } else {
      // Spider web thwip
      [800, 500, 800].forEach((f, i) => {
        setTimeout(() => this._tone(f, 'square', 0.2, 0.08), i * 100);
      });
    }
  }

  playIdleAmbient(characterId) {
    // Subtle ambient tick per character
    if (!this.initialized) return;
    if (characterId === 'ironman') this._tone(880, 'sine', 0.03, 0.05);
    else if (characterId === 'thor') this._tone(220, 'sine', 0.04, 0.1);
    else if (characterId === 'venom') this._tone(60, 'sawtooth', 0.04, 0.15);
  }

  // ---- Helpers ----

  _tone(freq, type, gainVal, duration) {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  _noise(gainVal, duration) {
    if (!this.initialized) return;
    const bufSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    source.buffer = buffer;
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    source.stop(this.ctx.currentTime + duration + 0.01);
  }
}

export const audioManager = new AudioManager();
