import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDuration } from '@/utils/formatDuration';
import { colors, radius, spacing, typography } from '@/theme';

type AudioPlayerProps = {
  isLoaded: boolean;
  isPlaying: boolean;
  isFinished: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  replay: () => Promise<void>;
};

export function AudioPlayer({
  isLoaded,
  isPlaying,
  isFinished,
  positionMs,
  durationMs,
  error,
  play,
  pause,
  seekTo,
  replay,
}: AudioPlayerProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  function handleProgressBarPress(event: { nativeEvent: { locationX: number } }) {
    if (!durationMs || !trackWidth) return;
    const seekMs = (event.nativeEvent.locationX / trackWidth) * durationMs;
    seekTo(Math.max(0, Math.min(seekMs, durationMs)));
  }

  // ── Loading state ─────────────────────────────────────────
  if (!isLoaded && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <Text style={styles.statusText}>正在加载音频……</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Time display ────────────────────────────────── */}
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatDuration(positionMs)}</Text>
        <Text style={styles.time}>{formatDuration(durationMs)}</Text>
      </View>

      {/* ── Progress bar (tap to seek) ───────────────────── */}
      <TouchableOpacity
        style={styles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onPress={handleProgressBarPress}
        activeOpacity={1}
      >
        <View style={[styles.fill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        {/* Thumb indicator */}
        <View
          style={[
            styles.thumb,
            { left: `${Math.min(progress * 100, 100)}%` },
          ]}
        />
      </TouchableOpacity>

      {/* ── Play / Pause / Replay button ─────────────────── */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={isFinished ? replay : isPlaying ? pause : play}
        activeOpacity={0.8}
      >
        <Text style={styles.playIcon}>
          {isFinished ? '↺' : isPlaying ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  statusText: {
    fontFamily: typography.body.fontFamily,
    color: colors.playerTextMuted,
    fontSize: 14,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },

  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },

  // Time
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  time: {
    color: colors.playerTextMuted,
    fontSize: 13,
    fontFamily: 'monospace',
  },

  // Progress bar
  track: {
    width: '100%',
    height: 6,
    backgroundColor: colors.playerSurface,
    borderRadius: radius.sm / 2,
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.sm / 2,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.accentPrimary,
    top: -5,
    marginLeft: -8,
  },

  // Play button
  playButton: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  playIcon: {
    color: colors.textInverse,
    fontSize: 28,
    lineHeight: 32,
  },
});
