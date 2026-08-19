import { Audio, type AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

type PlayerState = {
  isLoaded: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
};

const INITIAL_STATE: PlayerState = {
  isLoaded: false,
  isPlaying: false,
  isFinished: false,
  positionMs: 0,
  durationMs: 0,
  error: null,
};

export function useAudioPlayer(audioUrl: string | null) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayerState>(INITIAL_STATE);

  // ── Load & configure audio ───────────────────────────────
  useEffect(() => {
    if (!audioUrl) return;

    const playableUrl = audioUrl;

    let isMounted = true;

    async function load() {
      try {
        // Allow audio to play when device is in silent mode (iOS)
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
          { uri: playableUrl },
          { shouldPlay: false },
          (status: AVPlaybackStatus) => {
            if (!isMounted) return;

            if (status.isLoaded) {
              setState({
                isLoaded: true,
                isPlaying: status.isPlaying,
                isFinished: status.didJustFinish ?? false,
                positionMs: status.positionMillis,
                durationMs: status.durationMillis ?? 0,
                error: null,
              });
            } else {
              // AVPlaybackStatusError
              setState((prev) => ({
                ...prev,
                error: status.error ?? 'Playback error',
              }));
            }
          },
        );

        soundRef.current = sound;
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load audio';
        setState((prev) => ({ ...prev, error: msg }));
      }
    }

    load();

    // Cleanup: unload audio when component unmounts or audioUrl changes
    return () => {
      isMounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [audioUrl]);

  // ── Controls ─────────────────────────────────────────────
  const play = useCallback(async () => {
    await soundRef.current?.playAsync();
  }, []);

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync();
  }, []);

  const seekTo = useCallback(async (positionMs: number) => {
    await soundRef.current?.setPositionAsync(Math.round(positionMs));
  }, []);

  const replay = useCallback(async () => {
    await soundRef.current?.setPositionAsync(0);
    await soundRef.current?.playAsync();
  }, []);

  return { ...state, play, pause, seekTo, replay };
}
