import { Platform } from 'react-native';

export const COLORS = {
  light: {
    bg: '#E0E5EC',
    surface: '#E0E5EC',
    card: '#FFFFFF',
    primary: '#4361EE',
    primaryLight: '#6C83F1',
    primaryDark: '#3651D4',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    warning: '#F5A623',
    warningLight: '#FEF3C7',
    success: '#27AE60',
    successLight: '#D1FAE5',
    info: '#4361EE',
    infoLight: '#DBEAFE',
    text: '#2D3748',
    textSecondary: '#5A6577',
    textMuted: '#8896A6',
    border: '#D5DAE3',
    shadowLight: '#FFFFFF',
    shadowDark: '#A3B1C6',
    chipBg: 'rgba(0,0,0,0.03)',
    chipBgSelected: '#4361EE',
    chipTextSelected: '#FFFFFF',
    whiteText: '#FFFFFF',
    inputBg: 'rgba(0,0,0,0.02)',
    overlayBg: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(0,0,0,0.03)',
  },
  dark: {
    bg: '#1F2229',
    surface: '#1F2229',
    card: '#2A2D38',
    primary: '#5B7FFF',
    primaryLight: '#7B99FF',
    primaryDark: '#4A6DE6',
    danger: '#EF4444',
    dangerLight: '#3B1111',
    warning: '#F5A623',
    warningLight: '#3B2F0B',
    success: '#27AE60',
    successLight: '#0B3B2E',
    info: '#5B7FFF',
    infoLight: '#1E2A4A',
    text: '#E4E6EB',
    textSecondary: '#A0A8B8',
    textMuted: '#6B7280',
    border: '#363A4A',
    shadowLight: '#363A4A',
    shadowDark: '#15171E',
    chipBg: 'rgba(255,255,255,0.05)',
    chipBgSelected: '#5B7FFF',
    chipTextSelected: '#FFFFFF',
    whiteText: '#FFFFFF',
    inputBg: 'rgba(255,255,255,0.03)',
    overlayBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.04)',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, full: 100 };
export const FONT = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 20,
  title: 24,
  hero: 28,
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
};

export const neu = {
  raised: (theme) =>
    Platform.select({
      ios: {
        shadowColor: theme === 'dark' ? COLORS.dark.shadowDark : COLORS.light.shadowDark,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: theme === 'dark' ? 0.5 : 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  small: (theme) =>
    Platform.select({
      ios: {
        shadowColor: theme === 'dark' ? COLORS.dark.shadowDark : COLORS.light.shadowDark,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: theme === 'dark' ? 0.4 : 0.22,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  inset: (theme) =>
    Platform.select({
      ios: {
        shadowColor: theme === 'dark' ? COLORS.dark.shadowDark : COLORS.light.shadowDark,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: theme === 'dark' ? 0.35 : 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  insetSmall: (theme) =>
    Platform.select({
      ios: {
        shadowColor: theme === 'dark' ? COLORS.dark.shadowDark : COLORS.light.shadowDark,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.14,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
};

export function getColors(theme) {
  return COLORS[theme] || COLORS.light;
}
