import { useMemo } from 'react';
import { useQuaternityStore, type QuaterColor } from '@/stores/quaternityStore';
import { pieceSymbol, type MoveLogEntry } from '@/components/board/GameLog';

const COLOR_HEX: Record<QuaterColor, string> = {
  w: '#FFF5E6',
  r: '#E84040',
  b: '#666',
  g: '#2AAA6A',
};

const PIECE_DUTCH: Record<string, string> = {
  p: 'pion', n: 'paard', b: 'loper', r: 'toren', q: 'dame', k: 'koning',
};

/**
 * Bouwt MoveLogEntry[] op basis van het quaternity moveLog.
 */
export function useQuaternityMoveLog(): MoveLogEntry[] {
  const moveLog = useQuaternityStore((s) => s.moveLog);
  const playerNames = useQuaternityStore((s) => s.playerNames);

  return useMemo(() => {
    return moveLog.map((entry) => {
      const result: MoveLogEntry = {
        moveNumber: entry.moveNumber,
        playerName: playerNames[entry.color],
        playerColor: COLOR_HEX[entry.color],
        notation: entry.notation,
        isCapture: entry.isCapture,
        capturedPiece: entry.capturedPieceType ? pieceSymbol(entry.capturedPieceType) : undefined,
        capturedPieceName: entry.capturedPieceType ? PIECE_DUTCH[entry.capturedPieceType] : undefined,
        isCheck: false,
        isCheckmate: entry.isCheckmate,
        isPromotion: entry.isPromotion,
        isPass: entry.isPass,
        special: entry.special,
      };

      // Beschrijving voor bijzondere zetten
      if (entry.isCheckmate && entry.checkmatedColor) {
        result.description = `${playerNames[entry.checkmatedColor]} is mat!`;
      }
      if (entry.isPromotion) {
        result.description = 'promotie';
      }

      return result;
    });
  }, [moveLog, playerNames]);
}
