import {
  addMoscowDays,
  formatMoscowDate,
  getMoscowWeekday,
  toMoscowDateInput,
  toMoscowTimeInput,
} from './moscowTime';

export interface DayHours {
  date: string;
  label: string;
  start: string;
  end: string;
}

export interface ShiftTypeOption {
  id: number;
  title: string;
}

export const findDayShiftTypeId = (
  shiftTypes: ShiftTypeOption[]
): number | undefined => {
  const dayType = shiftTypes.find((type) => /днев|обыч/i.test(type.title));
  return dayType?.id ?? shiftTypes[0]?.id;
};

export const findNightShiftTypeId = (
  shiftTypes: ShiftTypeOption[]
): number | undefined => {
  const nightType = shiftTypes.find((type) => /ноч/i.test(type.title.trim()));
  return nightType?.id;
};

export const isNightShiftHour = (hour: string): boolean => {
  const hourNum = parseHour(hour);
  if (Number.isNaN(hourNum)) return false;
  return hourNum >= 23 || hourNum < 8;
};

export const getDefaultShiftTypeIdForHour = (
  hour: string,
  shiftTypes: ShiftTypeOption[]
): number | undefined => {
  if (isNightShiftHour(hour)) {
    return findNightShiftTypeId(shiftTypes);
  }
  return findDayShiftTypeId(shiftTypes);
};

export const resolveCellShiftTypeId = (
  hour: string,
  shiftTypes: ShiftTypeOption[],
  storedTypeId?: number,
  fallbackTypeId?: number
): number | undefined => {
  const hourDefault = getDefaultShiftTypeIdForHour(hour, shiftTypes);
  if (isNightShiftHour(hour)) {
    return hourDefault ?? storedTypeId ?? fallbackTypeId;
  }
  return storedTypeId ?? hourDefault ?? fallbackTypeId;
};

export const formatDisplayDate = (value: string) => {
  if (!value) return '';
  const dateStr = value.includes('T') ? toMoscowDateInput(value) : value;
  return formatMoscowDate(dateStr, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

export const formatGridDate = (iso: string) => formatDisplayDate(iso);

export const formatGridTime = (iso: string) => toMoscowTimeInput(iso);

export const toDateInput = (iso: string) => toMoscowDateInput(iso);

export const toLocalDateInput = toMoscowDateInput;

export const toLocalTimeInput = toMoscowTimeInput;

export const toTimeInput = (iso: string) => formatGridTime(iso);

export const combineDateTime = (date: string, time: string) => `${date}T${time}:00`;

export const addDays = addMoscowDays;

export const remapShiftDateToSchedule = (
  shiftDate: string,
  scheduleDates: string[]
): string => {
  if (scheduleDates.includes(shiftDate)) {
    return shiftDate;
  }

  const nextDay = addMoscowDays(shiftDate, 1);
  if (scheduleDates.includes(nextDay)) {
    return nextDay;
  }

  const weekday = getMoscowWeekday(shiftDate);
  const sameWeekday = scheduleDates.filter(
    (date) => getMoscowWeekday(date) === weekday
  );
  if (sameWeekday.length === 1) {
    return sameWeekday[0];
  }

  return shiftDate;
};

export const getShiftCellKey = (date: string, hour: string) => `${date}-${hour}`;

export const getShiftCellKeyFromIso = (iso: string) =>
  getShiftCellKey(toMoscowDateInput(iso), toMoscowTimeInput(iso));

export const getShiftCellKeyFromIsoForSchedule = (
  iso: string,
  scheduleDates: string[]
) => {
  const date = remapShiftDateToSchedule(toMoscowDateInput(iso), scheduleDates);
  return getShiftCellKey(date, toMoscowTimeInput(iso));
};

export const getDaysBetween = (startDate: string, endDate: string): DayHours[] => {
  if (!startDate || !endDate || endDate < startDate) return [];

  const days: DayHours[] = [];
  let current = startDate;

  while (current <= endDate) {
    days.push({
      date: current,
      label: formatDisplayDate(current),
      start: '12:00',
      end: '00:00',
    });
    current = addMoscowDays(current, 1);
  }

  return days;
};

export const parseHour = (time: string) => Number(time.split(':')[0]);

export const getHourFromShiftCellKey = (key: string) => key.slice(11);

export const isRoundTheClockHours = (start: string, end: string) =>
  start === '00:00' && end === '00:00';

const formatHourSlot = (hour: number) =>
  `${String(hour).padStart(2, '0')}:00`;

export const buildHourSlots = (start: string, end: string) => {
  const startHour = parseHour(start);
  let endHour = parseHour(end);

  if (Number.isNaN(startHour) || Number.isNaN(endHour)) {
    return [];
  }

  if (isRoundTheClockHours(start, end)) {
    return Array.from({ length: 24 }, (_, hour) => formatHourSlot(hour));
  }

  if (endHour === 0 && startHour > 0) {
    endHour = 24;
  }

  if (endHour < startHour) {
    const hours: string[] = [];
    for (let hour = startHour; hour < 24; hour += 1) {
      hours.push(formatHourSlot(hour));
    }
    for (let hour = 0; hour < endHour; hour += 1) {
      hours.push(formatHourSlot(hour));
    }
    return hours;
  }

  if (endHour === startHour) {
    return [];
  }

  const hours: string[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    hours.push(formatHourSlot(hour));
  }
  return hours;
};

export const sortHourSlots = (hours: string[]) =>
  [...hours].sort((left, right) => parseHour(left) - parseHour(right));

export const getShiftEndIso = (date: string, hour: string) => {
  const hourNum = parseHour(hour);
  if (hourNum === 23) {
    return combineDateTime(addMoscowDays(date, 1), '00:00');
  }
  return combineDateTime(date, `${String(hourNum + 1).padStart(2, '0')}:00`);
};
