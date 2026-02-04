import { io, Socket } from "socket.io-client";

// const BACKOFFICE_URL = "http://192.168.10.1:3000";
const BACKOFFICE_URL = "http://10.14.73.40:3000";

// =====================
// Game Types
// =====================

interface GameAction {
  id: string;
  label: string;
  params?: string[];
}

interface RegisterData {
  gameId: string;
  name: string;
  availableActions: GameAction[];
  role?: string;
}

interface Command {
  type: "command";
  action: string;
  payload: Record<string, unknown>;
}

// =====================
// Audio Types
// =====================

interface AudioConfig {
  enabled: boolean;
  autoUnlock: boolean;
  debug: boolean;
}

interface PlayAmbientPayload {
  soundId: string;
  audioBase64: string;
  mimeType: string;
  volume?: number;
}

interface StopAmbientPayload {
  soundId?: string;
}

interface PlayPresetPayload {
  presetIdx: number;
  file: string;
  audioBase64: string;
  mimeType: string;
}

interface PausePresetPayload {
  presetIdx: number;
}

interface SeekPresetPayload {
  presetIdx: number;
  currentTime: number;
}

interface StopPresetPayload {
  presetIdx: number;
}

interface PlayTTSPayload {
  audioBase64: string;
  mimeType?: string;
}

interface VolumePayload {
  volume: number;
}

interface AudioStatus {
  unlocked: boolean;
  enabled: boolean;
  masterVolume: number;
  iaVolume: number;
  ambientVolume: number;
  activeAmbients: string[];
  activePresets: number[];
}

// =====================
// Socket Connection
// =====================

const socket: Socket = io(BACKOFFICE_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000,
  autoConnect: true,
});

// =====================
// Game State
// =====================

let registeredData: RegisterData | null = null;
let lastKnownState: Record<string, unknown> = {};

// =====================
// Audio State
// =====================

let audioConfig: AudioConfig = {
  enabled: true,
  autoUnlock: true,
  debug: false,
};

let masterVolume = 1;
let iaVolume = 1;
let ambientVolume = 1;

const ambientAudios: Map<string, HTMLAudioElement> = new Map();
const presetAudios: Map<number, HTMLAudioElement> = new Map();
let ttsAudio: HTMLAudioElement | null = null;

// =====================
// Audio Helpers
// =====================

function audioLog(msg: string, ...args: unknown[]): void {
  console.log(`[gamemaster:audio] ${msg}`, ...args);
}

function stopAllAudio(): void {
  for (const [, audio] of ambientAudios) {
    audio.pause();
    audio.src = "";
  }
  ambientAudios.clear();

  for (const [, audio] of presetAudios) {
    audio.pause();
    audio.src = "";
  }
  presetAudios.clear();

  if (ttsAudio) {
    ttsAudio.pause();
    ttsAudio.src = "";
    ttsAudio = null;
  }

  audioLog("All audio stopped");
}

// =====================
// Audio Event Listeners
// =====================

function playBase64Audio(
  audio: HTMLAudioElement,
  base64: string,
  mimeType: string,
): void {
  audio.src = `data:${mimeType};base64,${base64}`;
  audio.play().catch((e) => audioLog("Play error:", e.message));
}

function applyPresetVolume(): void {
  for (const a of presetAudios.values()) {
    a.volume = masterVolume;
  }
}

function applyTtsVolume(): void {
  if (ttsAudio) {
    ttsAudio.volume = Math.min(1, iaVolume * masterVolume);
  }
}

function applyAmbientVolume(): void {
  for (const a of ambientAudios.values()) {
    a.volume = Math.min(1, ambientVolume * masterVolume);
  }
}

