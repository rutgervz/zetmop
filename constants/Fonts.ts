import { Platform } from 'react-native';

/**
 * Font families voor Zet 'm op!
 * Web: Google Fonts (Playfair Display + DM Sans)
 * Native: systeemfonts als fallback
 */
export const Fonts = {
  display: Platform.select({
    web: '"Playfair Display", Georgia, serif',
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }) as string,

  body: Platform.select({
    web: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }) as string,

  mono: Platform.select({
    web: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace',
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
};
