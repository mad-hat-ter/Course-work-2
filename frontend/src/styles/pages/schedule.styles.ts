import { colors, gradients, radii } from '../theme';
import { commonStyles } from '../common';

export const scheduleStyles = {
  container: commonStyles.pageContainer,

  pageHeader: {
    mb: 4,
  },

  pageTitle: commonStyles.pageTitle,

  toolbarCard: {
    ...commonStyles.borderedCard,
    p: { xs: 2.5, sm: 3 },
    mb: 3,
  },

  toolbarRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  selectField: {
    minWidth: 280,
    flex: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: radii.lg,
      bgcolor: colors.bgCard,
      '& fieldset': { borderColor: colors.borderField },
      '&:hover fieldset': { borderColor: colors.accent },
      '&.Mui-focused fieldset': { borderColor: colors.accent },
    },
  },

  toolbarActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1.5,
  },

  primaryAction: {
    ...commonStyles.primaryButton,
    px: 2.5,
    height: '42px',
  },

  secondaryAction: {
    px: 2.5,
    height: '42px',
    borderRadius: radii.md,
    border: `2px solid ${colors.border}`,
    color: colors.primary,
    fontWeight: 600,
    textTransform: 'none',
    bgcolor: colors.bgCard,
    boxShadow: 'none',
    '&:hover': {
      bgcolor: colors.bgHighlight,
      boxShadow: 'none',
    },
  },

  gridCard: {
    ...commonStyles.borderedCard,
    overflow: 'auto',
    mb: 3,
  },

  gridTable: {
    minWidth: 720,
    '& .MuiTableCell-root': {
      border: `1px solid ${colors.borderMuted}`,
      p: 1,
      verticalAlign: 'top',
    },
  },

  gridCornerCell: {
    bgcolor: colors.bgLayout,
    fontWeight: 700,
    color: colors.navy,
    minWidth: 90,
    textAlign: 'center',
    verticalAlign: 'middle',
    position: 'sticky',
    left: 0,
    zIndex: 2,
  },

  gridDateHead: {
    ...commonStyles.gradientHeader,
    textAlign: 'center',
    fontWeight: 700,
    color: colors.white,
    minWidth: 140,
    whiteSpace: 'nowrap',
  },

  gridTimeCell: {
    bgcolor: colors.bgLayout,
    fontWeight: 700,
    color: colors.navy,
    textAlign: 'center',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    minWidth: 90,
    position: 'sticky',
    left: 0,
    zIndex: 1,
  },

  slotCell: {
    minHeight: 88,
    bgcolor: colors.bgCard,
  },

  slotOccupied: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 0.5,
    p: 1,
    borderRadius: radii.sm,
    bgcolor: colors.bgHighlight,
    border: `1px solid ${colors.border}`,
    mb: 0.5,
    fontSize: '14px',
    fontWeight: 600,
    color: colors.navy,
  },

  slotRemoveBtn: {
    minWidth: 28,
    width: 28,
    height: 28,
    p: 0,
    color: colors.textMuted,
    border: `1px solid ${colors.borderLight}`,
  },

  slotSignupBtn: {
    width: '100%',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: radii.sm,
    border: `1px dashed ${colors.border}`,
    color: colors.primary,
    py: 1,
  },

  slotAddBtn: {
    width: '100%',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: radii.sm,
    bgcolor: colors.bgHighlight,
    border: `1px solid ${colors.border}`,
    color: colors.primary,
    py: 1,
  },

  curatorPicker: {
    mt: 0.5,
    '& .MuiOutlinedInput-root': {
      borderRadius: radii.sm,
      bgcolor: colors.bgCard,
      fontSize: '13px',
      '& fieldset': { borderColor: colors.borderField },
      '&:hover fieldset': { borderColor: colors.accent },
      '&.Mui-focused fieldset': { borderColor: colors.accent },
    },
    '& .MuiInputLabel-root': {
      fontSize: '13px',
    },
  },

  slotEmptyText: {
    fontSize: '12px',
    color: colors.textMuted,
    textAlign: 'center',
    py: 1,
  },

  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },

  dangerButton: {
    px: 3,
    height: '42px',
    borderRadius: radii.md,
    border: `2px solid #e57373`,
    color: '#c62828',
    fontWeight: 600,
    textTransform: 'none',
    bgcolor: colors.bgCard,
    boxShadow: 'none',
    '&:hover': {
      bgcolor: '#ffebee',
      boxShadow: 'none',
    },
  },

  emptyState: {
    py: 6,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: '16px',
  },

  fieldLabelBox: commonStyles.fieldLabelBox,
  fieldLabelIcon: commonStyles.fieldLabelIcon,
  fieldLabelText: commonStyles.fieldLabelText,
  textField: commonStyles.textField,

  dateTimeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    alignItems: 'center',
  },

  dateFieldInRow: {
    flex: '1 1 180px',
    minWidth: 180,
    maxWidth: '100%',
  },

  timeField: {
    ...commonStyles.textField,
    flex: '0 1 130px',
    width: 130,
    minWidth: 130,
    maxWidth: '100%',
  },

  capacityRowControls: {
    display: 'inline-flex',
    gap: 0.25,
    alignItems: 'center',
    mt: 0.75,
    touchAction: 'manipulation',
  },

  capacityControlBtn: {
    width: 28,
    height: 28,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.sm,
    bgcolor: colors.bgCard,
    color: colors.primary,
    '&:hover': {
      bgcolor: colors.bgHighlight,
      borderColor: colors.accent,
    },
  },

  sectionCard: {
    ...commonStyles.borderedCard,
    p: { xs: 2.5, sm: 3 },
    mb: 3,
    maxWidth: '100%',
    overflow: 'hidden',
  },

  sectionTitle: {
    fontWeight: 700,
    color: colors.navy,
    mb: 2,
    fontSize: '18px',
  },

  tableHead: commonStyles.tableHead,
  tableRow: {
    '& .MuiTableCell-body': {
      py: 1.5,
      borderBottom: `1px solid ${colors.borderMuted}`,
      fontSize: '15px',
    },
  },

  capacityTableWrap: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },

  capacityTable: {
    width: 'max-content',
    minWidth: '100%',
    tableLayout: 'auto',
  },

  capacityHourHead: {
    position: 'sticky',
    left: 0,
    zIndex: 3,
    minWidth: 96,
    width: 96,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    background: gradients.header,
    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.12)',
  },

  capacityHourCell: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    minWidth: 96,
    width: 96,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    bgcolor: colors.bgCard,
    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.08)',
  },

  capacityHourContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.25,
  },

  capacityHourLabel: {
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: 1.2,
  },

  capacityDayHead: {
    minWidth: 104,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    fontSize: '12px',
    px: 0.75,
  },

  capacityDayCell: {
    minWidth: 104,
    width: 104,
    verticalAlign: 'top',
    px: 0.75,
    py: 1.5,
  },

  capacityCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0.5,
    width: '100%',
    maxWidth: 96,
    mx: 'auto',
  },

  capacityInput: {
    width: '100%',
    maxWidth: 72,
    '& .MuiOutlinedInput-root': {
      borderRadius: radii.sm,
      bgcolor: colors.bgCard,
      '& input': { textAlign: 'center', py: 1 },
    },
  },

  capacityTypeSelect: {
    width: '100%',
    maxWidth: 96,
    '& .MuiOutlinedInput-root': {
      borderRadius: radii.sm,
      bgcolor: colors.bgCard,
      fontSize: '12px',
    },
    '& .MuiSelect-select': {
      py: 0.75,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },

  formActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: { xs: 'stretch', sm: 'flex-end' },
    gap: 2,
    mt: 2,
    '& .MuiButton-root': {
      flex: { xs: '1 1 140px', sm: '0 0 auto' },
    },
  },

  backButton: {
    minWidth: 168,
    height: 48,
    px: 4,
    borderRadius: radii.lg,
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 600,
    border: `2px solid ${colors.border}`,
    color: colors.primary,
    bgcolor: colors.bgCard,
    boxShadow: 'none',
    '&:hover': {
      bgcolor: colors.bgHighlight,
      borderColor: colors.primary,
      boxShadow: 'none',
    },
  },

  saveButton: {
    minWidth: 168,
    height: 48,
    px: 4,
    borderRadius: radii.lg,
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 600,
    background: gradients.header,
    color: colors.white,
    boxShadow: 'none',
    '&:hover': {
      background: gradients.header,
      filter: 'brightness(0.92)',
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      background: gradients.headerDisabled,
      color: colors.navy,
      opacity: 1,
      WebkitTextFillColor: colors.navy,
    },
  },
};
