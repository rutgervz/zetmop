import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useQuaternityStore, type QuaterColor } from '@/stores/quaternityStore';

// Open symbolen (klassiek silhouet met meer detail)
const OPEN_SYMBOLS: Record<string, string> = {
  k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659',
};
// Filled symbolen
const FILLED_SYMBOLS: Record<string, string> = {
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

// Wit = zwarte rand, rest = witte rand (zoals quaternity.com)
const PLAYER_FILL: Record<QuaterColor, string> = {
  w: '#EFEFEF',     // helder wit
  b: '#1A1A1A',     // zwart
  r: '#CC2222',     // helder rood
  g: '#228B22',     // fris groen
};

const PLAYER_STROKE: Record<QuaterColor, string> = {
  w: '#111111',     // zwarte rand om wit
  b: '#EEEEEE',     // witte rand om zwart
  r: '#EEEEEE',     // witte rand om rood
  g: '#EEEEEE',     // witte rand om groen
};

// Board: donker hout, hoog contrast (quaternity.com)
const SQ = {
  light: '#C8A878',     // warm zand
  dark: '#6B3E22',      // donker hout
  selected: 'rgba(255, 200, 50, 0.5)',
  legalMove: 'rgba(0, 0, 0, 0.22)',
  lastMove: 'rgba(220, 190, 50, 0.4)',
  coordText: '#B8A888',
  border: '#2A1808',
};

const COL_LABELS = 'ABCDEFGHIJKL';

/**
 * Chess piece met twee lagen:
 * 1. Filled symbool (♞) — solid body in spelerskleur met outline stroke
 * 2. Open symbool (♘) eroverheen — toont klassieke details (oog paard, kruis loper, etc.)
 */
function ChessPiece({ type, color, size, isACP }: {
  type: string;
  color: QuaterColor;
  size: number;
  isACP?: boolean;
}) {
  const fontSize = size * 0.92;
  const strokeWidth = Math.max(1.5, size * 0.04);
  const fill = PLAYER_FILL[color];
  const stroke = PLAYER_STROKE[color];
  // Detail kleur: contrasterende kleur voor de interne lijnen
  const detailColor = color === 'w' ? '#333333' : '#FFFFFF';

  const baseStyle = Platform.OS === 'web' ? {
    WebkitTextStroke: `${strokeWidth}px ${stroke}`,
    paintOrder: 'stroke fill' as const,
    filter: `drop-shadow(1px 2px 2px rgba(0,0,0,0.4))`,
  } : {};

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {/* ACP chevron */}
      {isACP && (
        <Text
          style={{
            position: 'absolute',
            top: size * 0.02,
            fontSize: size * 0.2,
            color: stroke,
            fontWeight: '800',
            zIndex: 2,
            ...(Platform.OS === 'web' ? {
              filter: `drop-shadow(0 1px 1px rgba(0,0,0,0.5))`,
            } as any : {}),
          }}
          allowFontScaling={false}
        >
          {'◇'}
        </Text>
      )}
      {/* Laag 1: filled symbool — solid body met outline */}
      <Text
        style={{
          position: 'absolute',
          fontSize,
          lineHeight: size,
          color: fill,
          textAlign: 'center',
          ...baseStyle,
        } as any}
        allowFontScaling={false}
      >
        {FILLED_SYMBOLS[type]}
      </Text>
      {/* Laag 2: open symbool — klassieke details (oog, kruis, etc.) */}
      <Text
        style={{
          fontSize,
          lineHeight: size,
          color: detailColor,
          textAlign: 'center',
          opacity: 0.35,
          ...(Platform.OS === 'web' ? {
            WebkitTextStroke: '0px transparent',
            filter: 'none',
          } as any : {}),
        } as any}
        allowFontScaling={false}
      >
        {OPEN_SYMBOLS[type]}
      </Text>
    </View>
  );
}

export default function QuaternityBoard() {
  const { width: ww, height: wh } = useWindowDimensions();
  const board = useQuaternityStore((s) => s.board);
  const selectedSquare = useQuaternityStore((s) => s.selectedSquare);
  const legalMoves = useQuaternityStore((s) => s.legalMoves);
  const lastMove = useQuaternityStore((s) => s.lastMove);
  const selectSquare = useQuaternityStore((s) => s.selectSquare);
  const aiThinking = useQuaternityStore((s) => s.aiThinking);

  const coordSize = 18;
  const availableSize = Math.min(ww - 4, wh - 56) - coordSize * 2;
  const squareSize = Math.floor(availableSize / 12);
  const boardSize = squareSize * 12;

  const legalSet = new Set(legalMoves.map((m) => `${m.col},${m.row}`));

  return (
    <View style={styles.wrapper}>
      {/* Kolom-labels boven */}
      <View style={[styles.coordRow, { width: boardSize + coordSize * 2 }]}>
        <View style={{ width: coordSize }} />
        {COL_LABELS.split('').map((letter) => (
          <View key={letter} style={[styles.coordCell, { width: squareSize }]}>
            <Text style={[styles.coordText, { fontSize: 11 }]}>{letter}</Text>
          </View>
        ))}
        <View style={{ width: coordSize }} />
      </View>

      <View style={styles.boardRow}>
        {/* Rij-labels links */}
        <View style={styles.rowLabels}>
          {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
            <View key={num} style={[styles.coordCell, { height: squareSize, width: coordSize }]}>
              <Text style={[styles.coordText, { fontSize: 11 }]}>{num}</Text>
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
                    onPress={() => !aiThinking && selectSquare(col, row)}
                    style={[styles.square, { width: squareSize, height: squareSize, backgroundColor: bgColor }]}
                  >
                    {isLastMove && <View style={[styles.overlay, { backgroundColor: SQ.lastMove }]} />}
                    {isSelected && <View style={[styles.overlay, { backgroundColor: SQ.selected }]} />}

                    {piece && (
                      <ChessPiece
                        type={piece.type}
                        color={piece.color}
                        size={squareSize}
                        isACP={piece.isAdvancedCentral && piece.type === 'p'}
                      />
                    )}

                    {/* Legal move indicator */}
                    {isLegal && !piece && (
                      <View style={[styles.legalDot, {
                        width: squareSize * 0.32,
                        height: squareSize * 0.32,
                        borderRadius: squareSize * 0.16,
                      }]} />
                    )}
                    {isLegal && piece && (
                      <View style={[styles.legalCapture, {
                        width: squareSize * 0.92,
                        height: squareSize * 0.92,
                        borderRadius: squareSize * 0.46,
                        borderWidth: squareSize * 0.07,
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
              <Text style={[styles.coordText, { fontSize: 11 }]}>{num}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Kolom-labels onder */}
      <View style={[styles.coordRow, { width: boardSize + coordSize * 2 }]}>
        <View style={{ width: coordSize }} />
        {COL_LABELS.split('').map((letter) => (
          <View key={letter} style={[styles.coordCell, { width: squareSize }]}>
            <Text style={[styles.coordText, { fontSize: 11 }]}>{letter}</Text>
          </View>
        ))}
        <View style={{ width: coordSize }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 2 },
  coordRow: { flexDirection: 'row', alignItems: 'center' },
  coordCell: { alignItems: 'center', justifyContent: 'center' },
  coordText: { color: SQ.coordText, fontWeight: '700', letterSpacing: 0.5 },
  boardRow: { flexDirection: 'row', alignItems: 'center' },
  rowLabels: { flexDirection: 'column' },
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
  legalDot: {
    backgroundColor: SQ.legalMove,
    position: 'absolute',
  },
  legalCapture: {
    borderColor: 'rgba(0, 0, 0, 0.25)',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
