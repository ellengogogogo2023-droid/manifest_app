// ── Generate Meditation ───────────────────────────────────────
// POST /api/generate-meditation

export type GenerateMeditationRequest = {
  goal: string;
  scene: string;
  difficulty: string;
  durationMinutes: number;
};

export type GenerateMeditationResponse = {
  meditationId: string;
  scriptText: string;
};

// ── Generate Audio (P1-05) ────────────────────────────────────
// POST /api/generate-audio

export type GenerateAudioRequest = {
  meditationId: string;
  scriptText: string;
};

export type GenerateAudioResponse = {
  audioUrl: string;
};
