import type { MeditationScript } from './meditation.types';

// ── Generate Meditation ───────────────────────────────────────
// POST /api/generate-meditation

export type GenerateMeditationRequest = {
  goal: string;
  scene: string;
  difficulty: string;
  durationMinutes: number;
  /** 21 天冥想计划中的第几天（1–21） */
  day: number;
};

export type GenerateMeditationResponse = {
  meditationId: string;
  script: MeditationScript;
};

// ── Generate Audio (P1-05) ────────────────────────────────────
// POST /api/generate-audio

export type GenerateAudioRequest = {
  meditationId: string;
  script: MeditationScript['script'];
  voice?: 'female' | 'male';
};

export type GenerateAudioResponse = {
  audioUrl: string;
};
