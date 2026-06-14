import type { MouseEvent } from 'react';

export const openTimePicker = (event: MouseEvent<HTMLElement>) => {
  const input = event.currentTarget.querySelector(
    'input[type="time"]'
  ) as HTMLInputElement | null;

  input?.showPicker?.();
};

export const timeFieldSlotProps = {
  htmlInput: {
    onClick: (event: MouseEvent<HTMLInputElement>) => {
      event.currentTarget.showPicker?.();
    },
  },
};
