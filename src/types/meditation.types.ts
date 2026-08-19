// ── 表单选项 ────────────────────────────────────────────────
export type MeditationGoal = string;

export type MeditationScene = string;

export type MeditationDuration = 3 | 5 | 10 | 15;

// ── 表单值（GoalInputForm 提交时传出的数据结构）──────────────
export type MeditationFormValues = {
  goal: MeditationGoal;
  scene: MeditationScene;
  difficulty: string;
  durationMinutes: MeditationDuration;
};

// ── 数据库记录（Edge Function 返回后存入 Store）────────────────
export type Meditation = {
  id: string;
  goal: MeditationGoal;
  scene: MeditationScene;
  difficulty: string;
  durationMinutes: MeditationDuration;
  scriptText: string | null;
  audioUrl: string | null;
  createdAt: string;
};