function setupAudioEventListeners(): void {
  // Ambient sounds
  socket.on("audio:play-ambient", (data: PlayAmbientPayload) => {
    if (!audioConfig.enabled) return;
    const { soundId, audioBase64, mimeType, volume } = data;
    audioLog("Play ambient:", soundId);

    const existing = ambientAudios.get(soundId);
    if (existing) {
      existing.pause();
    }

    const audio = new Audio();
    audio.loop = true;
    ambientAudios.set(soundId, audio);
    playBase64Audio(audio, audioBase64, mimeType);
    if (volume != null) {
      audio.volume = volume * masterVolume;
    } else {
      applyAmbientVolume();
    }
  });

  socket.on("audio:stop-ambient", (data: StopAmbientPayload) => {
    if (data && data.soundId && ambientAudios.has(data.soundId)) {
      ambientAudios.get(data.soundId)!.pause();
      ambientAudios.delete(data.soundId);
      audioLog("Stop ambient:", data.soundId);
    } else {
      // Stop all ambient
      for (const a of ambientAudios.values()) a.pause();
      ambientAudios.clear();
      audioLog("Stop all ambient");
    }
  });

  socket.on("audio:volume-ambient", (data: VolumePayload) => {
    ambientVolume = data.volume;
    applyAmbientVolume();
    audioLog("Ambient volume:", Math.round(ambientVolume * 100) + "%");
  });

  // Presets
  socket.on("audio:play-preset", (data: PlayPresetPayload) => {
    if (!audioConfig.enabled) return;
    const { presetIdx, audioBase64, mimeType } = data;
    audioLog("Play preset:", presetIdx, data.file);

    const existing = presetAudios.get(presetIdx);
    if (existing) {
      existing.pause();
    }

    const audio = new Audio();
    audio.volume = masterVolume;

    audio.addEventListener("timeupdate", () => {
      if (!audio.paused && socket.connected) {
        socket.emit("audio:preset-progress", {
          presetIdx,
          currentTime: audio.currentTime,
          duration: audio.duration || 0,
        });
      }
    });

    audio.addEventListener("ended", () => {
      socket.emit("audio:preset-progress", {
        presetIdx,
        currentTime: audio.duration || 0,
        duration: audio.duration || 0,
        ended: true,
      });
      presetAudios.delete(presetIdx);
    });

    presetAudios.set(presetIdx, audio);
    playBase64Audio(audio, audioBase64, mimeType);
  });

  socket.on("audio:pause-preset", (data: PausePresetPayload) => {
    const { presetIdx } = data;
    audioLog("Pause preset:", presetIdx);
    const audio = presetAudios.get(presetIdx);
    if (audio) audio.pause();
  });

  socket.on("audio:resume-preset", (data: PausePresetPayload) => {
    const { presetIdx } = data;
    audioLog("Resume preset:", presetIdx);
    const audio = presetAudios.get(presetIdx);
    if (audio) audio.play().catch((e) => audioLog("Resume error:", e.message));
  });

  socket.on("audio:seek-preset", (data: SeekPresetPayload) => {
    const { presetIdx, currentTime } = data;
    audioLog("Seek preset:", presetIdx, "to", currentTime);
    const audio = presetAudios.get(presetIdx);
    if (audio && typeof currentTime === "number")
      audio.currentTime = currentTime;
  });

  socket.on("audio:stop-preset", (data: StopPresetPayload) => {
    const { presetIdx } = data;
    audioLog("Stop preset:", presetIdx);
    const audio = presetAudios.get(presetIdx);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      presetAudios.delete(presetIdx);
    }
  });

  // TTS
  socket.on("audio:play-tts", (data: PlayTTSPayload) => {
    if (!audioConfig.enabled) return;
    const { audioBase64, mimeType } = data;
    audioLog("Play TTS");

    if (ttsAudio) {
      ttsAudio.pause();
    }

    ttsAudio = new Audio();
    playBase64Audio(ttsAudio, audioBase64, mimeType || "audio/mpeg");
    applyTtsVolume();

    ttsAudio.onended = () => {
      ttsAudio = null;
    };
  });

  // Volume controls
  socket.on("audio:master-volume", (data: VolumePayload) => {
    masterVolume = data.volume;
    audioLog("Master volume:", Math.round(masterVolume * 100) + "%");
    applyPresetVolume();
    applyTtsVolume();
    applyAmbientVolume();
  });

  socket.on("audio:volume-ia", (data: VolumePayload) => {
    iaVolume = data.volume;
    audioLog("IA volume:", Math.round(iaVolume * 100) + "%");
    applyTtsVolume();
  });

  // Stop all
  socket.on("audio:stop-all", () => {
    audioLog("Stop all audio");
    stopAllAudio();
  });
}

