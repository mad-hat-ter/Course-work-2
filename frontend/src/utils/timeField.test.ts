import { describe, expect, it, vi } from 'vitest';

import { openTimePicker, timeFieldSlotProps } from './timeField';

describe('timeField', () => {
  it('открывает time picker у вложенного input', () => {
    const showPicker = vi.fn();
    const input = { showPicker } as unknown as HTMLInputElement;
    const currentTarget = {
      querySelector: vi.fn(() => input),
    } as unknown as HTMLElement;

    openTimePicker({ currentTarget } as never);

    expect(showPicker).toHaveBeenCalled();
  });

  it('вызывает showPicker при клике по htmlInput', () => {
    const showPicker = vi.fn();
    const currentTarget = { showPicker } as unknown as HTMLInputElement;

    timeFieldSlotProps.htmlInput.onClick({ currentTarget } as never);

    expect(showPicker).toHaveBeenCalled();
  });
});
