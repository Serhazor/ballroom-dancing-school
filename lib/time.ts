import { TZDate } from "@date-fns/tz";

/** The studio is in Mullingar, so every date the user sees is Irish local time. */
export const TZ = "Europe/Dublin";

const timeFmt = new Intl.DateTimeFormat("en-IE", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});
const dateFmt = new Intl.DateTimeFormat("en-IE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});
const shortDateFmt = new Intl.DateTimeFormat("en-IE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});
const keyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});
const monthFmt = new Intl.DateTimeFormat("en-IE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const fmtTime = (d: Date) => timeFmt.format(d).replace(/\s/g, " ").toUpperCase();
export const fmtDate = (d: Date) => dateFmt.format(d);
export const fmtShortDate = (d: Date) => shortDateFmt.format(d);
/** "YYYY-MM-DD" of the given instant in Irish local time. */
export const dayKey = (d: Date) => keyFmt.format(d);

/** Convert Irish wall-clock date ("YYYY-MM-DD") and time ("HH:mm") to a real instant. */
export function zonedDate(date: string, time = "00:00"): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, TZ).getTime());
}

/** 0 = Sunday ... 6 = Saturday, for a calendar date. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function isYearMonth(v: string | undefined): v is string {
  return !!v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 1)));
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + delta, 1));
  return t.toISOString().slice(0, 7);
}

/** Cells for a Monday-first month grid: null for padding, otherwise "YYYY-MM-DD". */
export function monthGrid(ym: string): (string | null)[] {
  const [y, m] = ym.split("-").map(Number);
  const first = `${ym}-01`;
  const lead = (weekdayOf(first) + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export const HOUR_MS = 3_600_000;

const partsFmt = new Intl.DateTimeFormat("en-IE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TZ,
});
/** Weekday, day number and month as separate strings, for calendar-style cards. */
export function dateParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { weekday: p.weekday, day: p.day, month: p.month };
}
