import { describe, expect, it, vi } from 'vitest';

import { dateFieldSlotProps, openDatePicker } from './dateField';

describe('dateField', () => {
  it('открывает date picker у вложенного input', () => {
    const showPicker = vi.fn();
    const input = { showPicker } as unknown as HTMLInputElement;
    const currentTarget = {
      querySelector: vi.fn(() => input),
    } as unknown as HTMLElement;

    openDatePicker({ currentTarget } as never);

    expect(showPicker).toHaveBeenCalled();
  });

  it('не падает, если input не найден', () => {
    const currentTarget = {
      querySelector: vi.fn(() => null),
    } as unknown as HTMLElement;

    expect(() => openDatePicker({ currentTarget } as never)).not.toThrow();
  });

  it('вызывает showPicker при клике по htmlInput', () => {
    const showPicker = vi.fn();
    const currentTarget = { showPicker } as unknown as HTMLInputElement;

    dateFieldSlotProps.htmlInput.onClick({ currentTarget } as never);

    expect(showPicker).toHaveBeenCalled();
  });
});
