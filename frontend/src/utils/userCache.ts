import type { User } from '../types';

let cachedUser: User | null = null;
let inflight: Promise<User> | null = null;

export const getCachedUser = () => cachedUser;

export const setCachedUser = (user: User) => {
  cachedUser = user;
};

export const getInflightUserRequest = () => inflight;

export const setInflightUserRequest = (request: Promise<User> | null) => {
  inflight = request;
};

export const clearUserCache = () => {
  cachedUser = null;
  inflight = null;
};
