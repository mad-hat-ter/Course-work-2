import type { Schedule, Shift, Shift_user, User } from '../types';

export const SELECTED_SCHEDULE_KEY = 'schedule_selected_id';

export const getStoredScheduleId = (): number | '' => {
  const cached = localStorage.getItem(SELECTED_SCHEDULE_KEY);
  if (!cached) return '';
  const id = Number(cached);
  return Number.isNaN(id) ? '' : id;
};

export const setStoredScheduleId = (scheduleId: number | '') => {
  if (scheduleId === '') {
    localStorage.removeItem(SELECTED_SCHEDULE_KEY);
    return;
  }
  localStorage.setItem(SELECTED_SCHEDULE_KEY, String(scheduleId));
};

const normalizeShiftUsers = (shiftUsers?: Shift_user[] | Shift_user | null) => {
  if (!shiftUsers) return [];
  return Array.isArray(shiftUsers) ? shiftUsers : [shiftUsers];
};

export const isValidShiftUserRecordId = (id: number) =>
  Number.isInteger(id) && id > 0 && id <= 2_147_483_647;

export const applyShiftAssignment = (
  schedule: Schedule,
  shiftId: number,
  userId: number,
  user: User | null | undefined,
  updatedShift?: Shift
): Schedule => ({
  ...schedule,
  shift_schedule: schedule.shift_schedule.map((item) => {
    if (item.shift?.id !== shiftId) return item;

    const existingUsers = normalizeShiftUsers(item.shift.shift_user);
    const responseUsers = updatedShift
      ? normalizeShiftUsers(updatedShift.shift_user)
      : [];

    let shiftUserList =
      responseUsers.length > 0 ? responseUsers : existingUsers;

    if (!shiftUserList.some((entry) => entry.user_id === userId)) {
      shiftUserList = [
        ...shiftUserList,
        {
          id: -(userId || Date.now()),
          shift_id: shiftId,
          user_id: userId,
          user: user ?? null,
        },
      ];
    } else if (user) {
      shiftUserList = shiftUserList.map((entry) =>
        entry.user_id === userId && !entry.user
          ? { ...entry, user }
          : entry
      );
    }

    return {
      ...item,
      shift: {
        ...item.shift,
        ...(updatedShift ?? {}),
        shift_user: shiftUserList,
      },
    };
  }),
});

export const removeShiftUserFromSchedule = (
  schedule: Schedule,
  shiftUserId: number,
  userId?: number,
  shiftId?: number
): Schedule => ({
  ...schedule,
  shift_schedule: schedule.shift_schedule.map((item) => {
    if (!item.shift?.shift_user) return item;
    if (shiftId !== undefined && item.shift.id !== shiftId) return item;

    const shiftUsers = Array.isArray(item.shift.shift_user)
      ? item.shift.shift_user
      : [item.shift.shift_user];

    return {
      ...item,
      shift: {
        ...item.shift,
        shift_user: shiftUsers.filter((shiftUser) => {
          if (isValidShiftUserRecordId(shiftUserId)) {
            return shiftUser.id !== shiftUserId;
          }
          if (userId !== undefined) {
            return shiftUser.user_id !== userId;
          }
          return true;
        }),
      },
    };
  }),
});
