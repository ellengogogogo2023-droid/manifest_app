import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, type DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllDailyCheckIns, getTodayKey } from '@/services/check-in.service';
import type { DailyCheckIn } from '@/types/check-in.types';
import { colors, radius, spacing, typography } from '@/theme';

const calendarTheme = {
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textSecondary,
  selectedDayBackgroundColor: colors.accentPrimary,
  selectedDayTextColor: colors.textInverse,
  todayTextColor: colors.accentPrimary,
  dayTextColor: colors.textPrimary,
  textDisabledColor: colors.textMuted,
  dotColor: colors.accentPrimary,
  monthTextColor: colors.textPrimary,
  textMonthFontFamily: typography.fontFamily.bodySemiBold,
  textDayFontFamily: typography.body.fontFamily,
  textDayHeaderFontFamily: typography.label.fontFamily,
  textMonthFontSize: 16,
};

type CalendarMarks = Record<string, {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}>;

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-');
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export default function CheckInCalendarPage() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<Record<string, DailyCheckIn>>({});
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllDailyCheckIns()
      .then(setCheckIns)
      .catch(() => setError('读取打卡日历失败，请稍后重试。'))
      .finally(() => setIsLoading(false));
  }, []);

  const markedDates = useMemo<CalendarMarks>(() => {
    const marks: CalendarMarks = {};
    for (const date of Object.keys(checkIns)) {
      marks[date] = { marked: true, dotColor: colors.accentPrimary };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.accentPrimary,
    };
    return marks;
  }, [checkIns, selectedDate]);

  const selectedCheckIn = checkIns[selectedDate];

  function handleDayPress(day: DateData) {
    setSelectedDate(day.dateString);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accentPrimary} />
          <Text style={styles.mutedText}>正在读取打卡日历……</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 返回每日打卡</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>打卡日历</Text>
          <Text style={styles.title}>看看一路留下的足迹</Text>
          <Text style={styles.subtitle}>点击有标记的日期，回顾当天的练习和感受。</Text>
        </View>

        <View style={styles.calendarCard}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={calendarTheme}
            enableSwipeMonths
            firstDay={1}
          />
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{formatDateLabel(selectedDate)}</Text>
          {selectedCheckIn ? (
            <View style={styles.detailContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>完成冥想</Text>
                <Text style={styles.detailValue}>{selectedCheckIn.meditationCompleted}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>情绪评分</Text>
                <Text style={styles.detailValue}>{selectedCheckIn.moodScore} / 5</Text>
              </View>
              <View style={styles.achievementBlock}>
                <Text style={styles.detailLabel}>小成就或感恩</Text>
                <Text style={styles.detailValue}>
                  {selectedCheckIn.achievement || '今天没有留下文字记录。'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.mutedText}>当天未打卡</Text>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  backButtonText: {
    color: colors.accentPrimary,
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 15,
  },
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
  calendarCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  detailTitle: {
    color: colors.textPrimary,
    fontFamily: typography.h2.fontFamily,
    fontSize: typography.h2.fontSize,
  },
  detailContent: { gap: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  achievementBlock: { gap: spacing.xs },
  detailLabel: {
    color: colors.textSecondary,
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
  },
  detailValue: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: 'right',
  },
  mutedText: { color: colors.textMuted, fontFamily: typography.body.fontFamily, fontSize: 14 },
  errorText: { color: colors.danger, fontFamily: typography.meta.fontFamily, fontSize: 13 },
  loadingState: { alignItems: 'center', flex: 1, gap: spacing.xs, justifyContent: 'center' },
});