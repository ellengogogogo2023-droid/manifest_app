import { create } from 'zustand';
import type { MeditationFormValues, MeditationScript } from '@/types/meditation.types';

// Current meditation data — shared between IndexPage (set after generation)
// and PlayerPage (read for playback). Per RULES.md: cross-page data goes in store.
type MeditationState = {
  meditationId: string | null;
  script: MeditationScript | null;
  audioUrl: string | null;
  draftFormValues: MeditationFormValues | null;
};

type MeditationActions = {
  setCurrentMeditation: (data: {
    meditationId: string;
    script: MeditationScript;
    audioUrl: string;
  }) => void;
  setGeneratedScript: (data: {
    meditationId: string;
    script: MeditationScript;
    formValues: MeditationFormValues;
  }) => void;
  setAudioUrl: (audioUrl: string) => void;
  clearCurrentMeditation: () => void;
};

export const useMeditationStore = create<MeditationState & MeditationActions>((set) => ({
  meditationId: null,
  script: null,
  audioUrl: null,
  draftFormValues: null,
  setCurrentMeditation: ({ meditationId, script, audioUrl }) =>
    set({ meditationId, script, audioUrl }),
  setGeneratedScript: ({ meditationId, script, formValues }) =>
    set({ meditationId, script, draftFormValues: formValues, audioUrl: null }),
  setAudioUrl: (audioUrl: string) => set({ audioUrl }),
  clearCurrentMeditation: () =>
    set({
      meditationId: null,
      script: null,
      audioUrl: null,
      draftFormValues: null,
    }),
}));
