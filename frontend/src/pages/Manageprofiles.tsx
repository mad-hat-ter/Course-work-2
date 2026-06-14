import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import api from "../api/axios";
import { getRoleLabel } from "../utils/roles";
import { getPaginationItems } from "../utils/pagination";
import { commonStyles, manageProfilesStyles } from "../styles";

interface Department {
  id: number;
  title: string;
}

interface Position {
  id: number;
  title: string;
  department?: Department;
}

interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  lastname?: string;
  role: string;
  is_active: boolean;
  position?: Position;
}

export const Manageprofiles: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [deptFilter, setDeptFilter] = useState<number | "all">("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [usersResult, departmentsResult] = await Promise.allSettled([
        api.get<User[]>("/user/", { params: { limit: 1000 } }),
        api.get<Department[]>("/department/", { params: { limit: 1000 } }),
      ]);

      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.data);
      } else {
        console.warn("Не удалось получить сотрудников:", usersResult.reason);
        setUsers([]);
      }

      if (departmentsResult.status === "fulfilled") {
        setDepartments(departmentsResult.value.data);
      } else {
        console.warn("Не удалось получить отделы:", departmentsResult.reason);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const formatShortName = (user: User) => {
    return `${user.surname} ${user.name}`;
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const fullName =
        `${user.surname} ${user.name} ${user.lastname || ""}`.toLowerCase();
      const matchesSearch =
        fullName.includes(query) || user.email.toLowerCase().includes(query);
      const matchesActive =
        activeFilter === "all"
          ? true
          : activeFilter === "active"
            ? user.is_active
            : !user.is_active;
      const userDeptId = user.position?.department?.id;
      const matchesDept = deptFilter === "all" || userDeptId === deptFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesActive && matchesDept && matchesRole;
    });
  }, [users, searchQuery, activeFilter, deptFilter, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredUsers, page],
  );

  const paginationItems = getPaginationItems(page, totalPages);

  if (loading) {
    return (
      <Box sx={commonStyles.loadingCenter}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={manageProfilesStyles.container}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={manageProfilesStyles.pageTitle}>
          Управление профилями
        </Typography>
      </Box>

      <Box sx={manageProfilesStyles.searchBarContainer}>
        <TextField
          placeholder="Поиск сотрудников..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          sx={manageProfilesStyles.searchField}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={manageProfilesStyles.searchIcon} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          onClick={() => navigate("/manageprofiles/add")}
          startIcon={<PersonAddAlt1Icon />}
          sx={manageProfilesStyles.addButton}
        >
          Добавить
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid
          size={{ xs: 12, md: 9 }}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <TableContainer component={Paper} sx={manageProfilesStyles.tableCard}>
            <Table>
              <TableHead sx={manageProfilesStyles.tableHead}>
                <TableRow>
                  <TableCell sx={{ width: "30%" }}>ФИ</TableCell>
                  <TableCell sx={{ width: "35%" }}>Почта</TableCell>
                  <TableCell sx={{ width: "20%" }}>Отдел</TableCell>
                  <TableCell sx={{ width: "15%" }}>Роль</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      onClick={() =>
                        navigate(`/manageprofiles/edit/${user.id}`)
                      }
                      sx={manageProfilesStyles.tableRow}
                    >
                      <TableCell sx={manageProfilesStyles.tableCellName}>
                        {formatShortName(user)}
                      </TableCell>
                      <TableCell sx={manageProfilesStyles.tableCellMuted}>
                        {user.email}
                      </TableCell>
                      <TableCell sx={manageProfilesStyles.tableCellMuted}>
                        {user.position?.department?.title || "—"}
                      </TableCell>
                      <TableCell sx={manageProfilesStyles.tableCellRole}>
                        {getRoleLabel(user.role)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={manageProfilesStyles.emptyCell}
                    >
                      Сотрудники не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={manageProfilesStyles.paginationContainer}>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <Box
                    key={`ellipsis-${index}`}
                    sx={manageProfilesStyles.pageEllipsis}
                  >
                    …
                  </Box>
                ) : (
                  <Button
                    key={item}
                    onClick={() => setPage(item)}
                    sx={
                      page === item
                        ? manageProfilesStyles.activePageBtn
                        : manageProfilesStyles.pageBtn
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
          <Paper sx={manageProfilesStyles.filterCard}>
            <Box sx={manageProfilesStyles.filterHeader}>
              <FilterAltIcon sx={manageProfilesStyles.filterIcon} />
              <Typography sx={manageProfilesStyles.filterTitle}>
                Фильтры
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={manageProfilesStyles.filterLabel}>
                Активный?
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={() => {
                    setActiveFilter(
                      activeFilter === "active" ? "all" : "active",
                    );
                    setPage(1);
                  }}
                  sx={
                    activeFilter === "active"
                      ? manageProfilesStyles.filterActiveBtn
                      : manageProfilesStyles.filterOutlineBtn
                  }
                >
                  Да
                </Button>
                <Button
                  onClick={() => {
                    setActiveFilter(
                      activeFilter === "inactive" ? "all" : "inactive",
                    );
                    setPage(1);
                  }}
                  sx={
                    activeFilter === "inactive"
                      ? manageProfilesStyles.filterActiveBtn
                      : manageProfilesStyles.filterOutlineBtn
                  }
                >
                  Нет
                </Button>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={manageProfilesStyles.filterLabel}>
                Отдел
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={deptFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDeptFilter(value === "all" ? "all" : Number(value));
                    setPage(1);
                  }}
                  sx={manageProfilesStyles.selectInput}
                >
                  <MenuItem value="all">Все отделы</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={manageProfilesStyles.filterLabel}>
                Должность
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  onClick={() => {
                    setRoleFilter(roleFilter === "CURATOR" ? "all" : "CURATOR");
                    setPage(1);
                  }}
                  sx={
                    roleFilter === "CURATOR"
                      ? manageProfilesStyles.filterRoleActiveBtn
                      : manageProfilesStyles.filterRoleBtn
                  }
                >
                  Куратор
                </Button>
                <Button
                  onClick={() => {
                    setRoleFilter(roleFilter === "MANAGER" ? "all" : "MANAGER");
                    setPage(1);
                  }}
                  sx={
                    roleFilter === "MANAGER"
                      ? manageProfilesStyles.filterRoleActiveBtn
                      : manageProfilesStyles.filterRoleBtn
                  }
                >
                  Менеджер
                </Button>
                <Button
                  onClick={() => {
                    setRoleFilter(
                      roleFilter === "ADMINISTRATOR" ? "all" : "ADMINISTRATOR",
                    );
                    setPage(1);
                  }}
                  sx={
                    roleFilter === "ADMINISTRATOR"
                      ? manageProfilesStyles.filterRoleActiveBtn
                      : manageProfilesStyles.filterRoleBtn
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
