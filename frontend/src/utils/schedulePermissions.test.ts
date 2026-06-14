import { describe, expect, it } from 'vitest';

import {
  canCuratorRemoveFromShift,
  canCuratorSignupToShift,
  getScheduleRegistrationHint,
  isScheduleRegistrationOpen,
} from './schedulePermissions';
import { parseMoscowDateTimeMs } from './moscowTime';

const schedule = {
  opening_date: '2026-06-10T00:00:00',
  ending_date: '2026-06-20T23:59:59',
};

describe('schedulePermissions', () => {
  it('определяет открытую запись', () => {
    const nowMs = parseMoscowDateTimeMs('2026-06-15T12:00:00');
    expect(isScheduleRegistrationOpen(schedule, nowMs)).toBe(true);
    expect(canCuratorRemoveFromShift(schedule, nowMs)).toBe(true);
  });

  it('разрешает запись на будущую смену после закрытия', () => {
    const nowMs = parseMoscowDateTimeMs('2026-06-25T12:00:00');
    expect(
      canCuratorSignupToShift(schedule, '2026-07-01T08:00:00', nowMs)
    ).toBe(true);
    expect(canCuratorRemoveFromShift(schedule, nowMs)).toBe(false);
  });

  it('запрещает запись на прошедшую смену после закрытия', () => {
    const nowMs = parseMoscowDateTimeMs('2026-06-25T12:00:00');
    expect(
      canCuratorSignupToShift(schedule, '2026-06-01T08:00:00', nowMs)
    ).toBe(false);
  });

  it('запрещает запись до открытия периода', () => {
    const nowMs = parseMoscowDateTimeMs('2026-06-01T12:00:00');
    expect(
      canCuratorSignupToShift(schedule, '2026-06-15T08:00:00', nowMs)
    ).toBe(false);
  });

  it('возвращает подсказки по статусу записи', () => {
    const openMs = parseMoscowDateTimeMs('2026-06-15T12:00:00');
    expect(getScheduleRegistrationHint(schedule, openMs)).toContain('открыта');

    const closedMs = parseMoscowDateTimeMs('2026-06-25T12:00:00');
    expect(getScheduleRegistrationHint(schedule, closedMs)).toContain('закрыта');

    const beforeOpenMs = parseMoscowDateTimeMs('2026-06-01T12:00:00');
    expect(getScheduleRegistrationHint(schedule, beforeOpenMs)).toContain(
      'не открыта'
    );
  });
});
