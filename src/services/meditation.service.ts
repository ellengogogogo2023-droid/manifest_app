import { API_BASE_URL } from '@/constants/config';
import type {
  GenerateAudioRequest,
  GenerateAudioResponse,
  GenerateMeditationRequest,
  GenerateMeditationResponse,
} from '@/types/api.types';

// All LLM / TTS calls are routed through the Node backend — never called directly
// from the frontend. (RULES.md security requirement)

async function fetchBackend(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `无法连接冥想服务（${API_BASE_URL}）。请确认已在项目根目录运行 npm run dev。`,
      );
    }
    throw error;
  }
}

export async function generateMeditationScript(
  request: GenerateMeditationRequest,
): Promise<GenerateMeditationResponse> {
  const response = await fetchBackend('/api/generate-meditation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `generate-meditation failed: ${response.status}`);
  }

  return response.json() as Promise<GenerateMeditationResponse>;
}

export async function generateMeditationAudio(
  request: GenerateAudioRequest,
): Promise<GenerateAudioResponse> {
  const response = await fetchBackend('/api/generate-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `generate-audio failed: ${response.status}`);
  }

  return response.json() as Promise<GenerateAudioResponse>;
}
