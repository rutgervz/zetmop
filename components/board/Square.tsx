import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Piece from './Piece';
import type { PieceType, Square as SquareType } from '@/lib/chess/types';

type SquareProps = {
  square: SquareType;
  piece: PieceType | null;
  size: number;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onPress: (square: SquareType) => void;
};

const COLORS = {
  light: '#F0D9B5',
  dark: '#B58863',
  selected: 'rgba(255, 255, 0, 0.5)',
  legalMove: 'rgba(0, 0, 0, 0.2)',
  legalCapture: 'rgba(0, 0, 0, 0.2)',
  lastMove: 'rgba(155, 199, 0, 0.41)',
  check: 'rgba(255, 0, 0, 0.5)',
};

export default function Square({
  square,
  piece,
  size,
  isLight,
  isSelected,
  isLegalMove,
  isLastMove,
  isCheck,
  onPress,
}: SquareProps) {
  const bgColor = isLight ? COLORS.light : COLORS.dark;

  return (
    <Pressable
      onPress={() => onPress(square)}
      style={[
        styles.square,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
        },
      ]}
    >
      {isLastMove && <View style={[styles.overlay, { backgroundColor: COLORS.lastMove }]} />}
      {isSelected && <View style={[styles.overlay, { backgroundColor: COLORS.selected }]} />}
      {isCheck && <View style={[styles.overlay, { backgroundColor: COLORS.check }]} />}

      {piece && <Piece type={piece.type} color={piece.color} size={size} />}

      {isLegalMove && !piece && (
        <View
          style={[
            styles.legalDot,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
            },
          ]}
        />
      )}
      {isLegalMove && piece && (
        <View
          style={[
            styles.legalCapture,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
              borderWidth: size * 0.08,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  legalDot: {
    backgroundColor: COLORS.legalMove,
    position: 'absolute',
  },
  legalCapture: {
    borderColor: COLORS.legalCapture,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
