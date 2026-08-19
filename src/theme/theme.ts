// Single source of truth for colors, typography, spacing, radius and motion.
// Pages/components must import from here instead of hardcoding values.

export const colors = {
  // Core palette (beige + green minimalist)
  background: '#e4e3dd',
  surface: '#bbb9ae',
  surfaceMuted: '#d3d1c7',
  accentSecondary: '#cdbee6',
  accentPrimary: '#3e4b40',

  // Text (derived from core palette for contrast on a light background)
  textPrimary: '#3e4b40',
  textSecondary: '#6b6a61',
  textMuted: '#8f8d82',
  textInverse: '#f5f4f0',

  border: '#a8a69b',
  danger: '#b3554a',
  overlay: 'rgba(62, 75, 64, 0.55)',

  // Player screen keeps an intentional dark "focus mode" background
  playerBackground: '#1a1a24',
  playerSurface: '#2a2a3a',
  playerTextMuted: '#8a8a9a',
} as const;

export const typography = {
  fontFamily: {
    heading: 'Lora_600SemiBold',
    headingBold: 'Lora_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',
  },
  // Three-level text hierarchy: H1 / Body / Meta(Label)
  h1: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    lineHeight: 30,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const motion = {
  duration: 250,
  easing: 'ease-in-out',
} as const;

export const borderWidth = 1;

export const theme = { colors, typography, spacing, radius, motion, borderWidth };

export type Theme = typeof theme;
