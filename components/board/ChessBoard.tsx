import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import SquareComponent from './Square';
import { useGameStore } from '@/stores/gameStore';
import type { Square } from '@/lib/chess/types';

const isWeb = Platform.OS === 'web';
// Lazy import om circular deps te voorkomen
const EffectsOverlay = isWeb ? require('./EffectsOverlay').default : null;

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const BOARD_BORDER_COLOR = '#4A8B6E';
const BOARD_OUTER_COLOR = '#2D5A48';
const COORD_COLOR = '#B8D8C8';

export default function ChessBoard() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const board = useGameStore((s) => s.board);
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const legalMoves = useGameStore((s) => s.legalMoves);
  const lastMove = useGameStore((s) => s.lastMove);
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.turn);
  const boardFlipped = useGameStore((s) => s.boardFlipped);
  const selectSquare = useGameStore((s) => s.selectSquare);

  // Bord zo groot mogelijk: minimale marges, coördinaten compact
  const coordSize = 18;
  const maxSize = Math.min(windowWidth - 4, windowHeight - 56);
  const boardSize = Math.floor((maxSize - coordSize * 2) / 8) * 8;
  const squareSize = boardSize / 8;

  // Find king in check
  let checkSquare: Square | null = null;
  if (status === 'check' || status === 'checkmate') {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          checkSquare = `${file}${rank}` as Square;
        }
      }
    }
  }

  const displayFiles = boardFlipped ? [...FILES].reverse() : FILES;
  const displayRanks = boardFlipped ? [...RANKS].reverse() : RANKS;

  return (
    <View style={styles.wrapper}>
      {/* Outer frame */}
      <View style={[styles.outerFrame, { width: boardSize + coordSize * 2 + 8 }]}>
        {/* Top file labels */}
        <View style={[styles.fileRow, { marginLeft: coordSize + 4 }]}>
          {displayFiles.map((file) => (
            <Text key={`top-${file}`} style={[styles.coord, { width: squareSize }]}>
              {file}
            </Text>
          ))}
        </View>

        <View style={styles.middleRow}>
          {/* Left rank labels */}
          <View style={[styles.rankCol, { width: coordSize }]}>
            {displayRanks.map((rank) => (
              <Text key={`left-${rank}`} style={[styles.coord, styles.rankLabel, { height: squareSize }]}>
                {rank}
              </Text>
            ))}
          </View>

          {/* Board with inner border + effects overlay */}
          <View style={[styles.innerFrame, { position: 'relative' }]}>
            <View style={[styles.board, { width: boardSize, height: boardSize }]}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((displayRow) => {
                const r = boardFlipped ? 7 - displayRow : displayRow;
                return (
                  <View key={r} style={styles.row}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((displayCol) => {
                      const c = boardFlipped ? 7 - displayCol : displayCol;
                      const file = String.fromCharCode(97 + c);
                      const rank = 8 - r;
                      const square = `${file}${rank}` as Square;
                      const piece = board[r][c];
                      const isLight = (r + c) % 2 === 0;

                      return (
                        <SquareComponent
                          key={square}
                          square={square}
                          piece={piece}
                          size={squareSize}
                          isLight={isLight}
                          isSelected={selectedSquare === square}
                          isLegalMove={legalMoves.includes(square)}
                          isLastMove={lastMove?.from === square || lastMove?.to === square}
                          isCheck={checkSquare === square}
                          onPress={selectSquare}
                        />
                      );
                    })}
                  </View>
                );
              })}
            </View>
            {/* 3D effects overlay (transparant, bovenop het bord) */}
            {isWeb && EffectsOverlay && <EffectsOverlay boardSize={boardSize} />}
          </View>

          {/* Right rank labels */}
          <View style={[styles.rankCol, { width: coordSize }]}>
            {displayRanks.map((rank) => (
              <Text key={`right-${rank}`} style={[styles.coord, styles.rankLabel, { height: squareSize }]}>
                {rank}
              </Text>
            ))}
          </View>
        </View>

        {/* Bottom file labels */}
        <View style={[styles.fileRow, { marginLeft: coordSize + 4 }]}>
          {displayFiles.map((file) => (
            <Text key={`bottom-${file}`} style={[styles.coord, { width: squareSize }]}>
              {file}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  outerFrame: {
    backgroundColor: BOARD_OUTER_COLOR,
    borderRadius: 8,
    padding: 4,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  innerFrame: {
    borderWidth: 2,
    borderColor: BOARD_BORDER_COLOR,
    borderRadius: 2,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  board: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  fileRow: {
    flexDirection: 'row',
    height: 18,
    alignItems: 'center',
  },
  rankCol: {
    justifyContent: 'center',
  },
  coord: {
    color: COORD_COLOR,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  rankLabel: {
    justifyContent: 'center',
    textAlignVertical: 'center',
    lineHeight: undefined,
  },
});
