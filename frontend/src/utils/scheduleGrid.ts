import type { Schedule, Shift } from '../types';
import { formatScheduleGridUserName } from './format';
import {
  buildHourSlots,
  formatGridDate,
  getDaysBetween,
  remapShiftDateToSchedule,
  sortHourSlots,
  toDateInput,
  toLocalDateInput,
  toLocalTimeInput,
} from './scheduleForm';

export interface SlotEntry {
  id: string;
  userId: number;
  curatorName: string;
  isMine?: boolean;
}

export interface ScheduleCell {
  entries: SlotEntry[];
  hasFreeSlot: boolean;
  shiftId?: number;
  shiftStartTime?: string;
}

export interface ScheduleGridData {
  dates: string[];
  times: string[];
  grid: Record<string, ScheduleCell>;
}

interface CellShiftState {
  shiftId: number;
  shiftStartTime: string;
  maxUser: number;
  entries: SlotEntry[];
}

const normalizeShiftUsers = (shift: Shift) => {
  if (!shift.shift_user) return [];
  return Array.isArray(shift.shift_user) ? shift.shift_user : [shift.shift_user];
};

export const buildShiftEntries = (
  shift: Shift,
  currentUserId?: number
): SlotEntry[] => {
  const seenUserIds = new Set<number>();
  const entries: SlotEntry[] = [];

  normalizeShiftUsers(shift).forEach((shiftUser) => {
    if (seenUserIds.has(shiftUser.user_id)) return;
    seenUserIds.add(shiftUser.user_id);
    entries.push({
      id: String(shiftUser.id),
      userId: shiftUser.user_id,
      curatorName:
        formatScheduleGridUserName(shiftUser.user) ??
        `Куратор #${shiftUser.user_id}`,
      isMine: shiftUser.user_id === currentUserId,
    });
  });

  return entries;
};

const mergeEntries = (groups: SlotEntry[][]) => {
  const seenUserIds = new Set<number>();
  const merged: SlotEntry[] = [];

  groups.forEach((entries) => {
    entries.forEach((entry) => {
      if (seenUserIds.has(entry.userId)) return;
      seenUserIds.add(entry.userId);
      merged.push(entry);
    });
  });

  return merged;
};

const pickSignupShift = (shiftStates: CellShiftState[]) => {
  const withCapacity = shiftStates.find(
    (state) => state.entries.length < state.maxUser
  );
  return withCapacity ?? shiftStates[0];
};

export const buildScheduleGrid = (
  schedule: Schedule,
  currentUserId?: number
): ScheduleGridData => {
  const shifts = schedule.shift_schedule
    .map((item) => item.shift)
    .filter((shift): shift is NonNullable<typeof shift> => Boolean(shift));

  const periodDays = getDaysBetween(
    toDateInput(schedule.start_date),
    toDateInput(schedule.end_date)
  );

  const scheduleDates = periodDays.map((day) => day.date);
  const dateLabels = scheduleDates.map((date) =>
    formatGridDate(`${date}T00:00:00`)
  );

  const timesSet = new Set<string>();
  shifts.forEach((shift) => {
    timesSet.add(toLocalTimeInput(shift.start_time));
  });

  if (timesSet.size === 0 && periodDays.length > 0) {
    periodDays.forEach((day) => {
      buildHourSlots(day.start, day.end).forEach((hour) => timesSet.add(hour));
    });
  }

  const times = sortHourSlots(Array.from(timesSet));
  const grid: Record<string, ScheduleCell> = {};
  const cellShifts: Record<string, CellShiftState[]> = {};

  dateLabels.forEach((dateLabel) => {
    times.forEach((time) => {
      grid[`${time}-${dateLabel}`] = {
        entries: [],
        hasFreeSlot: false,
      };
    });
  });

  shifts.forEach((shift) => {
    const mappedDate = remapShiftDateToSchedule(
      toLocalDateInput(shift.start_time),
      scheduleDates
    );
    const dateLabel = formatGridDate(`${mappedDate}T00:00:00`);
    const time = toLocalTimeInput(shift.start_time);
    const cellKey = `${time}-${dateLabel}`;
    const entries = buildShiftEntries(shift, currentUserId);

    if (!cellShifts[cellKey]) {
      cellShifts[cellKey] = [];
    }

    cellShifts[cellKey].push({
      shiftId: shift.id,
      shiftStartTime: shift.start_time,
      maxUser: shift.max_user,
      entries,
    });
  });

  Object.entries(cellShifts).forEach(([cellKey, shiftStates]) => {
    const signupShift = pickSignupShift(shiftStates);
    const entries = mergeEntries(shiftStates.map((state) => state.entries));

    grid[cellKey] = {
      entries,
      hasFreeSlot: shiftStates.some(
        (state) => state.entries.length < state.maxUser
      ),
      shiftId: signupShift.shiftId,
      shiftStartTime: signupShift.shiftStartTime,
    };
  });

  return { dates: dateLabels, times, grid };
};
