import { colors, gradients, radii } from './theme';

export const commonStyles = {
  loadingCenter: {
    display: 'flex',
    justifyContent: 'center',
    mt: 10,
  },

  pageContainer: {
    p: { xs: 2, sm: 3, md: 4 },
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    bgcolor: colors.bgPage,
  },

  pageTitle: {
    fontWeight: 700,
    color: colors.navy,
  },

  gradientHeader: {
    background: gradients.header,
    color: colors.white,
  },

  borderedCard: {
    borderRadius: radii.md,
    border: `2px solid ${colors.border}`,
    bgcolor: colors.bgCard,
    boxShadow: 'none',
  },

  primaryButton: {
    bgcolor: colors.primary,
    border: `2px solid ${colors.border}`,
    borderRadius: radii.md,
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': {
      bgcolor: colors.primaryDark,
      borderColor: colors.primary,
      boxShadow: 'none',
    },
  },

  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: radii.lg,
      bgcolor: colors.bgCard,
      '& fieldset': { borderColor: colors.borderField },
      '&:hover fieldset': { borderColor: colors.accent },
      '&.Mui-focused fieldset': { borderColor: colors.accent },
    },
  },

  textFieldDisabled: {
    '& .MuiOutlinedInput-root': {
      borderRadius: radii.lg,
      bgcolor: colors.bgLayout,
      '& fieldset': { borderColor: colors.borderField },
    },
  },

  fieldLabelBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
  },

  fieldLabelIcon: {
    fontSize: 22,
    color: colors.roleAccent,
  },

  fieldLabelText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: 'bold',
  },

  tableHead: {
    background: gradients.header,
    '& .MuiTableCell-head': {
      color: colors.white,
      fontWeight: 700,
      fontSize: '14px',
      borderBottom: 'none',
      py: 1.5,
    },
  },

  tableRow: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      bgcolor: colors.bgHighlight,
    },
    '& .MuiTableCell-body': {
      py: 2,
      borderBottom: `1px solid ${colors.borderMuted}`,
    },
    '&:last-child .MuiTableCell-body': {
      borderBottom: 'none',
    },
  },

  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 1,
    mt: 3,
  },

  pageBtn: {
    minWidth: '34px',
    height: '34px',
    p: 0,
    bgcolor: colors.bgCard,
    border: `2px solid ${colors.border}`,
    borderRadius: radii.sm,
    color: colors.primary,
    fontWeight: 700,
    fontSize: '13px',
    '&:hover': { bgcolor: colors.bgHighlight },
  },

  activePageBtn: {
    minWidth: '34px',
    height: '34px',
    p: 0,
    bgcolor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.border}`,
    borderRadius: radii.sm,
    fontWeight: 700,
    fontSize: '13px',
    '&:hover': { bgcolor: colors.primaryDark },
  },

  pageEllipsis: {
    minWidth: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textMuted,
    fontWeight: 700,
    fontSize: '13px',
    userSelect: 'none',
  },
};
