import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearToken,
  getToken,
  isAuthenticated,
  isTokenExpired,
  redirectToLogin,
  setToken,
} from './auth';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const makeToken = (expSeconds: number) => {
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `header.${payload}.signature`;
};

describe('auth', () => {
  it('сохраняет и очищает токен', () => {
    setToken('abc');
    expect(getToken()).toBe('abc');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('определяет просроченный и валидный токен', () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired('broken.token')).toBe(true);
    expect(isTokenExpired(makeToken(Math.floor(Date.now() / 1000) - 10))).toBe(
      true
    );
    expect(isTokenExpired(makeToken(Math.floor(Date.now() / 1000) + 3600))).toBe(
      false
    );
  });

  it('проверяет аутентификацию по токену', () => {
    setToken(makeToken(Math.floor(Date.now() / 1000) + 3600));
    expect(isAuthenticated()).toBe(true);
    setToken(makeToken(Math.floor(Date.now() / 1000) - 10));
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
  });

  it('перенаправляет на login и очищает токен', () => {
    const replace = vi.fn();
    vi.stubGlobal('window', {
      location: {
        pathname: '/schedule',
        replace,
      },
    });
    setToken('token');

    redirectToLogin();

    expect(getToken()).toBeNull();
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('не перенаправляет, если уже на странице login', () => {
    const replace = vi.fn();
    vi.stubGlobal('window', {
      location: {
        pathname: '/login',
        replace,
      },
    });

    redirectToLogin();

    expect(replace).not.toHaveBeenCalled();
  });
});
