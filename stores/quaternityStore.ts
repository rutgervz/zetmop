import { create } from 'zustand';
import type { PieceSymbol } from '@/lib/chess/types';

export type QuaterColor = 'w' | 'r' | 'b' | 'g';
export type PawnDir = 'up' | 'down' | 'left' | 'right';

export type QuaterPiece = {
  type: PieceSymbol;
  color: QuaterColor;
  pawnDir?: PawnDir; // alleen voor pionnen
};

export type QuaterEvent =
  | { type: 'move'; color: QuaterColor }
  | { type: 'capture'; color: QuaterColor; captured: QuaterPiece }
  | { type: 'elimination'; eliminated: QuaterColor }
  | { type: 'promotion'; color: QuaterColor; piece: PieceSymbol }
  | { type: 'finished'; winner: QuaterColor };

type QuaternityState = {
  board: (QuaterPiece | null)[][];  // 12×12, [row][col]
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

  newGame: () => void;
  selectSquare: (col: number, row: number) => void;
  undoMove: () => void;
  setPlayerNames: (names: Record<QuaterColor, string>) => void;
};

const BOARD_SIZE = 12;

// === EXACTE QUATERNITY OPSTELLING ===
// Kolommen: A=0..L=11, Rijen: 1=0..12=11
// Bron: quaternity.com screenshot, geverifieerd door Rutger

function p(type: PieceSymbol, color: QuaterColor, pawnDir?: PawnDir): QuaterPiece {
  return pawnDir ? { type, color, pawnDir } : { type, color };
}

