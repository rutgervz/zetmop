import { create } from 'zustand';
import { GameEngine } from '@/lib/chess/rules';
import { getStockfish, parseUciMove } from '@/lib/chess/stockfish';
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
  aiLevel: number;
  aiThinking: boolean;

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
  setAiLevel: (level: number) => void;
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
  aiLevel: 5,
  aiThinking: false,

  newGame: (mode = 'local') => {
    const { engine } = get();
    engine.newGame();

    // Pre-init Stockfish when starting an AI game
    if (mode === 'ai') {
      const sf = getStockfish();
      sf.init().catch((err) => console.warn('[Stockfish] Init failed:', err));
    }

    // Keep existing player names — they're set by setPlayerNames before newGame
    const { playerWhite, playerBlack } = get();
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
      aiThinking: false,
      playerWhite,
      playerBlack,
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

    const newStatus = engine.getStatus();

    set({
      board: engine.getBoard(),
      turn: engine.getTurn(),
      status: newStatus,
      selectedSquare: null,
      legalMoves: [],
      moveHistory: engine.getHistorySan(),
      lastMove: { from, to },
      lastEvent: event,
      pendingPromotion: null,
    });

    // After human (white) moves in AI mode, trigger AI response
    const { gameMode } = get();
    if (
      gameMode === 'ai' &&
      engine.getTurn() === 'b' &&
      !engine.isGameOver()
    ) {
      triggerAiMove();
    }
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

  setAiLevel: (level: number) => {
    set({ aiLevel: Math.max(0, Math.min(20, Math.round(level))) });
  },
}));

/**
 * Trigger an AI move after a short delay.
 * Runs outside the store to avoid async issues in Zustand actions.
 */
function triggerAiMove(): void {
  const store = useGameStore.getState();
  if (store.aiThinking) return;

  useGameStore.setState({ aiThinking: true });

  // Small delay so the human move visually settles first
  setTimeout(async () => {
    try {
      const { engine, aiLevel, gameMode } = useGameStore.getState();
      if (gameMode !== 'ai' || engine.isGameOver()) {
        useGameStore.setState({ aiThinking: false });
        return;
      }

      const fen = engine.getFen();
      const sf = getStockfish();
      await sf.init();

      const uciMove = await sf.getBestMove(fen, aiLevel);
      const { from, to, promotion } = parseUciMove(uciMove);

      // Verify game is still in AI mode and it's still black's turn
      const current = useGameStore.getState();
      if (current.gameMode !== 'ai' || current.turn !== 'b' || current.engine.isGameOver()) {
        useGameStore.setState({ aiThinking: false });
        return;
      }

      // Execute the AI move through the store's makeMove
      // But we need to avoid re-triggering AI, so we do the move directly
      const event = engine.makeMove(from as any, to as any, promotion as any);
      if (event) {
        useGameStore.setState({
          board: engine.getBoard(),
          turn: engine.getTurn(),
          status: engine.getStatus(),
          selectedSquare: null,
          legalMoves: [],
          moveHistory: engine.getHistorySan(),
          lastMove: { from: from as any, to: to as any },
          lastEvent: event,
          aiThinking: false,
        });
      } else {
        useGameStore.setState({ aiThinking: false });
      }
    } catch (err) {
      console.warn('[AI] Move failed:', err);
      useGameStore.setState({ aiThinking: false });
    }
  }, 500);
}
