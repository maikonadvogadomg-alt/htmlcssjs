export interface TTSConfig {
  enabled: boolean;
  lang: string;
  rate: number;
  pitch: number;
  voiceName: string;
}

const DEFAULT_CONFIG: TTSConfig = {
  enabled: true,
  lang: "pt-BR",
  rate: 1.15,
  pitch: 0.95,
  voiceName: "",
};

const PT_BR_VOICE_PRIORITY = [
  "francisca",
  "francisc",
  "luciana",
  "google português do brasil",
  "google português",
  "google pt",
  "portuguese brazil",
  "brazil",
  "pt-br",
  "pt_br",
];

export function loadTTSConfig(): TTSConfig {
  try {
    const saved = localStorage.getItem("tts-config");
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveTTSConfig(config: TTSConfig) {
  localStorage.setItem("tts-config", JSON.stringify(config));
}

export function getAvailableVoices(lang: string): SpeechSynthesisVoice[] {
  if (!window.speechSynthesis) return [];
  const langBase = lang.split("-")[0].toLowerCase();
  return window.speechSynthesis
    .getVoices()
    .filter(v =>
      v.lang.toLowerCase().startsWith(langBase) ||
      v.lang.toLowerCase() === lang.toLowerCase()
    );
}

function selectBestVoice(voices: SpeechSynthesisVoice[], config: TTSConfig): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (config.voiceName) {
    const byName = voices.find(v => v.name === config.voiceName);
    if (byName) return byName;
  }
  for (const keyword of PT_BR_VOICE_PRIORITY) {
    const found = voices.find(v =>
      v.name.toLowerCase().includes(keyword) ||
      v.lang.toLowerCase().includes(keyword)
    );
    if (found) return found;
  }
  return voices[0] || null;
}

let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

function startKeepalive() {
  if (keepaliveTimer) return;
  keepaliveTimer = setInterval(() => {
    if (window.speechSynthesis?.speaking && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else if (!window.speechSynthesis?.speaking) {
      stopKeepalive();
    }
  }, 5000);
}

function stopKeepalive() {
  if (keepaliveTimer) { clearInterval(keepaliveTimer); keepaliveTimer = null; }
}

function doSpeak(text: string, config: TTSConfig) {
  if (!window.speechSynthesis) return;

  const limited = text.length > 250 ? text.substring(0, 250) + "..." : text;

  const utterance = new SpeechSynthesisUtterance(limited);
  utterance.lang = config.lang;
  utterance.rate = config.rate;
  utterance.pitch = config.pitch;

  const voices = window.speechSynthesis.getVoices();
  const best = selectBestVoice(voices, config);
  if (best) utterance.voice = best;

  utterance.onstart = () => startKeepalive();
  utterance.onend   = () => stopKeepalive();
  utterance.onerror = () => stopKeepalive();

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();

  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 100);
}

export function speak(text: string, config: TTSConfig): void {
  if (!config.enabled || !window.speechSynthesis || !text.trim()) return;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(text, config);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak(text, config);
    };
    // Fallback — trigger load
    window.speechSynthesis.getVoices();
  }
}

export function stopSpeaking() {
  stopKeepalive();
  window.speechSynthesis?.cancel();
}

export function startSpeechRecognition(
  lang: string,
  onResult: (text: string) => void,
  onEnd: () => void
): { stop: () => void } | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onend = onEnd;
  recognition.onerror = () => onEnd();
  recognition.start();

  return { stop: () => recognition.stop() };
}