function createInitialBoard(): (QuaterPiece | null)[][] {
  const b: (QuaterPiece | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
  const s = (col: number, row: number, piece: QuaterPiece) => { b[row][col] = piece; };

  // === WIT (linksonder, hoek a1) ===
  // Rij 1 (row=0)
  s(0, 0, p('k', 'w'));                                // a1: Koning
  s(3, 0, p('r', 'w'));                                // d1: Toren
  s(4, 0, p('p', 'w', 'right'));                       // e1: Pion →
  // Rij 2 (row=1)
  s(1, 1, p('q', 'w'));                                // b2: Dame
  s(2, 1, p('b', 'w'));                                // c2: Loper
  s(3, 1, p('p', 'w', 'right'));                       // d2: Pion →
  // Rij 3 (row=2)
  s(2, 2, p('b', 'w'));                                // c3: Loper
  s(3, 2, p('p', 'w', 'right'));                       // d3: Pion →
  // Rij 4 (row=3)
  s(0, 3, p('r', 'w'));                                // a4: Toren
  s(1, 3, p('n', 'w'));                                // b4: Paard
  s(2, 3, p('n', 'w'));                                // c4: Paard
  s(3, 3, p('p', 'w', 'up'));                          // d4: Pion ↑
  // Rij 5 (row=4)
  s(0, 4, p('p', 'w', 'up'));                          // a5: Pion ↑
  s(1, 4, p('p', 'w', 'up'));                          // b5: Pion ↑
  s(2, 4, p('p', 'w', 'up'));                          // c5: Pion ↑
  s(4, 4, p('p', 'w', 'up'));                          // e5: Pion ↑

  // === ROOD (linksboven, hoek a12) ===
  // Rij 12 (row=11)
  s(0, 11, p('k', 'r'));                               // a12: Koning
  s(3, 11, p('r', 'r'));                               // d12: Toren
  s(4, 11, p('p', 'r', 'right'));                      // e12: Pion →
  // Rij 11 (row=10)
  s(1, 10, p('q', 'r'));                               // b11: Dame
  s(3, 10, p('n', 'r'));                               // d11: Paard
  s(4, 10, p('p', 'r', 'right'));                      // e11: Pion →
  // Rij 10 (row=9)
  s(3, 9, p('n', 'r'));                                // d10: Paard
  s(4, 9, p('p', 'r', 'right'));                       // e10: Pion →
  // Rij 9 (row=8)
  s(0, 8, p('r', 'r'));                                // a9: Toren
  s(1, 8, p('b', 'r'));                                // b9: Loper
  s(2, 8, p('b', 'r'));                                // c9: Loper
  s(3, 8, p('p', 'r', 'down'));                        // d9: Pion ↓
  // Rij 8 (row=7)
  s(0, 7, p('p', 'r', 'down'));                        // a8: Pion ↓
  s(1, 7, p('p', 'r', 'down'));                        // b8: Pion ↓
  s(2, 7, p('p', 'r', 'down'));                        // c8: Pion ↓
  s(4, 7, p('p', 'r', 'down'));                        // e8: Pion ↓

  // === ZWART (rechtsboven, hoek l12) ===
  // Rij 12 (row=11)
  s(11, 11, p('k', 'b'));                              // l12: Koning
  s(8, 11, p('r', 'b'));                               // i12: Toren
  s(7, 11, p('p', 'b', 'left'));                       // h12: Pion ←
  // Rij 11 (row=10)
  s(10, 10, p('q', 'b'));                              // k11: Dame
  s(8, 10, p('b', 'b'));                               // i11: Loper
  s(7, 10, p('p', 'b', 'left'));                       // h11: Pion ←
  // Rij 10 (row=9)
  s(8, 9, p('b', 'b'));                                // i10: Loper
  s(7, 9, p('p', 'b', 'left'));                        // h10: Pion ←
  // Rij 9 (row=8)
  s(11, 8, p('r', 'b'));                               // l9: Toren
  s(10, 8, p('n', 'b'));                               // k9: Paard
  s(9, 8, p('n', 'b'));                                // j9: Paard
  s(8, 8, p('p', 'b', 'down'));                        // i9: Pion ↓
  // Rij 8 (row=7)
  s(7, 7, p('p', 'b', 'down'));                        // h8: Pion ↓
  s(9, 7, p('p', 'b', 'down'));                        // j8: Pion ↓
  s(10, 7, p('p', 'b', 'down'));                       // k8: Pion ↓
  s(11, 7, p('p', 'b', 'down'));                       // l8: Pion ↓

  // === GROEN (rechtsonder, hoek l1) ===
  // Rij 1 (row=0)
  s(11, 0, p('k', 'g'));                               // l1: Koning
  s(8, 0, p('r', 'g'));                                // i1: Toren
  s(7, 0, p('p', 'g', 'left'));                        // h1: Pion ←
  // Rij 2 (row=1)
  s(10, 1, p('q', 'g'));                               // k2: Dame
  s(8, 1, p('n', 'g'));                                // i2: Paard
  s(7, 1, p('p', 'g', 'left'));                        // h2: Pion ←
  // Rij 3 (row=2)
  s(8, 2, p('n', 'g'));                                // i3: Paard
  s(7, 2, p('p', 'g', 'left'));                        // h3: Pion ←
  // Rij 4 (row=3)
  s(11, 3, p('r', 'g'));                               // l4: Toren
  s(10, 3, p('b', 'g'));                               // k4: Loper
  s(9, 3, p('b', 'g'));                                // j4: Loper
  s(8, 3, p('p', 'g', 'up'));                          // i4: Pion ↑
  // Rij 5 (row=4)
  s(7, 4, p('p', 'g', 'up'));                          // h5: Pion ↑
  s(9, 4, p('p', 'g', 'up'));                          // j5: Pion ↑
  s(10, 4, p('p', 'g', 'up'));                         // k5: Pion ↑
  s(11, 4, p('p', 'g', 'up'));                         // l5: Pion ↑

  return b;
}

// === ZETGENERATIE ===

function isOnBoard(col: number, row: number): boolean {
  return col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE;
}

/** Is dit de startrij van een pion? */
function isPawnStart(piece: QuaterPiece, col: number, row: number): boolean {
  const { color, pawnDir } = piece;
  if (!pawnDir) return false;
  // Startrij is de rij waarop deze pion in de opstelling staat
  if (color === 'w') return (pawnDir === 'up' && row === 4) || (pawnDir === 'right' && col === 3);
  if (color === 'r') return (pawnDir === 'down' && row === 7) || (pawnDir === 'right' && col === 3);
  if (color === 'g') return (pawnDir === 'up' && row === 4) || (pawnDir === 'left' && col === 8);
  if (color === 'b') return (pawnDir === 'down' && row === 7) || (pawnDir === 'left' && col === 8);
  return false;
}

function generateMoves(
  board: (QuaterPiece | null)[][],
  col: number,
  row: number,
): { col: number; row: number }[] {
  const piece = board[row]?.[col];
  if (!piece) return [];
  const { type, color, pawnDir } = piece;
  const moves: { col: number; row: number }[] = [];

  const empty = (c: number, r: number) => isOnBoard(c, r) && !board[r][c];
  const enemy = (c: number, r: number) => isOnBoard(c, r) && board[r][c] !== null && board[r][c]!.color !== color;

  if (type === 'p' && pawnDir) {
    // Richting van de pion
    const dc = pawnDir === 'right' ? 1 : pawnDir === 'left' ? -1 : 0;
    const dr = pawnDir === 'up' ? 1 : pawnDir === 'down' ? -1 : 0;

    // Eén stap vooruit
    if (empty(col + dc, row + dr)) {
      moves.push({ col: col + dc, row: row + dr });
      // Twee stappen vanaf startrij
      if (isPawnStart(piece, col, row) && empty(col + dc * 2, row + dr * 2)) {
        moves.push({ col: col + dc * 2, row: row + dr * 2 });
      }
    }

    // Captures: diagonaal t.o.v. looprichting
    if (dc !== 0) {
      // Horizontale pion: captures op (col+dc, row±1)
      if (enemy(col + dc, row + 1)) moves.push({ col: col + dc, row: row + 1 });
      if (enemy(col + dc, row - 1)) moves.push({ col: col + dc, row: row - 1 });
    } else {
      // Verticale pion: captures op (col±1, row+dr)
      if (enemy(col + 1, row + dr)) moves.push({ col: col + 1, row: row + dr });
      if (enemy(col - 1, row + dr)) moves.push({ col: col - 1, row: row + dr });
    }
  } else if (type === 'n') {
    for (const [dc, dr] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nc = col + dc, nr = row + dr;
      if (isOnBoard(nc, nr) && (!board[nr][nc] || board[nr][nc]!.color !== color)) {
        moves.push({ col: nc, row: nr });
      }
    }
  } else if (type === 'k') {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nc = col + dc, nr = row + dr;
        if (isOnBoard(nc, nr) && (!board[nr][nc] || board[nr][nc]!.color !== color)) {
          moves.push({ col: nc, row: nr });
        }
      }
    }
  } else {
    // Sliding: r=recht, b=diagonaal, q=beide
    const dirs: [number, number][] = [];
    if (type === 'r' || type === 'q') dirs.push([0,1],[0,-1],[1,0],[-1,0]);
    if (type === 'b' || type === 'q') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
    for (const [dc, dr] of dirs) {
      for (let i = 1; i < BOARD_SIZE; i++) {
        const nc = col + dc * i, nr = row + dr * i;
        if (!isOnBoard(nc, nr)) break;
        if (!board[nr][nc]) {
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

function nextTurn(current: QuaterColor, active: QuaterColor[]): QuaterColor {
  const idx = TURN_ORDER.indexOf(current);
  for (let i = 1; i <= 4; i++) {
    const next = TURN_ORDER[(idx + i) % 4];
    if (active.includes(next)) return next;
  }
  return current;
}

const COL_LABELS = 'abcdefghijkl';

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

    // Zet uitvoeren
    if (selectedSquare && legalMoves.some((m) => m.col === col && m.row === row)) {
      const fc = selectedSquare.col, fr = selectedSquare.row;
      const newBoard = board.map((r) => [...r]);
      const captured = newBoard[row][col];
      const piece = { ...newBoard[fr][fc]! };
      newBoard[row][col] = piece;
      newBoard[fr][fc] = null;

      let event: QuaterEvent = { type: 'move', color: turn };
      let newActive = [...activePlayers];
      let newStatus = 'playing';
      let newWinner: QuaterColor | null = null;

      if (captured) {
        event = { type: 'capture', color: turn, captured };
        if (captured.type === 'k') {
          newActive = newActive.filter((c) => c !== captured.color);
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (newBoard[r][c]?.color === captured.color) newBoard[r][c] = null;
            }
          }
          event = { type: 'elimination', eliminated: captured.color };
          if (newActive.length === 1) {
            newStatus = 'finished';
            newWinner = newActive[0];
            event = { type: 'finished', winner: newWinner };
          }
        }
      }

      // Promotie: pion bereikt de overkant
      if (piece.type === 'p' && piece.pawnDir) {
        const promote = (
          (piece.pawnDir === 'up' && row === 11) ||
          (piece.pawnDir === 'down' && row === 0) ||
          (piece.pawnDir === 'right' && col === 11) ||
          (piece.pawnDir === 'left' && col === 0)
        );
        if (promote) {
          newBoard[row][col] = { type: 'q', color: turn };
          event = { type: 'promotion', color: turn, piece: 'q' };
        }
      }

      const newTurn = newStatus === 'finished' ? turn : nextTurn(turn, newActive);
      const moveStr = `${COL_LABELS[fc]}${fr + 1}→${COL_LABELS[col]}${row + 1}`;

      set({
        board: newBoard,
        turn: newTurn,
        activePlayers: newActive,
        status: newStatus,
        selectedSquare: null,
        legalMoves: [],
        lastMove: { fromCol: fc, fromRow: fr, toCol: col, toRow: row },
        lastEvent: event,
        winner: newWinner,
        moveHistory: [...get().moveHistory, moveStr],
      });
      return;
    }

    // Eigen stuk selecteren
    const piece = board[row]?.[col];
    if (piece && piece.color === turn) {
      const moves = generateMoves(board, col, row);
      set({ selectedSquare: { col, row }, legalMoves: moves });
      return;
    }

    set({ selectedSquare: null, legalMoves: [] });
  },

  undoMove: () => {},

  setPlayerNames: (names) => set({ playerNames: names }),
}));
