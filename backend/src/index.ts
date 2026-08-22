import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { generateMeditationRouter } from './routes/generate-meditation';
import { generateAudioRouter } from './routes/generate-audio';

const PORT = process.env['PORT'] ?? 3001;

// DashScope credentials are validated inside routes so the API can still start
// and return clear configuration errors to the app during local development.

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
  const dashScopeReady = Boolean(process.env['DASHSCOPE_API_KEY']);
  console.log(`[server] ${dashScopeReady ? '✓' : '✗'} DashScope config: ${dashScopeReady ? 'set' : 'not set'}`);
});


