/**
 * Zet 'm op! — Design Tokens
 * Luxe gold/cream thema met dark mode support
 */

const tintColorLight = '#C4A35A';
const tintColorDark = '#C4A35A';

export default {
  light: {
    text: '#1A1A2E',
    background: '#FBF8F0',
    tint: tintColorLight,
    tabIconDefault: '#9B99A8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F0EDE4',
    background: '#1E1E2E',
    tint: tintColorDark,
    tabIconDefault: '#9B99A8',
    tabIconSelected: tintColorDark,
  },
};

export const AppColors = {
  // Primary — Gold
  gold: '#C4A35A',
  goldLight: '#E8D5A0',
  goldDark: '#9B7E3A',
  goldBg: 'rgba(196, 163, 90, 0.06)',

  // Neutral — Cream/Ivory
  cream: '#FBF8F0',
  ivory: '#F5F0E4',

  // Text
  text: '#1A1A2E',
  textMuted: '#6B6B7B',

  // Board
  sqLight: '#F5F0E4',
  sqDark: '#C4A35A',
  sqLightHighlight: '#E8E0C8',
  sqDarkHighlight: '#B8943A',
  sqLightSelected: '#D4E8C4',
  sqDarkSelected: '#8DB56B',

  // Status
  onlineGreen: '#5DCAA5',
  error: '#CC4444',
  warning: '#C4A35A',

  // Legacy compat (used in some components)
  primary: '#C4A35A',
  secondary: '#9B7E3A',
  accent: '#C4A35A',
  background: '#FBF8F0',
  surface: '#F5F0E4',
  surfaceLight: '#E8D5A0',
  success: '#5DCAA5',
};
