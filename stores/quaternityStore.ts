import { create } from 'zustand';
import type { PieceSymbol } from '@/lib/chess/types';

export type QuaterColor = 'w' | 'r' | 'b' | 'g';

export type QuaterPiece = {
  type: PieceSymbol;
  color: QuaterColor;
};

export type QuaterEvent =
  | { type: 'move'; color: QuaterColor }
  | { type: 'capture'; color: QuaterColor; captured: QuaterPiece }
  | { type: 'check'; color: QuaterColor; kingCol: number; kingRow: number }
  | { type: 'elimination'; eliminated: QuaterColor }
  | { type: 'promotion'; color: QuaterColor; piece: PieceSymbol }
  | { type: 'finished'; winner: QuaterColor };

type QuaternityState = {
  board: (QuaterPiece | null)[][];
  turn: QuaterColor;
  activePlayers: QuaterColor[];
  status: string;
  selectedSquare: { col: number; row: number } | null;
  legalMoves: { col: number; row: number }[];
  lastMove: { fromCol: number; fromRow: number; toCol: number; toRow: number } | null;
  lastEvent: QuaterEvent | null;
  winner: QuaterColor | null;
  playerNames: Record<QuaterColor, string>;
  moveHistory: string[];

  // Actions
  newGame: () => void;
  selectSquare: (col: number, row: number) => void;
  undoMove: () => void;
  setPlayerNames: (names: Record<QuaterColor, string>) => void;
};

// Board helpers
function isInvalidSquare(col: number, row: number): boolean {
  const inLeft = col <= 2;
  const inRight = col >= 11;
  const inTop = row <= 2;
  const inBottom = row >= 11;
  return (inLeft && inTop) || (inRight && inTop) || (inLeft && inBottom) || (inRight && inBottom);
}

function createInitialBoard(): (QuaterPiece | null)[][] {
  const board: (QuaterPiece | null)[][] = Array.from({ length: 14 }, () =>
    Array.from({ length: 14 }, () => null)
  );

  const placePieces = (
    color: QuaterColor,
    backRank: [number, number][],
    pawnRank: [number, number][],
    pieces: PieceSymbol[]
  ) => {
    pieces.forEach((type, i) => {
      const [col, row] = backRank[i];
      board[row][col] = { type, color };
    });
    pawnRank.forEach(([col, row]) => {
      board[row][col] = { type: 'p', color };
    });
  };

  // South (white) — rows 0-1 (internal), cols 3-10
  const southPieces: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const southBack: [number, number][] = Array.from({ length: 8 }, (_, i) => [i + 3, 0]);
  const southPawns: [number, number][] = Array.from({ length: 8 }, (_, i) => [i + 3, 1]);
  placePieces('w', southBack, southPawns, southPieces);

  // North (black) — rows 13-12 (internal), cols 3-10
  const northPieces: PieceSymbol[] = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];
  const northBack: [number, number][] = Array.from({ length: 8 }, (_, i) => [i + 3, 13]);
  const northPawns: [number, number][] = Array.from({ length: 8 }, (_, i) => [i + 3, 12]);
  placePieces('b', northBack, northPawns, northPieces);

  // West (red) — cols 0-1, rows 3-10
  const westPieces: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const westBack: [number, number][] = Array.from({ length: 8 }, (_, i) => [0, i + 3]);
  const westPawns: [number, number][] = Array.from({ length: 8 }, (_, i) => [1, i + 3]);
  placePieces('r', westBack, westPawns, westPieces);

  // East (green) — cols 13-12, rows 3-10
  const eastPieces: PieceSymbol[] = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];
  const eastBack: [number, number][] = Array.from({ length: 8 }, (_, i) => [13, i + 3]);
  const eastPawns: [number, number][] = Array.from({ length: 8 }, (_, i) => [12, i + 3]);
  placePieces('g', eastBack, eastPawns, eastPieces);

  return board;
}

// Simple move generation (no check validation yet — will be replaced by engine)
function isOnBoard(col: number, row: number): boolean {
  return col >= 0 && col < 14 && row >= 0 && row < 14 && !isInvalidSquare(col, row);
}

