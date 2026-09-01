const MUTE_KEY = "cms-help-aria-muted";
const VOICE_KEY = "cms-help-aria-voice";
const CAPTIONS_KEY = "cms-help-aria-captions";
const SPEED_KEY = "cms-help-aria-speed";

export type AriaSpeedId = "slow" | "normal" | "fast" | "faster";

export type AriaPrefs = {
  voice: boolean;
  captions: boolean;
  speed: AriaSpeedId;
};

export const ARIA_SPEEDS: { id: AriaSpeedId; label: string; hint: string; rate: number }[] = [
  { id: "slow", label: "Slow", hint: "Easy to read", rate: 0.75 },
  { id: "normal", label: "Normal", hint: "Default", rate: 1 },
  { id: "fast", label: "Fast", hint: "Quicker", rate: 1.25 },
  { id: "faster", label: "Faster", hint: "Skim", rate: 1.55 },
];

const DEFAULT_PREFS: AriaPrefs = { voice: true, captions: true, speed: "normal" };

let voicesReady = false;
let followTimer: number | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speakGeneration = 0;

export type AriaSpeechHandlers = {
  onProgress?: (spoken: string, currentWord: string, fullText: string) => void;
  onEnd?: () => void;
};

function readFlag(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

function writeFlag(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value ? "1" : "0");
}

export function getAriaPrefs(): AriaPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  const storedSpeed = window.localStorage.getItem(SPEED_KEY);
  const speed = ARIA_SPEEDS.some((item) => item.id === storedSpeed)
    ? (storedSpeed as AriaSpeedId)
    : DEFAULT_PREFS.speed;

  const hasVoiceKey = window.localStorage.getItem(VOICE_KEY) !== null;
  const voice = hasVoiceKey ? readFlag(VOICE_KEY, true) : !readFlag(MUTE_KEY, false);

  return {
    voice,
    captions: readFlag(CAPTIONS_KEY, true),
    speed,
  };
}

export function setAriaPrefs(partial: Partial<AriaPrefs>): AriaPrefs {
  const next = { ...getAriaPrefs(), ...partial };
  writeFlag(VOICE_KEY, next.voice);
  writeFlag(MUTE_KEY, !next.voice);
  writeFlag(CAPTIONS_KEY, next.captions);
  if (typeof window !== "undefined") window.localStorage.setItem(SPEED_KEY, next.speed);
  return next;
}

export function getAriaRate() {
  return ARIA_SPEEDS.find((item) => item.id === getAriaPrefs().speed)?.rate ?? 1;
}

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function pickAriaVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;

  const ranked = [
    /aria/i,
    /jenny/i,
    /zira/i,
    /samantha/i,
    /google us english/i,
    /female/i,
    /hazel/i,
    /susan/i,
    /sonia/i,
  ];

  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;

  for (const pattern of ranked) {
    const match = pool.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }

  return pool[0] ?? null;
}

function clearFollowTimer() {
  if (followTimer !== null) {
    window.clearInterval(followTimer);
    followTimer = null;
  }
}

