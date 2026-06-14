import { Button, styled } from '@mui/material';
import { colors, radii } from './theme';

export const NavButton = styled(Button)(() => ({
  minWidth: '42px',
  height: '42px',
  padding: 0,
  borderRadius: radii.sm,
  border: `1px solid ${colors.border}`,
  color: colors.primary,
  backgroundColor: colors.bgCard,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: colors.bgHover,
    boxShadow: 'none',
    borderColor: colors.primary,
  },
  '& .MuiButton-startIcon': {
    margin: 0,
  },
  '& svg': {
    fontSize: 16,
  },
}));
