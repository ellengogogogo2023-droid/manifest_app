import path from 'path';
import fs from 'fs/promises';
import { Router, type Request, type Response } from 'express';

// ── Types ────────────────────────────────────────────────────

type MeditationScriptSegment = {
  text: string;
  pause_after_ms: number;
};

type GenerateAudioBody = {
  meditationId: string;
  script: MeditationScriptSegment[];
};

// ── DashScope Qwen3-TTS configuration ──────────────────────

const DASHSCOPE_TTS_URL =
  process.env['DASHSCOPE_TTS_URL'] ??
  'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const TTS_MODEL = 'qwen3-tts-flash';
const TTS_VOICES = {
  female: 'Cherry',
  male: 'Ethan',
} as const;
type TtsVoice = keyof typeof TTS_VOICES;

type DashScopeTtsResponse = {
  output?: {
    audio?: {
      url?: string;
    };
  };
  code?: string;
  message?: string;
};

function readWavPcm(buffer: Buffer): { audioFormat: number; channels: number; sampleRate: number; bitsPerSample: number; data: Buffer } {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('DashScope TTS returned an unsupported audio container');
  }

  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let data: Buffer | null = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkSize;
    if (chunkEnd > buffer.length) throw new Error('DashScope TTS returned a truncated WAV file');

    if (chunkId === 'fmt ') {
      audioFormat = buffer.readUInt16LE(chunkStart);
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    } else if (chunkId === 'data') {
      data = buffer.subarray(chunkStart, chunkEnd);
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!data || !audioFormat || !channels || !sampleRate || !bitsPerSample) {
    throw new Error('DashScope TTS returned an incomplete WAV file');
  }
  return { audioFormat, channels, sampleRate, bitsPerSample, data };
}

function createWavPcm(
  format: Pick<ReturnType<typeof readWavPcm>, 'audioFormat' | 'channels' | 'sampleRate' | 'bitsPerSample'>,
  data: Buffer,
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = format.sampleRate * format.channels * (format.bitsPerSample / 8);
  const blockAlign = format.channels * (format.bitsPerSample / 8);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(format.audioFormat, 20);
  header.writeUInt16LE(format.channels, 22);
  header.writeUInt32LE(format.sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(format.bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function mergeWavPcm(buffers: Buffer[]): Buffer {
  const parsed = buffers.map(readWavPcm);
  const first = parsed[0];
  if (!first) throw new Error('DashScope TTS returned no audio segments');
  if (parsed.some((item) =>
    item.audioFormat !== first.audioFormat ||
    item.channels !== first.channels ||
    item.sampleRate !== first.sampleRate ||
    item.bitsPerSample !== first.bitsPerSample
  )) {
    throw new Error('DashScope TTS returned incompatible WAV segments');
  }
  return createWavPcm(first, Buffer.concat(parsed.map((item) => item.data)));
}

/**
 * Group script segments into chunks whose combined text length stays ≤ maxChars.
 * Keeps segments (and their pauses) intact — never splits mid-sentence.
 * Modest chunks keep requests fast and preserve pause boundaries.
 */
function splitIntoChunks(
  segments: MeditationScriptSegment[],
  maxChars = 600,
): MeditationScriptSegment[][] {
  const chunks: MeditationScriptSegment[][] = [];
  let current: MeditationScriptSegment[] = [];
  let currentLength = 0;

  for (const segment of segments) {
    const segmentLength = segment.text.length;
    if (current.length > 0 && currentLength + segmentLength > maxChars) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(segment);
    currentLength += segmentLength;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function getVoice(value: unknown): TtsVoice {
  return value === 'male' ? 'male' : 'female';
}

/** Call DashScope Qwen3-TTS and download its WAV result. */
async function synthesizeChunk(
  segments: MeditationScriptSegment[],
  voice: TtsVoice,
  apiKey: string,
  attempt = 0,
): Promise<Buffer> {
  const response = await fetch(DASHSCOPE_TTS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: {
        text: segments.map((segment) => segment.text).join(' '),
        voice: TTS_VOICES[voice],
        language_type: 'Chinese',
      },
    }),
    signal: AbortSignal.timeout(90_000), // 90 s per RULES.md
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status < 500 && response.status !== 429) {
      throw new Error(`DashScope TTS error ${response.status}: ${errText}`);
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
      return synthesizeChunk(segments, voice, apiKey, attempt + 1);
    }
    throw new Error(`DashScope TTS error ${response.status} after ${attempt} retries: ${errText}`);
  }

  const data = (await response.json()) as DashScopeTtsResponse;
  const audioUrl = data.output?.audio?.url;
  if (!audioUrl) {
    throw new Error(data.message ?? 'DashScope TTS returned no audio URL');
  }

  const audioResponse = await fetch(audioUrl, { signal: AbortSignal.timeout(90_000) });
  if (!audioResponse.ok) {
    throw new Error(`DashScope TTS audio download failed: ${audioResponse.status}`);
  }
  return Buffer.from(await audioResponse.arrayBuffer());
}

// ── Route ────────────────────────────────────────────────────

export const generateAudioRouter = Router();

generateAudioRouter.post(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    const { meditationId, script } = req.body as GenerateAudioBody;

    // ── Input validation ─────────────────────────────────────
    if (!meditationId || typeof meditationId !== 'string') {
      res.status(400).json({ error: '缺少冥想记录标识。' });
      return;
    }
    const segments = Array.isArray(script) ? script : [];
    const isValidScript =
      segments.length > 0 &&
      segments.every(
        (s) =>
          s &&
          typeof s.text === 'string' &&
          s.text.trim().length > 0 &&
          typeof s.pause_after_ms === 'number',
      );
    if (!isValidScript) {
      res.status(400).json({ error: '请输入冥想文字。' });
      return;
    }

    const dashScopeApiKey = process.env['DASHSCOPE_API_KEY'];
    const voice = getVoice((req.body as { voice?: unknown }).voice);

    if (!dashScopeApiKey) {
      res.status(500).json({
        error: '中文语音服务尚未配置：请在 backend/.env 中设置 DASHSCOPE_API_KEY。',
      });
      return;
    }

    try {
      // ── Synthesize (sequential to avoid rate limits) ──────
      const chunks = splitIntoChunks(segments);
      console.log(`[generate-audio] ${chunks.length} chunk(s) for ${meditationId}`);

      const buffers: Buffer[] = [];
      for (const [i, chunk] of chunks.entries()) {
        console.log(`[generate-audio] chunk ${i + 1}/${chunks.length} (${chunk.length} segments)`);
        buffers.push(await synthesizeChunk(chunk, voice, dashScopeApiKey));
      }

      // DashScope returns WAV files; merge PCM payloads before rebuilding one valid WAV.
      const audioBuffer = mergeWavPcm(buffers);

      // ── Save to uploads/ ──────────────────────────────────
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `${meditationId}.wav`;
      await fs.writeFile(path.join(uploadsDir, filename), audioBuffer);

      // ── Build URL from incoming request host ──────────────
      // Works for localhost, Android emulator (10.0.2.2), and real device IP
      const host = req.get('host') ?? `localhost:${process.env['PORT'] ?? 3001}`;
      const audioUrl = `${req.protocol}://${host}/audio/${filename}`;

      console.log(`[generate-audio] ✓ saved ${filename} (${audioBuffer.length} bytes)`);
      res.json({ audioUrl });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[generate-audio] failed after retries:', msg);
      res.status(500).json({ error: '冥想音频生成失败，请稍后重试。' });
    }
  },
);