// =====================
// Game Connection Handlers
// =====================

socket.on("connect", () => {
  console.log("[gamemaster] Connected to backoffice");
  if (registeredData) {
    socket.emit("register", registeredData);
    if (Object.keys(lastKnownState).length > 0) {
      setTimeout(() => {
        socket.emit("state_update", { state: lastKnownState });
      }, 100);
    }
  }
  if (audioConfig.enabled) {
    socket.emit("register-audio-player", {});
  }
});

socket.on("disconnect", (reason: string) => {
  console.log(`[gamemaster] Disconnected: ${reason}`);
});

socket.io.on("reconnect_attempt", (attempt: number) => {
  console.log(`[gamemaster] Reconnection attempt ${attempt}`);
});

socket.io.on("reconnect", (attempt: number) => {
  console.log(`[gamemaster] Reconnected after ${attempt} attempts`);
});

socket.io.on("reconnect_failed", () => {
  console.error("[gamemaster] Reconnection failed");
});

// =====================
// Audio Visibility Handler
// =====================

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Resume any paused audio elements when tab becomes visible again
      for (const a of ambientAudios.values()) {
        if (a.paused && a.src) a.play().catch(() => {});
      }
    }
  });
}

// =====================
// Audio Auto-Init
// =====================

(function initAudio() {
  if (typeof window === "undefined") return;
  setupAudioEventListeners();
})();

// =====================
// Gamemaster Export
// =====================

export const gamemaster = {
  // Game API
  register(
    gameId: string,
    name: string,
    availableActions: GameAction[] = [],
    role?: string,
  ) {
    registeredData = { gameId, name, availableActions, role };
    socket.emit("register", registeredData);
  },

  onCommand(
    callback: (cmd: {
      action: string;
      payload: Record<string, unknown>;
    }) => void,
  ) {
    socket.on("command", (data: Command) => {
      callback({ action: data.action, payload: data.payload });
    });
  },

  updateState(state: Record<string, unknown>) {
    lastKnownState = { ...lastKnownState, ...state };
    socket.emit("state_update", { state: lastKnownState });
  },

  resetState() {
    lastKnownState = {};
  },

  sendEvent(name: string, data: Record<string, unknown> = {}) {
    socket.emit("event", { name, data });
  },

  sendMessage(message: unknown) {
    socket.emit("game-message", message);
  },

  onMessage(callback: (message: unknown) => void) {
    socket.on("game-message", callback);
  },

  onConnect(callback: () => void) {
    socket.on("connect", callback);
  },

  onDisconnect(callback: () => void) {
    socket.on("disconnect", callback);
  },

  get isConnected(): boolean {
    return socket.connected;
  },

  // Audio API
  get isAudioReady(): boolean {
    return audioConfig.enabled;
  },

  get audioStatus(): AudioStatus {
    return {
      unlocked: true,
      enabled: audioConfig.enabled,
      masterVolume,
      iaVolume,
      ambientVolume,
      activeAmbients: [...ambientAudios.keys()],
      activePresets: [...presetAudios.keys()],
    };
  },

  configureAudio(config: Partial<AudioConfig>): void {
    audioConfig = { ...audioConfig, ...config };
    console.log("[gamemaster] Audio configured:", audioConfig);

    if (config.enabled === false) {
      stopAllAudio();
    }
  },

  disableAudio(): void {
    audioConfig.enabled = false;
    stopAllAudio();
  },

  enableAudio(): void {
    audioConfig.enabled = true;
    socket.emit("register-audio-player", {});
  },

  socket,
};

// =====================
// Global Window Export
// =====================

declare global {
  interface Window {
    gamemaster: typeof gamemaster;
  }
}
window.gamemaster = gamemaster;
