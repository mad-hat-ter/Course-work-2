import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { Schedule, User } from '../types';
import {
  applyShiftAssignment,
  getStoredScheduleId,
  isValidShiftUserRecordId,
  removeShiftUserFromSchedule,
  setStoredScheduleId,
} from './scheduleCache';

const baseSchedule = (): Schedule => ({
  id: 1,
  creator_id: 1,
  start_date: '2026-06-22T00:00:00',
  end_date: '2026-06-28T00:00:00',
  opening_date: '2026-06-10T00:00:00',
  ending_date: '2026-06-20T00:00:00',
  create_date: '2026-06-01T00:00:00',
  user: {} as Schedule['user'],
  shift_schedule: [
    {
      id: 1,
      schedule_id: 1,
      shift_id: 10,
      shift: {
        id: 10,
        type_id: 1,
        start_time: '2026-06-23T08:00:00',
        end_time: '2026-06-23T17:00:00',
        is_free: true,
        max_user: 2,
        shift_type: {
          id: 1,
          title: 'Обычная',
          rate: 100,
          quantity_for_increased_payment: 0,
          increased_payment: 0,
        },
        shift_user: [],
      },
    },
  ],
});

const firstShift = (schedule: Schedule) => schedule.shift_schedule[0]!.shift!;

describe('scheduleCache', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('сохраняет и читает выбранное расписание', () => {
    expect(getStoredScheduleId()).toBe('');
    setStoredScheduleId(12);
    expect(getStoredScheduleId()).toBe(12);
    setStoredScheduleId('');
    expect(getStoredScheduleId()).toBe('');
  });

  it('проверяет валидный id записи на смену', () => {
    expect(isValidShiftUserRecordId(42)).toBe(true);
    expect(isValidShiftUserRecordId(1781212955891)).toBe(false);
  });

  it('добавляет пользователя локально, если ответ API пустой', () => {
    const user = {
      id: 5,
      name: 'Иван',
      surname: 'Иванов',
      lastname: '',
      email: 'ivan@test.ru',
      phone: '',
      role: 'CURATOR',
      is_active: true,
      registration_date: '2026-01-01T00:00:00',
      last_login: null,
      position_id: 1,
    } as User;

    const updated = applyShiftAssignment(baseSchedule(), 10, 5, user, {
      id: 10,
      type_id: 1,
      start_time: '2026-06-23T08:00:00',
      end_time: '2026-06-23T17:00:00',
      is_free: true,
      max_user: 2,
      shift_type: firstShift(baseSchedule()).shift_type,
      shift_user: [],
    });

    const users = firstShift(updated).shift_user ?? [];
    expect(users).toHaveLength(1);
    expect(users[0].user_id).toBe(5);
    expect(users[0].user?.name).toBe('Иван');
  });

  it('добавляет пользователя из ответа API', () => {
    const updated = applyShiftAssignment(baseSchedule(), 10, 5, null, {
      id: 10,
      type_id: 1,
      start_time: '2026-06-23T08:00:00',
      end_time: '2026-06-23T17:00:00',
      is_free: true,
      max_user: 2,
      shift_type: firstShift(baseSchedule()).shift_type,
      shift_user: [{ id: 99, shift_id: 10, user_id: 5, user: null }],
    });

    const users = firstShift(updated).shift_user ?? [];
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(99);
  });

  it('обновляет пользователя в существующей записи', () => {
    const schedule = applyShiftAssignment(baseSchedule(), 10, 5, null, {
      id: 10,
      type_id: 1,
      start_time: '2026-06-23T08:00:00',
      end_time: '2026-06-23T17:00:00',
      is_free: true,
      max_user: 2,
      shift_type: firstShift(baseSchedule()).shift_type,
      shift_user: [{ id: 99, shift_id: 10, user_id: 5, user: null }],
    });

    const user = {
      id: 5,
      name: 'Иван',
      surname: 'Иванов',
      lastname: '',
      email: 'ivan@test.ru',
      phone: '',
      role: 'CURATOR',
      is_active: true,
      registration_date: '2026-01-01T00:00:00',
      last_login: null,
      position_id: 1,
    } as User;

    const updated = applyShiftAssignment(schedule, 10, 5, user, undefined);
    expect(firstShift(updated).shift_user?.[0].user?.name).toBe('Иван');
  });

  it('удаляет пользователя по user_id при временном id', () => {
    const schedule = applyShiftAssignment(baseSchedule(), 10, 5, null, {
      id: 10,
      type_id: 1,
      start_time: '2026-06-23T08:00:00',
      end_time: '2026-06-23T17:00:00',
      is_free: true,
      max_user: 2,
      shift_type: firstShift(baseSchedule()).shift_type,
      shift_user: [{ id: 1781212955891, shift_id: 10, user_id: 5, user: null }],
    });

    const updated = removeShiftUserFromSchedule(
      schedule,
      1781212955891,
      5,
      10
    );
    expect(firstShift(updated).shift_user).toEqual([]);
  });
});
