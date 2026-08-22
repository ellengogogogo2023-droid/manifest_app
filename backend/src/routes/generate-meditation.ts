import { Router, type Request, type Response } from 'express';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { buildMeditationPrompt } from '../prompts/meditationPrompt';

// ── Types ────────────────────────────────────────────────────

type GenerateMeditationBody = {
  goal: string;
  scene: string;
  difficulty: string;
  durationMinutes: number;
  day: number;
};

type MeditationScriptSegment = {
  text: string;
  pause_after_ms: number;
};

type MeditationScript = {
  title: string;
  intention: string;
  script: MeditationScriptSegment[];
  duration_target_minutes: number;
  safety_notes: string[];
};

/** Narrow an unknown parsed JSON value down to the expected meditation script shape */
function isMeditationScript(value: unknown): value is MeditationScript {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v['title'] !== 'string' || typeof v['intention'] !== 'string') return false;
  if (typeof v['duration_target_minutes'] !== 'number') return false;
  if (!Array.isArray(v['safety_notes']) || !v['safety_notes'].every((n) => typeof n === 'string')) {
    return false;
  }
  if (!Array.isArray(v['script']) || v['script'].length === 0) return false;
  return v['script'].every(
    (segment) =>
      segment &&
      typeof segment === 'object' &&
      typeof (segment as Record<string, unknown>)['text'] === 'string' &&
      typeof (segment as Record<string, unknown>)['pause_after_ms'] === 'number',
  );
}

// ── DashScope OpenAI-compatible client ──────────────────────
// SDK automatically retries up to 2 times on network errors and 5xx/429 responses
// (matches the retry policy in RULES.md)
function createDashScopeClient(): { client: OpenAI; model: string } {
  const model = process.env['DASHSCOPE_TEXT_MODEL'] ?? 'qwen-turbo';
  const baseURL = process.env['DASHSCOPE_BASE_URL'] ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

  return {
    model,
    client: new OpenAI({
      apiKey: process.env['DASHSCOPE_API_KEY'],
      baseURL,
      maxRetries: 2,
      timeout: 120_000, // 120 s — allows time for long 15-min meditation scripts
    }),
  };
}

// ── Route ────────────────────────────────────────────────────

export const generateMeditationRouter = Router();

generateMeditationRouter.post(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    const dashScopeApiKey = process.env['DASHSCOPE_API_KEY'];

    if (!dashScopeApiKey) {
      res.status(500).json({
        error: '冥想文字服务尚未配置：请在 backend/.env 中设置 DASHSCOPE_API_KEY。',
      });
      return;
    }

    const { goal, scene, difficulty, durationMinutes, day } =
      req.body as GenerateMeditationBody;

    // ── Input validation ─────────────────────────────────────
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      res.status(400).json({ error: '请输入具体目标。' });
      return;
    }
    if (!scene || typeof scene !== 'string' || scene.trim().length === 0) {
      res.status(400).json({ error: '请输入冥想时间、地点或场景。' });
      return;
    }
    if (!difficulty || typeof difficulty !== 'string' || difficulty.trim().length === 0) {
      res.status(400).json({ error: '请输入当前困难或限制性信念。' });
      return;
    }
    if (!durationMinutes || ![3, 5, 10, 15].includes(Number(durationMinutes))) {
      res.status(400).json({ error: '冥想时长必须为 3、5、10 或 15 分钟。' });
      return;
    }
    if (!day || !Number.isInteger(Number(day)) || Number(day) < 1 || Number(day) > 21) {
      res.status(400).json({ error: '冥想天数必须为 1 到 21 之间的整数。' });
      return;
    }

    const { systemPrompt, userPrompt } = buildMeditationPrompt({
      goal: goal.trim(),
      scene: scene.trim(),
      difficulty: difficulty.trim(),
      durationMinutes: Number(durationMinutes),
      day: Number(day),
    });

    // ── Call DashScope via OpenAI-compatible API ─────────────
    try {
      const { client, model } = createDashScopeClient();
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const rawContent = completion.choices[0]?.message?.content?.trim();
      if (!rawContent) {
        res.status(500).json({ error: '冥想文字服务返回了无效结果，请稍后重试。' });
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        console.error('[generate-meditation] Failed to parse JSON response:', rawContent);
        res.status(500).json({ error: '冥想文字服务返回了无效结果，请稍后重试。' });
        return;
      }

      if (!isMeditationScript(parsed)) {
        console.error('[generate-meditation] Response did not match expected schema:', parsed);
        res.status(500).json({ error: '冥想文字服务返回了无效结果，请稍后重试。' });
        return;
      }

      res.json({
        meditationId: uuidv4(),
        script: parsed,
      });
    } catch (error) {
      // SDK already exhausted its 2 retries; this is a final failure
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[generate-meditation] DashScope text API error after retries:', msg);
      res.status(500).json({
        error: '冥想文字生成失败，请稍后重试。',
      });
    }
  },
);
