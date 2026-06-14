import { colors } from '../theme';

export const mainLayoutStyles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
    bgcolor: colors.bgLayout,
  },

  mobileAppBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    width: '100%',
    boxSizing: 'border-box',
    px: 1,
    py: 1,
    bgcolor: colors.navy,
    color: colors.white,
    position: 'sticky',
    top: 0,
    zIndex: 1100,
  },

  mobileMenuButton: {
    color: colors.white,
  },

  mobileAppBarTitle: {
    fontWeight: 700,
    fontSize: '1.1rem',
  },

  sidebarInner: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    flexGrow: 1,
  },

  menuList: {
    flexGrow: 1,
  },

  drawerPaper: {
    width: 280,
    bgcolor: colors.navy,
    color: colors.white,
    display: 'flex',
    flexDirection: 'column',
  },

  sidebarHeader: {
    p: 3,
    fontWeight: 700,
    textAlign: 'center',
    fontSize: '1.4rem',
  },

  contentArea: {
    flex: 1,
    minWidth: 0,
    bgcolor: colors.bgPage,
    p: { xs: 2, sm: 3 },
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },

  menuItem: {
    '&:hover': {
      bgcolor: 'rgba(255,255,255,0.1)',
    },
  },

  menuItemIcon: {
    color: 'rgba(255,255,255,0.7)',
  },

  menuItemText: {
    color: colors.white,
  },

  activeMenuItem: {
    bgcolor: 'rgba(255,255,255,0.15)',
    borderLeft: `4px solid ${colors.accentLight}`,
    '&:hover': {
      bgcolor: 'rgba(255,255,255,0.2)',
    },
  },

  activeMenuItemIcon: {
    color: colors.white,
  },

  activeMenuItemText: {
    color: colors.white,
    fontWeight: 600,
  },

  logoutFooter: {
    mt: 'auto',
    px: 2,
    pb: 2,
    pt: 1.5,
    borderTop: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    justifyContent: 'center',
  },

  logoutButton: {
    width: 'auto',
    minWidth: 0,
    px: 1.5,
    py: 0.75,
    borderRadius: 1,
    '&:hover': {
      bgcolor: 'rgba(255,255,255,0.1)',
    },
  },

  logoutButtonIcon: {
    color: 'rgba(255,255,255,0.85)',
    minWidth: 32,
  },

  logoutButtonText: {
    color: colors.white,
    flex: '0 0 auto',
    '& .MuiTypography-root': {
      fontSize: '0.9rem',
    },
  },
};
