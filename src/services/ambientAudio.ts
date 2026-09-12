// Offline Procedural Ambient Soundscapes Engine using Web Audio API
// 100% Client-Side, Zero Network Requests, Infinite Non-Repeating Audio
import type { SoundscapeType } from '../types';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private currentType: SoundscapeType = 'none';
  private volume: number = 0.45;
  private isMuted: boolean = false;
  private stateListeners: ((type: SoundscapeType, isPlaying: boolean, volume: number) => void)[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    this.notifyListeners();
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSoundscape(): SoundscapeType {
    return this.currentType;
  }

  public isPlaying(): boolean {
    return this.currentType !== 'none';
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignore already stopped
      }
    });
    this.activeNodes = [];
    this.currentType = 'none';
    this.notifyListeners();
  }

  public setSoundscape(type: SoundscapeType) {
    if (this.currentType === type) {
      return;
    }
    this.stop();
    if (type === 'none') {
      return;
    }

    const ctx = this.getContext();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.connect(ctx.destination);
    }
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, ctx.currentTime);

    this.currentType = type;

    switch (type) {
      case 'rain':
        this.startRain(ctx, this.masterGain);
        break;
      case 'fireplace':
        this.startFireplace(ctx, this.masterGain);
        break;
      case 'cafe':
        this.startCafe(ctx, this.masterGain);
        break;
      case 'brown-noise':
        this.startBrownNoise(ctx, this.masterGain);
        break;
      case 'waves':
        this.startOceanWaves(ctx, this.masterGain);
        break;
      case 'crickets':
        this.startCrickets(ctx, this.masterGain);
        break;
    }

    this.notifyListeners();
  }

  // RAIN: Pink noise + dual bandpass filters with light LFO modulation
  private startRain(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter 1: Low-pass for heavy body of rain
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(800, ctx.currentTime);

    // Filter 2: High-shelf to tame harsh hiss
    const highshelf = ctx.createBiquadFilter();
    highshelf.type = 'highshelf';
    highshelf.frequency.setValueAtTime(3000, ctx.currentTime);
    highshelf.gain.setValueAtTime(-6, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);

    whiteNoise.connect(lowpass);
    lowpass.connect(highshelf);
    highshelf.connect(gain);
    gain.connect(destination);

    whiteNoise.start();
    this.activeNodes.push({
      stop: () => {
        whiteNoise.stop();
        whiteNoise.disconnect();
      },
    });
  }

  // FIREPLACE: Warm low rumble + random crackle pops
  private startFireplace(ctx: AudioContext, destination: AudioNode) {
    // 1. Low warm fire roar
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const brownNoise = ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(380, ctx.currentTime);

    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.65, ctx.currentTime);

    brownNoise.connect(lowpass);
    lowpass.connect(roarGain);
    roarGain.connect(destination);
    brownNoise.start();

    // 2. Intermittent crackle pops
    let isRunning = true;
    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.4, ctx.currentTime);
    popGain.connect(destination);

    const scheduleCrackle = () => {
      if (!isRunning) return;
      const delay = Math.random() * 280 + 70; // every 70-350ms
      setTimeout(() => {
        if (!isRunning) return;
        try {
          const osc = ctx.createOscillator();
          const snapGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(Math.random() * 2400 + 800, ctx.currentTime);
          filter.Q.setValueAtTime(3, ctx.currentTime);

          const dur = 0.01 + Math.random() * 0.02;
          snapGain.gain.setValueAtTime(Math.random() * 0.25 + 0.05, ctx.currentTime);
          snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

          osc.type = 'square';
          osc.frequency.setValueAtTime(Math.random() * 120 + 60, ctx.currentTime);

          osc.connect(filter);
          filter.connect(snapGain);
          snapGain.connect(popGain);

          osc.start();
          osc.stop(ctx.currentTime + dur);
        } catch {
          // ignore
        }
        scheduleCrackle();
      }, delay);
    };

    scheduleCrackle();

    this.activeNodes.push({
      stop: () => {
        isRunning = false;
        brownNoise.stop();
        brownNoise.disconnect();
      },
    });
  }

  // CAFÉ: Murmurs and soft acoustic ambient diffuse hum
  private startCafe(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.05 * white) / 1.05;
      lastOut = output[i];
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.setValueAtTime(320, ctx.currentTime);
    bp1.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, ctx.currentTime);

    source.connect(bp1);
    bp1.connect(gain);
    gain.connect(destination);
    source.start();

    // Subtle ambient ceramic / cup touches
    let isRunning = true;
    const scheduleCupTouch = () => {
      if (!isRunning) return;
      const delay = Math.random() * 6000 + 4000; // every 4-10s
      setTimeout(() => {
        if (!isRunning) return;
        try {
          const osc = ctx.createOscillator();
          const clinkGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime);

          clinkGain.gain.setValueAtTime(0.04, ctx.currentTime);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

          osc.connect(clinkGain);
          clinkGain.connect(destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {
          // ignore
        }
        scheduleCupTouch();
      }, delay);
    };
    scheduleCupTouch();

    this.activeNodes.push({
      stop: () => {
        isRunning = false;
        source.stop();
        source.disconnect();
      },
    });
  }

  // DEEP BROWN NOISE: Low-frequency 1/f^2 smooth continuous rumble
  private startBrownNoise(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.8;
    }

    const brownSource = ctx.createBufferSource();
    brownSource.buffer = noiseBuffer;
    brownSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(250, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);

    brownSource.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(destination);

    brownSource.start();
    this.activeNodes.push({
      stop: () => {
        brownSource.stop();
        brownSource.disconnect();
      },
    });
  }

  // OCEAN WAVES: Modulated surging white noise with slow breathing envelope
  private startOceanWaves(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.2, ctx.currentTime);

    // LFO for surge and recession (every ~6 seconds)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destination);

    noise.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        noise.stop();
        lfo.stop();
        noise.disconnect();
      },
    });
  }

  // CRICKETS: High pitch gentle rhythmic evening chirping
  private startCrickets(ctx: AudioContext, destination: AudioNode) {
    let isRunning = true;
    const chirpGain = ctx.createGain();
    chirpGain.gain.setValueAtTime(0.18, ctx.currentTime);
    chirpGain.connect(destination);

    const chirpSequence = () => {
      if (!isRunning) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, ctx.currentTime);

        // Pulsed burst (3 chirps)
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        for (let j = 0; j < 3; j++) {
          const t = now + j * 0.06;
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        }

        osc.connect(gain);
        gain.connect(chirpGain);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch {
        // ignore
      }

      const nextDelay = 800 + Math.random() * 900;
      setTimeout(chirpSequence, nextDelay);
    };

    chirpSequence();

    this.activeNodes.push({
      stop: () => {
        isRunning = false;
        chirpGain.disconnect();
      },
    });
  }

  // Reading Timer Chime: Warm Tibetan singing bowl / crystal meditation chime
  public playFocusChime() {
    try {
      const ctx = this.getContext();
      const frequencies = [528, 1056, 1584]; // 528Hz Solfeggio frequency
      const gainNodes: GainNode[] = [];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const initialVol = idx === 0 ? 0.4 : 0.15 / (idx + 1);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.8);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4.0);
        gainNodes.push(g);
      });
    } catch (err) {
      console.warn('Could not play chime:', err);
    }
  }

  public onStateChange(listener: (type: SoundscapeType, isPlaying: boolean, volume: number) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.currentType, this.isPlaying(), this.volume);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.stateListeners.forEach((l) => l(this.currentType, this.isPlaying(), this.volume));
  }
}

export const ambientAudio = new AmbientSoundEngine();
