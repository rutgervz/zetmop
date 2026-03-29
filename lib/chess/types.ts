import type { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';

export type { Square, Move, PieceSymbol, Color };

export type PieceType = {
  type: PieceSymbol;
  color: Color;
};

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned';

export type GameMode = 'local' | 'ai' | 'online';

export type GameResult = {
  status: GameStatus;
  winner?: Color;
  reason?: string;
};

export type GameEvent =
  | { type: 'move'; move: Move }
  | { type: 'capture'; move: Move; captured: PieceSymbol }
  | { type: 'check'; kingSquare: Square }
  | { type: 'checkmate'; winner: Color; kingSquare: Square }
  | { type: 'stalemate' }
  | { type: 'castling'; side: 'kingside' | 'queenside'; color: Color }
  | { type: 'enPassant'; move: Move }
  | { type: 'promotion'; move: Move; piece: PieceSymbol };
