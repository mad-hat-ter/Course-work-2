import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  MailOutlined as MailOutlineIcon,
} from '@mui/icons-material';

import api from '../api/axios';
import { type TokenResponse } from '../types';
import { setToken } from '../utils/auth';
import { authStyles } from '../styles';

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await api.post<TokenResponse>('/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToken(response.data.access_token);
      navigate('/profile');
    } catch (err: any) {
      if (!err.response) {
        setError('Не удалось связаться с сервером. Проверьте, что backend запущен на порту 8000.');
        return;
      }
      setError(err.response?.data?.detail || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={authStyles.page}>
      <Container maxWidth="xs">
        <Paper elevation={0} sx={authStyles.paper}>
          <Box sx={authStyles.header}>
            <Avatar sx={authStyles.avatar}>
              <LockOutlinedIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="h5" sx={authStyles.headerTitle}>
              Авторизация
            </Typography>
            <Typography variant="body2" sx={authStyles.headerSubtitle}>
              Введите ваши данные для входа
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={authStyles.form}>
            {error && (
              <Alert severity="error" sx={authStyles.alert}>
                {error}
              </Alert>
            )}

            <Box sx={authStyles.fieldGroup}>
              <Box sx={authStyles.fieldLabelRow}>
                <MailOutlineIcon sx={authStyles.fieldIcon} />
                <Typography
                  variant="caption"
                  sx={authStyles.fieldLabel}
                  color="text.secondary"
                >
                  Электронная почта
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="ivanov@example.com"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={authStyles.textField}
              />
            </Box>

            <Box sx={authStyles.fieldGroupLast}>
              <Box sx={authStyles.fieldLabelRow}>
                <LockOutlinedIcon sx={authStyles.fieldIcon} />
                <Typography
                  variant="caption"
                  sx={authStyles.fieldLabel}
                  color="text.secondary"
                >
                  Пароль
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="password"
                placeholder="••••••••"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={authStyles.textField}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={authStyles.submitButton}
            >
              {loading ? 'Вход в систему...' : 'Войти в личный кабинет'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
