import { memo } from "react";
import {
  Box,
  IconButton,
  MenuItem,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import type { Shift_type } from "../types";
import {
  buildHourSlots,
  findNightShiftTypeId,
  getShiftCellKey,
  isNightShiftHour,
  resolveCellShiftTypeId,
  type DayHours,
} from "../utils/scheduleForm";
import { scheduleStyles } from "../styles";

interface ScheduleCapacityRowProps {
  hour: string;
  dayHours: DayHours[];
  capacity: Record<string, number>;
  cellShiftTypes: Record<string, number>;
  defaultShiftTypeId: number | undefined;
  shiftTypes: Shift_type[];
  onAdjustRow: (hour: string, delta: number) => void;
  onUpdateCapacity: (key: string, value: number) => void;
  onUpdateShiftType: (key: string, typeId: number) => void;
}

export const ScheduleCapacityRow = memo(function ScheduleCapacityRow({
  hour,
  dayHours,
  capacity,
  cellShiftTypes,
  defaultShiftTypeId,
  shiftTypes,
  onAdjustRow,
  onUpdateCapacity,
  onUpdateShiftType,
}: ScheduleCapacityRowProps) {
  const hasActiveCells = dayHours.some((day) =>
    buildHourSlots(day.start, day.end).includes(hour),
  );

  const getSelectTypeId = (key: string) => {
    if (isNightShiftHour(hour)) {
      const nightTypeId = findNightShiftTypeId(shiftTypes);
      if (nightTypeId !== undefined) {
        return nightTypeId;
      }
    }
    return (
      resolveCellShiftTypeId(
        hour,
        shiftTypes,
        cellShiftTypes[key],
        defaultShiftTypeId,
      ) ?? ""
    );
  };

  return (
    <TableRow sx={scheduleStyles.tableRow}>
      <TableCell sx={scheduleStyles.capacityHourCell}>
        <Box sx={scheduleStyles.capacityHourContent}>
          <Typography sx={scheduleStyles.capacityHourLabel}>{hour}</Typography>
          {hasActiveCells && (
            <Box sx={scheduleStyles.capacityRowControls}>
              <IconButton
                size="small"
                disableRipple
                onClick={() => onAdjustRow(hour, -1)}
                sx={scheduleStyles.capacityControlBtn}
                aria-label={`Уменьшить количество на ${hour}`}
              >
                <RemoveIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                onClick={() => onAdjustRow(hour, 1)}
                sx={scheduleStyles.capacityControlBtn}
                aria-label={`Увеличить количество на ${hour}`}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </TableCell>
      {dayHours.map((day) => {
        const key = getShiftCellKey(day.date, hour);
        const isVisible = buildHourSlots(day.start, day.end).includes(hour);

        return (
          <TableCell
            key={key}
            align="center"
            sx={scheduleStyles.capacityDayCell}
          >
            {isVisible ? (
              <Box sx={scheduleStyles.capacityCell}>
                <TextField
                  type="number"
                  value={capacity[key] ?? 0}
                  onChange={(e) =>
                    onUpdateCapacity(
                      key,
                      Math.max(0, Number(e.target.value) || 0),
                    )
                  }
                  slotProps={{ htmlInput: { min: 0 } }}
                  sx={scheduleStyles.capacityInput}
                />
                <TextField
                  select
                  size="small"
                  value={getSelectTypeId(key)}
                  onChange={(e) =>
                    onUpdateShiftType(key, Number(e.target.value))
                  }
                  disabled={shiftTypes.length === 0}
                  sx={scheduleStyles.capacityTypeSelect}
                >
                  {shiftTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ) : (
              "—"
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
});
