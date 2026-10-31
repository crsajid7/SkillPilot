// Browser SpeechRecognition interface declaration
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export class SpeechHandler {
  private recognition: any = null;
  private isListening = false;
  private onTranscript: (text: string, isFinal: boolean) => void;
  private onError: (errorMsg: string) => void;
  private onStateChange: (listening: boolean) => void;

  constructor(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError: (errorMsg: string) => void,
    onStateChange: (listening: boolean) => void
  ) {
    this.onTranscript = onTranscript;
    this.onError = onError;
    this.onStateChange = onStateChange;

    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindow;
      const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechConstructor) {
        this.recognition = new SpeechConstructor();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStateChange(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onStateChange(false);
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          this.onStateChange(false);
          const error = event.error || 'Speech recognition encountered an issue.';
          if (error !== 'no-speech') {
            this.onError(`Microphone error: ${error}`);
          }
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            this.onTranscript(finalTranscript, true);
          } else if (interimTranscript) {
            this.onTranscript(interimTranscript, false);
          }
        };
      }
    }
  }

  public start() {
    if (!this.recognition) {
      this.onError('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }
    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (e: any) {
      console.warn('SpeechRecognition start error:', e);
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (e: any) {
      console.warn('SpeechRecognition stop error:', e);
    }
  }

  public toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getListeningState(): boolean {
    return this.isListening;
  }
}
