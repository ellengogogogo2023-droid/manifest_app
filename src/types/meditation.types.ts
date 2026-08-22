// ── 表单选项 ────────────────────────────────────────────────
export type MeditationGoal = string;

export type MeditationScene = string;

export type MeditationDuration = 3 | 5 | 10 | 15;

/** 21 天冥想计划中的第几天 */
export type MeditationDay = number;

// ── 表单值（GoalInputForm 提交时传出的数据结构）──────────────
export type MeditationFormValues = {
  goal: MeditationGoal;
  scene: MeditationScene;
  difficulty: string;
  durationMinutes: MeditationDuration;
  day: MeditationDay;
};

// ── 结构化冥想脚本（LLM 输出的 JSON 结构）────────────────────
export type MeditationScriptSegment = {
  text: string;
  pause_after_ms: number;
};

export type MeditationScript = {
  title: string;
  intention: string;
  script: MeditationScriptSegment[];
  duration_target_minutes: number;
  safety_notes: string[];
};

// ── 数据库记录（Edge Function 返回后存入 Store）────────────────
export type Meditation = {
  id: string;
  goal: MeditationGoal;
  scene: MeditationScene;
  difficulty: string;
  durationMinutes: MeditationDuration;
  day: MeditationDay;
  script: MeditationScript | null;
  audioUrl: string | null;
  createdAt: string;
};
