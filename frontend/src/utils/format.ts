import type { ShiftUserBrief, User } from '../types';
import {
  isMoscowDateTimeUpcoming,
  parseMoscowDateTimeMs,
} from './moscowTime';

export const parseShiftStartMs = parseMoscowDateTimeMs;

export const isShiftUpcomingInMoscow = isMoscowDateTimeUpcoming;

export const formatUserName = (user?: User | null) => {
  if (!user) return null;
  return [user.surname, user.name, user.lastname].filter(Boolean).join(' ');
};

export const formatScheduleGridUserName = (
  user?: User | ShiftUserBrief | null
) => {
  if (!user) return null;
  return [user.surname, user.name].filter(Boolean).join(' ');
};

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
