import type { Schedule } from '../types';
import {
  getMoscowNowMs,
  parseMoscowDateTimeMs,
} from './moscowTime';

type SchedulePeriod = Pick<Schedule, 'opening_date' | 'ending_date'>;

export const isScheduleRegistrationOpen = (
  schedule: SchedulePeriod,
  nowMs = getMoscowNowMs()
) => {
  const opening = parseMoscowDateTimeMs(schedule.opening_date);
  const ending = parseMoscowDateTimeMs(schedule.ending_date);
  return nowMs >= opening && nowMs <= ending;
};

export const isScheduleRegistrationClosed = (
  schedule: SchedulePeriod,
  nowMs = getMoscowNowMs()
) => nowMs > parseMoscowDateTimeMs(schedule.ending_date);

export const canCuratorSignupToShift = (
  schedule: SchedulePeriod,
  shiftStartTime: string,
  nowMs = getMoscowNowMs()
) => {
  if (isScheduleRegistrationOpen(schedule, nowMs)) {
    return true;
  }

  if (isScheduleRegistrationClosed(schedule, nowMs)) {
    return parseMoscowDateTimeMs(shiftStartTime) >= nowMs;
  }

  return false;
};

export const canCuratorRemoveFromShift = (
  schedule: SchedulePeriod,
  nowMs = getMoscowNowMs()
) => isScheduleRegistrationOpen(schedule, nowMs);

export const getScheduleRegistrationHint = (
  schedule: SchedulePeriod,
  nowMs = getMoscowNowMs()
) => {
  if (isScheduleRegistrationOpen(schedule, nowMs)) {
    return 'Запись открыта: можно записаться на смены и снять свою запись.';
  }

  if (isScheduleRegistrationClosed(schedule, nowMs)) {
    return 'Запись закрыта: можно записаться только на будущие смены, удаление недоступно.';
  }

  return 'Запись ещё не открыта.';
};
