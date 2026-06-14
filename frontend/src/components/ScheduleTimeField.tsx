import React from "react";
import { type Dayjs } from "dayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import type { SxProps, Theme } from "@mui/material";
import { createMoscowTime } from "../utils/moscowTime";

interface ScheduleTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
}

const formatTime = (value: Dayjs | null) =>
  value?.isValid() ? value.format("HH:mm") : "";

export const ScheduleTimeField: React.FC<ScheduleTimeFieldProps> = ({
  value,
  onChange,
  sx,
  fullWidth = false,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <TimePicker
      ampm={false}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={createMoscowTime(value)}
      onChange={(newValue) => onChange(formatTime(newValue))}
      format="HH:mm"
      views={["hours", "minutes"]}
      openTo="hours"
      minutesStep={1}
      viewRenderers={{
        hours: renderTimeViewClock,
        minutes: renderTimeViewClock,
      }}
      slotProps={{
        textField: {
          fullWidth,
          variant: "outlined",
          size: "small",
          onClick: () => setOpen(true),
          sx: {
            cursor: "pointer",
            "& .MuiInputBase-root": { cursor: "pointer" },
            "& .MuiInputBase-input": { cursor: "pointer" },
            ...sx,
          },
          slotProps: {
            htmlInput: { readOnly: true },
          },
        },
      }}
    />
  );
};
