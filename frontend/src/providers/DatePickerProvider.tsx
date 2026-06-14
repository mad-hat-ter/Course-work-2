import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ruRU } from '@mui/x-date-pickers/locales';
import '../utils/moscowTime';

dayjs.locale('ru');

interface DatePickerProviderProps {
  children: React.ReactNode;
}

export const DatePickerProvider: React.FC<DatePickerProviderProps> = ({
  children,
}) => (
  <LocalizationProvider
    dateAdapter={AdapterDayjs}
    adapterLocale="ru"
    localeText={
      ruRU.components.MuiLocalizationProvider.defaultProps.localeText
    }
  >
    {children}
  </LocalizationProvider>
);
