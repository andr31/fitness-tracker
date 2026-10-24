export interface DailyActivityEntry {
  date: string;
  total: number | string;
}

export interface CalendarActivityStats {
  total: number;
  days: number;
  average: number;
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getCalendarActivityStats(
  entries: readonly DailyActivityEntry[],
  createdAt: string | undefined,
  currentDate = new Date(),
): CalendarActivityStats {
  const today = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 29);

  const createdDate = createdAt ? new Date(createdAt) : null;
  if (createdDate && Number.isFinite(createdDate.getTime())) {
    const createdDay = new Date(
      createdDate.getFullYear(),
      createdDate.getMonth(),
      createdDate.getDate(),
    );
    if (createdDay > windowStart) {
      windowStart.setTime(createdDay.getTime());
    }
  }

  const startKey = formatLocalDate(windowStart);
  const todayKey = formatLocalDate(today);
  const days = Math.max(
    1,
    Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(
          windowStart.getFullYear(),
          windowStart.getMonth(),
          windowStart.getDate(),
        )) /
        86_400_000,
    ) + 1,
  );
  const total = entries.reduce((sum, entry) => {
    if (entry.date < startKey || entry.date > todayKey) return sum;
    const amount = Number(entry.total);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return { total, days, average: total / days };
}
