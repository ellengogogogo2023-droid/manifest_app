import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import { generateMeditationRouter } from './routes/generate-meditation';
import { generateAudioRouter } from './routes/generate-audio';

const PORT = process.env['PORT'] ?? 3001;

// ── Guard: fail fast on missing required keys ────────────────
if (!process.env['AZURE_OPENAI_API_KEY']) {
  console.error('[server] ✗ AZURE_OPENAI_API_KEY is not set in backend/.env');
  process.exit(1);
}
if (!process.env['AZURE_OPENAI_ENDPOINT']) {
  console.error('[server] ✗ AZURE_OPENAI_ENDPOINT is not set in backend/.env');
  process.exit(1);
}
if (!process.env['AZURE_OPENAI_DEPLOYMENT']) {
  console.error('[server] ✗ AZURE_OPENAI_DEPLOYMENT is not set in backend/.env');
  process.exit(1);
}
// AZURE_SPEECH_KEY / REGION are optional at startup — the route returns a clear error if missing

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' })); // Allow large scriptText payloads

// ── Static: serve generated audio files ─────────────────────
// generate-audio route saves files to uploads/
// Accessible at GET /audio/:filename.mp3
app.use('/audio', express.static(path.join(process.cwd(), 'uploads')));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/generate-meditation', generateMeditationRouter);
app.use('/api/generate-audio', generateAudioRouter);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] ✓ Backend running on http://localhost:${PORT}`);
  console.log('[server] ✓ Azure OpenAI config: set');
  const ttsReady = process.env['AZURE_SPEECH_KEY'] && process.env['AZURE_SPEECH_REGION'];
  console.log(`[server] ${ttsReady ? '✓' : '✗'} Azure Speech (TTS): ${ttsReady ? 'set' : 'not set'}`);
});


