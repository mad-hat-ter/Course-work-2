import { describe, expect, it } from 'vitest';
import {
  addMoscowDays,
  compareMoscowDateTime,
  formatMoscowDate,
  getMoscowTodayDate,
  getMoscowWeekday,
  isMoscowDateTimeUpcoming,
  parseMoscowDateTimeMs,
  toMoscowDateInput,
  toMoscowTimeInput,
} from './moscowTime';

describe('parseMoscowDateTimeMs', () => {
  it('treats naive datetime as Moscow wall clock', () => {
    const ms = parseMoscowDateTimeMs('2026-06-15T14:00:00');
    expect(new Date(ms).toISOString()).toBe('2026-06-15T11:00:00.000Z');
  });

  it('parses explicit timezone offsets', () => {
    const ms = parseMoscowDateTimeMs('2026-06-15T14:00:00+03:00');
    expect(new Date(ms).toISOString()).toBe('2026-06-15T11:00:00.000Z');
  });
});

describe('toMoscowDateInput', () => {
  it('extracts Moscow calendar date from naive datetime', () => {
    expect(toMoscowDateInput('2026-06-15T23:30:00')).toBe('2026-06-15');
  });
});

describe('toMoscowTimeInput', () => {
  it('extracts Moscow wall clock time from naive datetime', () => {
    expect(toMoscowTimeInput('2026-06-15T23:30:00')).toBe('23:30');
  });
});

describe('isMoscowDateTimeUpcoming', () => {
  it('includes shifts starting at the current Moscow instant', () => {
    const nowMs = parseMoscowDateTimeMs('2026-06-15T14:00:00');
    expect(isMoscowDateTimeUpcoming('2026-06-15T14:00:00', nowMs)).toBe(true);
  });

  it('excludes shifts that already started in Moscow', () => {
    const nowMs = parseMoscowDateTimeMs('2026-06-15T15:00:00');
    expect(isMoscowDateTimeUpcoming('2026-06-15T14:00:00', nowMs)).toBe(false);
  });
});

describe('addMoscowDays', () => {
  it('adds days in Moscow calendar', () => {
    expect(addMoscowDays('2026-06-15', 2)).toBe('2026-06-17');
  });
});

describe('compareMoscowDateTime', () => {
  it('sorts naive datetimes by Moscow wall clock', () => {
    expect(
      compareMoscowDateTime('2026-06-15T10:00:00', '2026-06-15T12:00:00')
    ).toBeLessThan(0);
  });
});

describe('formatMoscowDate', () => {
  it('formats naive datetime in ru-RU using Moscow timezone', () => {
    expect(formatMoscowDate('2026-06-15T14:00:00')).toMatch(/15\.06\.2026/);
  });
});

describe('getMoscowWeekday', () => {
  it('returns weekday for Moscow calendar date', () => {
    expect(getMoscowWeekday('2026-06-08')).toBe(1);
  });
});

describe('getMoscowTodayDate', () => {
  it('returns YYYY-MM-DD', () => {
    expect(getMoscowTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatMoscowDateTime', () => {
  it('formats date and time together', async () => {
    const { formatMoscowDateTime, formatMoscowWeekdayLong } = await import(
      './moscowTime'
    );
    expect(formatMoscowDateTime('2026-06-15T14:00:00')).toMatch(
      /15\.06\.2026 14:00/
    );
    expect(formatMoscowWeekdayLong('2026-06-08')).toMatch(/^Понедельник/i);
  });
});
