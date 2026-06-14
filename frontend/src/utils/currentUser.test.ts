import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '../types';
import {
  clearCurrentUserCache,
  fetchCurrentUser,
  setCachedCurrentUser,
} from './currentUser';
import { clearUserCache, getCachedUser } from './userCache';

const user = {
  id: 2,
  name: 'Анна',
  surname: 'Петрова',
  lastname: '',
  email: 'anna@test.ru',
  phone: '',
  role: 'CURATOR',
  is_active: true,
  registration_date: '2026-01-01T00:00:00',
  last_login: null,
  position_id: 1,
} as User;

const getMock = vi.fn();

vi.mock('../api/axios', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

describe('currentUser', () => {
  beforeEach(() => {
    clearUserCache();
    getMock.mockReset();
  });

  it('возвращает пользователя из кэша без запроса', async () => {
    setCachedCurrentUser(user);
    const result = await fetchCurrentUser();
    expect(result).toEqual(user);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('загружает пользователя через API и кэширует результат', async () => {
    getMock.mockResolvedValue({ data: user });
    const result = await fetchCurrentUser(true);
    expect(result).toEqual(user);
    expect(getCachedUser()).toEqual(user);
    expect(getMock).toHaveBeenCalledWith('/user/me');
  });

  it('переиспользует inflight-запрос', async () => {
    let resolveRequest: (value: { data: User }) => void = () => undefined;
    getMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const first = fetchCurrentUser();
    const second = fetchCurrentUser();
    resolveRequest({ data: user });

    expect(await first).toEqual(user);
    expect(await second).toEqual(user);
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('очищает кэш текущего пользователя', () => {
    setCachedCurrentUser(user);
    clearCurrentUserCache();
    expect(getCachedUser()).toBeNull();
  });
});
