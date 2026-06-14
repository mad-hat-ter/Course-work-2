import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  IconButton,
} from "@mui/material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import {
  PersonOutlined as PersonOutlineIcon,
  CalendarMonthOutlined as CalendarMonthIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import type { User } from "../types";
import { fetchCurrentUser } from "../utils/currentUser";
import { getMenuItemsForRole } from "../utils/roleAccess";
import { clearToken } from "../utils/auth";
import { mainLayoutStyles } from "../styles";

const menuIcons: Record<string, React.ReactElement> = {
  "/profile": <PersonOutlineIcon />,
  "/shifts": <CalendarMonthIcon />,
  "/schedule": <ScheduleIcon />,
  "/statistics": <BarChartIcon />,
  "/manage-statistics": <BarChartIcon />,
  "/manageprofiles": <SettingsIcon />,
};

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const isActive = (path: string) => {
    if (path === "/manageprofiles") {
      return location.pathname.startsWith("/manageprofiles");
    }
    if (path === "/statistics") {
      return (
        location.pathname === "/statistics" ||
        location.pathname.startsWith("/statistics/")
      );
    }
    if (path === "/schedule") {
      return location.pathname.startsWith("/schedule");
    }
    if (path === "/manage-statistics") {
      return location.pathname.startsWith("/manage-statistics");
    }
    return location.pathname === path;
  };

  const menuItems = useMemo(
    () =>
      getMenuItemsForRole(currentUser?.role ?? "NONE").map((item) => ({
        ...item,
        icon: menuIcons[item.path] ?? <PersonOutlineIcon />,
      })),
    [currentUser?.role],
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    clearToken();
    setDrawerOpen(false);
    navigate("/login", { replace: true });
  };

  const renderMenu = () => (
    <Box sx={mainLayoutStyles.sidebarInner}>
      <Typography variant="h5" sx={mainLayoutStyles.sidebarHeader}>
        Меню
      </Typography>
      <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
      <List sx={mainLayoutStyles.menuList}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => handleNavigate(item.path)}
            sx={
              isActive(item.path)
                ? mainLayoutStyles.activeMenuItem
                : mainLayoutStyles.menuItem
            }
          >
            <ListItemIcon
              sx={
                isActive(item.path)
                  ? mainLayoutStyles.activeMenuItemIcon
                  : mainLayoutStyles.menuItemIcon
              }
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={
                isActive(item.path)
                  ? mainLayoutStyles.activeMenuItemText
                  : mainLayoutStyles.menuItemText
              }
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={mainLayoutStyles.logoutFooter}>
        <ListItemButton
          onClick={handleLogout}
          sx={mainLayoutStyles.logoutButton}
        >
          <ListItemIcon sx={mainLayoutStyles.logoutButtonIcon}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Выйти"
            sx={mainLayoutStyles.logoutButtonText}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={mainLayoutStyles.pageContainer}>
      <Box sx={mainLayoutStyles.mobileAppBar}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={mainLayoutStyles.mobileMenuButton}
          aria-label="Открыть меню"
        >
          <MenuIcon />
        </IconButton>
        <Typography sx={mainLayoutStyles.mobileAppBarTitle}>Меню</Typography>
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        keepMounted
        slotProps={{ paper: { sx: mainLayoutStyles.drawerPaper } }}
      >
        {renderMenu()}
      </Drawer>

      <Box sx={mainLayoutStyles.contentArea}>
        <Outlet />
      </Box>
    </Box>
  );
};
