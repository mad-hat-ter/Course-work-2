import { beforeEach, describe, expect, it } from 'vitest';

import type { User } from '../types';
import {
  clearUserCache,
  getCachedUser,
  getInflightUserRequest,
  setCachedUser,
  setInflightUserRequest,
} from './userCache';

const user = {
  id: 1,
  name: 'Иван',
  surname: 'Иванов',
  lastname: '',
  email: 'ivan@test.ru',
  phone: '',
  role: 'CURATOR',
  is_active: true,
  registration_date: '2026-01-01T00:00:00',
  last_login: null,
  position_id: 1,
} as User;

describe('userCache', () => {
  beforeEach(() => {
    clearUserCache();
  });

  it('кэширует и возвращает пользователя', () => {
    expect(getCachedUser()).toBeNull();
    setCachedUser(user);
    expect(getCachedUser()).toEqual(user);
  });

  it('хранит и сбрасывает inflight-запрос', async () => {
    const request = Promise.resolve(user);
    setInflightUserRequest(request);
    expect(getInflightUserRequest()).toBe(request);
    setInflightUserRequest(null);
    expect(getInflightUserRequest()).toBeNull();
  });

  it('очищает кэш и inflight', async () => {
    setCachedUser(user);
    setInflightUserRequest(Promise.resolve(user));
    clearUserCache();
    expect(getCachedUser()).toBeNull();
    expect(getInflightUserRequest()).toBeNull();
  });
});
