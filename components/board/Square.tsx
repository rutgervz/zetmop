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
  lightBase: '#E8D5B5',
  lightAccent: '#F2E4CC',
  darkBase: '#7B6B4F',
  darkAccent: '#8A7A5E',
  selected: 'rgba(78, 205, 196, 0.55)',
  legalMove: 'rgba(78, 205, 196, 0.4)',
  lastMove: 'rgba(78, 205, 196, 0.25)',
  check: 'radial-gradient(circle, rgba(255,50,50,0.8), rgba(255,0,0,0.3))',
  checkColor: 'rgba(255, 50, 50, 0.55)',
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
  const bgColor = isLight ? COLORS.lightBase : COLORS.darkBase;

  return (
    <Pressable
      onPress={() => onPress(square)}
      style={({ pressed }) => [
        styles.square,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
        },
        pressed && styles.pressed,
      ]}
    >
      {/* Subtle grain texture via inner highlight */}
      <View
        style={[
          styles.grain,
          {
            backgroundColor: isLight ? COLORS.lightAccent : COLORS.darkAccent,
            opacity: 0.3,
          },
        ]}
      />

      {isLastMove && <View style={[styles.overlay, { backgroundColor: COLORS.lastMove }]} />}
      {isSelected && <View style={[styles.overlay, { backgroundColor: COLORS.selected }]} />}
      {isCheck && (
        <View style={[styles.checkOverlay, { borderColor: '#FF3232' }]}>
          <View style={[styles.overlay, { backgroundColor: COLORS.checkColor }]} />
        </View>
      )}

      {piece && <Piece type={piece.type} color={piece.color} size={size} />}

      {isLegalMove && !piece && (
        <View
          style={[
            styles.legalDot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
            },
          ]}
        />
      )}
      {isLegalMove && piece && (
        <View
          style={[
            styles.legalCapture,
            {
              width: size - 2,
              height: size - 2,
              borderRadius: size * 0.08,
              borderWidth: size * 0.06,
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
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
  },
  legalDot: {
    backgroundColor: COLORS.legalMove,
    position: 'absolute',
  },
  legalCapture: {
    borderColor: 'rgba(78, 205, 196, 0.5)',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
