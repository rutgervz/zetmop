import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PieceSymbol, Color } from '@/lib/chess/types';

// Using Unicode chess pieces with styled rendering for depth
const PIECE_SYMBOLS: Record<PieceSymbol, string> = {
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
  const symbol = PIECE_SYMBOLS[type];
  const fontSize = size * 0.75;
  const isWhite = color === 'w';

  return (
    <View style={styles.container}>
      {/* Shadow layer for depth */}
      <Text
        style={[
          styles.shadow,
          {
            fontSize,
            lineHeight: size,
            color: 'rgba(0,0,0,0.35)',
            transform: [{ translateX: 1.5 }, { translateY: 1.5 }],
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
            color: isWhite ? '#FFEEDD' : '#1A1A1A',
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
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  blackPiece: {
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
});
