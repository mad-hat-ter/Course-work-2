import type { Role } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRATOR: 'Руководитель',
  MANAGER: 'Менеджер',
  CURATOR: 'Куратор',
  NONE: 'Не назначена',
};

export const getRoleLabel = (role: string) => {
  const key = role.toUpperCase() as Role;
  return ROLE_LABELS[key] ?? role;
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'CURATOR', label: 'Куратор' },
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'ADMINISTRATOR', label: 'Руководитель' },
];
