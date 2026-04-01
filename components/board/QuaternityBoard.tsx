import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useQuaternityStore, type QuaterColor } from '@/stores/quaternityStore';

// Altijd filled symbolen (zoals quaternity.com)
const SYMBOLS: Record<string, string> = {
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

// Quaternity.com stijl: filled stukken in spelerskleur met contrasterende outline
const PLAYER_COLORS: Record<QuaterColor, string> = {
  w: '#B0A898',     // grijs (zoals quaternity.com)
  b: '#2A2A2A',     // zwart
  r: '#8B2020',     // donkerrood
  g: '#2D6B2D',     // donkergroen
};

// Outline/rand kleur per speler
const PLAYER_OUTLINE: Record<QuaterColor, string> = {
  w: '#D8D0C4',     // lichtere rand
  b: '#666666',     // grijze rand
  r: '#CC5555',     // lichtere rode rand
  g: '#55AA55',     // lichtere groene rand
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
                        {/* ACP pijl-indicator boven de pion (^ zoals quaternity.com) */}
                        {piece.isAdvancedCentral && piece.type === 'p' && (
                          <Text style={[styles.acpArrow, {
                            fontSize: squareSize * 0.25,
                            color: PLAYER_OUTLINE[piece.color],
                          }]}>
                            {'^'}
                          </Text>
                        )}
                        {/* Outline laag (lichtere kleur, iets groter, als rand-effect) */}
                        <Text
                          style={[styles.pieceOutline, {
                            fontSize: squareSize * 0.78,
                            lineHeight: squareSize * 0.85,
                            color: PLAYER_OUTLINE[piece.color],
                          }]}
                          allowFontScaling={false}
                        >
                          {SYMBOLS[piece.type]}
                        </Text>
                        {/* Hoofdkleur */}
                        <Text
                          style={[styles.pieceText, {
                            fontSize: squareSize * 0.72,
                            lineHeight: squareSize * 0.85,
                            color: PLAYER_COLORS[piece.color],
                          }]}
                          allowFontScaling={false}
                        >
                          {SYMBOLS[piece.type]}
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
  pieceOutline: {
    position: 'absolute',
    textAlign: 'center',
  },
  pieceText: {
    textAlign: 'center',
  },
  acpArrow: {
    position: 'absolute',
    top: -2,
    fontWeight: '700',
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
