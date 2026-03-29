import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PieceSymbol, Color } from '@/lib/chess/types';

// Witte stukken: open symbolen (met vulling), zwarte: gevulde symbolen
const WHITE_SYMBOLS: Record<PieceSymbol, string> = {
  k: '\u2654',
  q: '\u2655',
  r: '\u2656',
  b: '\u2657',
  n: '\u2658',
  p: '\u2659',
};
const BLACK_SYMBOLS: Record<PieceSymbol, string> = {
  k: '\u265A',
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
  p: '\u265F',
};

type PieceProps = {
  type: PieceSymbol;
  color: Color;
  size: number;
};

export default function Piece({ type, color, size }: PieceProps) {
  const isWhite = color === 'w';
  const symbol = isWhite ? WHITE_SYMBOLS[type] : BLACK_SYMBOLS[type];
  const fontSize = size * 0.82;

  return (
    <View style={styles.container}>
      {/* Shadow layer for depth */}
      <Text
        style={[
          styles.shadow,
          {
            fontSize,
            lineHeight: size,
            color: 'rgba(0,0,0,0.3)',
            transform: [{ translateX: 1.2 }, { translateY: 1.2 }],
          },
        ]}
        allowFontScaling={false}
      >
        {symbol}
      </Text>
      {/* Main piece */}
      <Text
        style={[
          styles.piece,
          {
            fontSize,
            lineHeight: size,
            color: isWhite ? '#FFFFFF' : '#1A1A1A',
          },
          isWhite && styles.whitePiece,
          !isWhite && styles.blackPiece,
        ]}
        allowFontScaling={false}
      >
        {symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    textAlign: 'center',
  },
  piece: {
    textAlign: 'center',
  },
  whitePiece: {
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  blackPiece: {
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
