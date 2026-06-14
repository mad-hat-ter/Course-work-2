import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { CalendarMonthOutlined as CalendarMonthIcon } from '@mui/icons-material';
import api from '../api/axios';
import { dateFieldSlotProps, openDatePicker } from '../utils/dateField';
import { formatMoney } from '../utils/format';
import { statisticsStyles } from '../styles';

const CACHE_KEY = 'curator_statistics_cache';

export interface ShiftStatisticsRow {
  shift_type: string;
  count: number;
  payment: number;
}

export interface UserStatisticsResponse {
  rows: ShiftStatisticsRow[];
  total_shifts: number;
  total_payment: number;
}

interface StatisticsCache {
  startDate: string;
  endDate: string;
  data: UserStatisticsResponse;
}

export const Statistics: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<ShiftStatisticsRow[]>([]);
  const [totalShifts, setTotalShifts] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;

    try {
      const parsed: StatisticsCache = JSON.parse(cached);
      skipNextFetchRef.current = true;
      setStartDate(parsed.startDate);
      setEndDate(parsed.endDate);
      setRows(parsed.data.rows);
      setTotalShifts(parsed.data.total_shifts);
      setTotalPayment(parsed.data.total_payment);
      setHasFetched(true);
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) {
      setRows([]);
      setTotalShifts(0);
      setTotalPayment(0);
      setHasFetched(false);
      setError('');
      return;
    }

    if (endDate < startDate) {
      setError('Конец периода не может быть раньше начала');
      setRows([]);
      setTotalShifts(0);
      setTotalPayment(0);
      setHasFetched(false);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const fetchStatistics = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<UserStatisticsResponse>(
          '/user/statistics/me',
          {
            params: { start_date: startDate, end_date: endDate },
          }
        );
        setRows(response.data.rows);
        setTotalShifts(response.data.total_shifts);
        setTotalPayment(response.data.total_payment);
        setHasFetched(true);

        const cache: StatisticsCache = {
          startDate,
          endDate,
          data: response.data,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (err: any) {
        setError(
          err.response?.data?.detail || 'Не удалось получить статистику'
        );
        setRows([]);
        setTotalShifts(0);
        setTotalPayment(0);
        setHasFetched(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [startDate, endDate]);

  return (
    <Box sx={statisticsStyles.container}>
      <Box sx={statisticsStyles.pageHeader}>
        <Typography variant="h4" sx={statisticsStyles.pageTitle}>
          Моя статистика
        </Typography>
      </Box>

      <Paper sx={statisticsStyles.filterCard}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={statisticsStyles.fieldLabelBox}>
              <CalendarMonthIcon sx={statisticsStyles.fieldLabelIcon} />
              <Typography sx={statisticsStyles.fieldLabelText}>
                Начало периода
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={openDatePicker}
              slotProps={dateFieldSlotProps}
              variant="outlined"
              sx={statisticsStyles.textField}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={statisticsStyles.fieldLabelBox}>
              <CalendarMonthIcon sx={statisticsStyles.fieldLabelIcon} />
              <Typography sx={statisticsStyles.fieldLabelText}>
                Конец периода
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={openDatePicker}
              slotProps={dateFieldSlotProps}
              variant="outlined"
              sx={statisticsStyles.textField}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={statisticsStyles.tableCard}>
        {loading ? (
          <Box sx={statisticsStyles.loadingBox}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead sx={statisticsStyles.tableHead}>
              <TableRow>
                <TableCell sx={{ width: '50%' }}>Вид смены</TableCell>
                <TableCell sx={{ width: '25%', textAlign: 'right' }}>
                  Кол-во
                </TableCell>
                <TableCell sx={{ width: '25%', textAlign: 'right' }}>
                  Оплата
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hasFetched && rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.shift_type} sx={statisticsStyles.tableRow}>
                    <TableCell sx={statisticsStyles.tableCellType}>
                      {row.shift_type}
                    </TableCell>
                    <TableCell sx={statisticsStyles.tableCellNumber}>
                      {row.count}
                    </TableCell>
                    <TableCell sx={statisticsStyles.tableCellNumber}>
                      {formatMoney(row.payment)} ₽
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} sx={statisticsStyles.emptyCell}>
                    {hasFetched
                      ? 'Нет смен в выбранном периоде'
                      : 'Выберите период для просмотра статистики'}
                  </TableCell>
                </TableRow>
              )}

              {hasFetched && rows.length > 0 && (
                <TableRow sx={statisticsStyles.tableFooter}>
                  <TableCell />
                  <TableCell sx={statisticsStyles.footerLabel}>
                    Сумма смен: {totalShifts}
                  </TableCell>
                  <TableCell sx={statisticsStyles.footerValue}>
                    Сумма оплаты: {formatMoney(totalPayment)} ₽
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};
