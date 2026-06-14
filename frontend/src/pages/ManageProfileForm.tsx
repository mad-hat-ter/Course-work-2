import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  MenuItem,
  Switch,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  PersonOutlined as PersonOutlineIcon,
  LocalPhoneOutlined as LocalPhoneOutlineIcon,
  MailOutlined as MailOutlineIcon,
  SecurityOutlined as SecurityIcon,
  CalendarMonthOutlined as CalendarMonthIcon,
  WorkOutlineOutlined as WorkOutlineIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { PatternFormat } from 'react-number-format';
import api from '../api/axios';
import type { Department, Position, Role, User } from '../types';
import { getRoleLabel, ROLE_OPTIONS } from '../utils/roles';
import { commonStyles, manageProfileFormStyles, profileStyles } from '../styles';
import { formatMoscowDate, formatMoscowDateTime } from '../utils/moscowTime';

interface ManageProfileFormProps {
  mode: 'edit' | 'create';
}

interface FormState {
  name: string;
  surname: string;
  lastname: string;
  email: string;
  phone: string;
  position_id: number | '';
  role: Role;
  is_active: boolean;
  password: string;
  registration_date: string;
  last_login: string;
}

const emptyForm: FormState = {
  name: '',
  surname: '',
  lastname: '',
  email: '',
  phone: '',
  position_id: '',
  role: 'CURATOR',
  is_active: true,
  password: '',
  registration_date: '',
  last_login: '',
};

interface HeaderSnapshot {
  displayName: string;
  positionTitle: string;
  role: Role;
}

const buildHeaderSnapshot = (
  data: Pick<FormState, 'surname' | 'name' | 'lastname' | 'position_id' | 'role'>,
  positions: Position[],
  fallbackName = 'Новый сотрудник'
): HeaderSnapshot => ({
  displayName:
    `${data.surname} ${data.name} ${data.lastname}`.trim() || fallbackName,
  positionTitle:
    positions.find((p) => p.id === data.position_id)?.title ?? '',
  role: data.role,
});

