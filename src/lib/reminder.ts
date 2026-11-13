import { getCalendarDaysRemaining, getRequiredDailyPace } from './pace';

export const DEFAULT_REMINDER_TIMES = ['19:00'];
export const MAX_REMINDERS = 3;

export function isValidReminderTimes(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 1 && value.length <= MAX_REMINDERS &&
    value.every((time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) &&
    new Set(value).size === value.length;
}

export function getDueReminderTimes(now: Date, timezone: string, times: string[]) {
  if (!isValidReminderTimes(times)) throw new Error('Invalid stored reminder times');
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const due = new Map<string, { date: string; time: string; scheduledAt: Date }>();
  const currentMinute = Math.floor(now.getTime() / 60_000) * 60_000;
  for (let minutesAgo = 30; minutesAgo >= 0; minutesAgo--) {
    const scheduledAt = new Date(currentMinute - minutesAgo * 60_000);
    const parts = formatter.formatToParts(scheduledAt);
    const part = (name: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === name)?.value;
    const year = part('year');
    const month = part('month');
    const day = part('day');
    const hour = part('hour');
    const minute = part('minute');
    if (!year || !month || !day || !hour || !minute) {
      throw new Error('Could not determine reminder local time');
    }
    const date = `${year}-${month}-${day}`;
    const time = `${hour}:${minute}`;
    if (times.includes(time)) due.set(`${date} ${time}`, { date, time, scheduledAt });
  }
  return [...due.values()];
}

interface ReminderInput {
  now: Date;
  deliveryNow?: Date;
  timezone: string;
  endDate: string | null;
  milestone: number;
  total: number;
  todayTotal: number;
  sessionType: string;
  exerciseName: string | null;
}

export function getDailyReminder(input: ReminderInput): { date: string; body: string } | null {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: input.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const localTime = (instant: Date) => {
    const parts = formatter.formatToParts(instant);
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
    const date = `${year}-${month}-${day}`;
    return { date, time: new Date(`${date}T${hour}:${minute}:${second}`) };
  };
  if (!input.endDate || input.total >= input.milestone) return null;

  const { date, time: localNow } = localTime(input.now);
  const endDate = new Date(input.endDate);
  if (!Number.isFinite(endDate.getTime())) {
    throw new Error('Invalid competition deadline');
  }
  if (input.deliveryNow && endDate.getTime() <= localTime(input.deliveryNow).time.getTime()) return null;
  const days = getCalendarDaysRemaining(endDate, localNow);
  if (days <= 0) return null;

  const pace = getRequiredDailyPace(input.milestone - input.total, days, input.sessionType);
  if (input.todayTotal >= pace) return null;

  const activity = input.sessionType === 'plank'
    ? 'plank'
    : input.sessionType === 'custom'
      ? input.exerciseName?.trim() || 'exercises'
      : 'push-ups';
  const unit = input.sessionType === 'plank' ? ' min' : '';
  return {
    date,
    body: `Time for ${activity}! ${pace}${unit}/day needed; ${input.total}/${input.milestone}${unit} done.`,
  };
}
