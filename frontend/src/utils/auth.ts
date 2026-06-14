import { clearUserCache } from './userCache';

const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  clearUserCache();
};

export const isTokenExpired = (token: string | null) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const redirectToLogin = () => {
  if (window.location.pathname.startsWith('/login')) return;
  clearToken();
  window.location.replace('/login');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (isTokenExpired(token)) {
    clearToken();
    return false;
  }
  return Boolean(token);
};
