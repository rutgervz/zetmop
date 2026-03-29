import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useQuaternityStore } from '@/stores/quaternityStore';

// --- Invalid corner check ---
// Corners cut off: (0-2, 0-2), (11-13, 0-2), (0-2, 11-13), (11-13, 11-13)
function isInvalidSquare(col: number, row: number): boolean {
  const inLeft = col <= 2;
  const inRight = col >= 11;
  const inTop = row <= 2;
  const inBottom = row >= 11;
  return (inLeft && inTop) || (inRight && inTop) || (inLeft && inBottom) || (inRight && inBottom);
}

// --- Unicode chess pieces ---
// Open symbols (white-style outlines) for w/r/g, filled for b
const OPEN_SYMBOLS: Record<string, string> = {
  k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659',
};
const FILLED_SYMBOLS: Record<string, string> = {
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

// Player piece colors
const PLAYER_COLORS: Record<string, string> = {
  w: '#FFFFFF',
  b: '#1A1A1A',
  r: '#E84040',
  g: '#2AAA6A',
};

// Turn indicator edge: which rows/cols glow for each player
const TURN_EDGES: Record<string, (col: number, row: number) => boolean> = {
  w: (_c, r) => r === 13,  // South — bottom edge
  b: (_c, r) => r === 0,   // North — top edge
  r: (c, _r) => c === 0,   // West — left edge
  g: (c, _r) => c === 13,  // East — right edge
};

const SQUARE_COLORS = {
  lightBase: '#F0E6C8',
  lightAccent: '#F5EDD5',
  darkBase: '#6BAF8D',
  darkAccent: '#7BC09D',
  selected: 'rgba(255, 210, 70, 0.6)',
  legalMove: 'rgba(255, 210, 70, 0.45)',
  lastMove: 'rgba(120, 200, 255, 0.3)',
  turnGlow: 'rgba(255, 210, 70, 0.18)',
};

// --- Piece sub-component (inline, mirrors Piece.tsx pattern) ---
function QuatPiece({ pieceType, playerColor, size }: { pieceType: string; playerColor: string; size: number }) {
  // Black uses filled symbols, others use open symbols
  const symbol = playerColor === 'b' ? FILLED_SYMBOLS[pieceType] : OPEN_SYMBOLS[pieceType];
  const color = PLAYER_COLORS[playerColor] ?? '#FFFFFF';
  const fontSize = size * 0.78;

  // Shadow style depends on piece brightness
  const isLight = playerColor === 'w' || playerColor === 'g';

  return (
    <View style={pieceStyles.container}>
      {/* Shadow layer */}
      <Text
        style={[
          pieceStyles.shadow,
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
          pieceStyles.piece,
          {
            fontSize,
            lineHeight: size,
            color,
            textShadowColor: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.2)',
            textShadowOffset: { width: 0, height: isLight ? 1 : 0 },
            textShadowRadius: isLight ? 4 : 3,
          },
        ]}
        allowFontScaling={false}
      >
        {symbol}
      </Text>
    </View>
  );
}

const pieceStyles = StyleSheet.create({
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
});

// --- Main board component ---
export default function QuaternityBoard() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const board = useQuaternityStore((s) => s.board);
  const selectedSquare = useQuaternityStore((s) => s.selectedSquare);
  const legalMoves = useQuaternityStore((s) => s.legalMoves);
  const lastMove = useQuaternityStore((s) => s.lastMove);
  const turn = useQuaternityStore((s) => s.turn);
  const selectSquare = useQuaternityStore((s) => s.selectSquare);

  const squareSize = Math.floor(Math.min(windowWidth - 4, windowHeight - 56) / 14);
  const boardPixelSize = squareSize * 14;

  // Build a set of legal move coords for fast lookup
  const legalMoveSet = new Set(legalMoves.map((m) => `${m.col},${m.row}`));

  const isEdgeGlow = TURN_EDGES[turn] ?? (() => false);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.boardContainer, { width: boardPixelSize, height: boardPixelSize }]}>
        {Array.from({ length: 14 }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: 14 }, (_, col) => {
              // Skip invalid corner squares — render nothing
              if (isInvalidSquare(col, row)) {
                return <View key={col} style={{ width: squareSize, height: squareSize }} />;
              }

              const piece = board[row]?.[col] ?? null;
              const isLight = (row + col) % 2 === 0;
              const isSelected =
                selectedSquare !== null && selectedSquare.col === col && selectedSquare.row === row;
              const isLegal = legalMoveSet.has(`${col},${row}`);
              const isLastMoveSquare =
                lastMove !== null &&
                ((lastMove.fromCol === col && lastMove.fromRow === row) ||
                  (lastMove.toCol === col && lastMove.toRow === row));
              const showTurnGlow = isEdgeGlow(col, row);

              const bgColor = isLight ? SQUARE_COLORS.lightBase : SQUARE_COLORS.darkBase;

              return (
                <Pressable
                  key={col}
                  onPress={() => selectSquare(col, row)}
                  style={({ pressed }) => [
                    styles.square,
                    { width: squareSize, height: squareSize, backgroundColor: bgColor },
                    pressed && styles.pressed,
                  ]}
                >
                  {/* Grain texture */}
                  <View
                    style={[
                      styles.grain,
                      {
                        backgroundColor: isLight ? SQUARE_COLORS.lightAccent : SQUARE_COLORS.darkAccent,
                        opacity: 0.3,
                      },
                    ]}
                  />

                  {/* Turn glow on edge */}
                  {showTurnGlow && <View style={[styles.overlay, { backgroundColor: SQUARE_COLORS.turnGlow }]} />}

                  {/* Last move highlight */}
                  {isLastMoveSquare && (
                    <View style={[styles.overlay, { backgroundColor: SQUARE_COLORS.lastMove }]} />
                  )}

                  {/* Selected highlight */}
                  {isSelected && (
                    <View style={[styles.overlay, { backgroundColor: SQUARE_COLORS.selected }]} />
                  )}

                  {/* Piece */}
                  {piece && (
                    <QuatPiece pieceType={piece.type} playerColor={piece.color} size={squareSize} />
                  )}

                  {/* Legal move dot (empty square) */}
                  {isLegal && !piece && (
                    <View
                      style={[
                        styles.legalDot,
                        {
                          width: squareSize * 0.28,
                          height: squareSize * 0.28,
                          borderRadius: squareSize * 0.14,
                        },
                      ]}
                    />
                  )}

                  {/* Legal capture ring (occupied square) */}
                  {isLegal && piece && (
                    <View
                      style={[
                        styles.legalCapture,
                        {
                          width: squareSize - 2,
                          height: squareSize - 2,
                          borderRadius: squareSize * 0.08,
                          borderWidth: squareSize * 0.06,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  boardContainer: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
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
  legalDot: {
    backgroundColor: SQUARE_COLORS.legalMove,
    position: 'absolute',
  },
  legalCapture: {
    borderColor: 'rgba(255, 210, 70, 0.55)',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
