import { create } from 'zustand';
import { GameEngine } from '@/lib/chess/rules';
import type { Square, Move, PieceSymbol, Color, GameStatus, GameEvent, PieceType, GameMode } from '@/lib/chess/types';

type GameState = {
  engine: GameEngine;
  board: (PieceType | null)[][];
  turn: Color;
  status: GameStatus;
  selectedSquare: Square | null;
  legalMoves: Square[];
  moveHistory: string[];
  lastMove: { from: Square; to: Square } | null;
  lastEvent: GameEvent | null;
  gameMode: GameMode;
  playerWhite: string;
  playerBlack: string;
  boardFlipped: boolean;
  pendingPromotion: { from: Square; to: Square } | null;

  // Actions
  newGame: (mode?: GameMode) => void;
  selectSquare: (square: Square) => void;
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => void;
  undoMove: () => void;
  resign: (color: Color) => void;
  flipBoard: () => void;
  setPromotion: (piece: PieceSymbol) => void;
  cancelPromotion: () => void;
  setPlayerNames: (white: string, black: string) => void;
};

const engine = new GameEngine();

export const useGameStore = create<GameState>((set, get) => ({
  engine,
  board: engine.getBoard(),
  turn: 'w',
  status: 'playing',
  selectedSquare: null,
  legalMoves: [],
  moveHistory: [],
  lastMove: null,
  lastEvent: null,
  gameMode: 'local',
  playerWhite: 'Wit',
  playerBlack: 'Zwart',
  boardFlipped: false,
  pendingPromotion: null,

  newGame: (mode = 'local') => {
    const { engine } = get();
    engine.newGame();
    set({
      board: engine.getBoard(),
      turn: 'w',
      status: 'playing',
      selectedSquare: null,
      legalMoves: [],
      moveHistory: [],
      lastMove: null,
      lastEvent: null,
      gameMode: mode,
      boardFlipped: false,
      pendingPromotion: null,
    });
  },

  selectSquare: (square: Square) => {
    const { engine, selectedSquare, legalMoves, turn, status, board } = get();
    if (status !== 'playing' && status !== 'check') return;

    // If tapping a legal move target, execute the move
    if (selectedSquare && legalMoves.includes(square)) {
      get().makeMove(selectedSquare, square);
      return;
    }

    // If tapping own piece, select it
    const piece = engine.getPiece(square);
    if (piece && piece.color === turn) {
      const moves = engine.getLegalMoves(square);
      set({
        selectedSquare: square,
        legalMoves: moves.map((m) => m.to),
      });
      return;
    }

    // Deselect
    set({ selectedSquare: null, legalMoves: [] });
  },

  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => {
    const { engine } = get();

    // Check if this is a pawn promotion without a specified piece
    const piece = engine.getPiece(from);
    if (
      piece?.type === 'p' &&
      !promotion &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))
    ) {
      set({ pendingPromotion: { from, to } });
      return;
    }

    const event = engine.makeMove(from, to, promotion);
    if (!event) return;

    set({
      board: engine.getBoard(),
      turn: engine.getTurn(),
      status: engine.getStatus(),
      selectedSquare: null,
      legalMoves: [],
      moveHistory: engine.getHistorySan(),
      lastMove: { from, to },
      lastEvent: event,
      pendingPromotion: null,
    });
  },

  setPromotion: (piece: PieceSymbol) => {
    const { pendingPromotion } = get();
    if (!pendingPromotion) return;
    get().makeMove(pendingPromotion.from, pendingPromotion.to, piece);
  },

  cancelPromotion: () => {
    set({ pendingPromotion: null });
  },

  undoMove: () => {
    const { engine } = get();
    const undone = engine.undoMove();
    if (!undone) return;

    set({
      board: engine.getBoard(),
      turn: engine.getTurn(),
      status: engine.getStatus(),
      selectedSquare: null,
      legalMoves: [],
      moveHistory: engine.getHistorySan(),
      lastMove: null,
      lastEvent: null,
      pendingPromotion: null,
    });
  },

  resign: (color: Color) => {
    set({
      status: 'resigned',
      lastEvent: {
        type: 'checkmate',
        winner: color === 'w' ? 'b' : 'w',
        kingSquare: 'e1' as Square, // placeholder
      },
    });
  },

  flipBoard: () => {
    set((state) => ({ boardFlipped: !state.boardFlipped }));
  },

  setPlayerNames: (white: string, black: string) => {
    set({ playerWhite: white, playerBlack: black });
  },
}));