export const ManageProfileForm: React.FC<ManageProfileFormProps> = ({
  mode,
}) => {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const userId =
    mode === 'edit' && userIdParam ? Number(userIdParam) : undefined;
  const isInvalidEditId =
    mode === 'edit' &&
    (userIdParam === undefined || userId === undefined || Number.isNaN(userId));

  const [form, setForm] = useState<FormState>(emptyForm);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [header, setHeader] = useState<HeaderSnapshot>({
    displayName: 'Новый сотрудник',
    positionTitle: '',
    role: 'CURATOR',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isInvalidEditId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [departmentsRes, positionsRes] = await Promise.all([
          api.get<Department[]>('/department/'),
          api.get<Position[]>('/position/'),
        ]);
        setDepartments(departmentsRes.data);
        setPositions(positionsRes.data);

        if (mode === 'edit' && userId) {
          const userRes = await api.get<User>(`/user/${userId}`);
          const user = userRes.data;
          const loadedForm: FormState = {
            name: user.name,
            surname: user.surname,
            lastname: user.lastname ?? '',
            email: user.email,
            phone: user.phone ?? '',
            position_id: user.position_id ?? '',
            role: user.role,
            is_active: user.is_active,
            password: '',
            registration_date: user.registration_date,
            last_login: user.last_login ?? '',
          };
          setForm(loadedForm);
          setDepartmentId(user.position?.department_id ?? '');
          setHeader(buildHeaderSnapshot(loadedForm, positionsRes.data));
        }
      } catch (err: any) {
        setError(
          err.response?.data?.detail || 'Не удалось загрузить данные пользователя'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mode, userId, isInvalidEditId]);

  const filteredPositions = useMemo(() => {
    if (!departmentId) return positions;
    return positions.filter((p) => p.department_id === departmentId);
  }, [departmentId, positions]);

  const isFormValid = useMemo(() => {
    const hasRequiredFields =
      form.surname.trim() !== '' &&
      form.name.trim() !== '' &&
      form.email.trim() !== '' &&
      form.role !== 'NONE' &&
      form.position_id !== '';

    if (mode === 'create') {
      return hasRequiredFields && form.password.trim() !== '';
    }

    return hasRequiredFields;
  }, [form, mode]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatMoscowDate(dateString);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Нет данных';
    return formatMoscowDateTime(dateString);
  };

  const handleDepartmentChange = (value: number | '') => {
    setDepartmentId(value);
    setForm((prev) => ({ ...prev, position_id: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      lastname: form.lastname.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() ? form.phone : null,
      position_id: form.position_id === '' ? null : form.position_id,
      role: form.role,
      is_active: form.is_active,
    };

    try {
      if (mode === 'edit' && userId) {
        await api.patch<User>(`/user/${userId}`, {
          ...payload,
          ...(form.password.trim() ? { password: form.password } : {}),
        });
        setForm((prev) => ({ ...prev, password: '' }));
        setHeader(buildHeaderSnapshot(form, positions));
        setSuccess('Изменения сохранены');
      } else {
        if (!form.password.trim()) {
          setError('Укажите пароль для нового пользователя');
          setSaving(false);
          return;
        }
        await api.post<User>('/user/', { ...payload, password: form.password });
        setSuccess('Пользователь создан');
        setTimeout(() => navigate('/manageprofiles'), 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось сохранить данные');
    } finally {
      setSaving(false);
    }
  };

  if (isInvalidEditId) {
    return (
      <Box sx={profileStyles.pageContainer}>
        <Container maxWidth="sm">
          <Typography variant="h5" sx={{ mb: 2 }}>
            Некорректный идентификатор пользователя
          </Typography>
          <Button
            onClick={() => navigate('/manageprofiles')}
            sx={manageProfileFormStyles.backButton}
          >
            К списку
          </Button>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={commonStyles.loadingCenter}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={profileStyles.pageContainer}>
      <Container maxWidth="md">
        <Box sx={manageProfileFormStyles.pageHeader}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {mode === 'edit' ? 'Редактирование профиля' : 'Новый сотрудник'}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manageprofiles')}
            sx={manageProfileFormStyles.backButton}
          >
            К списку
          </Button>
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
                {header.positionTitle
                  ? `${header.positionTitle} • ${getRoleLabel(header.role)}`
                  : getRoleLabel(header.role)}
              </Typography>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSave}>
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
                  required
                  variant="outlined"
                  sx={profileStyles.textField}
                  value={form.surname}
                  onChange={(e) =>
                    setForm({ ...form, surname: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <PersonOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Имя
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  required
                  variant="outlined"
                  sx={profileStyles.textField}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  sx={profileStyles.textField}
                  value={form.lastname}
                  onChange={(e) =>
                    setForm({ ...form, lastname: e.target.value })
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
                  value={form.phone}
                  onValueChange={(values) => {
                    setForm({ ...form, phone: values.value });
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
                  required
                  type="email"
                  variant="outlined"
                  sx={profileStyles.textField}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <SecurityIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    {mode === 'create' ? 'Пароль' : 'Новый пароль'}
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  required={mode === 'create'}
                  type="password"
                  variant="outlined"
                  sx={profileStyles.textField}
                  value={form.password}
                  placeholder={
                    mode === 'edit' ? 'Оставьте пустым, если не меняете' : ''
                  }
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <WorkOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Предмет / отдел
                  </Typography>
                </Box>
                <TextField
                  select
                  fullWidth
                  variant="outlined"
                  sx={profileStyles.textField}
                  value={departmentId}
                  onChange={(e) =>
                    handleDepartmentChange(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value="">
                    <em>Не выбран</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <WorkOutlineIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Должность
                  </Typography>
                </Box>
                <TextField
                  select
                  fullWidth
                  variant="outlined"
                  disabled={!departmentId}
                  sx={profileStyles.textField}
                  value={form.position_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      position_id:
                        e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value="">
                    <em>Не выбрана</em>
                  </MenuItem>
                  {filteredPositions.map((position) => (
                    <MenuItem key={position.id} value={position.id}>
                      {position.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <SecurityIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Роль
                  </Typography>
                </Box>
                <TextField
                  select
                  fullWidth
                  variant="outlined"
                  sx={profileStyles.textField}
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as Role })
                  }
                >
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={profileStyles.fieldLabelBox}>
                  <CalendarMonthIcon sx={profileStyles.fieldLabelIcon} />
                  <Typography sx={profileStyles.fieldLabelText}>
                    Дата регистрации
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  disabled
                  variant="outlined"
                  sx={profileStyles.textFieldDisabled}
                  value={
                    mode === 'edit'
                      ? formatDate(form.registration_date)
                      : 'Будет назначена при создании'
                  }
                />
              </Grid>

              {mode === 'edit' && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={profileStyles.fieldLabelBox}>
                    <CalendarMonthIcon sx={profileStyles.fieldLabelIcon} />
                    <Typography sx={profileStyles.fieldLabelText}>
                      Дата последнего входа
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    disabled
                    variant="outlined"
                    sx={profileStyles.textFieldDisabled}
                    value={formatDateTime(form.last_login)}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Box sx={manageProfileFormStyles.activeToggleBox}>
                  <Switch
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    color="primary"
                  />
                  <Typography sx={manageProfileFormStyles.activeLabel}>
                    {form.is_active
                      ? 'Сотрудник активен'
                      : 'Сотрудник деактивирован'}
                  </Typography>
                </Box>
              </Grid>
              </Grid>
            </Box>

            <Box sx={manageProfileFormStyles.actions}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/manageprofiles')}
                sx={manageProfileFormStyles.cancelButton}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isFormValid || saving}
                sx={profileStyles.saveButton}
              >
                {saving ? (
                  <CircularProgress size={22} sx={{ color: '#ffffff' }} />
                ) : mode === 'edit' ? (
                  'Сохранить изменения'
                ) : (
                  'Создать сотрудника'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => setError('')}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};
