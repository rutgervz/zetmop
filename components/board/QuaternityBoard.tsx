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

// Quaternity.com kleuren
const PLAYER_COLORS: Record<QuaterColor, string> = {
  w: '#E8E0D0',     // zilver/lichtgrijs
  b: '#1A1A1A',     // zwart
  r: '#CC2222',     // donkerrood
  g: '#1B6B1B',     // donkergroen
};

const PLAYER_SHADOW: Record<QuaterColor, string> = {
  w: 'rgba(0,0,0,0.5)',
  b: 'rgba(255,255,255,0.15)',
  r: 'rgba(0,0,0,0.5)',
  g: 'rgba(0,0,0,0.5)',
};

// Board kleuren: warm hout thema (quaternity.com stijl)
const SQ = {
  light: '#C8A96E',      // warm beige/tan
  dark: '#6B4226',       // donker hout bruin
  selected: 'rgba(255, 210, 70, 0.55)',
  legalMove: 'rgba(255, 210, 70, 0.4)',
  lastMove: 'rgba(200, 180, 80, 0.35)',
  coordText: '#9A8A6A',
  border: '#3D2B1F',
};

// Richting-pijltjes voor Advanced Central Pawns
const DIR_ARROWS: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

export default function QuaternityBoard() {
  const { width: ww, height: wh } = useWindowDimensions();
  const board = useQuaternityStore((s) => s.board);
  const selectedSquare = useQuaternityStore((s) => s.selectedSquare);
  const legalMoves = useQuaternityStore((s) => s.legalMoves);
  const lastMove = useQuaternityStore((s) => s.lastMove);
  const turn = useQuaternityStore((s) => s.turn);
  const selectSquare = useQuaternityStore((s) => s.selectSquare);

  // Coördinaten nemen ruimte in: 18px links + 18px rechts
  const coordSize = 16;
  const availableSize = Math.min(ww - 4, wh - 56) - coordSize * 2;
  const squareSize = Math.floor(availableSize / 12);
  const boardSize = squareSize * 12;

  // Legal moves lookup
  const legalSet = new Set(legalMoves.map((m) => `${m.col},${m.row}`));

  const COL_LABELS = 'ABCDEFGHIJKL';

  return (
    <View style={styles.wrapper}>
      {/* Kolom-labels boven */}
      <View style={[styles.coordRow, { width: boardSize + coordSize * 2 }]}>
        <View style={{ width: coordSize }} />
        {COL_LABELS.split('').map((letter) => (
          <View key={letter} style={[styles.coordCell, { width: squareSize }]}>
            <Text style={[styles.coordText, { fontSize: coordSize * 0.7 }]}>{letter}</Text>
          </View>
        ))}
        <View style={{ width: coordSize }} />
      </View>

      {/* Board met rij-labels */}
      <View style={styles.boardRow}>
        {/* Rij-labels links */}
        <View style={styles.rowLabels}>
          {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
            <View key={num} style={[styles.coordCell, { height: squareSize, width: coordSize }]}>
              <Text style={[styles.coordText, { fontSize: coordSize * 0.7 }]}>{num}</Text>
            </View>
          ))}
        </View>

        {/* Het bord */}
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
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

                const bgColor = isLight ? SQ.light : SQ.dark;

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
                            fontSize: squareSize * 0.78,
                            lineHeight: squareSize,
                          }]}
                          allowFontScaling={false}
                        >
                          {piece.color === 'b' ? FILLED_SYMBOLS[piece.type] : OPEN_SYMBOLS[piece.type]}
                        </Text>
                        {/* Main */}
                        <Text
                          style={[styles.pieceText, {
                            fontSize: squareSize * 0.78,
                            lineHeight: squareSize,
                            color: PLAYER_COLORS[piece.color],
                            textShadowColor: PLAYER_SHADOW[piece.color],
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
                          }]}
                          allowFontScaling={false}
                        >
                          {piece.color === 'b' ? FILLED_SYMBOLS[piece.type] : OPEN_SYMBOLS[piece.type]}
                        </Text>

                        {/* ACP richting-indicator (< > pijltjes) */}
                        {piece.isAdvancedCentral && piece.type === 'p' && (
                          <Text style={[styles.acpIndicator, {
                            fontSize: squareSize * 0.22,
                            color: PLAYER_COLORS[piece.color],
                          }]}>
                            {'<>'}
                          </Text>
                        )}
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

        {/* Rij-labels rechts */}
        <View style={styles.rowLabels}>
          {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
            <View key={num} style={[styles.coordCell, { height: squareSize, width: coordSize }]}>
              <Text style={[styles.coordText, { fontSize: coordSize * 0.7 }]}>{num}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Kolom-labels onder */}
      <View style={[styles.coordRow, { width: boardSize + coordSize * 2 }]}>
        <View style={{ width: coordSize }} />
        {COL_LABELS.split('').map((letter) => (
          <View key={letter} style={[styles.coordCell, { width: squareSize }]}>
            <Text style={[styles.coordText, { fontSize: coordSize * 0.7 }]}>{letter}</Text>
          </View>
        ))}
        <View style={{ width: coordSize }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 2 },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordText: {
    color: SQ.coordText,
    fontWeight: '600',
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabels: {
    flexDirection: 'column',
  },
  board: {
    borderWidth: 2,
    borderColor: SQ.border,
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
  pieceContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceShadow: {
    position: 'absolute',
    textAlign: 'center',
    color: 'rgba(0,0,0,0.25)',
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  pieceText: {
    textAlign: 'center',
  },
  acpIndicator: {
    position: 'absolute',
    bottom: -2,
    fontWeight: '700',
    opacity: 0.7,
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
