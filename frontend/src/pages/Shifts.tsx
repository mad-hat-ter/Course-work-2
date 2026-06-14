import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import api from '../api/axios';
import type { Shift } from '../types';
import { commonStyles, NavButton, shiftsStyles } from '../styles';
import { isShiftUpcomingInMoscow } from '../utils/format';
import {
  addMoscowDays,
  compareMoscowDateTime,
  formatMoscowDate,
  formatMoscowWeekdayLong,
  getMoscowTodayDate,
  toMoscowDateInput,
  toMoscowTimeInput,
} from '../utils/moscowTime';

export const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getMoscowTodayDate);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        const response = await api.get<Shift[]>('/user/shiftme');
        setShifts(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке смен:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  const handlePrevDay = () => {
    setCurrentDate((date) => addMoscowDays(date, -4));
  };

  const handleNextDay = () => {
    setCurrentDate((date) => addMoscowDays(date, 4));
  };

  const daysToShow = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => {
        const dateStr = addMoscowDays(currentDate, index);
        return {
          label: formatMoscowWeekdayLong(dateStr),
          dateStr,
        };
      }),
    [currentDate]
  );

  const sortedShifts = useMemo(
    () =>
      [...shifts].sort((left, right) =>
        compareMoscowDateTime(left.start_time, right.start_time)
      ),
    [shifts]
  );

  const upcomingShifts = useMemo(
    () =>
      sortedShifts.filter((shift) =>
        isShiftUpcomingInMoscow(shift.start_time)
      ),
    [sortedShifts]
  );

  if (loading) {
    return (
      <Box sx={commonStyles.loadingCenter}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={shiftsStyles.container}>
      <Box sx={shiftsStyles.header}>
        <Typography variant="h4" sx={shiftsStyles.pageTitle}>
          Мои смены
        </Typography>
        <Box sx={shiftsStyles.navigation}>
          <NavButton onClick={handlePrevDay}>
            <ArrowBackIosNewIcon />
          </NavButton>
          <NavButton onClick={handleNextDay}>
            <ArrowForwardIosIcon />
          </NavButton>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
        {daysToShow.map((day) => {
          const dayShifts = sortedShifts.filter(
            (shift) => toMoscowDateInput(shift.start_time) === day.dateStr
          );

          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={day.dateStr}>
              <Paper sx={shiftsStyles.dayCard}>
                <Box sx={shiftsStyles.dayCardHeader}>
                  <Typography variant="subtitle1">{day.label}</Typography>
                  <Typography variant="body2">
                    {formatMoscowDate(day.dateStr)}
                  </Typography>
                </Box>

                <Box sx={shiftsStyles.dayCardBody}>
                  {dayShifts.length > 0 ? (
                    dayShifts.map((shift) => (
                      <Box key={shift.id} sx={shiftsStyles.shiftItem}>
                        <Typography variant="body2">
                          {shift.shift_type?.title ?? 'Смена'}
                        </Typography>
                        <Typography variant="caption">
                          {toMoscowTimeInput(shift.start_time)} -{' '}
                          {toMoscowTimeInput(shift.end_time)}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={shiftsStyles.noShiftsText}>
                      Нет смен
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={shiftsStyles.upcomingContainer}>
        <Typography sx={shiftsStyles.upcomingShiftsTitle}>
          Ближайшие смены
        </Typography>
        {upcomingShifts.length > 0 ? (
          upcomingShifts.slice(0, 3).map((shift) => (
            <Box key={shift.id} sx={shiftsStyles.upcomingShiftItem}>
              <Typography variant="body2">
                {formatMoscowDate(shift.start_time)} •{' '}
                {toMoscowTimeInput(shift.start_time)} -{' '}
                {toMoscowTimeInput(shift.end_time)} •{' '}
                {shift.shift_type?.title ?? 'Смена'}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography sx={shiftsStyles.noShiftsText}>Нет смен</Typography>
        )}
      </Box>
    </Box>
  );
};
