import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useQuaternityStore, type QuaterColor } from '@/stores/quaternityStore';

// Unicode chess symbols
const OPEN_SYMBOLS: Record<string, string> = {
  k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659',
};
const FILLED_SYMBOLS: Record<string, string> = {
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

// Speler kleuren
const PLAYER_COLORS: Record<QuaterColor, string> = {
  w: '#FFFFFF',
  b: '#1A1A1A',
  r: '#CC3333',
  g: '#228B22',
};

const PLAYER_SHADOW: Record<QuaterColor, string> = {
  w: 'rgba(0,0,0,0.6)',
  b: 'rgba(255,255,255,0.2)',
  r: 'rgba(0,0,0,0.5)',
  g: 'rgba(0,0,0,0.5)',
};

const SQ = {
  lightBase: '#F0E6C8',
  darkBase: '#6BAF8D',
  selected: 'rgba(255, 210, 70, 0.6)',
  legalMove: 'rgba(255, 210, 70, 0.45)',
  lastMove: 'rgba(120, 200, 255, 0.3)',
};

export default function QuaternityBoard() {
  const { width: ww, height: wh } = useWindowDimensions();
  const board = useQuaternityStore((s) => s.board);
  const selectedSquare = useQuaternityStore((s) => s.selectedSquare);
  const legalMoves = useQuaternityStore((s) => s.legalMoves);
  const lastMove = useQuaternityStore((s) => s.lastMove);
  const turn = useQuaternityStore((s) => s.turn);
  const selectSquare = useQuaternityStore((s) => s.selectSquare);

  const squareSize = Math.floor(Math.min(ww - 4, wh - 56) / 12);
  const boardSize = squareSize * 12;

  // Legal moves lookup
  const legalSet = new Set(legalMoves.map((m) => `${m.col},${m.row}`));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {/* Render top-to-bottom (row 11 = top) */}
        {[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((col) => {
              const piece = board[row]?.[col] ?? null;
              const isLight = (col + row) % 2 === 0;
              const isSelected = selectedSquare?.col === col && selectedSquare?.row === row;
              const isLegal = legalSet.has(`${col},${row}`);
              const isLastMove = lastMove && (
                (lastMove.fromCol === col && lastMove.fromRow === row) ||
                (lastMove.toCol === col && lastMove.toRow === row)
              );

              const bgColor = isLight ? SQ.lightBase : SQ.darkBase;

              return (
                <Pressable
                  key={col}
                  onPress={() => selectSquare(col, row)}
                  style={[styles.square, { width: squareSize, height: squareSize, backgroundColor: bgColor }]}
                >
                  {/* Last move */}
                  {isLastMove && <View style={[styles.overlay, { backgroundColor: SQ.lastMove }]} />}
                  {/* Selected */}
                  {isSelected && <View style={[styles.overlay, { backgroundColor: SQ.selected }]} />}

                  {/* Piece */}
                  {piece && (
                    <View style={styles.pieceContainer}>
                      {/* Shadow */}
                      <Text
                        style={[styles.pieceShadow, {
                          fontSize: squareSize * 0.8,
                          lineHeight: squareSize,
                        }]}
                        allowFontScaling={false}
                      >
                        {piece.color === 'b' ? FILLED_SYMBOLS[piece.type] : OPEN_SYMBOLS[piece.type]}
                      </Text>
                      {/* Main */}
                      <Text
                        style={[styles.pieceText, {
                          fontSize: squareSize * 0.8,
                          lineHeight: squareSize,
                          color: PLAYER_COLORS[piece.color],
                          textShadowColor: PLAYER_SHADOW[piece.color],
                        }]}
                        allowFontScaling={false}
                      >
                        {piece.color === 'b' ? FILLED_SYMBOLS[piece.type] : OPEN_SYMBOLS[piece.type]}
                      </Text>
                    </View>
                  )}

                  {/* Legal move: dot (empty) or ring (capture) */}
                  {isLegal && !piece && (
                    <View style={[styles.legalDot, {
                      width: squareSize * 0.28,
                      height: squareSize * 0.28,
                      borderRadius: squareSize * 0.14,
                    }]} />
                  )}
                  {isLegal && piece && (
                    <View style={[styles.legalCapture, {
                      width: squareSize - 2,
                      height: squareSize - 2,
                      borderRadius: squareSize * 0.08,
                      borderWidth: squareSize * 0.06,
                    }]} />
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
  wrapper: { alignItems: 'center', paddingVertical: 2 },
  board: {
    borderWidth: 2,
    borderColor: '#4A8B6E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: { ...StyleSheet.absoluteFillObject },
  pieceContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pieceShadow: {
    position: 'absolute',
    textAlign: 'center',
    color: 'rgba(0,0,0,0.3)',
    transform: [{ translateX: 1.2 }, { translateY: 1.2 }],
  },
  pieceText: {
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  legalDot: {
    backgroundColor: SQ.legalMove,
    position: 'absolute',
  },
  legalCapture: {
    borderColor: 'rgba(255, 210, 70, 0.55)',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
