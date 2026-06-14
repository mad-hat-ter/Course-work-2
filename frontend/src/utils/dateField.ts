import type { MouseEvent } from 'react';

export const openDatePicker = (event: MouseEvent<HTMLElement>) => {
  const input = event.currentTarget.querySelector(
    'input[type="date"]'
  ) as HTMLInputElement | null;

  input?.showPicker?.();
};

export const dateFieldSlotProps = {
  htmlInput: {
    onClick: (event: MouseEvent<HTMLInputElement>) => {
      event.currentTarget.showPicker?.();
    },
  },
};
