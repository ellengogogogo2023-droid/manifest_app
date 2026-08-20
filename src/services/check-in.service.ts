import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyCheckIn } from '@/types/check-in.types';

const CHECK_INS_KEY = '@meditation/daily-check-ins';

type StoredCheckIns = Record<string, DailyCheckIn>;

export function getTodayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readCheckIns(): Promise<StoredCheckIns> {
  const raw = await AsyncStorage.getItem(CHECK_INS_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as StoredCheckIns;
  } catch {
    return {};
  }
}

export async function getDailyCheckIn(date = new Date()): Promise<DailyCheckIn | null> {
  const checkIns = await readCheckIns();
  return checkIns[getTodayKey(date)] ?? null;
}

export async function getAllDailyCheckIns(): Promise<StoredCheckIns> {
  return readCheckIns();
}

export async function saveDailyCheckIn(checkIn: DailyCheckIn): Promise<void> {
  const checkIns = await readCheckIns();
  await AsyncStorage.setItem(
    CHECK_INS_KEY,
    JSON.stringify({ ...checkIns, [checkIn.date]: checkIn }),
  );
}