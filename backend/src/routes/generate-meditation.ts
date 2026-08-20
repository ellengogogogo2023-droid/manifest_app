import { Router, type Request, type Response } from 'express';
import { AzureOpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { buildMeditationPrompt } from '../prompts/meditationPrompt';

// ── Types ────────────────────────────────────────────────────

type GenerateMeditationBody = {
  goal: string;
  scene: string;
  difficulty: string;
  durationMinutes: number;
};

// ── Azure OpenAI client ──────────────────────────────────────
// SDK automatically retries up to 2 times on network errors and 5xx/429 responses
// (matches the retry policy in RULES.md)
const azureOpenAiDeployment = process.env['AZURE_OPENAI_DEPLOYMENT'] ?? '';
const azureOpenAiApiVersion = process.env['AZURE_OPENAI_API_VERSION'] ?? '2024-10-21';

const azureOpenAi = new AzureOpenAI({
  apiKey: process.env['AZURE_OPENAI_API_KEY'],
  endpoint: process.env['AZURE_OPENAI_ENDPOINT'],
  apiVersion: azureOpenAiApiVersion,
  deployment: azureOpenAiDeployment,
  maxRetries: 2,
  timeout: 120_000, // 120 s — allows time for long 15-min meditation scripts
});

// ── Route ────────────────────────────────────────────────────

export const generateMeditationRouter = Router();

generateMeditationRouter.post(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    if (!azureOpenAiDeployment) {
      res.status(500).json({ error: '冥想文字服务尚未配置，请稍后重试。' });
      return;
    }

    const { goal, scene, difficulty, durationMinutes } =
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

    const { systemPrompt, userPrompt } = buildMeditationPrompt({
      goal: goal.trim(),
      scene: scene.trim(),
      difficulty: difficulty.trim(),
      durationMinutes: Number(durationMinutes),
    });

    // ── Call Azure OpenAI ────────────────────────────────────
    try {
      const completion = await azureOpenAi.chat.completions.create({
        model: azureOpenAiDeployment,
        temperature: 0.7,
        max_tokens: 6000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const scriptText = completion.choices[0]?.message?.content?.trim();
      if (!scriptText) {
        res.status(500).json({ error: '冥想文字服务返回了无效结果，请稍后重试。' });
        return;
      }

      res.json({
        meditationId: uuidv4(),
        scriptText,
      });
    } catch (error) {
      // SDK already exhausted its 2 retries; this is a final failure
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[generate-meditation] Azure OpenAI API error after retries:', msg);
      res.status(500).json({
        error: '冥想文字生成失败，请稍后重试。',
      });
    }
  },
);
