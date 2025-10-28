// config/theme.js
// Centralized design tokens for consistent, future-proof UI

// Color palette aligned to requested CSS variables
export const colors = {
  // Brand
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#81C784',
  accent: '#4CAF50',

  // Background / surfaces
  bg: '#E8F5E9', // root --bg
  background: '#E8F5E9', // alias for compatibility
  surface: '#FFFFFF',
  surfaceAlt: '#f6fbf6',

  // Text
  text: '#1B5E20',
  muted: '#33691E',
  heading: '#1B5E20',
  subtle: '#33691E',

  // Borders / dividers
  border: '#d7e7d6',
  borderColor: '#e7efe8',
  borderColorStrong: '#d1e0d3',

  // Gradients
  gradient: ['#f8fdf8', '#f0faf0'], // --gradient-soft-start -> --gradient-soft-end

  // Status
  danger: '#e53e3e',
  dangerBg: '#fee2e2',

  // Derived / utility
  primarySoft: 'rgba(46, 125, 50, 0.12)', // soft tint for badges/backgrounds
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radii = {
  base: 14, // root --radius
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
};

export const shadow = {
  sm: {
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  lg: {
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  }
};

export const typography = {
  title: { fontSize: 24, fontWeight: '800' },
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 14 },
  small: { fontSize: 12 },
};
