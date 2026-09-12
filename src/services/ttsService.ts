export interface TTSVoiceOption {
  name: string;
  lang: string;
  isDefault: boolean;
  voiceURI: string;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private isPausedState: boolean = false;
  private currentSentenceIndex: number = 0;
  private sentences: string[] = [];
  private onSentenceChangeCallbacks: ((sentence: string, index: number) => void)[] = [];
  private onStateChangeCallbacks: ((isPlaying: boolean, isPaused: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return Boolean(this.synth);
  }

  public getVoices(): TTSVoiceOption[] {
    if (!this.synth) return [];
    return this.synth.getVoices().map((v) => ({
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      voiceURI: v.voiceURI,
    }));
  }

  public speakText(
    fullText: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
    } = {}
  ) {
    if (!this.synth) return;

    this.stop();

    // Split text into meaningful sentences for rhythmic speech
    this.sentences = fullText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (this.sentences.length === 0) return;

    this.currentSentenceIndex = 0;
    this.speakCurrentSentence(options);
  }

  private speakCurrentSentence(options: { rate?: number; pitch?: number; voiceName?: string } = {}) {
    if (!this.synth || this.currentSentenceIndex >= this.sentences.length) {
      this.stop();
      return;
    }

    const currentSentence = this.sentences[this.currentSentenceIndex];
    this.utterance = new SpeechSynthesisUtterance(currentSentence);
    this.utterance.rate = options.rate || 1.0;
    this.utterance.pitch = options.pitch || 1.0;

    if (options.voiceName) {
      const found = this.synth.getVoices().find((v) => v.name === options.voiceName);
      if (found) this.utterance.voice = found;
    }

    this.utterance.onstart = () => {
      this.isSpeakingState = true;
      this.isPausedState = false;
      this.notifyState();
      this.onSentenceChangeCallbacks.forEach((cb) => cb(currentSentence, this.currentSentenceIndex));
    };

    this.utterance.onend = () => {
      this.currentSentenceIndex++;
      if (this.currentSentenceIndex < this.sentences.length && this.isSpeakingState && !this.isPausedState) {
        this.speakCurrentSentence(options);
      } else {
        this.stop();
      }
    };

    this.utterance.onerror = () => {
      this.stop();
    };

    this.synth.speak(this.utterance);
  }

  public pause() {
    if (!this.synth) return;
    this.synth.pause();
    this.isPausedState = true;
    this.notifyState();
  }

  public resume() {
    if (!this.synth) return;
    this.synth.resume();
    this.isPausedState = false;
    this.notifyState();
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isSpeakingState = false;
    this.isPausedState = false;
    this.currentSentenceIndex = 0;
    this.notifyState();
  }

  public onSentenceChange(callback: (sentence: string, index: number) => void) {
    this.onSentenceChangeCallbacks.push(callback);
    return () => {
      this.onSentenceChangeCallbacks = this.onSentenceChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onStateChange(callback: (isPlaying: boolean, isPaused: boolean) => void) {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyState() {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.isSpeakingState, this.isPausedState));
  }

  public isPlaying(): boolean {
    return this.isSpeakingState && !this.isPausedState;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }
}

export const ttsService = new TTSService();
