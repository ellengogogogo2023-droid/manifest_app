import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * 吸引力法则引导页 - App 首页
 * 用户先了解核心理念，再进入输入表单页。
 */
export default function IndexPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>显化冥想</Text>
        <Text style={styles.title}>你持续关注的方向，会塑造你的行动。</Text>
        <Text style={styles.description}>
          从一个清晰、具体的目标开始，在平静的呼吸中看见它、感受它，并重新选择与目标一致的行动。
        </Text>
        <Text style={styles.description}>
          我们会根据你的目标、使用场景和当前困难，生成一段专属中文引导冥想。
        </Text>

        <View style={styles.bulletCard}>
          <Text style={styles.bulletTitle}>开始之前</Text>
          <Text style={styles.bullet}>1. 写下具体、可感受的目标。</Text>
          <Text style={styles.bullet}>2. 描述冥想的时间、地点与场景。</Text>
          <Text style={styles.bullet}>3. 坦诚面对当前的困难或限制性信念。</Text>
          <Text style={styles.bullet}>4. 跟随呼吸聆听，并做出一个新的选择。</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/form')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>开始定制冥想</Text>
        </TouchableOpacity>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.xs + 6,
  },
  eyebrow: {
    fontFamily: typography.meta.fontFamily,
    fontSize: typography.meta.fontSize,
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  bulletCard: {
    marginTop: 6,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  bulletTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: typography.h2.fontSize,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bullet: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textPrimary,
  },
  primaryButton: {
    marginTop: 'auto',
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.textInverse,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

