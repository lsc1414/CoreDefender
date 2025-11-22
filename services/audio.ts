
export class AudioSynth {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration: number, vol: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    
    // Lowpass filter for explosion punch
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
  }

  // SFX Presets
  shoot() { this.playTone(300 + Math.random()*50, 'triangle', 0.1, 0.3); }
  hit() { this.playTone(100, 'square', 0.1, 0.2); }
  crit() { this.playTone(600, 'sawtooth', 0.15, 0.3); }
  explosion() { this.playNoise(0.3, 0.5); }
  collectXP() { this.playTone(800 + Math.random()*200, 'sine', 0.1, 0.1); }
  levelUp() { 
    if(!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'square', 0.3, 0.2), i * 100);
    });
  }
  chest() {
    if(!this.ctx) return;
    [1000, 1200, 1500].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.5, 0.3), i * 150);
    });
  }
  gameOver() {
    this.playTone(100, 'sawtooth', 1.0, 0.5);
    this.playNoise(0.5, 0.5);
  }
}

export const sfx = new AudioSynth();
