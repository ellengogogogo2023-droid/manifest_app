export type CheckInMeditationCompleted = '是' | '否';

export type DailyCheckIn = {
  date: string;
  meditationCompleted: CheckInMeditationCompleted;
  moodScore: 1 | 2 | 3 | 4 | 5;
  achievement: string;
};