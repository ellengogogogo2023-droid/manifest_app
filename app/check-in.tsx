import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';
import { getDailyCheckIn, getTodayKey, saveDailyCheckIn } from '@/services/check-in.service';
import type {
  CheckInMeditationCompleted,
  DailyCheckIn,
} from '@/types/check-in.types';

const COMPLETION_OPTIONS: CheckInMeditationCompleted[] = ['是', '否'];
const MOOD_OPTIONS: DailyCheckIn['moodScore'][] = [1, 2, 3, 4, 5];

export default function CheckInPage() {
  const router = useRouter();
  const [completed, setCompleted] = useState<CheckInMeditationCompleted | null>(null);
  const [moodScore, setMoodScore] = useState<DailyCheckIn['moodScore'] | null>(null);
  const [achievement, setAchievement] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getDailyCheckIn()
      .then((checkIn) => {
        if (!isMounted || !checkIn) return;
        setCompleted(checkIn.meditationCompleted);
        setMoodScore(checkIn.moodScore);
        setAchievement(checkIn.achievement);
      })
      .catch(() => {
        if (isMounted) setError('读取今日打卡失败，请稍后重试。');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit() {
    setSubmitted(true);
    if (!completed || !moodScore) return;

    setIsSaving(true);
    setError(null);
    try {
      await saveDailyCheckIn({
        date: getTodayKey(),
        meditationCompleted: completed,
        moodScore,
        achievement: achievement.trim(),
      });
      router.replace('/form');
    } catch {
      setError('保存今日打卡失败，请稍后重试。');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accentPrimary} />
          <Text style={styles.mutedText}>正在读取今日打卡……</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>每日打卡</Text>
            <Text style={styles.title}>给今天留下一笔记录</Text>
            <Text style={styles.subtitle}>花一分钟回望刚才的练习，也听听自己的感受。</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>今天完成冥想了吗？</Text>
            <View style={styles.optionRow}>
              {COMPLETION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, completed === option && styles.optionSelected]}
                  onPress={() => setCompleted(option)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionText, completed === option && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {submitted && !completed ? <Text style={styles.errorText}>请选择今天是否完成冥想</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>今天的情绪评分</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.moodOption, moodScore === score && styles.moodOptionSelected]}
                  onPress={() => setMoodScore(score)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.moodScore, moodScore === score && styles.optionTextSelected]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.moodLegend}>
              <Text style={styles.mutedText}>低落</Text>
              <Text style={styles.mutedText}>很好</Text>
            </View>
            {submitted && !moodScore ? <Text style={styles.errorText}>请选择 1-5 分的情绪评分</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>今天的小成就或感恩（可选）</Text>
            <TextInput
              value={achievement}
              onChangeText={setAchievement}
              style={styles.input}
              placeholder="写下一件让你感到满足的小事"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{achievement.length}/100</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>{isSaving ? '正在保存……' : '保存今日打卡'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.calendarLink}
            onPress={() => router.push('/check-in-calendar')}
            activeOpacity={0.8}
          >
            <Text style={styles.calendarLinkText}>查看打卡日历</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs },
  eyebrow: {
    color: colors.accentPrimary,
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.h1.fontFamily,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  field: { gap: spacing.xs },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
  },
  optionRow: { flexDirection: 'row', gap: spacing.xs },
  option: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  optionSelected: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  optionText: { color: colors.textPrimary, fontFamily: typography.body.fontFamily, fontSize: 16 },
  optionTextSelected: { color: colors.textInverse, fontFamily: typography.fontFamily.bodySemiBold },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  moodOption: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  moodOptionSelected: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  moodScore: { color: colors.textPrimary, fontFamily: typography.fontFamily.bodySemiBold, fontSize: 18 },
  moodLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  mutedText: { color: colors.textMuted, fontFamily: typography.meta.fontFamily, fontSize: 13 },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    minHeight: 96,
    padding: spacing.sm,
  },
  characterCount: { alignSelf: 'flex-end', color: colors.textMuted, fontSize: 12 },
  errorText: { color: colors.danger, fontFamily: typography.meta.fontFamily, fontSize: 13 },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: colors.textInverse,
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 16,
  },
  calendarLink: { alignItems: 'center', paddingVertical: spacing.xs },
  calendarLinkText: {
    color: colors.accentPrimary,
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 15,
  },
  loadingState: { alignItems: 'center', flex: 1, gap: spacing.xs, justifyContent: 'center' },
});