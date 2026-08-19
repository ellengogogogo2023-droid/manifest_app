import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalInputForm } from '@/components/meditation/GoalInputForm';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useMeditationGenerate } from '@/hooks/useMeditationGenerate';
import { colors, spacing, typography } from '@/theme';
import type { MeditationFormValues } from '@/types/meditation.types';

export default function FormPage() {
  const router = useRouter();
  const { generateScript, isLoading, progress, error } = useMeditationGenerate();

  async function handleFormSubmit(values: MeditationFormValues) {
    const result = await generateScript(values);
    if (result) {
      router.push('/script-review');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>定制你的冥想</Text>
        <Text style={styles.subtitle}>
          提供越具体的细节，生成的画面和引导就越贴近你。
        </Text>
        {error ? (
          <View style={styles.errorWrapper}>
            <ErrorMessage message={error} />
          </View>
        ) : null}
      </View>

      <GoalInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />

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
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  errorWrapper: {
    marginTop: 4,
  },
});

