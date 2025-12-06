// Theme extracted from design screens
export const theme = {
  colors: {
    primary: '#000000', // Modern Black Brand
    secondary: '#F5F5F5', // Light Gray accent
    backgroundLight: '#F5F7FA', // Light Grey
    backgroundDark: '#0a0a0a', // Dark Black
    surface: '#FFFFFF',
    textLight: '#1f2937',
    textDark: '#f8fafc',
    borderLight: '#e5e7eb',
    borderDark: '#1a1a1a',
    placeholderLight: '#9ca3af',
    placeholderDark: '#94a3b8',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#000000', // Black for info
    error: '#EF4444',
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
    } as const,
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

