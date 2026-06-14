import { colors, radii } from '../theme';
import { profileStyles } from './profile.styles';

export const manageProfileFormStyles = {
  pageHeader: {
    ...profileStyles.pageHeader,
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'end' },
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 1.5, sm: 0 },
    height: 'auto',
    minHeight: 40,
  },

  backButton: {
    color: colors.primary,
    textTransform: 'none',
    fontWeight: 600,
    border: `2px solid ${colors.border}`,
    borderRadius: radii.md,
    px: 2,
    height: 36,
    '&:hover': {
      bgcolor: colors.bgHighlight,
      borderColor: colors.primary,
    },
  },

  activeToggleBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    borderRadius: radii.lg,
    border: `2px solid ${colors.border}`,
    bgcolor: colors.bgHighlight,
  },

  activeLabel: {
    fontWeight: 600,
    color: colors.navy,
  },

  actions: profileStyles.actions,
  cancelButton: profileStyles.cancelButton,
};
