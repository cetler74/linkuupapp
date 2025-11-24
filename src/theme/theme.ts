// Theme extracted from design screens
export const theme = {
  colors: {
    primary: '#3b82f6', // Vibrant Blue
    secondary: '#ef4444', // Red
    backgroundLight: '#ffffff',
    backgroundDark: '#0f1723',
    textLight: '#1f2937',
    textDark: '#f8fafc',
    borderLight: '#d1d5db',
    borderDark: '#334155',
    placeholderLight: '#6b7280',
    placeholderDark: '#94a3b8',
  },
  typography: {
    fontFamily: {
      display: 'Plus Jakarta Sans', // Will need to load this font
      body: 'System', // Default system font
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 32,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '700',
      extrabold: '800',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export type Theme = typeof theme;

