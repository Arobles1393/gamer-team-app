// Sonidos de notificación generados con Web Audio (sin archivos de audio):
// - "message": blip digital (chat 1:1 y chat del grupo)
// - "default": campanita (el resto)
// La preferencia de silencio vale para este navegador (localStorage); sin
// almacenamiento disponible, el sonido queda activado.

const STORAGE_KEY = "gm-notification-sound";
const MASTER_GAIN = 0.2;

let audioContext = null;
const listeners = new Set();

const readEnabled = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

let enabled = readEnabled();

export const isNotificationSoundEnabled = () => enabled;

export const setNotificationSoundEnabled = (value) => {
  enabled = Boolean(value);
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Sin almacenamiento: vale solo para esta visita
  }
  listeners.forEach((listener) => listener(enabled));
};

export const subscribeToNotificationSound = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getContext = () => {
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
};

// Los navegadores no dejan sonar audio hasta que la persona interactúa con la
// página: el contexto se crea y se reanuda en el primer clic o tecla
export const unlockNotificationSound = () => {
  const context = getContext();
  if (context?.state === "suspended") {
    context.resume().catch(() => {});
  }
};

// Un tono con ataque de 12 ms y caída exponencial; freqEnd hace un barrido
const playTone = (context, destination, { type, freq, start, duration, peak, freqEnd }) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  if (freqEnd) {
    oscillator.frequency.exponentialRampToValueAtTime(freqEnd, start + duration * 0.6);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
};

const playBlip = (context, destination) => {
  const t = context.currentTime;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2600;
  filter.connect(destination);

  playTone(context, filter, { type: "square", freq: 520, freqEnd: 1040, start: t, duration: 0.11, peak: 0.35 });
  playTone(context, filter, { type: "square", freq: 1040, freqEnd: 1320, start: t + 0.1, duration: 0.1, peak: 0.25 });
};

const playBell = (context, destination) => {
  const t = context.currentTime;
  playTone(context, destination, { type: "sine", freq: 1046.5, start: t, duration: 0.6, peak: 0.7 });
  playTone(context, destination, { type: "sine", freq: 2093, start: t, duration: 0.4, peak: 0.25 });
  playTone(context, destination, { type: "sine", freq: 3136, start: t, duration: 0.25, peak: 0.12 });
  playTone(context, destination, { type: "sine", freq: 1569.98, start: t + 0.06, duration: 0.5, peak: 0.35 });
};

const playSound = (context, kind) => {
  const master = context.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(context.destination);

  if (kind === "message") {
    playBlip(context, master);
  } else {
    playBell(context, master);
  }
};

// kind: "message" | "default". No hace nada si está silenciado o si el
// navegador todavía no permite audio (sin interacción previa)
export const playNotificationSound = (kind = "default") => {
  if (!enabled) return;

  const context = getContext();
  if (!context || context.state !== "running") return;

  playSound(context, kind);
};

// Vista previa desde el perfil: suena aunque esté silenciado (viene de un
// clic, así que el navegador ya permite el audio)
export const previewNotificationSound = (kind = "default") => {
  const context = getContext();
  if (!context) return;

  if (context.state === "running") {
    playSound(context, kind);
  } else {
    context.resume().then(() => playSound(context, kind)).catch(() => {});
  }
};
