import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Autocomplete,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../api/axios";
import type { Schedule as ScheduleData, Shift, User } from "../types";
import { scheduleStyles } from "../styles";
import { getApiErrorMessage } from "../utils/apiError";
import { fetchCurrentUser } from "../utils/currentUser";
import { formatScheduleGridUserName } from "../utils/format";
import { formatMoscowDate } from "../utils/moscowTime";
import { buildScheduleGrid } from "../utils/scheduleGrid";
import { isManagerRole } from "../utils/roleAccess";
import {
  canCuratorRemoveFromShift,
  canCuratorSignupToShift,
  getScheduleRegistrationHint,
} from "../utils/schedulePermissions";
import {
  applyShiftAssignment,
  getStoredScheduleId,
  isValidShiftUserRecordId,
  removeShiftUserFromSchedule,
  setStoredScheduleId,
} from "../utils/scheduleCache";

interface ScheduleOption {
  id: number;
  label: string;
}

const formatScheduleLabel = (startDate: string, endDate: string) =>
  `${formatMoscowDate(startDate)} — ${formatMoscowDate(endDate)}`;

const REMOVE_SHIFT_ERROR = "Не удалось удалить запись со смены";

const shouldRefreshScheduleAfterAssignError = (error: unknown) => {
  const message = getApiErrorMessage(error, "");
  return message.includes("свободных мест") || message.includes("уже записан");
};

