import api from '../api/axios';
import type { User } from '../types';
import {
  clearUserCache,
  getCachedUser,
  getInflightUserRequest,
  setCachedUser,
  setInflightUserRequest,
} from './userCache';

export const fetchCurrentUser = async (force = false): Promise<User> => {
  if (!force) {
    const cached = getCachedUser();
    if (cached) return cached;

    const inflight = getInflightUserRequest();
    if (inflight) return inflight;
  }

  const request = api
    .get<User>('/user/me')
    .then((response) => {
      setCachedUser(response.data);
      return response.data;
    })
    .finally(() => {
      setInflightUserRequest(null);
    });

  setInflightUserRequest(request);
  return request;
};

export const setCachedCurrentUser = (user: User) => {
  setCachedUser(user);
};

export const clearCurrentUserCache = () => {
  clearUserCache();
};
