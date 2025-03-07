import { Dimensions } from 'react-native';

// Screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base colors that stay the same in both modes
export const COMMON_COLORS = {
  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  primaryDark: '#4A42E3',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
};

// Light mode colors
export const LIGHT_COLORS = {
  ...COMMON_COLORS,
  background: '#FFFFFF',
  card: '#F5F5F5',
  cardElevated: '#FFFFFF',
  text: '#121212',
  textSecondary: '#555555',
  textMuted: '#777777',
  border: '#E0E0E0',
  statusBarStyle: 'dark',
};

// Dark mode colors
export const DARK_COLORS = {
  ...COMMON_COLORS,
  background: '#121212',
  card: '#1E1E1E',
  cardElevated: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#888888',
  border: '#333333',
  statusBarStyle: 'light',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Timing for animations
export const TIMING = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  circle: 9999,
};

// Shadows
export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
}; 