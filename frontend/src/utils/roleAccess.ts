import type { Role } from '../types';

export const isAdministratorRole = (role: Role) => role === 'ADMINISTRATOR';

export const isManagerRole = (role: Role) =>
  role === 'MANAGER' || role === 'ADMINISTRATOR';

export const isCuratorRole = (role: Role) => role === 'CURATOR';

export interface AppMenuItem {
  text: string;
  path: string;
}

export const MENU_ITEMS: AppMenuItem[] = [
  { text: 'Профиль', path: '/profile' },
  { text: 'Мои смены', path: '/shifts' },
  { text: 'Расписание', path: '/schedule' },
  { text: 'Моя статистика', path: '/statistics' },
  { text: 'Статистика', path: '/manage-statistics' },
  { text: 'Управление профилями', path: '/manageprofiles' },
];

const ROLE_MENU_PATHS: Record<Role, string[]> = {
  CURATOR: ['/profile', '/shifts', '/schedule', '/statistics'],
  MANAGER: ['/profile', '/schedule', '/manage-statistics'],
  ADMINISTRATOR: [
    '/profile',
    '/schedule',
    '/manage-statistics',
    '/manageprofiles',
  ],
  NONE: ['/profile'],
};

const matchesPath = (path: string, allowedPath: string) =>
  path === allowedPath || path.startsWith(`${allowedPath}/`);

export const canAccessPath = (role: Role, path: string): boolean => {
  if (path === '/profile' || path.startsWith('/profile/')) {
    return true;
  }

  if (path === '/shifts' || path.startsWith('/shifts/')) {
    return isCuratorRole(role);
  }

  if (path === '/statistics' || path.startsWith('/statistics/')) {
    return isCuratorRole(role);
  }

  if (path.startsWith('/manage-statistics')) {
    return isManagerRole(role);
  }

  if (path.startsWith('/manageprofiles')) {
    return isAdministratorRole(role);
  }

  if (path === '/schedule/add' || path.startsWith('/schedule/edit')) {
    return isManagerRole(role);
  }

  if (path === '/schedule' || path.startsWith('/schedule/')) {
    return isCuratorRole(role) || isManagerRole(role);
  }

  return ROLE_MENU_PATHS[role]?.some((allowedPath) =>
    matchesPath(path, allowedPath)
  ) ?? false;
};

export const getMenuItemsForRole = (role: Role): AppMenuItem[] => {
  const allowedPaths = ROLE_MENU_PATHS[role] ?? ROLE_MENU_PATHS.NONE;
  return MENU_ITEMS.filter((item) => allowedPaths.includes(item.path));
};