function getPawnDirection(color: QuaterColor): { dc: number; dr: number } {
  switch (color) {
    case 'w': return { dc: 0, dr: 1 };   // up
    case 'b': return { dc: 0, dr: -1 };  // down
    case 'r': return { dc: 1, dr: 0 };   // right
    case 'g': return { dc: -1, dr: 0 };  // left
  }
}

function getPawnStartRow(color: QuaterColor): (col: number, row: number) => boolean {
  switch (color) {
    case 'w': return (_, row) => row === 1;
    case 'b': return (_, row) => row === 12;
    case 'r': return (col, _) => col === 1;
    case 'g': return (col, _) => col === 12;
  }
}

function generateMoves(
  board: (QuaterPiece | null)[][],
  col: number,
  row: number,
  color: QuaterColor,
  type: PieceSymbol
): { col: number; row: number }[] {
  const moves: { col: number; row: number }[] = [];
  const canMove = (c: number, r: number) => isOnBoard(c, r) && !board[r][c];
  const canCapture = (c: number, r: number) =>
    isOnBoard(c, r) && board[r][c] !== null && board[r][c]!.color !== color;
  const canMoveOrCapture = (c: number, r: number) => canMove(c, r) || canCapture(c, r);

  if (type === 'p') {
    const { dc, dr } = getPawnDirection(color);
    const isStart = getPawnStartRow(color);
    // One step
    if (canMove(col + dc, row + dr)) {
      moves.push({ col: col + dc, row: row + dr });
      // Two steps from start
      if (isStart(col, row) && canMove(col + dc * 2, row + dr * 2)) {
        moves.push({ col: col + dc * 2, row: row + dr * 2 });
      }
    }
    // Captures (diagonal relative to pawn direction)
    if (dc === 0) {
      // vertical pawn: captures on (col-1, row+dr) and (col+1, row+dr)
      if (canCapture(col - 1, row + dr)) moves.push({ col: col - 1, row: row + dr });
      if (canCapture(col + 1, row + dr)) moves.push({ col: col + 1, row: row + dr });
    } else {
      // horizontal pawn: captures on (col+dc, row-1) and (col+dc, row+1)
      if (canCapture(col + dc, row - 1)) moves.push({ col: col + dc, row: row - 1 });
      if (canCapture(col + dc, row + 1)) moves.push({ col: col + dc, row: row + 1 });
    }
  } else if (type === 'n') {
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dc, dr] of knightMoves) {
      if (canMoveOrCapture(col + dc, row + dr)) moves.push({ col: col + dc, row: row + dr });
    }
  } else if (type === 'k') {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        if (canMoveOrCapture(col + dc, row + dr)) moves.push({ col: col + dc, row: row + dr });
      }
    }
  } else {
    // Sliding pieces: r (straights), b (diagonals), q (both)
    const directions: [number, number][] = [];
    if (type === 'r' || type === 'q') directions.push([0,1],[0,-1],[1,0],[-1,0]);
    if (type === 'b' || type === 'q') directions.push([1,1],[1,-1],[-1,1],[-1,-1]);
    for (const [dc, dr] of directions) {
      for (let i = 1; i < 14; i++) {
        const nc = col + dc * i, nr = row + dr * i;
        if (!isOnBoard(nc, nr)) break;
        if (board[nr][nc] === null) {
          moves.push({ col: nc, row: nr });
        } else {
          if (board[nr][nc]!.color !== color) moves.push({ col: nc, row: nr });
          break;
        }
      }
    }
  }

  return moves;
}

const TURN_ORDER: QuaterColor[] = ['w', 'r', 'b', 'g'];

function nextTurn(current: QuaterColor, activePlayers: QuaterColor[]): QuaterColor {
  const idx = TURN_ORDER.indexOf(current);
  for (let i = 1; i <= 4; i++) {
    const next = TURN_ORDER[(idx + i) % 4];
    if (activePlayers.includes(next)) return next;
  }
  return current;
}

