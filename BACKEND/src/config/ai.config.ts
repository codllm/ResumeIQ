/**
 * Centralized AI Configuration
 * 
 * Single source of truth for AI Model names used across all services in the backend.
 * You can change default model names here or override them via environment variables in .env.
 */

export const AI_CONFIG = {
  /** Main Gemini model for text generation, assessment planning, MCQs, transcription & evaluation */
  DEFAULT_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",

  /** Gemini model for Text-To-Speech (TTS) audio generation */
  TTS_MODEL: process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview",
} as const;
