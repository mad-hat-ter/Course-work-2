import { describe, expect, it } from 'vitest';

import type { User } from '../types';
import {
  formatMoney,
  formatScheduleGridUserName,
  formatUserName,
  isShiftUpcomingInMoscow,
} from './format';

const user: User = {
  id: 1,
  name: 'Иван',
  surname: 'Иванов',
  lastname: 'Иванович',
  email: 'ivan@test.ru',
  phone: '',
  role: 'CURATOR',
  is_active: true,
  registration_date: '2026-01-01T00:00:00',
  last_login: null,
  position_id: 1,
};

describe('format', () => {
  it('форматирует полное имя пользователя', () => {
    expect(formatUserName(user)).toBe('Иванов Иван Иванович');
    expect(formatUserName(null)).toBeNull();
  });

  it('форматирует имя для сетки без отчества', () => {
    expect(formatScheduleGridUserName(user)).toBe('Иванов Иван');
    expect(formatScheduleGridUserName(null)).toBeNull();
  });

  it('форматирует деньги в ru-RU', () => {
    expect(formatMoney(9000)).toMatch(/9\s?000/);
  });

  it('проверяет, что смена ещё не началась', () => {
    expect(isShiftUpcomingInMoscow('2026-12-31T23:00:00')).toBe(true);
  });
});
