import { create } from 'zustand';
import type { MeditationFormValues } from '@/types/meditation.types';

// Current meditation data — shared between IndexPage (set after generation)
// and PlayerPage (read for playback). Per RULES.md: cross-page data goes in store.
type MeditationState = {
  meditationId: string | null;
  scriptText: string | null;
  audioUrl: string | null;
  draftFormValues: MeditationFormValues | null;
};

type MeditationActions = {
  setCurrentMeditation: (data: {
    meditationId: string;
    scriptText: string;
    audioUrl: string;
  }) => void;
  setGeneratedScript: (data: {
    meditationId: string;
    scriptText: string;
    formValues: MeditationFormValues;
  }) => void;
  setAudioUrl: (audioUrl: string) => void;
  clearCurrentMeditation: () => void;
};

export const useMeditationStore = create<MeditationState & MeditationActions>((set) => ({
  meditationId: null,
  scriptText: null,
  audioUrl: null,
  draftFormValues: null,
  setCurrentMeditation: ({ meditationId, scriptText, audioUrl }) =>
    set({ meditationId, scriptText, audioUrl }),
  setGeneratedScript: ({ meditationId, scriptText, formValues }) =>
    set({ meditationId, scriptText, draftFormValues: formValues, audioUrl: null }),
  setAudioUrl: (audioUrl: string) => set({ audioUrl }),
  clearCurrentMeditation: () =>
    set({
      meditationId: null,
      scriptText: null,
      audioUrl: null,
      draftFormValues: null,
    }),
}));
