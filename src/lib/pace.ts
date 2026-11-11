export function getCalendarDaysRemaining(endDate: Date, currentDate: Date): number {
  if (endDate.getTime() <= currentDate.getTime()) return 0;

  const today = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const lastActivityDate = new Date(endDate);
  if (
    lastActivityDate.getHours() === 0 &&
    lastActivityDate.getMinutes() === 0 &&
    lastActivityDate.getSeconds() === 0 &&
    lastActivityDate.getMilliseconds() === 0
  ) {
    lastActivityDate.setDate(lastActivityDate.getDate() - 1);
  }
  const deadline = Date.UTC(
    lastActivityDate.getFullYear(),
    lastActivityDate.getMonth(),
    lastActivityDate.getDate(),
  );

  return Math.max(0, Math.floor((deadline - today) / 86_400_000) + 1);
}

export function roundUpToActivityIncrement(value: number, increment: number): number {
  return Math.ceil((value - Number.EPSILON) / increment) * increment;
}

export function getRequiredDailyPace(
  remaining: number,
  daysRemaining: number,
  sessionType: string,
): number {
  return roundUpToActivityIncrement(
    remaining / daysRemaining,
    sessionType === 'plank' ? 0.25 : 1,
  );
}
