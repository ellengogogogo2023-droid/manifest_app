import { useCallback, useState } from 'react';
import {
  generateMeditationAudio,
  generateMeditationScript,
} from '@/services/meditation.service';
import { useMeditationStore } from '@/stores/meditationStore';
import type { MeditationFormValues } from '@/types/meditation.types';

type ScriptResult = {
  meditationId: string;
  scriptText: string;
} | null;

type AudioResult = {
  audioUrl: string;
} | null;

export function useMeditationGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setGeneratedScript = useMeditationStore((s) => s.setGeneratedScript);
  const setAudioUrl = useMeditationStore((s) => s.setAudioUrl);
  const meditationId = useMeditationStore((s) => s.meditationId);
  const scriptText = useMeditationStore((s) => s.scriptText);

  const generateScript = useCallback(
    async (formValues: MeditationFormValues): Promise<ScriptResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1 — Generate meditation text only
        setProgress('正在为你创作冥想文字……');
        const { meditationId, scriptText } = await generateMeditationScript({
          goal: formValues.goal,
          scene: formValues.scene,
          difficulty: formValues.difficulty,
          durationMinutes: formValues.durationMinutes,
        });

        // Persist generated script so review page can inspect before TTS
        setGeneratedScript({ meditationId, scriptText, formValues });

        setIsLoading(false);
        setProgress('');
        return { meditationId, scriptText };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : '生成失败，请稍后重试。';
        setIsLoading(false);
        setProgress('');
        setError(msg);
        return null;
      }
    },
    [setGeneratedScript],
  );

  const generateAudioForCurrent = useCallback(async (): Promise<AudioResult> => {
    if (!meditationId || !scriptText) {
      setError('没有找到冥想文字，请先完成生成。');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      setProgress('正在生成中文冥想音频……');
      const { audioUrl } = await generateMeditationAudio({ meditationId, scriptText });
      setAudioUrl(audioUrl);
      setIsLoading(false);
      setProgress('');
      return { audioUrl };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '音频生成失败，请稍后重试。';
      setIsLoading(false);
      setProgress('');
      setError(msg);
      return null;
    }
  }, [meditationId, scriptText, setAudioUrl]);

  return { generateScript, generateAudioForCurrent, isLoading, progress, error, setError };
}
