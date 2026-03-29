import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import SquareComponent from './Square';
import { useGameStore } from '@/stores/gameStore';
import type { Square, PieceType } from '@/lib/chess/types';

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
  const engine = useGameStore((s) => s.engine);

  // Board fills available space, max 90% of smallest dimension
  const maxSize = Math.min(windowWidth, windowHeight - 200) * 0.9;
  const boardSize = Math.floor(maxSize / 8) * 8;
  const squareSize = boardSize / 8;

  // Find king in check
  let checkSquare: Square | null = null;
  if (status === 'check' || status === 'checkmate') {
    const b = board;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          checkSquare = `${file}${rank}` as Square;
        }
      }
    }
  }

  const rows = boardFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <View style={[styles.board, { width: boardSize, height: boardSize }]}>
      {rows.map((displayRow) => {
        const r = boardFlipped ? 7 - displayRow : displayRow;
        return (
          <View key={r} style={styles.row}>
            {cols.map((c) => {
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
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 2,
    borderColor: '#463624',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
