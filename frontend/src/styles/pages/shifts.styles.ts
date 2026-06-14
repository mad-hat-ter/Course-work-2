import { colors, radii } from '../theme';
import { commonStyles } from '../common';

export const shiftsStyles = {
  container: commonStyles.pageContainer,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 2,
  },
  pageTitle: commonStyles.pageTitle,
  navigation: {
    display: 'flex',
    gap: 1,
  },
  dayCard: {
    ...commonStyles.borderedCard,
    display: 'flex',
    flexDirection: 'column',
  },

  dayCardBody: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    pb: 1,
  },
  dayCardHeader: {
    ...commonStyles.gradientHeader,
    p: 1.5,
    textAlign: 'center',
    borderBottom: `1px solid ${colors.border}`,
    '& .MuiTypography-root': {
      color: colors.white,
    },
    '& .MuiTypography-subtitle1': {
      fontWeight: 700,
      fontSize: '14px',
      mb: 0.5,
    },
    '& .MuiTypography-body2': {
      fontSize: '25px',
      fontWeight: 600,
      opacity: 1,
    },
    '& .MuiTypography-caption': {
      fontSize: '10px',
      fontWeight: 600,
      opacity: 0.8,
      mt: 0.5,
      display: 'block',
    },
  },
  shiftItem: {
    bgcolor: colors.bgHighlight,
    borderRadius: radii.sm,
    p: 1.5,
    m: '12px 10px 0 10px',
    '&:last-child': {
      mb: '10px',
    },
    border: `2px solid ${colors.border}`,
    boxShadow: 'none',
    '& .MuiTypography-body2': {
      fontWeight: 600,
      color: colors.navy,
      fontSize: '20px',
    },
    '& .MuiTypography-caption': {
      fontSize: '15px',
      fontWeight: 600,
      color: colors.textSecondary,
      display: 'block',
    },
  },
  noShiftsText: {
    p: 2,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  upcomingShiftsTitle: {
    fontWeight: 700,
    color: colors.navy,
    mt: 2,
    mb: 2,
    fontSize: '25px',
  },
  upcomingContainer: {
    ...commonStyles.borderedCard,
    mt: 4,
    p: 2,
  },
  upcomingShiftItem: {
    p: '15px 20px',
    mb: 1,
    borderRadius: radii.sm,
    border: `2px solid ${colors.border}`,
    bgcolor: colors.bgCard,
    '&:last-child': { mb: 0 },
    color: colors.textBody,
    '& .MuiTypography-body2': {
      fontSize: '17px',
      fontWeight: 600,
      color: colors.navy,
    },
  },
};
