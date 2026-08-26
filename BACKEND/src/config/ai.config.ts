

export const AI_CONFIG = {

  DEFAULT_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",

  TTS_MODEL: process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview",
} as const;
