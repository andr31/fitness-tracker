import { getCalendarDaysRemaining, getRequiredDailyPace } from './pace';

interface ReminderInput {
  now: Date;
  timezone: string;
  endDate: string | null;
  milestone: number;
  total: number;
  sessionType: string;
  exerciseName: string | null;
}

export function getDailyReminder(input: ReminderInput): { date: string; body: string } | null {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: input.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(input.now);
  const part = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === name)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');
  const hour = part('hour');
  const minute = part('minute');
  const second = part('second');
  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error('Could not determine reminder local time');
  }
  if (hour !== '19' || !input.endDate || input.total >= input.milestone) return null;

  const date = `${year}-${month}-${day}`;
  const localNow = new Date(`${date}T${hour}:${minute}:${second}`);
  const endDate = new Date(input.endDate);
  if (!Number.isFinite(endDate.getTime())) {
    throw new Error('Invalid competition deadline');
  }
  const days = getCalendarDaysRemaining(endDate, localNow);
  if (days <= 0) return null;

  const pace = getRequiredDailyPace(input.milestone - input.total, days, input.sessionType);
  const activity = input.sessionType === 'plank'
    ? 'minutes of plank'
    : input.sessionType === 'custom'
      ? input.exerciseName?.trim() || 'exercises'
      : 'push-ups';
  return {
    date,
    body: `Keep going! Your pace is ${pace} ${activity} per day to reach your goal.`,
  };
}
