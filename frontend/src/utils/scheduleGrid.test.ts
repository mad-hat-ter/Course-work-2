import { describe, expect, it } from 'vitest';

import type { Schedule } from '../types';
import { buildScheduleGrid } from './scheduleGrid';

const baseSchedule = (): Schedule => ({
  id: 1,
  creator_id: 1,
  start_date: '2026-06-15T00:00:00',
  end_date: '2026-06-18T00:00:00',
  opening_date: '2026-06-01T00:00:00',
  ending_date: '2026-06-20T00:00:00',
  create_date: '2026-06-01T00:00:00',
  user: {} as Schedule['user'],
  shift_schedule: [],
});

const shiftType = {
  id: 1,
  title: 'Обычная',
  rate: 100,
  quantity_for_increased_payment: 0,
  increased_payment: 0,
};

describe('buildScheduleGrid', () => {
  it('объединяет записи из нескольких смен в одной ячейке', () => {
    const schedule = baseSchedule();
    schedule.shift_schedule = [
      {
        id: 1,
        schedule_id: 1,
        shift_id: 10,
        shift: {
          id: 10,
          type_id: 1,
          start_time: '2026-06-16T12:00:00',
          end_time: '2026-06-16T13:00:00',
          is_free: true,
          max_user: 1,
          shift_type: shiftType,
          shift_user: [
            {
              id: 101,
              shift_id: 10,
              user_id: 5,
              user: {
                id: 5,
                surname: 'Иванов',
                name: 'Иван',
                lastname: '',
              } as never,
            },
          ],
        },
      },
      {
        id: 2,
        schedule_id: 1,
        shift_id: 11,
        shift: {
          id: 11,
          type_id: 1,
          start_time: '2026-06-16T12:00:00',
          end_time: '2026-06-16T13:00:00',
          is_free: true,
          max_user: 1,
          shift_type: shiftType,
          shift_user: [],
        },
      },
    ];

    const grid = buildScheduleGrid(schedule);
    const cell = grid.grid['12:00-вт, 16.06'];

    expect(cell.entries).toHaveLength(1);
    expect(cell.entries[0].curatorName).toBe('Иванов Иван');
    expect(cell.hasFreeSlot).toBe(true);
    expect(cell.shiftId).toBe(11);
  });

  it('не показывает отчество в ячейке сетки', () => {
    const schedule = baseSchedule();
    schedule.shift_schedule = [
      {
        id: 1,
        schedule_id: 1,
        shift_id: 10,
        shift: {
          id: 10,
          type_id: 1,
          start_time: '2026-06-16T12:00:00',
          end_time: '2026-06-16T13:00:00',
          is_free: true,
          max_user: 1,
          shift_type: shiftType,
          shift_user: [
            {
              id: 101,
              shift_id: 10,
              user_id: 5,
              user: {
                id: 5,
                surname: 'Иванов',
                name: 'Иван',
                lastname: 'Иванович',
              } as never,
            },
          ],
        },
      },
    ];

    const grid = buildScheduleGrid(schedule);
    const cell = grid.grid['12:00-вт, 16.06'];

    expect(cell.entries[0].curatorName).toBe('Иванов Иван');
  });

  it('не показывает свободное место, если все смены заняты', () => {
    const schedule = baseSchedule();
    schedule.shift_schedule = [
      {
        id: 1,
        schedule_id: 1,
        shift_id: 10,
        shift: {
          id: 10,
          type_id: 1,
          start_time: '2026-06-16T12:00:00',
          end_time: '2026-06-16T13:00:00',
          is_free: true,
          max_user: 1,
          shift_type: shiftType,
          shift_user: [{ id: 101, shift_id: 10, user_id: 5, user: null }],
        },
      },
      {
        id: 2,
        schedule_id: 1,
        shift_id: 11,
        shift: {
          id: 11,
          type_id: 1,
          start_time: '2026-06-16T12:00:00',
          end_time: '2026-06-16T13:00:00',
          is_free: true,
          max_user: 1,
          shift_type: shiftType,
          shift_user: [{ id: 102, shift_id: 11, user_id: 6, user: null }],
        },
      },
    ];

    const grid = buildScheduleGrid(schedule);
    const cell = grid.grid['12:00-вт, 16.06'];

    expect(cell.entries).toHaveLength(2);
    expect(cell.hasFreeSlot).toBe(false);
  });

  it('строит часы из периода, если смен ещё нет', () => {
    const schedule = baseSchedule();
    schedule.start_date = '2026-06-15T00:00:00';
    schedule.end_date = '2026-06-16T00:00:00';
    schedule.shift_schedule = [];

    const grid = buildScheduleGrid(schedule);

    expect(grid.times.length).toBeGreaterThan(0);
    expect(Object.keys(grid.grid).length).toBeGreaterThan(0);
  });
});
