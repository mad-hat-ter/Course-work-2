import { colors } from '../theme';
import { commonStyles } from '../common';

export const statisticsStyles = {
  container: commonStyles.pageContainer,

  pageHeader: {
    mb: 4,
  },

  pageTitle: commonStyles.pageTitle,

  filterCard: {
    ...commonStyles.borderedCard,
    p: { xs: 2.5, sm: 4 },
    mb: 4,
  },

  fieldLabelBox: commonStyles.fieldLabelBox,
  fieldLabelIcon: commonStyles.fieldLabelIcon,
  fieldLabelText: commonStyles.fieldLabelText,
  textField: {
    ...commonStyles.textField,
    cursor: 'pointer',
    '& input[type="date"]': {
      cursor: 'pointer',
    },
  },

  tableCard: {
    ...commonStyles.borderedCard,
    overflow: 'hidden',
  },

  tableHead: commonStyles.tableHead,

  tableRow: {
    '& .MuiTableCell-body': {
      py: 2.5,
      borderBottom: `1px solid ${colors.borderMuted}`,
      color: colors.textDark,
      fontSize: '16px',
    },
  },

  tableCellType: {
    fontWeight: 600,
    color: colors.navy,
  },

  tableCellNumber: {
    fontWeight: 600,
    color: colors.primary,
    textAlign: 'right',
  },

  tableFooter: {
    bgcolor: colors.bgHighlight,
    '& .MuiTableCell-body': {
      py: 2.5,
      borderTop: `2px solid ${colors.border}`,
      fontWeight: 700,
      color: colors.navy,
      fontSize: '16px',
    },
  },

  footerLabel: {
    textAlign: 'right',
    fontWeight: 700,
    color: colors.navy,
  },

  footerValue: {
    textAlign: 'right',
    fontWeight: 700,
    color: colors.primary,
  },

  emptyCell: {
    py: 4,
    color: colors.textMuted,
    textAlign: 'center',
  },

  loadingBox: {
    display: 'flex',
    justifyContent: 'center',
    py: 8,
  },
};
