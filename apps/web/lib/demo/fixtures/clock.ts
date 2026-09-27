// Fixture timestamps are relative to the moment the demo state is seeded, so a
// fresh demo always reads as recent activity.
export function clock(now: number) {
  const HOUR = 3600_000;
  const DAY = 24 * HOUR;
  const iso = (ms: number) => new Date(ms).toISOString();
  return {
    now: iso(now),
    minutesAgo: (m: number) => iso(now - m * 60_000),
    hoursAgo: (h: number) => iso(now - h * HOUR),
    daysAgo: (d: number, h = 0) => iso(now - d * DAY - h * HOUR),
    hoursFromNow: (h: number) => iso(now + h * HOUR),
    daysFromNow: (d: number) => iso(now + d * DAY),
    /** Calendar date (midnight UTC) d days out, for campaign start/end dates. */
    dateFromNow: (d: number) => new Date(now + d * DAY).toISOString().slice(0, 10) + 'T00:00:00.000Z',
  };
}

export type Clock = ReturnType<typeof clock>;
