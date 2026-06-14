import { describe, expect, it } from 'vitest';

import { canAccessPath, getMenuItemsForRole } from './roleAccess';

describe('roleAccess', () => {
  it('даёт куратору доступ к своим сменам и статистике', () => {
    expect(canAccessPath('CURATOR', '/shifts')).toBe(true);
    expect(canAccessPath('CURATOR', '/statistics')).toBe(true);
    expect(canAccessPath('CURATOR', '/manageprofiles')).toBe(false);
  });

  it('даёт администратору доступ к управлению профилями', () => {
    expect(canAccessPath('ADMINISTRATOR', '/manageprofiles')).toBe(true);
    expect(canAccessPath('ADMINISTRATOR', '/schedule/edit/1')).toBe(true);
  });

  it('формирует меню по роли', () => {
    const curatorMenu = getMenuItemsForRole('CURATOR').map((item) => item.path);
    expect(curatorMenu).toEqual([
      '/profile',
      '/shifts',
      '/schedule',
      '/statistics',
    ]);
  });

  it('разрешает менеджеру доступ к статистике отдела', () => {
    expect(canAccessPath('MANAGER', '/manage-statistics')).toBe(true);
    expect(canAccessPath('CURATOR', '/manage-statistics')).toBe(false);
  });

  it('разрешает менеджеру редактирование расписания', () => {
    expect(canAccessPath('MANAGER', '/schedule/edit/5')).toBe(true);
    expect(canAccessPath('CURATOR', '/schedule/edit/5')).toBe(false);
  });

  it('формирует меню менеджера и руководителя', () => {
    expect(getMenuItemsForRole('MANAGER').map((item) => item.path)).toEqual([
      '/profile',
      '/schedule',
      '/manage-statistics',
    ]);
    expect(getMenuItemsForRole('ADMINISTRATOR').map((item) => item.path)).toContain(
      '/manageprofiles'
    );
  });

  it('запрещает доступ к неизвестному маршруту', () => {
    expect(canAccessPath('NONE', '/unknown-page')).toBe(false);
  });
});
