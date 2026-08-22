import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import type {
  MeditationDuration,
  MeditationFormValues,
  MeditationGoal,
  MeditationScene,
} from '@/types/meditation.types';

// ── 静态选项 ─────────────────────────────────────────────────
const GOALS: MeditationGoal[] = [
  '财富增长',
  '健康减重',
  '强健体魄',
  '事业发展',
  '自信表达',
  '家庭关系',
];

const SCENES: MeditationScene[] = [
  '睡前',
  '清晨',
  '午间休息',
  '运动后',
];

const DURATIONS: MeditationDuration[] = [3, 5, 10, 15];

// ── Props ────────────────────────────────────────────────────
type GoalInputFormProps = {
  /** 表单通过校验后的提交回调 */
  onSubmit: (values: MeditationFormValues) => void;
  /** 外部（如 API 调用中）可传入 true 使按钮进入 loading 状态 */
  isLoading?: boolean;
};

// ── 组件 ─────────────────────────────────────────────────────
export function GoalInputForm({ onSubmit, isLoading = false }: GoalInputFormProps) {
  // 表单字段状态（单页 UI 状态，不进 Zustand store）
  const [goal, setGoal] = useState<MeditationGoal>('');
  const [scene, setScene] = useState<MeditationScene>('');
  const [difficulty, setDifficulty] = useState('');
  const [duration, setDuration] = useState<MeditationDuration>(10);
  const [day, setDay] = useState(1);
  // 是否已点击过提交（用于决定何时展示错误提示）
  const [submitted, setSubmitted] = useState(false);

  const isGoalValid = goal.trim().length > 0;
  const isSceneValid = scene.trim().length > 0;
  const isDifficultyValid = difficulty.trim().length > 0;
  const isFormValid = isGoalValid && isSceneValid && isDifficultyValid;

  function handleSubmit() {
    setSubmitted(true);
    if (!isFormValid) return;
    onSubmit({
      goal: goal.trim(),
      scene: scene.trim(),
      difficulty: difficulty.trim(),
      durationMinutes: duration,
      day,
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Goal ─────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>
            具体目标 <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.goalGrid}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.goalCard, goal === g && styles.goalCardSelected]}
                onPress={() => setGoal(g)}
                activeOpacity={0.7}
              >
                <Text style={[styles.goalCardText, goal === g && styles.goalCardTextSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="请写清目标、期望达成的时间以及达成时的感受"
            placeholderTextColor={colors.textMuted}
            value={goal}
            onChangeText={setGoal}
            multiline
            textAlignVertical="top"
          />
          {submitted && !isGoalValid && (
            <Text style={styles.errorText}>请输入你的具体目标</Text>
          )}
        </View>

        {/* ── Scene ────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>
            时间、地点与场景 <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipGrid}>
            {SCENES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, scene === s && styles.chipSelected]}
                onPress={() => setScene(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, scene === s && styles.chipTextSelected]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="例如：每天睡前，在卧室里，想象三个月后的自己"
            placeholderTextColor={colors.textMuted}
            value={scene}
            onChangeText={setScene}
            multiline
            textAlignVertical="top"
          />
          {submitted && !isSceneValid && (
            <Text style={styles.errorText}>请输入冥想的时间、地点或场景</Text>
          )}
        </View>

        {/* ── Difficulty ───────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>
            当前困难或限制性信念 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="例如：我总是半途而废，觉得自己不配拥有成功"
            placeholderTextColor={colors.textMuted}
            value={difficulty}
            onChangeText={setDifficulty}
            multiline
            textAlignVertical="top"
          />
          {submitted && !isDifficultyValid && (
            <Text style={styles.errorText}>请输入目前最主要的困难或限制性信念</Text>
          )}
        </View>

        {/* ── Duration ─────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>冥想时长</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationButton,
                  duration === d && styles.durationButtonSelected,
                ]}
                onPress={() => setDuration(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === d && styles.durationTextSelected,
                  ]}
                >
                  {d} 分钟
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Day ──────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>第几天（21 天计划）</Text>
          <TextInput
            style={styles.input}
            placeholder="1-21"
            placeholderTextColor={colors.textMuted}
            value={String(day)}
            onChangeText={(text) => {
              if (!text) {
                setDay(1);
                return;
              }
              const parsed = Number(text.replace(/[^0-9]/g, ''));
              if (Number.isFinite(parsed)) {
                setDay(Math.min(21, Math.max(1, parsed)));
              }
            }}
            keyboardType="number-pad"
          />
        </View>

        {/* ── Submit ───────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? '正在生成……' : '生成冥想文字'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
  },

  // Fields
  field: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  required: {
    color: colors.danger,
  },

  // Goal cards
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  goalCard: {
    width: '47%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  goalCardSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  goalCardText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  goalCardTextSelected: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.textInverse,
  },

  // Text inputs
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 6,
    color: colors.textPrimary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  multilineInput: {
    minHeight: 76,
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.meta.fontFamily,
    fontSize: typography.meta.fontSize,
    marginTop: -4,
  },

  // Scene chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  chipText: {
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },

  // Duration buttons
  durationRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  durationButton: {
    flex: 1,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  durationText: {
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
  },
  durationTextSelected: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.textInverse,
  },

  // Submit button
  submitButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.textInverse,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
