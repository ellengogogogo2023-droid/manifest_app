import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useMeditationGenerate } from '@/hooks/useMeditationGenerate';
import { useMeditationStore } from '@/stores/meditationStore';
import { colors, radius, spacing, typography } from '@/theme';
import type { MeditationFormValues, MeditationScript } from '@/types/meditation.types';

function renderScriptWithMarkers(script: MeditationScript) {
  return script.script.map((segment, index) => (
    <View key={`segment-${index}`}>
      <Text style={styles.scriptLine}>{segment.text}</Text>
      <Text style={styles.pauseMarker}>
        {`（停顿 ${(segment.pause_after_ms / 1000).toFixed(1)} 秒）`}
      </Text>
    </View>
  ));
}

export default function ScriptReviewPage() {
  const router = useRouter();
  const script = useMeditationStore((s) => s.script);
  const draftFormValues = useMeditationStore((s) => s.draftFormValues);
  const { generateScript, generateAudioForCurrent, isLoading, progress, error, setError } =
    useMeditationGenerate();

  const [goalDraft, setGoalDraft] = useState<string>(draftFormValues?.goal ?? '');
  const [sceneDraft, setSceneDraft] = useState<string>(draftFormValues?.scene ?? '');
  const [difficultyDraft, setDifficultyDraft] = useState(draftFormValues?.difficulty ?? '');

  const canConfirm = !!script && !isLoading;

  const scriptContent = useMemo(() => {
    if (!script) return null;
    return renderScriptWithMarkers(script);
  }, [script]);

  async function handleRegenerate() {
    if (!draftFormValues) {
      setError('缺少生成参数，请返回表单页重新填写。');
      return;
    }

    const payload: MeditationFormValues = {
      ...draftFormValues,
      goal: goalDraft.trim(),
      scene: sceneDraft.trim(),
      difficulty: difficultyDraft.trim(),
    };

    if (!payload.goal) {
      setError('重新生成前，请填写具体目标。');
      return;
    }
    if (!payload.scene) {
      setError('重新生成前，请填写时间、地点或场景。');
      return;
    }
    if (!payload.difficulty) {
      setError('重新生成前，请填写当前困难或限制性信念。');
      return;
    }

    await generateScript(payload);
  }

  async function handleConfirmAndGenerateAudio() {
    const result = await generateAudioForCurrent();
    if (result) {
      router.push('/player');
    }
  }

  if (!script || !draftFormValues) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>暂无可查看的冥想文字</Text>
          <Text style={styles.emptyDescription}>
            请先返回表单页，填写信息并生成冥想。
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/form')}>
            <Text style={styles.primaryButtonText}>返回表单</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>确认冥想文字</Text>
        <Text style={styles.subtitle}>
          你可以调整关键信息重新生成，确认后再转换为音频。
        </Text>
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorMessage message={error} />
        </View>
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.regenerateCard}>
          <Text style={styles.cardTitle}>调整后重新生成</Text>

          <Text style={styles.fieldLabel}>具体目标</Text>
          <TextInput
            value={goalDraft}
            onChangeText={setGoalDraft}
            style={styles.input}
            placeholder="你的具体目标"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>时间、地点与场景</Text>
          <TextInput
            value={sceneDraft}
            onChangeText={setSceneDraft}
            style={styles.input}
            placeholder="冥想的时间、地点与场景"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>当前困难或限制性信念</Text>
          <TextInput
            value={difficultyDraft}
            onChangeText={setDifficultyDraft}
            style={styles.input}
            placeholder="你目前最主要的困难或限制性信念"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegenerate}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>重新生成</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scriptCard}>
          <Text style={styles.cardTitle}>{script.title}</Text>
          <Text style={styles.fieldLabel}>{script.intention}</Text>
          <View style={styles.scriptBody}>{scriptContent}</View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, !canConfirm && styles.buttonDisabled]}
          onPress={handleConfirmAndGenerateAudio}
          disabled={!canConfirm}
        >
          <Text style={styles.primaryButtonText}>确认并生成音频</Text>
        </TouchableOpacity>
      </View>

      <LoadingOverlay visible={isLoading} message={progress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  errorWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  regenerateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  scriptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cardTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: spacing.xs + 2,
    color: colors.textPrimary,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
  },
  scriptBody: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs + 4,
    gap: 4,
  },
  scriptLine: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  sectionMarker: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 13,
    color: colors.accentPrimary,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.sm - 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  pauseMarker: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.sm - 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.textInverse,
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.accentSecondary,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 24,
    color: colors.textPrimary,
  },
  emptyDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
