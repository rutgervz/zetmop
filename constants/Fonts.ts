import { Platform } from 'react-native';

/**
 * Font families voor Zet 'm op!
 * Gebruikt @expo-google-fonts packages (werkt cross-platform).
 * De naam moet exact matchen met de key in useFonts().
 */
export const Fonts = {
  // Playfair Display — titels & logo
  displayRegular: 'PlayfairDisplay_400Regular',
  displayMedium: 'PlayfairDisplay_500Medium',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',

  // DM Sans — body/UI
  bodyRegular: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',

  // Monospace — game log, code input
  mono: Platform.select({
    web: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace',
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,

  // Compat aliases (voor bestaande code die Fonts.display / Fonts.body gebruikt)
  get display() { return this.displayBold; },
  get body() { return this.bodyRegular; },
};
