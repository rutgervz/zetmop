import { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { pieceSymbol, type MoveLogEntry } from '@/components/board/GameLog';

const PLAYER_COLORS = { w: '#FFF5E6', b: '#666' };

// Stuk namen voor beschrijvingen
const PIECE_DUTCH: Record<string, string> = {
  p: 'pion', n: 'paard', b: 'loper', r: 'toren', q: 'dame', k: 'koning',
};

/**
 * Bouwt een MoveLogEntry[] op basis van de chess engine's verbose history.
 */
export function useChessMoveLog(): MoveLogEntry[] {
  const engine = useGameStore((s) => s.engine);
  const moveHistory = useGameStore((s) => s.moveHistory); // trigger re-render
  const playerWhite = useGameStore((s) => s.playerWhite);
  const playerBlack = useGameStore((s) => s.playerBlack);
  const status = useGameStore((s) => s.status);
  const lastEvent = useGameStore((s) => s.lastEvent);

  return useMemo(() => {
    const verboseMoves = engine.getMoveHistory();
    const entries: MoveLogEntry[] = [];

    for (let i = 0; i < verboseMoves.length; i++) {
      const m = verboseMoves[i];
      const isWhite = m.color === 'w';
      const moveNum = Math.floor(i / 2) + 1;

      const isCastling = m.san === 'O-O' || m.san === 'O-O-O';
      const isCapture = !!m.captured;
      const isCheck = m.san.includes('+') && !m.san.includes('#');
      const isCheckmate = m.san.includes('#');
      const isPromotion = m.san.includes('=');
      const isEnPassant = m.flags.includes('e');

      // Beschrijving voor bijzondere zetten
      let description: string | undefined;
      if (isCastling) {
        description = m.san === 'O-O' ? 'korte rokade' : 'lange rokade';
      } else if (isPromotion) {
        const promotedTo = m.san.match(/=([QRBN])/)?.[1];
        const pieceName = promotedTo ? PIECE_DUTCH[promotedTo.toLowerCase()] : 'dame';
        description = `promotie naar ${pieceName}`;
      } else if (isEnPassant) {
        description = 'en passant';
      } else if (isCheckmate) {
        description = 'schaakmat!';
      } else if (isCheck) {
        description = 'schaak';
      }

      entries.push({
        moveNumber: moveNum,
        playerName: isWhite ? playerWhite : playerBlack,
        playerColor: isWhite ? PLAYER_COLORS.w : PLAYER_COLORS.b,
        notation: m.san,
        piece: pieceSymbol(m.piece),
        pieceName: PIECE_DUTCH[m.piece],
        from: m.from,
        to: m.to,
        isCapture,
        capturedPiece: m.captured ? pieceSymbol(m.captured) : undefined,
        capturedPieceName: m.captured ? PIECE_DUTCH[m.captured] : undefined,
        isCheck,
        isCheckmate,
        isPromotion,
        isCastling,
        isEnPassant,
        description,
      });
    }

    // Eindresultaat
    if (status === 'checkmate' && lastEvent?.type === 'checkmate') {
      const winnerName = lastEvent.winner === 'w' ? playerWhite : playerBlack;
      const result = lastEvent.winner === 'w' ? '1-0' : '0-1';
      entries.push({
        moveNumber: entries.length > 0 ? entries[entries.length - 1].moveNumber : 0,
        playerName: '', playerColor: '#FFD93D', notation: '', piece: '', isCapture: false,
        special: `Schaakmat! ${winnerName} wint.`,
        result,
      });
    } else if (status === 'stalemate') {
      entries.push({
        moveNumber: entries.length > 0 ? entries[entries.length - 1].moveNumber : 0,
        playerName: '', playerColor: '#FFD93D', notation: '', piece: '', isCapture: false,
        special: 'Pat — remise.',
        result: '½-½',
      });
    } else if (status === 'draw') {
      entries.push({
        moveNumber: entries.length > 0 ? entries[entries.length - 1].moveNumber : 0,
        playerName: '', playerColor: '#FFD93D', notation: '', piece: '', isCapture: false,
        special: 'Remise.',
        result: '½-½',
      });
    } else if (status === 'resigned') {
      entries.push({
        moveNumber: entries.length > 0 ? entries[entries.length - 1].moveNumber : 0,
        playerName: '', playerColor: '#FFD93D', notation: '', piece: '', isCapture: false,
        special: 'Opgegeven.',
        result: lastEvent?.type === 'checkmate' ? (lastEvent.winner === 'w' ? '1-0' : '0-1') : undefined,
      });
    }

    return entries;
  }, [moveHistory, status, lastEvent, playerWhite, playerBlack, engine]);
}
