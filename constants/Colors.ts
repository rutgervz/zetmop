/**
 * Zet 'm op! — Design Tokens
 * Dark mode met gouden accenten
 */

const gold = '#C4A35A';
const goldLight = 'rgba(196, 163, 90, 0.2)';
const goldDark = '#9B7E3A';

const Colors = {
  // Primary
  gold,
  goldLight,
  goldDark,
  goldBg: 'rgba(196, 163, 90, 0.08)',

  // Backgrounds (dark mode)
  cream: '#1A1A2E',
  ivory: '#252538',

  // Text (licht op donker)
  textDark: '#F0EDE4',
  textMuted: '#9B99A8',

  // Schaakbord (dark mode)
  squareLight: '#3D3A2E',
  squareDark: '#8B7432',
  squareLightHighlight: '#4A4535',
  squareDarkHighlight: '#7A6528',
  squareLightSelected: '#3A5A2A',
  squareDarkSelected: '#5A8A3A',

  // Status
  onlineGreen: '#5DCAA5',

  // Light mode variants (voor eventueel toggle)
  light: {
    cream: '#FBF8F0',
    ivory: '#F5F0E4',
    textDark: '#1A1A2E',
    textMuted: '#6B6B7B',
    goldLight: '#E8D5A0',
    goldBg: 'rgba(196, 163, 90, 0.06)',
    squareLight: '#F5F0E4',
    squareDark: '#C4A35A',
    squareLightHighlight: '#E8E0C8',
    squareDarkHighlight: '#B8943A',
  },
};

export default Colors;

// Backwards-compatible named export voor bestaande componenten
export const AppColors = {
  gold,
  goldLight,
  goldDark,
  goldBg: Colors.goldBg,
  cream: Colors.cream,
  ivory: Colors.ivory,
  text: Colors.textDark,
  textMuted: Colors.textMuted,
  sqLight: Colors.squareLight,
  sqDark: Colors.squareDark,
  sqLightHighlight: Colors.squareLightHighlight,
  sqDarkHighlight: Colors.squareDarkHighlight,
  sqLightSelected: Colors.squareLightSelected,
  sqDarkSelected: Colors.squareDarkSelected,
  onlineGreen: Colors.onlineGreen,
  error: '#CC4444',
  warning: gold,
  primary: gold,
  secondary: goldDark,
  accent: gold,
  background: Colors.cream,
  surface: Colors.ivory,
  surfaceLight: goldLight,
  success: Colors.onlineGreen,
};
