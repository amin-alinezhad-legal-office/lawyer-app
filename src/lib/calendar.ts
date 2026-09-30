import * as jalaali from "jalaali-js";

export type CalendarMode = "shamsi" | "miladi";

export type CalendarParts = {
  year: number;
  month: number; // 1-12
  day: number;
};

export const SHAMSI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const MILADI_MONTHS = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
] as const;

/** Week starts Saturday for Iranian calendar UI */
export const WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function gregorianToParts(date: Date): CalendarParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function partsToGregorian({ year, month, day }: CalendarParts): Date {
  return new Date(year, month - 1, day);
}

export function gregorianToJalali(date: Date): CalendarParts {
  const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { year: jy, month: jm, day: jd };
}

export function jalaliToGregorian({ year, month, day }: CalendarParts): Date {
  const { gy, gm, gd } = jalaali.toGregorian(year, month, day);
  return new Date(gy, gm - 1, gd);
}

export function daysInMonth(mode: CalendarMode, year: number, month: number) {
  if (mode === "shamsi") return jalaali.jalaaliMonthLength(year, month);
  return new Date(year, month, 0).getDate();
}

/** 0 = Saturday … 6 = Friday */
export function weekStartOffset(mode: CalendarMode, year: number, month: number) {
  const first =
    mode === "shamsi"
      ? jalaliToGregorian({ year, month, day: 1 })
      : partsToGregorian({ year, month, day: 1 });
  // JS: 0 Sun … 6 Sat → map to Sat-first index
  return (first.getDay() + 1) % 7;
}

export function shiftMonth(
  mode: CalendarMode,
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  let nextMonth = month + delta;
  let nextYear = year;
  while (nextMonth > 12) {
    nextMonth -= 12;
    nextYear += 1;
  }
  while (nextMonth < 1) {
    nextMonth += 12;
    nextYear -= 1;
  }
  return { year: nextYear, month: nextMonth };
}

export function sameDay(a: CalendarParts, b: CalendarParts) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function formatPartsLabel(mode: CalendarMode, parts: CalendarParts, withDigits = true) {
  const monthName =
    mode === "shamsi" ? SHAMSI_MONTHS[parts.month - 1] : MILADI_MONTHS[parts.month - 1];
  const raw = `${parts.day} ${monthName} ${parts.year}`;
  return withDigits && mode === "shamsi" ? toPersianDigits(raw) : raw;
}

export function formatMonthTitle(mode: CalendarMode, year: number, month: number) {
  const monthName = mode === "shamsi" ? SHAMSI_MONTHS[month - 1] : MILADI_MONTHS[month - 1];
  const raw = `${monthName} ${year}`;
  return mode === "shamsi" ? toPersianDigits(raw) : raw;
}

/** Value for `<input type="datetime-local">` / form posts: YYYY-MM-DDTHH:mm */
export function toDateTimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, m, d, h, min] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
}

export function getPartsForMode(mode: CalendarMode, date: Date): CalendarParts {
  return mode === "shamsi" ? gregorianToJalali(date) : gregorianToParts(date);
}

export function dateFromParts(mode: CalendarMode, parts: CalendarParts, hours: number, minutes: number) {
  const base = mode === "shamsi" ? jalaliToGregorian(parts) : partsToGregorian(parts);
  base.setHours(hours, minutes, 0, 0);
  return base;
}
