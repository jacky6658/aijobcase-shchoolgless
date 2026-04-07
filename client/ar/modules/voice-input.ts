/**
 * voice-input.ts - Web Speech API with 30-second limit
 */

const MAX_DURATION = 30; // seconds

export class VoiceInput {
  private recognition: any = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private isActive = false;
  private onResult: (text: string) => void;
  private onStateChange: (listening: boolean, countdown: number) => void;

  constructor(
    onResult: (text: string) => void,
    onStateChange: (listening: boolean, countdown: number) => void
  ) {
    this.onResult = onResult;
    this.onStateChange = onStateChange;
  }

  isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  start() {
    if (this.isActive) { this.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'zh-TW';
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = '';
    let remaining = MAX_DURATION;

    recognition.onstart = () => {
      this.isActive = true;
      this.onStateChange(true, remaining);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
    };

    recognition.onend = () => {
      this.cleanup();
      const text = finalTranscript.trim();
      if (text) this.onResult(text);
    };

    recognition.onerror = () => {
      this.cleanup();
    };

    this.recognition = recognition;
    recognition.start();

    // 30-second countdown
    this.countdownInterval = setInterval(() => {
      remaining--;
      this.onStateChange(true, remaining);
      if (remaining <= 0) this.stop();
    }, 1000);

    // Hard stop at 30s
    this.timer = setTimeout(() => this.stop(), MAX_DURATION * 1000);
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private cleanup() {
    this.isActive = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    this.onStateChange(false, MAX_DURATION);
    this.recognition = null;
  }
}
