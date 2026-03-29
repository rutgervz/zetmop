import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { PieceSymbol, Color } from '@/lib/chess/types';

const PIECE_SYMBOLS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
  b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
};

type PieceProps = {
  type: PieceSymbol;
  color: Color;
  size: number;
};

export default function Piece({ type, color, size }: PieceProps) {
  const symbol = PIECE_SYMBOLS[color][type];
  const fontSize = size * 0.7;

  return (
    <Text style={[styles.piece, { fontSize, lineHeight: size }]} allowFontScaling={false}>
      {symbol}
    </Text>
  );
}

const styles = StyleSheet.create({
  piece: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