function stopSpeechEngine() {
  clearFollowTimer();
  activeUtterance = null;
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function runTimedFollow(
  text: string,
  generation: number,
  handlers?: AriaSpeechHandlers,
  options?: { emitEnd?: boolean; msPerWord?: number }
) {
  clearFollowTimer();
  const words = text.split(" ").filter(Boolean);
  let index = 0;
  const emitEnd = options?.emitEnd ?? true;
  const msPerWord = options?.msPerWord ?? Math.round(300 / getAriaRate());

  followTimer = window.setInterval(() => {
    if (generation !== speakGeneration) {
      clearFollowTimer();
      return;
    }
    index += 1;
    const spoken = words.slice(0, index).join(" ");
    handlers?.onProgress?.(spoken, words[index - 1] ?? "", text);
    if (index >= words.length) {
      clearFollowTimer();
      if (emitEnd) handlers?.onEnd?.();
    }
  }, msPerWord);
}

export function isAriaMuted() {
  return !getAriaPrefs().voice;
}

export function setAriaMuted(muted: boolean) {
  setAriaPrefs({ voice: !muted });
  if (muted) stopAriaSpeech();
}

export function stopAriaSpeech() {
  speakGeneration += 1;
  if (typeof window === "undefined") return;
  stopSpeechEngine();
}

function startUtterance(text: string, generation: number, handlers?: AriaSpeechHandlers) {
  stopSpeechEngine();

  const stillCurrent = () => generation === speakGeneration;
  const prefs = getAriaPrefs();
  const rate = getAriaRate();
  const msPerWord = Math.round(300 / rate);

  if (!prefs.voice && !prefs.captions) {
    handlers?.onProgress?.(text, "", text);
    handlers?.onEnd?.();
    return;
  }

  if (!prefs.voice || !window.speechSynthesis) {
    runTimedFollow(text, generation, handlers, { msPerWord });
    return;
  }

  const spoken = new SpeechSynthesisUtterance(text);
  spoken.rate = Math.min(2, Math.max(0.6, rate));
  spoken.pitch = 1.08;
  spoken.lang = "en-US";
  const voice = pickAriaVoice();
  if (voice) spoken.voice = voice;

  let gotBoundary = false;
  spoken.onboundary = (event) => {
    if (!stillCurrent()) return;
    if (event.name && event.name !== "word") return;
    gotBoundary = true;
    clearFollowTimer();
    const start = event.charIndex ?? 0;
    const length = "charLength" in event && typeof event.charLength === "number" ? event.charLength : 0;
    const end = length > 0 ? start + length : text.indexOf(" ", start + 1);
    const wordEnd = end === -1 ? text.length : end;
    handlers?.onProgress?.(text.slice(0, wordEnd), text.slice(start, wordEnd).trim(), text);
  };
  spoken.onend = () => {
    if (!stillCurrent()) return;
    clearFollowTimer();
    handlers?.onProgress?.(text, "", text);
    handlers?.onEnd?.();
  };
  spoken.onerror = () => {
    if (!stillCurrent()) return;
    if (!gotBoundary && prefs.captions) runTimedFollow(text, generation, handlers, { msPerWord });
    else handlers?.onEnd?.();
  };

  activeUtterance = spoken;
  window.speechSynthesis.speak(spoken);
  window.setTimeout(() => {
    if (!stillCurrent() || gotBoundary || activeUtterance !== spoken) return;
    if (prefs.captions) runTimedFollow(text, generation, handlers, { emitEnd: false, msPerWord });
  }, 700);
}

export function speakAria(text: string, handlers?: AriaSpeechHandlers) {
  if (typeof window === "undefined") return;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;

  const generation = ++speakGeneration;
  let started = false;
  const start = () => {
    if (generation !== speakGeneration || started) return;
    started = true;
    startUtterance(clean, generation, handlers);
  };

  if (!voicesReady && loadVoices().length === 0 && window.speechSynthesis) {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        voicesReady = true;
        start();
      },
      { once: true }
    );
    window.speechSynthesis.getVoices();
    window.setTimeout(start, 400);
    return;
  }

  voicesReady = true;
  start();
}

export function currentSpokenSentenceRange(fullText: string, spoken: string) {
  if (!spoken) {
    const endMatch = fullText.search(/[.!?](\s|$)/);
    const sentence = (endMatch === -1 ? fullText : fullText.slice(0, endMatch + 1)).trim();
    return { sentence, start: 0, spokenInSentence: 0 };
  }

  const index = Math.max(0, spoken.length - 1);
  const before = fullText.slice(0, index + 1);
  const startMark = Math.max(before.lastIndexOf(". "), before.lastIndexOf("! "), before.lastIndexOf("? "), 0);
  const start = startMark > 0 ? startMark + 2 : 0;
  const rest = fullText.slice(start);
  const endMatch = rest.search(/[.!?](\s|$)/);
  const sentence = (endMatch === -1 ? rest : rest.slice(0, endMatch + 1)).trim();
  return {
    sentence,
    start,
    spokenInSentence: Math.max(0, spoken.length - start),
  };
}

export type KaraokeToken = {
  part: string;
  said: boolean;
  current: boolean;
  isSpace: boolean;
};

export function karaokeTokens(text: string, spokenChars: number): KaraokeToken[] {
  const parts = text.split(/(\s+)/);
  let cursor = 0;
  return parts.map((part) => {
    const start = cursor;
    cursor += part.length;
    const isSpace = /^\s+$/.test(part);
    const said = !isSpace && spokenChars > cursor;
    const current = !isSpace && spokenChars > start && spokenChars <= cursor;
    return { part, said, current, isSpace };
  });
}
