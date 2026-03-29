import { Chess } from 'chess.js';
import type { Square, Move, PieceSymbol, Color, GameStatus, GameEvent, PieceType } from './types';

export class GameEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  newGame(): void {
    this.chess.reset();
  }

  loadFen(fen: string): void {
    this.chess.load(fen);
  }

  getFen(): string {
    return this.chess.fen();
  }

  getTurn(): Color {
    return this.chess.turn();
  }

  makeMove(from: Square, to: Square, promotion?: PieceSymbol): GameEvent | null {
    const move = this.chess.move({ from, to, promotion });
    if (!move) return null;

    return this.classifyMove(move);
  }

  makeMoveFromSan(san: string): GameEvent | null {
    const move = this.chess.move(san);
    if (!move) return null;
    return this.classifyMove(move);
  }

  undoMove(): Move | null {
    return this.chess.undo();
  }

  getLegalMoves(square?: Square): Move[] {
    return this.chess.moves({ square, verbose: true });
  }

  getPiece(square: Square): PieceType | null {
    return this.chess.get(square);
  }

  getBoard(): (PieceType | null)[][] {
    return this.chess.board();
  }

  getStatus(): GameStatus {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isDraw()) return 'draw';
    if (this.chess.isCheck()) return 'check';
    return 'playing';
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  getMoveHistory(): Move[] {
    return this.chess.history({ verbose: true });
  }

  getHistorySan(): string[] {
    return this.chess.history();
  }

  getPgn(): string {
    return this.chess.pgn();
  }

  private classifyMove(move: Move): GameEvent {
    // Checkmate
    if (this.chess.isCheckmate()) {
      const loser = this.chess.turn();
      const winner: Color = loser === 'w' ? 'b' : 'w';
      const kingSquare = this.findKing(loser);
      return { type: 'checkmate', winner, kingSquare: kingSquare! };
    }

    // Stalemate
    if (this.chess.isStalemate() || this.chess.isDraw()) {
      return { type: 'stalemate' };
    }

    // Castling
    if (move.flags.includes('k')) {
      return { type: 'castling', side: 'kingside', color: move.color };
    }
    if (move.flags.includes('q')) {
      return { type: 'castling', side: 'queenside', color: move.color };
    }

    // En passant
    if (move.flags.includes('e')) {
      return { type: 'enPassant', move };
    }

    // Promotion
    if (move.promotion) {
      return { type: 'promotion', move, piece: move.promotion };
    }

    // Check
    if (this.chess.isCheck()) {
      const kingSquare = this.findKing(this.chess.turn());
      return { type: 'check', kingSquare: kingSquare! };
    }

    // Capture
    if (move.captured) {
      return { type: 'capture', move, captured: move.captured };
    }

    // Normal move
    return { type: 'move', move };
  }

  private findKing(color: Color): Square | null {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }
}