export const useQuaternityStore = create<QuaternityState>((set, get) => ({
  board: createInitialBoard(),
  turn: 'w',
  activePlayers: ['w', 'r', 'b', 'g'],
  status: 'playing',
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  lastEvent: null,
  winner: null,
  playerNames: { w: 'Wit', r: 'Rood', b: 'Zwart', g: 'Groen' },
  moveHistory: [],

  newGame: () => {
    set({
      board: createInitialBoard(),
      turn: 'w',
      activePlayers: ['w', 'r', 'b', 'g'],
      status: 'playing',
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      lastEvent: null,
      winner: null,
      moveHistory: [],
    });
  },

  selectSquare: (col: number, row: number) => {
    const { board, turn, selectedSquare, legalMoves, activePlayers, status } = get();
    if (status === 'finished') return;

    // If a legal move target is tapped, execute the move
    if (selectedSquare && legalMoves.some((m) => m.col === col && m.row === row)) {
      const fromCol = selectedSquare.col;
      const fromRow = selectedSquare.row;
      const newBoard = board.map((r) => [...r]);
      const captured = newBoard[row][col];
      const piece = newBoard[fromRow][fromCol]!;
      newBoard[row][col] = piece;
      newBoard[fromRow][fromCol] = null;

      let event: QuaterEvent = { type: 'move', color: turn };
      let newActivePlayers = [...activePlayers];
      let newStatus = 'playing';
      let newWinner: QuaterColor | null = null;

      if (captured) {
        event = { type: 'capture', color: turn, captured };
        // If a king is captured, that player is eliminated
        if (captured.type === 'k') {
          newActivePlayers = newActivePlayers.filter((c) => c !== captured.color);
          // Remove all pieces of eliminated player
          for (let r = 0; r < 14; r++) {
            for (let c = 0; c < 14; c++) {
              if (newBoard[r][c]?.color === captured.color) {
                newBoard[r][c] = null;
              }
            }
          }
          event = { type: 'elimination', eliminated: captured.color };

          // Check if game is over
          if (newActivePlayers.length === 1) {
            newStatus = 'finished';
            newWinner = newActivePlayers[0];
            event = { type: 'finished', winner: newWinner };
          }
        }
      }

      // Pawn promotion (simplified: auto-promote to queen)
      const { dc, dr } = getPawnDirection(turn);
      if (piece.type === 'p') {
        const atEnd = (
          (turn === 'w' && row >= 12) ||
          (turn === 'b' && row <= 1) ||
          (turn === 'r' && col >= 12) ||
          (turn === 'g' && col <= 1)
        );
        if (atEnd) {
          newBoard[row][col] = { type: 'q', color: turn };
          event = { type: 'promotion', color: turn, piece: 'q' };
        }
      }

      const newTurn = newStatus === 'finished' ? turn : nextTurn(turn, newActivePlayers);

      const moveStr = `${String.fromCharCode(97 + fromCol)}${fromRow + 1}→${String.fromCharCode(97 + col)}${row + 1}`;

      set({
        board: newBoard,
        turn: newTurn,
        activePlayers: newActivePlayers,
        status: newStatus,
        selectedSquare: null,
        legalMoves: [],
        lastMove: { fromCol, fromRow, toCol: col, toRow: row },
        lastEvent: event,
        winner: newWinner,
        moveHistory: [...get().moveHistory, moveStr],
      });
      return;
    }

    // If tapping own piece, select it and show legal moves
    const piece = board[row]?.[col];
    if (piece && piece.color === turn) {
      const moves = generateMoves(board, col, row, turn, piece.type);
      set({
        selectedSquare: { col, row },
        legalMoves: moves,
      });
      return;
    }

    // Deselect
    set({ selectedSquare: null, legalMoves: [] });
  },

  undoMove: () => {
    // Simplified: just restart for now
    // Full undo would need move history stack
  },

  setPlayerNames: (names: Record<QuaterColor, string>) => {
    set({ playerNames: names });
  },
}));
