import path from 'path';
import fs from 'fs/promises';
import { Router, type Request, type Response } from 'express';

// ── Types ────────────────────────────────────────────────────

type GenerateAudioBody = {
  meditationId: string;
  scriptText: string;
};

// ── Helpers ──────────────────────────────────────────────────

/** Escape special XML characters so they're safe inside SSML */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build SSML for Azure TTS.
 * Voice: zh-CN-XiaoxiaoNeural — warm Mandarin female voice
 * Rate: -10% — slightly slower for meditative delivery
 */
function buildSsml(text: string): string {
  return `<speak version='1.0' xml:lang='zh-CN'>
  <voice xml:lang='zh-CN' xml:gender='Female' name='zh-CN-XiaoxiaoNeural'>
    <prosody rate='-10%'>${escapeXml(text)}</prosody>
  </voice>
</speak>`;
}

/**
 * Split long scripts into chunks ≤ maxChars.
 * Splits on double-newlines first, then sentence boundaries.
 * Azure TTS handles large inputs but 2000-char chunks keep requests fast.
 */
function splitIntoChunks(text: string, maxChars = 2000): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split(/\n{2,}/);
  let current = '';

  for (const para of paragraphs) {
    const joined = current ? `${current}\n\n${para}` : para;
    if (joined.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      if (para.length > maxChars) {
        const sentences = para.split(/(?<=[.!?…])\s+/);
        for (const sentence of sentences) {
          if ((current ? `${current} ` : '').length + sentence.length > maxChars) {
            if (current) chunks.push(current.trim());
            current = sentence;
          } else {
            current += (current ? ' ' : '') + sentence;
          }
        }
      } else {
        current = para;
      }
    } else {
      current = joined;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Call Azure TTS REST API for one text chunk.
 * Returns raw MP3 buffer.
 * Per RULES.md: retries up to 2 times on 5xx / network errors (not 4xx).
 */
async function synthesizeChunk(
  text: string,
  region: string,
  speechKey: string,
  attempt = 0,
): Promise<Buffer> {
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'MeditationApp/1.0',
    },
    body: buildSsml(text),
    signal: AbortSignal.timeout(90_000), // 90 s per RULES.md
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status < 500 && response.status !== 429) {
      throw new Error(`Azure TTS error ${response.status}: ${errText}`);
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
      return synthesizeChunk(text, region, speechKey, attempt + 1);
    }
    throw new Error(`Azure TTS error ${response.status} after ${attempt} retries: ${errText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// ── Route ────────────────────────────────────────────────────

export const generateAudioRouter = Router();

generateAudioRouter.post(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    const { meditationId, scriptText } = req.body as GenerateAudioBody;

    // ── Input validation ─────────────────────────────────────
    if (!meditationId || typeof meditationId !== 'string') {
      res.status(400).json({ error: 'meditationId is required' });
      return;
    }
    if (!scriptText || typeof scriptText !== 'string' || scriptText.trim().length === 0) {
      res.status(400).json({ error: 'scriptText is required' });
      return;
    }

    const speechKey = process.env['AZURE_SPEECH_KEY'];
    const speechRegion = process.env['AZURE_SPEECH_REGION'];

    if (!speechKey || !speechRegion) {
      res.status(500).json({
        error: 'TTS not configured — add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to backend/.env',
      });
      return;
    }

    try {
      // ── Synthesize (sequential to avoid rate limits) ──────
      const chunks = splitIntoChunks(scriptText.trim());
      console.log(`[generate-audio] ${chunks.length} chunk(s) for ${meditationId}`);

      const buffers: Buffer[] = [];
      for (const [i, chunk] of chunks.entries()) {
        console.log(`[generate-audio] chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        buffers.push(await synthesizeChunk(chunk, speechRegion, speechKey));
      }

      // Binary MP3 concat — works for same-bitrate files (MVP quality)
      const audioBuffer = Buffer.concat(buffers);

      // ── Save to uploads/ ──────────────────────────────────
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `${meditationId}.mp3`;
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
