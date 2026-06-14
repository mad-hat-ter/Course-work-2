import { describe, expect, it } from 'vitest';

import {
  buildHourSlots,
  findDayShiftTypeId,
  findNightShiftTypeId,
  getDefaultShiftTypeIdForHour,
  formatGridDate,
  getDaysBetween,
  isNightShiftHour,
  isRoundTheClockHours,
  remapShiftDateToSchedule,
  resolveCellShiftTypeId,
  sortHourSlots,
  getShiftEndIso,
  getShiftCellKey,
  getShiftCellKeyFromIso,
} from './scheduleForm';

const shiftTypes = [
  { id: 1, title: 'Обычная' },
  { id: 2, title: 'Ночная' },
];

describe('scheduleForm', () => {
  it('выбирает обычный тип смены по умолчанию', () => {
    const id = findDayShiftTypeId([
      { id: 1, title: 'Ночная' },
      { id: 2, title: 'Обычная' },
    ]);
    expect(id).toBe(2);
  });

  it('возвращает первый тип, если обычный не найден', () => {
    const id = findDayShiftTypeId([{ id: 5, title: 'Ночная' }]);
    expect(id).toBe(5);
  });

  it('находит ночной тип смены', () => {
    expect(findNightShiftTypeId(shiftTypes)).toBe(2);
    expect(findNightShiftTypeId([{ id: 1, title: 'Обычная' }])).toBeUndefined();
  });

  it('строит круглосуточные часы для 00:00-00:00', () => {
    expect(isRoundTheClockHours('00:00', '00:00')).toBe(true);
    expect(buildHourSlots('00:00', '00:00')).toEqual([
      '00:00',
      '01:00',
      '02:00',
      '03:00',
      '04:00',
      '05:00',
      '06:00',
      '07:00',
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
      '23:00',
    ]);
  });

  it('строит ночной диапазон через полночь', () => {
    expect(buildHourSlots('22:00', '06:00')).toEqual([
      '22:00',
      '23:00',
      '00:00',
      '01:00',
      '02:00',
      '03:00',
      '04:00',
      '05:00',
    ]);
  });

  it('сортирует часы по номеру', () => {
    expect(sortHourSlots(['12:00', '01:00', '23:00', '00:00'])).toEqual([
      '00:00',
      '01:00',
      '12:00',
      '23:00',
    ]);
  });

  it('определяет ночные часы с 23 до 8', () => {
    expect(isNightShiftHour('23:00')).toBe(true);
    expect(isNightShiftHour('07:00')).toBe(true);
    expect(isNightShiftHour('08:00')).toBe(false);
    expect(isNightShiftHour('12:00')).toBe(false);
  });

  it('подставляет ночной тип для ночных часов', () => {
    expect(getDefaultShiftTypeIdForHour('23:00', shiftTypes)).toBe(2);
    expect(getDefaultShiftTypeIdForHour('07:00', shiftTypes)).toBe(2);
    expect(getDefaultShiftTypeIdForHour('12:00', shiftTypes)).toBe(1);
  });

  it('перезаписывает обычный тип на ночной для ночных часов', () => {
    expect(resolveCellShiftTypeId('02:00', shiftTypes, 1)).toBe(2);
    expect(resolveCellShiftTypeId('07:00', shiftTypes, 1)).toBe(2);
  });

  it('сохраняет выбранный тип для дневных часов', () => {
    expect(resolveCellShiftTypeId('12:00', shiftTypes, 2)).toBe(2);
    expect(resolveCellShiftTypeId('12:00', shiftTypes)).toBe(1);
  });

  it('форматирует дату сетки с днём недели', () => {
    expect(formatGridDate('2026-06-08T00:00:00')).toMatch(/^пн, 08\.06$/);
  });

  it('строит дни периода без дубликатов', () => {
    const days = getDaysBetween('2026-06-22', '2026-06-25');
    expect(days.map((day) => day.date)).toEqual([
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
    ]);
  });

  it('переносит смену на следующий день расписания', () => {
    const remapped = remapShiftDateToSchedule('2026-06-24', [
      '2026-06-22',
      '2026-06-23',
      '2026-06-25',
    ]);
    expect(remapped).toBe('2026-06-25');
  });

  it('возвращает пустой диапазон при одинаковом начале и конце', () => {
    expect(buildHourSlots('12:00', '12:00')).toEqual([]);
  });

  it('строит обычный дневной диапазон часов', () => {
    expect(buildHourSlots('08:00', '11:00')).toEqual([
      '08:00',
      '09:00',
      '10:00',
    ]);
  });

  it('вычисляет конец смены и переход через полночь', () => {
    expect(getShiftEndIso('2026-06-15', '12:00')).toBe('2026-06-15T13:00:00');
    expect(getShiftEndIso('2026-06-15', '23:00')).toBe('2026-06-16T00:00:00');
  });

  it('строит ключи ячеек смены', () => {
    expect(getShiftCellKey('2026-06-15', '12:00')).toBe('2026-06-15-12:00');
    expect(getShiftCellKeyFromIso('2026-06-15T12:00:00')).toBe(
      '2026-06-15-12:00'
    );
  });
});
