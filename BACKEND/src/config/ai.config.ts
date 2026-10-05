

export const AI_CONFIG = {
  DEFAULT_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  TTS_MODEL: process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
} as const;
