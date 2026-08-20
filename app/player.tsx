import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioPlayer } from '@/components/meditation/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useMeditationStore } from '@/stores/meditationStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function PlayerPage() {
  const router = useRouter();
  const audioUrl = useMeditationStore((s) => s.audioUrl);
  const player = useAudioPlayer(audioUrl);

  useEffect(() => {
    if (!audioUrl) {
      router.replace('/form');
    }
  }, [audioUrl, router]);

  useEffect(() => {
    if (player.isFinished) {
      router.replace('/check-in');
    }
  }, [player.isFinished, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>你的冥想</Text>
          <Text style={styles.subtitle}>找一个舒服的姿势，闭上眼睛，跟随声音慢慢呼吸。</Text>
        </View>

        {/* Player */}
        <View style={styles.playerCard}>
          <AudioPlayer {...player} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: spacing.xs,
  },
  backButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.accentPrimary,
    fontSize: 16,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: 8,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  playerCard: {
    backgroundColor: colors.playerBackground,
    borderRadius: radius.lg + 8,
    padding: spacing.md,
    justifyContent: 'center',
  },
});

