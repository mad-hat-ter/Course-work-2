import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Button,
  InputAdornment,
} from "@mui/material";
import {
  CalendarMonthOutlined as CalendarMonthIcon,
  Search as SearchIcon,
  FileDownloadOutlined as FileDownloadIcon,
  FilterAlt as FilterAltIcon,
} from "@mui/icons-material";
import api from "../api/axios";
import { fetchCurrentUser } from "../utils/currentUser";
import { formatMoney } from "../utils/format";
import { dateFieldSlotProps, openDatePicker } from "../utils/dateField";
import { getPaginationItems } from "../utils/pagination";
import { manageStatisticsStyles } from "../styles";

interface Department {
  id: number;
  title: string;
}

interface CuratorStatisticsRow {
  user_id: number;
  curator_name: string;
  counts: number[];
  payment: number;
}

interface AdminStatisticsResponse {
  shift_type_columns: string[];
  rows: CuratorStatisticsRow[];
  total: number;
}

const CACHE_KEY = "admin_statistics_dates_cache";
const ITEMS_PER_PAGE = 5;

interface DatesCache {
  startDate: string;
  endDate: string;
}

export const ManageStatistics: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [deptFilter, setDeptFilter] = useState<number | "all">("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentTitle, setDepartmentTitle] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shiftTypeColumns, setShiftTypeColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<CuratorStatisticsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginationItems = getPaginationItems(page, totalPages);
  const canExport = hasFetched && total > 0 && !loading;

  const filterParams = useMemo(
    () => ({
      q: searchQuery.trim() || undefined,
      is_active: activeFilter === "all" ? undefined : activeFilter === "active",
      department_id: deptFilter === "all" ? undefined : deptFilter,
      role: roleFilter === "all" ? undefined : roleFilter,
    }),
    [searchQuery, activeFilter, deptFilter, roleFilter],
  );

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;

    try {
      const parsed: DatesCache = JSON.parse(cached);
      setStartDate(parsed.startDate);
      setEndDate(parsed.endDate);
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  useEffect(() => {
    const loadDepartmentScope = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        const departmentId = currentUser.position?.department?.id;

        if (departmentId) {
          setDeptFilter(departmentId);
          setDepartmentTitle(
            currentUser.position?.department?.title ?? "Ваш отдел",
          );
        }

        const response = await api.get<Department[]>("/department/", {
          params: { limit: 1000 },
        });
        setDepartments(response.data);
      } catch (err) {
        console.warn("Не удалось получить данные отдела:", err);
      }
    };
    loadDepartmentScope();
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) {
      setRows([]);
      setShiftTypeColumns([]);
      setTotal(0);
      setHasFetched(false);
      setError("");
      return;
    }

    if (endDate < startDate) {
      setError("Конец периода не может быть раньше начала");
      setRows([]);
      setShiftTypeColumns([]);
      setTotal(0);
      setHasFetched(false);
      return;
    }

    const fetchStatistics = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<AdminStatisticsResponse>(
          "/user/statistics/admin",
          {
            params: {
              start_date: startDate,
              end_date: endDate,
              ...filterParams,
              skip: (page - 1) * ITEMS_PER_PAGE,
              limit: ITEMS_PER_PAGE,
            },
          },
        );
        setShiftTypeColumns(response.data.shift_type_columns);
        setRows(response.data.rows);
        setTotal(response.data.total);
        setHasFetched(true);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ startDate, endDate } satisfies DatesCache),
        );
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Не удалось получить статистику",
        );
        setRows([]);
        setShiftTypeColumns([]);
        setTotal(0);
        setHasFetched(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [startDate, endDate, filterParams, page]);

  const emptyMessage = useMemo(() => {
    if (!hasFetched) {
      return "Выберите период для просмотра статистики";
    }
    if (
      searchQuery.trim() ||
      activeFilter !== "all" ||
      deptFilter !== "all" ||
      roleFilter !== "all"
    ) {
      return "Кураторы не найдены";
    }
    return "Нет данных за выбранный период";
  }, [hasFetched, searchQuery, activeFilter, deptFilter, roleFilter]);

  const handleExport = async () => {
    if (!startDate || !endDate || endDate < startDate) return;

    setExporting(true);
    setError("");
    try {
      const response = await api.get("/user/statistics/admin/export", {
        params: {
          start_date: startDate,
          end_date: endDate,
          ...filterParams,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "statistics.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Не удалось экспортировать данные",
      );
    } finally {
      setExporting(false);
    }
  };

  const resetPage = () => setPage(1);

  return (
    <Box sx={manageStatisticsStyles.container}>
      <Box sx={manageStatisticsStyles.pageHeader}>
        <Typography variant="h4" sx={manageStatisticsStyles.pageTitle}>
          Статистика
        </Typography>
      </Box>

      <Paper sx={manageStatisticsStyles.filterCard}>
        <Box sx={manageStatisticsStyles.filterCardContent}>
          <Box sx={manageStatisticsStyles.periodFields}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={manageStatisticsStyles.fieldLabelBox}>
                  <CalendarMonthIcon
                    sx={manageStatisticsStyles.fieldLabelIcon}
                  />
                  <Typography sx={manageStatisticsStyles.fieldLabelText}>
                    Начало периода
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    resetPage();
                  }}
                  onClick={openDatePicker}
                  slotProps={dateFieldSlotProps}
                  variant="outlined"
                  sx={manageStatisticsStyles.textField}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={manageStatisticsStyles.fieldLabelBox}>
                  <CalendarMonthIcon
                    sx={manageStatisticsStyles.fieldLabelIcon}
                  />
                  <Typography sx={manageStatisticsStyles.fieldLabelText}>
                    Конец периода
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    resetPage();
                  }}
                  onClick={openDatePicker}
                  slotProps={dateFieldSlotProps}
                  variant="outlined"
                  sx={manageStatisticsStyles.textField}
                />
              </Grid>
            </Grid>
          </Box>

          <Button
            variant="contained"
            onClick={handleExport}
            disabled={!canExport || exporting}
            startIcon={<FileDownloadIcon />}
            sx={manageStatisticsStyles.exportButton}
          >
            {exporting ? "Экспорт..." : "Экспорт"}
          </Button>
        </Box>
      </Paper>

      <Box sx={manageStatisticsStyles.searchBarContainer}>
        <TextField
          placeholder="Поиск кураторов..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            resetPage();
          }}
          sx={manageStatisticsStyles.searchField}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={manageStatisticsStyles.searchIcon} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid
          size={{ xs: 12, md: 9 }}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <TableContainer
            component={Paper}
            sx={manageStatisticsStyles.tableCard}
          >
            {loading ? (
              <Box sx={manageStatisticsStyles.loadingBox}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead sx={manageStatisticsStyles.tableHead}>
                  <TableRow>
                    <TableCell>Куратор</TableCell>
                    {shiftTypeColumns.map((column) => (
                      <TableCell key={column} sx={{ textAlign: "center" }}>
                        {column}
                      </TableCell>
                    ))}
                    <TableCell sx={{ textAlign: "right" }}>Оплата</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hasFetched && rows.length > 0 ? (
                    rows.map((row) => (
                      <TableRow
                        key={row.user_id}
                        sx={manageStatisticsStyles.tableRow}
                      >
                        <TableCell sx={manageStatisticsStyles.tableCellCurator}>
                          {row.curator_name}
                        </TableCell>
                        {row.counts.map((count, index) => (
                          <TableCell
                            key={`${row.user_id}-${index}`}
                            sx={manageStatisticsStyles.tableCellCount}
                          >
                            {count}
                          </TableCell>
                        ))}
                        <TableCell sx={manageStatisticsStyles.tableCellNumber}>
                          {formatMoney(row.payment)} ₽
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={Math.max(shiftTypeColumns.length + 2, 3)}
                        sx={manageStatisticsStyles.emptyCell}
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={manageStatisticsStyles.paginationContainer}>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <Box
                    key={`ellipsis-${index}`}
                    sx={manageStatisticsStyles.pageEllipsis}
                  >
                    …
                  </Box>
                ) : (
                  <Button
                    key={item}
                    onClick={() => setPage(item)}
                    sx={
                      page === item
                        ? manageStatisticsStyles.activePageBtn
                        : manageStatisticsStyles.pageBtn
                    }
                  >
                    {item}
                  </Button>
                ),
              )}
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={manageStatisticsStyles.sidebarFilterCard}>
            <Box sx={manageStatisticsStyles.filterHeader}>
              <FilterAltIcon sx={manageStatisticsStyles.filterIcon} />
              <Typography sx={manageStatisticsStyles.filterTitle}>
                Фильтры
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={manageStatisticsStyles.filterLabel}>
                Активный?
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={() => {
                    setActiveFilter(
                      activeFilter === "active" ? "all" : "active",
                    );
                    resetPage();
                  }}
                  sx={
                    activeFilter === "active"
                      ? manageStatisticsStyles.filterActiveBtn
                      : manageStatisticsStyles.filterOutlineBtn
                  }
                >
                  Да
                </Button>
                <Button
                  onClick={() => {
                    setActiveFilter(
                      activeFilter === "inactive" ? "all" : "inactive",
                    );
                    resetPage();
                  }}
                  sx={
                    activeFilter === "inactive"
                      ? manageStatisticsStyles.filterActiveBtn
                      : manageStatisticsStyles.filterOutlineBtn
                  }
                >
                  Нет
                </Button>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={manageStatisticsStyles.filterLabel}>
                Отдел
              </Typography>
              <Typography sx={{ fontWeight: 600, color: "#1a2b4a" }}>
                {departmentTitle ||
                  departments.find((dept) => dept.id === deptFilter)?.title ||
                  "Не указан"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={manageStatisticsStyles.filterLabel}>
                Должность
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  onClick={() => {
                    setRoleFilter(roleFilter === "CURATOR" ? "all" : "CURATOR");
                    resetPage();
                  }}
                  sx={
                    roleFilter === "CURATOR"
                      ? manageStatisticsStyles.filterRoleActiveBtn
                      : manageStatisticsStyles.filterRoleBtn
                  }
                >
                  Куратор
                </Button>
                <Button
                  onClick={() => {
                    setRoleFilter(roleFilter === "MANAGER" ? "all" : "MANAGER");
                    resetPage();
                  }}
                  sx={
                    roleFilter === "MANAGER"
                      ? manageStatisticsStyles.filterRoleActiveBtn
                      : manageStatisticsStyles.filterRoleBtn
                  }
                >
                  Менеджер
                </Button>
                <Button
                  onClick={() => {
                    setRoleFilter(
                      roleFilter === "ADMINISTRATOR" ? "all" : "ADMINISTRATOR",
                    );
                    resetPage();
                  }}
                  sx={
                    roleFilter === "ADMINISTRATOR"
                      ? manageStatisticsStyles.filterRoleActiveBtn
                      : manageStatisticsStyles.filterRoleBtn
                  }
                >
                  Руководитель
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