export const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | "">(
    getStoredScheduleId,
  );
  const [scheduleDetail, setScheduleDetail] = useState<ScheduleData | null>(
    null,
  );
  const [curators, setCurators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [activeAddCell, setActiveAddCell] = useState<string | null>(null);
  const [busyCell, setBusyCell] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const actionErrorRef = useRef<HTMLDivElement>(null);
  const busyCellRef = useRef<string | null>(null);
  const activeAddCellRef = useRef<string | null>(null);

  busyCellRef.current = busyCell;
  activeAddCellRef.current = activeAddCell;

  const isAdmin = currentUser ? isManagerRole(currentUser.role) : false;
  const isCurator = currentUser?.role === "CURATOR";

  const canSignupToCell = (shiftStartTime?: string, hasFreeSlot = false) => {
    if (!hasFreeSlot || !shiftStartTime || !scheduleDetail) return false;
    if (isAdmin) return true;
    return canCuratorSignupToShift(scheduleDetail, shiftStartTime);
  };

  const canShowRemoveButton = (isMine: boolean) => {
    if (isAdmin) return true;
    if (!isMine || !scheduleDetail) return false;
    return canCuratorRemoveFromShift(scheduleDetail);
  };

  const loadSchedules = useCallback(async () => {
    const schedulesRes =
      await api.get<Pick<ScheduleData, "id" | "start_date" | "end_date">[]>(
        "/schedule/",
      );
    const options = schedulesRes.data.map((item) => ({
      id: item.id,
      label: formatScheduleLabel(item.start_date, item.end_date),
    }));
    setSchedules(options);
    setLoadError("");

    setSelectedScheduleId((current) => {
      if (current && options.some((item) => item.id === current)) {
        return current;
      }
      const stored = getStoredScheduleId();
      if (stored && options.some((item) => item.id === stored)) {
        return stored;
      }
      if (current && !options.some((item) => item.id === current)) {
        setStoredScheduleId("");
        return "";
      }
      return current;
    });
  }, []);

  const loadScheduleDetail = useCallback(
    async (scheduleId: number, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setGridLoading(true);
        setDetailError("");
      }
      try {
        const response = await api.get<ScheduleData>(`/schedule/${scheduleId}`);
        setScheduleDetail(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке расписания:", error);
        if (!options?.silent) {
          setScheduleDetail(null);
          setDetailError(
            getApiErrorMessage(
              error,
              "Не удалось загрузить расписание. Попробуйте обновить страницу.",
            ),
          );
        }
      } finally {
        if (!options?.silent) {
          setGridLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        setCurrentUser(await fetchCurrentUser());
      } catch {
        setCurrentUser(null);
      }

      try {
        await loadSchedules();
      } catch (error) {
        console.error("Ошибка при загрузке расписаний:", error);
        setSchedules([]);
        setLoadError("Не удалось загрузить список расписаний");
      }

      setLoading(false);
    };

    loadInitialData();
  }, [loadSchedules]);

  useEffect(() => {
    const state = location.state as { refreshSchedules?: boolean } | null;
    if (!state?.refreshSchedules) return;

    const refreshAfterSave = async () => {
      try {
        await loadSchedules();
        if (selectedScheduleId) {
          await loadScheduleDetail(selectedScheduleId, { silent: true });
        }
      } catch (error) {
        console.error("Ошибка при обновлении расписаний:", error);
      } finally {
        navigate("/schedule", { replace: true, state: null });
      }
    };

    refreshAfterSave();
  }, [
    location.state,
    loadSchedules,
    loadScheduleDetail,
    navigate,
    selectedScheduleId,
  ]);

  useEffect(() => {
    if (!selectedScheduleId) {
      setScheduleDetail(null);
      return;
    }
    loadScheduleDetail(selectedScheduleId);
  }, [selectedScheduleId, loadScheduleDetail]);

  useEffect(() => {
    setStoredScheduleId(selectedScheduleId);
  }, [selectedScheduleId]);

  useEffect(() => {
    if (!selectedScheduleId) return;

    const refreshSchedule = () => {
      if (busyCellRef.current || activeAddCellRef.current) return;
      loadScheduleDetail(selectedScheduleId, { silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshSchedule();
      }
    };

    const intervalId = window.setInterval(refreshSchedule, 8_000);
    window.addEventListener("focus", refreshSchedule);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshSchedule);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedScheduleId, loadScheduleDetail]);

  useEffect(() => {
    if (actionError) {
      actionErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [actionError]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadCurators = async () => {
      try {
        const departmentId = currentUser?.position?.department?.id;
        const response = await api.get<User[]>("/user/", {
          params: {
            role: "CURATOR",
            is_active: true,
            limit: 1000,
            ...(departmentId ? { department_id: departmentId } : {}),
          },
        });
        setCurators(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке кураторов:", error);
        setCurators([]);
      }
    };

    loadCurators();
  }, [isAdmin, currentUser?.position?.department?.id]);

  const gridData = useMemo(() => {
    if (!scheduleDetail) {
      return { dates: [], times: [], grid: {} };
    }
    return buildScheduleGrid(scheduleDetail, currentUser?.id);
  }, [scheduleDetail, currentUser?.id]);

  const handleAssignUser = async (
    cellKey: string,
    shiftId: number,
    userId: number,
    assignedUser?: User,
  ) => {
    setBusyCell(cellKey);
    setActionError("");
    try {
      const response = await api.post<Shift>(
        `/shift/${shiftId}/assign/${userId}`,
      );
      setActiveAddCell(null);
      const userForPatch =
        assignedUser ??
        curators.find((curator) => curator.id === userId) ??
        (currentUser?.id === userId ? currentUser : undefined);

      setScheduleDetail((prev) =>
        prev
          ? applyShiftAssignment(
              prev,
              shiftId,
              userId,
              userForPatch,
              response.data,
            )
          : prev,
      );
    } catch (error) {
      console.error("Ошибка при назначении куратора:", error);
      setActionError(
        getApiErrorMessage(error, "Не удалось добавить куратора на смену"),
      );
      if (selectedScheduleId && shouldRefreshScheduleAfterAssignError(error)) {
        await loadScheduleDetail(selectedScheduleId, { silent: true });
      }
    } finally {
      setBusyCell(null);
    }
  };

  const handleRemoveUser = async (
    cellKey: string,
    shiftUserId: number,
    userId: number,
    shiftId: number,
    isMine: boolean,
  ) => {
    setBusyCell(cellKey);
    setActionError("");

    if (
      !isAdmin &&
      isMine &&
      scheduleDetail &&
      !canCuratorRemoveFromShift(scheduleDetail)
    ) {
      setActionError("Удаление записей на смены сейчас недоступно");
      setBusyCell(null);
      return;
    }

    if (!userId || !shiftId) {
      setActionError(REMOVE_SHIFT_ERROR);
      setBusyCell(null);
      return;
    }

    try {
      const deleted = isValidShiftUserRecordId(shiftUserId)
        ? await api.delete(`/shift/assign-record/${shiftUserId}`)
        : await api.delete(`/shift/${shiftId}/assign/${userId}`);
      if (!deleted.data) {
        setActionError(REMOVE_SHIFT_ERROR);
        if (selectedScheduleId) {
          await loadScheduleDetail(selectedScheduleId, { silent: true });
        }
        return;
      }
      setScheduleDetail((prev) =>
        prev
          ? removeShiftUserFromSchedule(prev, shiftUserId, userId, shiftId)
          : prev,
      );
    } catch (error) {
      console.error("Ошибка при удалении записи:", error);
      setActionError(getApiErrorMessage(error, REMOVE_SHIFT_ERROR));
    } finally {
      setBusyCell(null);
    }
  };

  const handleSignup = async (cellKey: string, shiftId: number) => {
    if (!currentUser) return;
    await handleAssignUser(cellKey, shiftId, currentUser.id, currentUser);
  };

  const handleDeleteSchedule = async () => {
    if (!selectedScheduleId) return;
    setDeleting(true);
    try {
      await api.delete(`/schedule/${selectedScheduleId}`);
      setSelectedScheduleId("");
      setScheduleDetail(null);
      setActiveAddCell(null);
      setStoredScheduleId("");
      await loadSchedules();
    } catch (error) {
      console.error("Ошибка при удалении расписания:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          ...scheduleStyles.container,
          display: "flex",
          justifyContent: "center",
          mt: 10,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={scheduleStyles.container}>
      <Box sx={scheduleStyles.pageHeader}>
        <Typography variant="h4" sx={scheduleStyles.pageTitle}>
          Расписание
        </Typography>
      </Box>

      <Paper sx={scheduleStyles.toolbarCard}>
        <Box sx={scheduleStyles.toolbarRow}>
          <TextField
            select
            label="Выбор даты"
            value={selectedScheduleId}
            onChange={(e) => {
              setActiveAddCell(null);
              setSelectedScheduleId(
                e.target.value === "" ? "" : Number(e.target.value),
              );
            }}
            sx={scheduleStyles.selectField}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">
              <em>Не выбрано</em>
            </MenuItem>
            {schedules.map((schedule) => (
              <MenuItem key={schedule.id} value={schedule.id}>
                {schedule.label}
              </MenuItem>
            ))}
          </TextField>

          {isAdmin && (
            <Box sx={scheduleStyles.toolbarActions}>
              <Button
                variant="contained"
                sx={scheduleStyles.primaryAction}
                onClick={() => navigate("/schedule/add")}
              >
                Добавить расписание
              </Button>
              <Button
                variant="outlined"
                disabled={!selectedScheduleId}
                sx={scheduleStyles.secondaryAction}
                onClick={() => navigate(`/schedule/edit/${selectedScheduleId}`)}
              >
                Изменить расписание
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {actionError && (
        <Box ref={actionErrorRef}>
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setActionError("")}
          >
            {actionError}
          </Alert>
        </Box>
      )}

      {detailError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setDetailError("")}>
          {detailError}
        </Alert>
      )}

      {isCurator && scheduleDetail && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {getScheduleRegistrationHint(scheduleDetail)}
        </Alert>
      )}

      {!selectedScheduleId ? (
        <Paper sx={scheduleStyles.gridCard}>
          <Typography sx={scheduleStyles.emptyState}>
            {loadError ||
              (schedules.length === 0
                ? "Расписания пока нет"
                : "Выберите расписание, чтобы увидеть сетку смен")}
          </Typography>
        </Paper>
      ) : gridLoading ? (
        <Paper sx={scheduleStyles.gridCard}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={scheduleStyles.gridCard}>
            <Table sx={scheduleStyles.gridTable} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={scheduleStyles.gridCornerCell}>
                    Время
                  </TableCell>
                  {gridData.dates.map((date) => (
                    <TableCell key={date} sx={scheduleStyles.gridDateHead}>
                      {date}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {gridData.times.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={gridData.dates.length + 1}>
                      <Typography sx={scheduleStyles.emptyState}>
                        {detailError
                          ? detailError
                          : scheduleDetail?.shift_schedule.length
                            ? "Не удалось построить сетку смен"
                            : "В расписании нет смен. Нажмите «Изменить расписание» и укажите часы и количество кураторов."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  gridData.times.map((time) => (
                    <TableRow key={time}>
                      <TableCell sx={scheduleStyles.gridTimeCell}>
                        {time}
                      </TableCell>
                      {gridData.dates.map((date) => {
                        const cellKey = `${time}-${date}`;
                        const cell = gridData.grid[cellKey] ?? {
                          entries: [],
                          hasFreeSlot: false,
                        };
                        const isPickerOpen = activeAddCell === cellKey;
                        const isBusy = busyCell === cellKey;
                        const assignedUserIds = new Set(
                          cell.entries.map((entry) => entry.userId),
                        );
                        const availableCurators = curators.filter(
                          (curator) => !assignedUserIds.has(curator.id),
                        );
                        const isCurrentUserAssigned = cell.entries.some(
                          (entry) => entry.isMine,
                        );

                        return (
                          <TableCell key={cellKey} sx={scheduleStyles.slotCell}>
                            {cell.entries.map((entry) => (
                              <Box
                                key={entry.id}
                                sx={scheduleStyles.slotOccupied}
                              >
                                <span>{entry.curatorName}</span>
                                {canShowRemoveButton(Boolean(entry.isMine)) &&
                                  cell.shiftId && (
                                    <IconButton
                                      size="small"
                                      disabled={isBusy}
                                      sx={scheduleStyles.slotRemoveBtn}
                                      aria-label="Удалить запись"
                                      onClick={() =>
                                        handleRemoveUser(
                                          cellKey,
                                          Number(entry.id),
                                          entry.userId,
                                          cell.shiftId!,
                                          Boolean(entry.isMine),
                                        )
                                      }
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  )}
                              </Box>
                            ))}

                            {cell.entries.length === 0 && (
                              <Typography sx={scheduleStyles.slotEmptyText}>
                                Никто не записан
                              </Typography>
                            )}

                            {canSignupToCell(
                              cell.shiftStartTime,
                              cell.hasFreeSlot,
                            ) &&
                              !isCurrentUserAssigned &&
                              !isAdmin &&
                              cell.shiftId && (
                                <Button
                                  disabled={isBusy}
                                  sx={scheduleStyles.slotSignupBtn}
                                  onClick={() =>
                                    handleSignup(cellKey, cell.shiftId!)
                                  }
                                >
                                  {isBusy ? (
                                    <CircularProgress size={18} />
                                  ) : (
                                    "Записаться"
                                  )}
                                </Button>
                              )}

                            {canSignupToCell(
                              cell.shiftStartTime,
                              cell.hasFreeSlot,
                            ) &&
                              isAdmin &&
                              cell.shiftId && (
                                <>
                                  {isPickerOpen ? (
                                    <Autocomplete
                                      size="small"
                                      options={availableCurators}
                                      getOptionLabel={(curator) =>
                                        formatScheduleGridUserName(curator) ??
                                        ""
                                      }
                                      renderOption={(props, curator) => {
                                        const { key, ...optionProps } = props;
                                        return (
                                          <li key={key} {...optionProps}>
                                            {formatScheduleGridUserName(
                                              curator,
                                            )}
                                          </li>
                                        );
                                      }}
                                      loading={isBusy}
                                      onChange={(_, curator) => {
                                        if (curator) {
                                          handleAssignUser(
                                            cellKey,
                                            cell.shiftId!,
                                            curator.id,
                                            curator,
                                          );
                                        }
                                      }}
                                      disableCloseOnSelect
                                      openOnFocus
                                      autoHighlight
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          label="Поиск куратора"
                                          autoFocus
                                          sx={scheduleStyles.curatorPicker}
                                        />
                                      )}
                                      slotProps={{
                                        paper: { sx: { fontSize: "13px" } },
                                      }}
                                    />
                                  ) : (
                                    <Button
                                      disabled={isBusy}
                                      sx={scheduleStyles.slotAddBtn}
                                      onClick={() => setActiveAddCell(cellKey)}
                                    >
                                      {isBusy ? (
                                        <CircularProgress size={18} />
                                      ) : (
                                        "Добавить"
                                      )}
                                    </Button>
                                  )}
                                </>
                              )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {isAdmin && (
            <Box sx={scheduleStyles.footerActions}>
              <Button
                sx={scheduleStyles.dangerButton}
                disabled={deleting}
                onClick={handleDeleteSchedule}
              >
                {deleting ? (
                  <CircularProgress size={22} sx={{ color: "#c62828" }} />
                ) : (
                  "Удалить расписание"
                )}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
