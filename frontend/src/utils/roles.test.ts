import { describe, expect, it } from 'vitest';

import { getRoleLabel, ROLE_OPTIONS } from './roles';

describe('roles', () => {
  it('возвращает русские названия ролей', () => {
    expect(getRoleLabel('ADMINISTRATOR')).toBe('Руководитель');
    expect(getRoleLabel('MANAGER')).toBe('Менеджер');
    expect(getRoleLabel('CURATOR')).toBe('Куратор');
    expect(getRoleLabel('NONE')).toBe('Не назначена');
  });

  it('возвращает исходное значение для неизвестной роли', () => {
    expect(getRoleLabel('custom')).toBe('custom');
  });

  it('содержит варианты выбора ролей', () => {
    expect(ROLE_OPTIONS.map((item) => item.value)).toEqual([
      'CURATOR',
      'MANAGER',
      'ADMINISTRATOR',
    ]);
  });
});
