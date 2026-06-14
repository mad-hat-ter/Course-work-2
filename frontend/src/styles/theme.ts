export const colors = {
  primary: '#1e5bb8',
  primaryDark: '#164a9a',
  primaryDeeper: '#0E51A7',
  navy: '#1d4680',
  accent: '#3370c5',
  accentLight: '#6997D3',
  border: '#6c9cdb',
  borderLight: '#b0c4de',
  borderMuted: '#d0d7e2',
  borderField: '#e0e4ec',
  bgPage: '#f0f4f8',
  bgLayout: '#f5f7fa',
  bgCard: '#ffffff',
  bgHighlight: '#edf5ff',
  bgHover: '#e0e7f2',
  textMuted: '#607d8b',
  textSecondary: '#4a6b9a',
  textBody: '#445a74',
  textDark: '#2c3e50',
  textGray: '#555555',
  textPlaceholder: '#888888',
  white: '#ffffff',
  roleAccent: '#9bc2e0',
} as const;

export const gradients = {
  header: `linear-gradient(to left, ${colors.accentLight}, ${colors.primaryDeeper})`,
  headerDisabled: `linear-gradient(to left, ${colors.roleAccent}, ${colors.accentLight})`,
} as const;

export const radii = {
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '16px',
} as const;
