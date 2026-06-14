import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CalendarMonthOutlined as CalendarMonthIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../api/axios';
import type { Schedule, Shift_type } from '../types';
import { getApiErrorMessage } from '../utils/apiError';
import { fetchCurrentUser } from '../utils/currentUser';
import { dateFieldSlotProps, openDatePicker } from '../utils/dateField';
import { ScheduleCapacityRow } from '../components/ScheduleCapacityRow';
import { ScheduleTimeField } from '../components/ScheduleTimeField';
import {
  buildHourSlots,
  combineDateTime,
  getDaysBetween,
  findDayShiftTypeId,
  getHourFromShiftCellKey,
  resolveCellShiftTypeId,
  getShiftCellKey,
  getShiftCellKeyFromIsoForSchedule,
  getShiftEndIso,
  remapShiftDateToSchedule,
  sortHourSlots,
  toLocalDateInput,
  toLocalTimeInput,
  toDateInput,
  toTimeInput,
  type DayHours,
} from '../utils/scheduleForm';
import { scheduleStyles } from '../styles';

interface ScheduleFormProps {
  mode: 'create' | 'edit';
}

const parseScheduleToForm = (schedule: Schedule) => {
  const dayHours = getDaysBetween(
    toDateInput(schedule.start_date),
    toDateInput(schedule.end_date)
  );

  const dayHoursMap = new Map(
    dayHours.map((day) => [day.date, { ...day }])
  );

  const scheduleDates = dayHours.map((day) => day.date);
  const capacity: Record<string, number> = {};
  const cellShiftTypes: Record<string, number> = {};

  schedule.shift_schedule.forEach((item) => {
    const shift = item.shift;
    if (!shift) return;

    const date = remapShiftDateToSchedule(
      toLocalDateInput(shift.start_time),
      scheduleDates
    );
    const hour = toLocalTimeInput(shift.start_time);
    const endHour = toLocalTimeInput(shift.end_time);
    const day = dayHoursMap.get(date);
    if (!day) return;

    if (!day.start || day.start > hour) {
      day.start = hour;
    }
    if (endHour === '00:00') {
      day.end = '00:00';
    } else if (!day.end || day.end < endHour) {
      day.end = endHour;
    }

    const key = getShiftCellKey(date, hour);
    capacity[key] = shift.max_user;
    cellShiftTypes[key] = shift.type_id;
  });

  return {
    cellShiftTypes,
    startDate: toDateInput(schedule.start_date),
    endDate: toDateInput(schedule.end_date),
    openingDate: toDateInput(schedule.opening_date),
    openingTime: toTimeInput(schedule.opening_date),
    endingDate: toDateInput(schedule.ending_date),
    endingTime: toTimeInput(schedule.ending_date),
    dayHours: dayHours.map((day) => dayHoursMap.get(day.date) ?? day),
    capacity,
  };
};

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { scheduleId: scheduleIdParam } = useParams<{ scheduleId: string }>();
  const scheduleId =
    mode === 'edit' && scheduleIdParam ? Number(scheduleIdParam) : undefined;
  const isInvalidEditId =
    mode === 'edit' &&
    (scheduleIdParam === undefined ||
      scheduleId === undefined ||
      Number.isNaN(scheduleId));
  const skipDayHoursSync = useRef(false);
  const capacityLoaded = useRef(mode === 'create');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [openingTime, setOpeningTime] = useState('00:00');
  const [endingDate, setEndingDate] = useState('');
  const [endingTime, setEndingTime] = useState('23:59');
  const [dayHours, setDayHours] = useState<DayHours[]>([]);
  const [capacity, setCapacity] = useState<Record<string, number>>({});
  const [shiftTypes, setShiftTypes] = useState<Shift_type[]>([]);
  const [cellShiftTypes, setCellShiftTypes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const loadShiftTypes = async () => {
      try {
        const response = await api.get<Shift_type[]>('/shift_type/');
        setShiftTypes(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке типов смен:', error);
        setShiftTypes([]);
      }
    };

    loadShiftTypes();
  }, []);

  useEffect(() => {
    if (isInvalidEditId) {
      setLoading(false);
      return;
    }
    if (mode !== 'edit' || !scheduleId) return;

    const loadSchedule = async () => {
      setLoading(true);
      try {
        const response = await api.get<Schedule>(`/schedule/${scheduleId}`);
        const parsed = parseScheduleToForm(response.data);
        skipDayHoursSync.current = true;
        capacityLoaded.current = false;
        setStartDate(parsed.startDate);
        setEndDate(parsed.endDate);
        setOpeningDate(parsed.openingDate);
        setOpeningTime(parsed.openingTime);
        setEndingDate(parsed.endingDate);
        setEndingTime(parsed.endingTime);
        setDayHours(parsed.dayHours);
        setCapacity(parsed.capacity);
        setCellShiftTypes(parsed.cellShiftTypes);
        capacityLoaded.current = true;
      } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        navigate('/schedule', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [mode, scheduleId, navigate, isInvalidEditId]);

  useEffect(() => {
    if (skipDayHoursSync.current) {
      skipDayHoursSync.current = false;
      return;
    }
    setDayHours(getDaysBetween(startDate, endDate));
  }, [startDate, endDate]);

  const hoursConfigured = dayHours.every((day) => day.start && day.end);
  const showCapacityGrid = startDate && endDate && dayHours.length > 0 && hoursConfigured;

  const defaultShiftTypeId = useMemo(
    () => findDayShiftTypeId(shiftTypes),
    [shiftTypes]
  );

  const hourRows = useMemo(() => {
    if (!showCapacityGrid) return [];
    const unique = new Set<string>();
    dayHours.forEach((day) => {
      buildHourSlots(day.start, day.end).forEach((hour) => unique.add(hour));
    });
    return sortHourSlots(Array.from(unique));
  }, [dayHours, showCapacityGrid]);

  useEffect(() => {
    if (!showCapacityGrid) {
      if (!capacityLoaded.current) {
        setCapacity({});
      }
      return;
    }

    if (!capacityLoaded.current) return;

    setCapacity((prev) => {
      const nextCapacity: Record<string, number> = {};
      dayHours.forEach((day) => {
        buildHourSlots(day.start, day.end).forEach((hour) => {
          const key = getShiftCellKey(day.date, hour);
          nextCapacity[key] = prev[key] ?? 0;
        });
      });
      return nextCapacity;
    });

    if (shiftTypes.length === 0) return;

    setCellShiftTypes((prev) => {
      const nextTypes: Record<string, number> = {};
      dayHours.forEach((day) => {
        buildHourSlots(day.start, day.end).forEach((hour) => {
          const key = getShiftCellKey(day.date, hour);
          const resolved = resolveCellShiftTypeId(
            hour,
            shiftTypes,
            prev[key],
            defaultShiftTypeId
          );
          if (resolved !== undefined) {
            nextTypes[key] = resolved;
          }
        });
      });
      return nextTypes;
    });
  }, [dayHours, showCapacityGrid, shiftTypes, defaultShiftTypeId]);

  const isFormComplete = useMemo(() => {
    if (
      !startDate ||
      !endDate ||
      !openingDate ||
      !openingTime ||
      !endingDate ||
      !endingTime
    ) {
      return false;
    }
    if (!hoursConfigured) return false;
    if (!showCapacityGrid) return false;
    if (!defaultShiftTypeId) return false;
    if (!Object.values(capacity).some((value) => value > 0)) return false;
    return Object.values(capacity).every((value) => value !== null && value >= 0);
  }, [
    startDate,
    endDate,
    openingDate,
    openingTime,
    endingDate,
    endingTime,
    hoursConfigured,
    showCapacityGrid,
    defaultShiftTypeId,
    capacity,
  ]);

  type ShiftPayload = {
    type_id: number;
    start_time: string;
    end_time: string;
    is_free: boolean;
    max_user: number;
  };

  const buildShiftPayloadMap = () => {
    const shifts = new Map<string, ShiftPayload>();

    dayHours.forEach((day) => {
      buildHourSlots(day.start, day.end).forEach((hour) => {
        const key = getShiftCellKey(day.date, hour);
        const maxUser = capacity[key] ?? 0;
        if (maxUser <= 0 || !defaultShiftTypeId) return;

        shifts.set(key, {
          type_id:
            resolveCellShiftTypeId(
              hour,
              shiftTypes,
              cellShiftTypes[key],
              defaultShiftTypeId
            ) ?? defaultShiftTypeId,
          start_time: combineDateTime(day.date, hour),
          end_time: getShiftEndIso(day.date, hour),
          is_free: true,
          max_user: maxUser,
        });
      });
    });

    return shifts;
  };

  const syncScheduleShifts = async (targetScheduleId: number) => {
    const desiredShifts = buildShiftPayloadMap();
    const scheduleRes = await api.get<Schedule>(`/schedule/${targetScheduleId}`);
    const matchedKeys = new Set<string>();

    for (const item of scheduleRes.data.shift_schedule) {
      const shift = item.shift;
      if (!shift?.id) continue;

      const scheduleDates = dayHours.map((day) => day.date);
      const key = getShiftCellKeyFromIsoForSchedule(shift.start_time, scheduleDates);
      const desiredShift = desiredShifts.get(key);

      if (!desiredShift) {
        await api.delete(`/shift/${shift.id}`);
        continue;
      }

      matchedKeys.add(key);
      if (
        shift.max_user !== desiredShift.max_user ||
        shift.type_id !== desiredShift.type_id
      ) {
        await api.patch(`/shift/${shift.id}`, {
          max_user: desiredShift.max_user,
          type_id: desiredShift.type_id,
        });
      }
    }

    const shiftsToCreate = [...desiredShifts.entries()]
      .filter(([key]) => !matchedKeys.has(key))
      .map(([, payload]) => payload);

    if (shiftsToCreate.length > 0) {
      const createdShifts = await api.post<{ id: number }[]>('/shift/all', shiftsToCreate);
      const shiftIds = createdShifts.data.map((shift) => shift.id);
      await api.post(`/schedule/${targetScheduleId}/assign`, shiftIds);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    try {
      const currentUser = await fetchCurrentUser();
      const payload = {
        creator_id: currentUser.id,
        start_date: combineDateTime(startDate, '00:00'),
        end_date: combineDateTime(endDate, '23:59'),
        opening_date: combineDateTime(openingDate, openingTime),
        ending_date: combineDateTime(endingDate, endingTime),
      };

      if (shiftTypes.length === 0 || !defaultShiftTypeId) {
        setSaveError('В системе нет типов смен. Обратитесь к администратору.');
        return;
      }

      let targetScheduleId = scheduleId;
      const desiredShifts = buildShiftPayloadMap();

      if (desiredShifts.size === 0) {
        setSaveError('Укажите количество людей хотя бы для одной смены');
        return;
      }

      if (mode === 'edit' && scheduleId) {
        await api.patch(`/schedule/${scheduleId}`, payload);
        await syncScheduleShifts(scheduleId);
      } else {
        const createdSchedule = await api.post<Schedule>('/schedule/', payload);
        targetScheduleId = createdSchedule.data.id;

        const shifts = [...desiredShifts.values()];
        const createdShifts = await api.post<{ id: number }[]>('/shift/all', shifts);
        const shiftIds = createdShifts.data.map((shift) => shift.id);
        await api.post(`/schedule/${targetScheduleId}/assign`, shiftIds);
      }

      navigate('/schedule', { replace: true, state: { refreshSchedules: true } });
    } catch (error) {
      console.error('Ошибка при сохранении расписания:', error);
      setSaveError(
        getApiErrorMessage(
          error,
          'Не удалось сохранить расписание. Проверьте данные и попробуйте снова.',
          'Недостаточно прав для сохранения расписания'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/schedule');
  };

  const updateDayHours = (
    date: string,
    field: 'start' | 'end',
    value: string
  ) => {
    setDayHours((prev) =>
      prev.map((day) => (day.date === date ? { ...day, [field]: value } : day))
    );
  };

  const adjustRowCapacity = useCallback(
    (hour: string, delta: number) => {
      startTransition(() => {
        setCapacity((prev) => {
          const next = { ...prev };
          dayHours.forEach((day) => {
            if (!buildHourSlots(day.start, day.end).includes(hour)) return;
            const key = getShiftCellKey(day.date, hour);
            next[key] = Math.max(0, (prev[key] ?? 0) + delta);
          });
          return next;
        });
      });
    },
    [dayHours]
  );

  const updateCellCapacity = useCallback((key: string, value: number) => {
    setCapacity((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateCellShiftType = useCallback(
    (key: string, typeId: number) => {
      const hour = getHourFromShiftCellKey(key);
      setCellShiftTypes((prev) => ({
        ...prev,
        [key]:
          resolveCellShiftTypeId(hour, shiftTypes, typeId, defaultShiftTypeId) ??
          typeId,
      }));
    },
    [shiftTypes, defaultShiftTypeId]
  );

  if (isInvalidEditId) {
    return (
      <Box sx={scheduleStyles.container}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Некорректный идентификатор расписания
        </Typography>
        <Button
          onClick={() => navigate('/schedule')}
          startIcon={<ArrowBackIcon />}
        >
          К списку
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ ...scheduleStyles.container, display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={scheduleStyles.container}>
      <Box sx={scheduleStyles.pageHeader}>
        <Typography variant="h4" sx={scheduleStyles.pageTitle}>
          {mode === 'create' ? 'Новое расписание' : 'Изменение расписания'}
        </Typography>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError('')}>
          {saveError}
        </Alert>
      )}

      <Paper sx={scheduleStyles.sectionCard}>
        <Grid container spacing={3}>
          {[
            { label: 'Начало периода', value: startDate, setter: setStartDate },
            { label: 'Конец периода', value: endDate, setter: setEndDate },
          ].map((field) => (
            <Grid key={field.label} size={{ xs: 12, sm: 6, xl: 3 }}>
              <Box sx={scheduleStyles.fieldLabelBox}>
                <CalendarMonthIcon sx={scheduleStyles.fieldLabelIcon} />
                <Typography sx={scheduleStyles.fieldLabelText}>
                  {field.label}
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="date"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                onClick={openDatePicker}
                slotProps={dateFieldSlotProps}
                variant="outlined"
                sx={scheduleStyles.textField}
              />
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={scheduleStyles.fieldLabelBox}>
              <CalendarMonthIcon sx={scheduleStyles.fieldLabelIcon} />
              <Typography sx={scheduleStyles.fieldLabelText}>
                Дата открытия записи
              </Typography>
            </Box>
            <Box sx={scheduleStyles.dateTimeRow}>
              <Box sx={scheduleStyles.dateFieldInRow}>
                <TextField
                  fullWidth
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  onClick={openDatePicker}
                  slotProps={dateFieldSlotProps}
                  variant="outlined"
                  sx={scheduleStyles.textField}
                />
              </Box>
              <ScheduleTimeField
                value={openingTime}
                onChange={setOpeningTime}
                sx={scheduleStyles.timeField}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={scheduleStyles.fieldLabelBox}>
              <CalendarMonthIcon sx={scheduleStyles.fieldLabelIcon} />
              <Typography sx={scheduleStyles.fieldLabelText}>
                Дата закрытия записи
              </Typography>
            </Box>
            <Box sx={scheduleStyles.dateTimeRow}>
              <Box sx={scheduleStyles.dateFieldInRow}>
                <TextField
                  fullWidth
                  type="date"
                  value={endingDate}
                  onChange={(e) => setEndingDate(e.target.value)}
                  onClick={openDatePicker}
                  slotProps={dateFieldSlotProps}
                  variant="outlined"
                  sx={scheduleStyles.textField}
                />
              </Box>
              <ScheduleTimeField
                value={endingTime}
                onChange={setEndingTime}
                sx={scheduleStyles.timeField}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {startDate && endDate && (
        <Paper sx={scheduleStyles.sectionCard}>
          <Typography sx={scheduleStyles.sectionTitle}>
            Часы работы по дням
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={scheduleStyles.tableHead}>
                <TableRow>
                  <TableCell>День</TableCell>
                  <TableCell>Начало работы</TableCell>
                  <TableCell>Конец работы</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dayHours.map((day) => (
                  <TableRow key={day.date} sx={scheduleStyles.tableRow}>
                    <TableCell sx={{ fontWeight: 600 }}>{day.label}</TableCell>
                    <TableCell>
                      <ScheduleTimeField
                        value={day.start}
                        onChange={(value) =>
                          updateDayHours(day.date, 'start', value)
                        }
                        fullWidth
                        sx={scheduleStyles.textField}
                      />
                    </TableCell>
                    <TableCell>
                      <ScheduleTimeField
                        value={day.end}
                        onChange={(value) =>
                          updateDayHours(day.date, 'end', value)
                        }
                        fullWidth
                        sx={scheduleStyles.textField}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {showCapacityGrid && (
        <Paper sx={scheduleStyles.sectionCard}>
          <Typography sx={scheduleStyles.sectionTitle}>
            Количество людей и вид смены
          </Typography>
          <Box sx={scheduleStyles.capacityTableWrap}>
            <Table sx={scheduleStyles.capacityTable}>
              <TableHead sx={scheduleStyles.tableHead}>
                <TableRow>
                  <TableCell sx={scheduleStyles.capacityHourHead}>Час</TableCell>
                  {dayHours.map((day) => (
                    <TableCell
                      key={day.date}
                      align="center"
                      sx={scheduleStyles.capacityDayHead}
                    >
                      {day.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {hourRows.map((hour) => (
                  <ScheduleCapacityRow
                    key={hour}
                    hour={hour}
                    dayHours={dayHours}
                    capacity={capacity}
                    cellShiftTypes={cellShiftTypes}
                    defaultShiftTypeId={defaultShiftTypeId}
                    shiftTypes={shiftTypes}
                    onAdjustRow={adjustRowCapacity}
                    onUpdateCapacity={updateCellCapacity}
                    onUpdateShiftType={updateCellShiftType}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      <Box sx={scheduleStyles.formActions}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={scheduleStyles.backButton}
        >
          Назад
        </Button>
        <Button
          variant="contained"
          disabled={!isFormComplete || saving}
          onClick={handleSave}
          sx={scheduleStyles.saveButton}
        >
          {saving ? <CircularProgress size={22} sx={{ color: '#ffffff' }} /> : 'Сохранить'}
        </Button>
      </Box>
    </Box>
  );
};
