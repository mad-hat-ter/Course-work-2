import { colors, radii } from '../theme';
import { commonStyles } from '../common';

export const authStyles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: colors.bgLayout,
  },
  paper: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    boxShadow: '0px 10px 40px rgba(0,0,0,0.08)',
  },
  header: {
    bgcolor: colors.accent,
    p: 4,
    textAlign: 'center',
    color: colors.white,
  },
  avatar: {
    width: 60,
    height: 60,
    bgcolor: 'rgba(255,255,255,0.2)',
    mx: 'auto',
    mb: 2,
    border: '1px solid rgba(255,255,255,0.4)',
  },
  headerTitle: {
    fontWeight: 700,
  },
  headerSubtitle: {
    opacity: 0.8,
  },
  form: {
    p: 4,
  },
  alert: {
    mb: 3,
    borderRadius: radii.lg,
  },
  fieldGroup: {
    mb: 3,
  },
  fieldGroupLast: {
    mb: 4,
  },
  fieldLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
  },
  fieldLabel: {
    fontWeight: 600,
  },
  fieldIcon: {
    fontSize: 18,
    color: 'text.secondary',
  },
  textField: commonStyles.textField,
  submitButton: {
    bgcolor: colors.primary,
    py: 1.5,
    borderRadius: radii.lg,
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(30, 91, 184, 0.3)',
    '&:hover': { bgcolor: colors.primaryDark },
  },
};
