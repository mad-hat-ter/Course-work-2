import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const MSK_TIMEZONE = 'Europe/Moscow';
const MSK_OFFSET_HOURS = 3;

const NAIVE_ISO_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/;

export const hasExplicitTimezone = (iso: string) =>
  /[zZ]$/.test(iso) || /[+-]\d{2}:\d{2}$/.test(iso);

export const parseMoscowDateTimeMs = (iso: string): number => {
  if (!iso) return Number.NaN;

  if (hasExplicitTimezone(iso)) {
    return new Date(iso).getTime();
  }

  const match = iso.match(NAIVE_ISO_REGEX);
  if (!match) return Number.NaN;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - MSK_OFFSET_HOURS,
    Number(minute),
    Number(second)
  );
};

export const parseMoscowDateOnlyMs = (date: string): number =>
  parseMoscowDateTimeMs(`${date}T12:00:00`);

export const getMoscowNowMs = (): number => Date.now();

export const toMoscowDateInput = (iso: string): string => {
  if (!iso) return '';

  if (hasExplicitTimezone(iso)) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: MSK_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  }

  return iso.includes('T') ? iso.split('T')[0] : iso;
};

export const toMoscowTimeInput = (iso: string): string => {
  if (!iso || !iso.includes('T')) return '';

  if (hasExplicitTimezone(iso)) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: MSK_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  }

  const timePart = iso.split('T')[1] ?? '';
  const [hours = '', minutes = ''] = timePart.split(':');
  if (!hours || !minutes) return '';
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

export const formatMoscowDate = (
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
): string => {
  let ms: number;

  if (typeof value === 'string') {
    ms = value.includes('T')
      ? parseMoscowDateTimeMs(value)
      : parseMoscowDateOnlyMs(value);
  } else if (typeof value === 'number') {
    ms = value;
  } else {
    ms = value.getTime();
  }

  if (Number.isNaN(ms)) return '';

  return new Intl.DateTimeFormat('ru-RU', {
    ...options,
    timeZone: MSK_TIMEZONE,
  }).format(ms);
};

export const formatMoscowDateTime = (iso: string): string => {
  if (!iso) return '';
  return `${formatMoscowDate(iso)} ${toMoscowTimeInput(iso)}`;
};

export const formatMoscowWeekdayLong = (dateStr: string): string => {
  const weekday = formatMoscowDate(dateStr, { weekday: 'long' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
};

export const getMoscowTodayDate = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: MSK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export const addMoscowDays = (date: string, days: number): string => {
  const ms = parseMoscowDateOnlyMs(date) + days * 24 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MSK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ms);
};

export const getMoscowWeekday = (date: string): number => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: MSK_TIMEZONE,
    weekday: 'short',
  }).format(parseMoscowDateOnlyMs(date));

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? 0;
};

export const compareMoscowDateTime = (leftIso: string, rightIso: string): number =>
  parseMoscowDateTimeMs(leftIso) - parseMoscowDateTimeMs(rightIso);

export const isMoscowDateTimeUpcoming = (
  iso: string,
  nowMs: number = getMoscowNowMs()
): boolean => {
  const startMs = parseMoscowDateTimeMs(iso);
  return !Number.isNaN(startMs) && startMs >= nowMs;
};

export const getMoscowDayjs = (): Dayjs => dayjs().tz(MSK_TIMEZONE);

export const createMoscowTime = (time: string): Dayjs | null => {
  if (!time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return getMoscowDayjs().hour(hours).minute(minutes).second(0).millisecond(0);
};
