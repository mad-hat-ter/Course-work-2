import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PersonOutlined as PersonOutlineIcon,
  LocalPhoneOutlined as LocalPhoneOutlineIcon,
  MailOutlined as MailOutlineIcon,
  SecurityOutlined as SecurityIcon,
  CalendarMonthOutlined as CalendarMonthIcon,
  WorkOutlineOutlined as WorkOutlineIcon,
} from '@mui/icons-material';
import { profileStyles } from '../styles';
import type { Role, User } from '../types';
import { getRoleLabel } from '../utils/roles';
import api from '../api/axios';
import { fetchCurrentUser, setCachedCurrentUser } from '../utils/currentUser';
import { formatMoscowDate } from '../utils/moscowTime';
import { PatternFormat } from 'react-number-format';

interface HeaderSnapshot {
  displayName: string;
  positionTitle: string;
  role: Role;
}

interface EditableFields {
  surname: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
}

const buildHeaderFromUser = (user: User): HeaderSnapshot => ({
  displayName: `${user.surname} ${user.name} ${user.lastname || ''}`.trim(),
  positionTitle: user.position.title,
  role: user.role,
});

const getEditableFields = (user: User): EditableFields => ({
  surname: user.surname,
  name: user.name,
  lastname: user.lastname ?? '',
  email: user.email,
  phone: user.phone ?? '',
});

const areEditableFieldsEqual = (a: EditableFields, b: EditableFields) =>
  a.surname === b.surname &&
  a.name === b.name &&
  a.lastname === b.lastname &&
  a.email === b.email &&
  a.phone === b.phone;

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User>({
    id: 0,
    name: '',
    surname: '',
    lastname: '',
    position_id: 0,
    role: 'NONE',
    email: '',
    phone: '',
    is_active: true,
    registration_date: '',
    position: {
      id: 0,
      title: '',
      department_id: 0,
      department: {
        id: 0,
        title: '',
      },
    },
  });
  const [header, setHeader] = useState<HeaderSnapshot>({
    displayName: '',
    positionTitle: '',
    role: 'NONE',
  });
  const [savedUser, setSavedUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const getuser = async () => {
      setIsFetching(true);
      setError('');
      try {
        const response = await fetchCurrentUser();
        setUser(response);
        setSavedUser(response);
        setHeader(buildHeaderFromUser(response));
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось получить данные');
      } finally {
        setIsFetching(false);
      }
    };
    getuser();
  }, []);

  const hasChanges = useMemo(() => {
    if (!savedUser) return false;
    return !areEditableFieldsEqual(
      getEditableFields(user),
      getEditableFields(savedUser)
    );
  }, [user, savedUser]);

  const handleSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSaving) return;

    setError('');
    setIsSaving(true);
    try {
      const response = await api.patch<User>('/user/', {
        name: user.name.trim(),
        surname: user.surname.trim(),
        lastname: user.lastname?.trim() || null,
        email: user.email.trim(),
        phone: user.phone?.trim() || null,
        position_id: user.position_id,
        role: user.role,
        is_active: user.is_active,
      });
      setCachedCurrentUser(response.data);
      setUser(response.data);
      setSavedUser(response.data);
      setHeader(buildHeaderFromUser(response.data));
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось сохранить данные');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatMoscowDate(dateString);
  };

  const handleCancel = () => {
    if (!savedUser || !hasChanges) return;
    setUser(savedUser);
    setError('');
  };

  const fieldsDisabled = isFetching || isSaving;

  if (isFetching) {
    return (
      <Box sx={profileStyles.pageContainer}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={profileStyles.pageContainer}>
      <Container maxWidth="md">
        <Box
          sx={{
            ...profileStyles.pageHeader,
            flexWrap: 'wrap',
            height: 'auto',
            minHeight: 40,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Профиль
          </Typography>
        </Box>

        <Paper elevation={0} sx={profileStyles.profileCard}>
          <Box sx={profileStyles.cardHeader}>
            <Avatar sx={profileStyles.avatar}>
              <PersonOutlineIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box sx={profileStyles.nameContainer}>
              <Typography variant="h5" sx={profileStyles.userName}>
                {header.displayName}
              </Typography>
              <Typography variant="h6" sx={profileStyles.userRole}>
                {header.positionTitle} • {getRoleLabel(header.role)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <PersonOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Фамилия
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  disabled={fieldsDisabled}
                  sx={profileStyles.textField}
                  value={user.surname}
                  onChange={(e) =>
                    setUser({ ...user, surname: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <PersonOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>Имя</Typography>
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  disabled={fieldsDisabled}
                  sx={profileStyles.textField}
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <PersonOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Отчество
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  disabled={fieldsDisabled}
                  sx={profileStyles.textField}
                  value={user.lastname}
                  onChange={(e) =>
                    setUser({ ...user, lastname: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <LocalPhoneOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Телефон
                  </Typography>
                </Box>
                <PatternFormat
                  fullWidth
                  disabled={fieldsDisabled}
                  value={user.phone}
                  onValueChange={(values) => {
                    setUser({ ...user, phone: values.value });
                  }}
                  format="+7 (###) ###-##-##"
                  mask="_"
                  customInput={TextField}
                  variant="outlined"
                  sx={profileStyles.textField}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <MailOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Электронная почта
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  disabled={fieldsDisabled}
                  sx={profileStyles.textField}
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <WorkOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Должность
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  disabled
                  variant="outlined"
                  sx={profileStyles.textFieldDisabled}
                  value={user.position.title}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <SecurityIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>Роль</Typography>
                </Box>
                <TextField
                  fullWidth
                  disabled
                  variant="outlined"
                  sx={profileStyles.textFieldDisabled}
                  value={getRoleLabel(user.role)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <CalendarMonthIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Дата регистрации
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  sx={profileStyles.textFieldDisabled}
                  disabled
                  value={formatDate(user.registration_date)}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={profileStyles.actions}>
            <Button
              type="button"
              variant="outlined"
              disabled={!hasChanges || isSaving}
              onClick={handleCancel}
              sx={profileStyles.cancelButton}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              sx={profileStyles.saveButton}
              disabled={!hasChanges || isSaving}
              onClick={handleSaving}
            >
              {isSaving ? (
                <CircularProgress size={22} sx={{ color: '#ffffff' }} />
              ) : (
                'Сохранить изменения'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={saved}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSaved(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Сохранение успешно
        </Alert>
      </Snackbar>

      <Snackbar
        open={error.length !== 0}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error || 'Не удалось получить данные'}
        </Alert>
      </Snackbar>
    </Box>
  );
};
