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

  newGame: () => void;
  selectSquare: (col: number, row: number) => void;
  undoMove: () => void;
  setPlayerNames: (names: Record<QuaterColor, string>) => void;
};

/**
 * Quaternity: 8x8 bord, 4 spelers in de hoeken.
 *
 * Wit (linksonder):  rij 0-2, kolom 0-3
 * Rood (linksboven): rij 5-7, kolom 0-3
 * Zwart (rechtsboven): rij 5-7, kolom 4-7
 * Groen (rechtsonder): rij 0-2, kolom 4-7
 *
 * Opstelling per speler (driehoekig, stukken naar het midden gericht):
 *
 * Wit (linksonder):
 *   rij 0: R  N  B  Q    (achterste rij)
 *   rij 1: .  N  B  K
 *   rij 2: P  P  P  P    (pionnen, gaan omhoog)
 *
 * Groen (rechtsonder):
 *   rij 0: Q  B  N  R
 *   rij 1: K  B  N  .
 *   rij 2: P  P  P  P    (pionnen, gaan omhoog)
 *
 * Rood (linksboven):
 *   rij 5: P  P  P  P    (pionnen, gaan omlaag)
 *   rij 6: K  B  N  .
 *   rij 7: R  N  B  Q
 *
 * Zwart (rechtsboven):
 *   rij 5: P  P  P  P    (pionnen, gaan omlaag)
 *   rij 6: .  N  B  K
 *   rij 7: Q  B  N  R
 */
function createInitialBoard(): (QuaterPiece | null)[][] {
  const b: (QuaterPiece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );

  const set = (row: number, col: number, type: PieceSymbol, color: QuaterColor) => {
    b[row][col] = { type, color };
  };

  // Wit (linksonder)
  set(0, 0, 'r', 'w'); set(0, 1, 'n', 'w'); set(0, 2, 'b', 'w'); set(0, 3, 'q', 'w');
  set(1, 1, 'n', 'w'); set(1, 2, 'b', 'w'); set(1, 3, 'k', 'w');
  set(2, 0, 'p', 'w'); set(2, 1, 'p', 'w'); set(2, 2, 'p', 'w'); set(2, 3, 'p', 'w');

  // Groen (rechtsonder)
  set(0, 4, 'q', 'g'); set(0, 5, 'b', 'g'); set(0, 6, 'n', 'g'); set(0, 7, 'r', 'g');
  set(1, 4, 'k', 'g'); set(1, 5, 'b', 'g'); set(1, 6, 'n', 'g');
  set(2, 4, 'p', 'g'); set(2, 5, 'p', 'g'); set(2, 6, 'p', 'g'); set(2, 7, 'p', 'g');

  // Rood (linksboven)
  set(5, 0, 'p', 'r'); set(5, 1, 'p', 'r'); set(5, 2, 'p', 'r'); set(5, 3, 'p', 'r');
  set(6, 0, 'k', 'r'); set(6, 1, 'b', 'r'); set(6, 2, 'n', 'r');
  set(7, 0, 'r', 'r'); set(7, 1, 'n', 'r'); set(7, 2, 'b', 'r'); set(7, 3, 'q', 'r');

  // Zwart (rechtsboven)
  set(5, 4, 'p', 'b'); set(5, 5, 'p', 'b'); set(5, 6, 'p', 'b'); set(5, 7, 'p', 'b');
  set(6, 5, 'n', 'b'); set(6, 6, 'b', 'b'); set(6, 7, 'k', 'b');
  set(7, 4, 'q', 'b'); set(7, 5, 'b', 'b'); set(7, 6, 'n', 'b'); set(7, 7, 'r', 'b');

  return b;
}

// Pionrichting: wit en groen gaan omhoog (+row), rood en zwart gaan omlaag (-row)
function pawnDir(color: QuaterColor): number {
  return (color === 'w' || color === 'g') ? 1 : -1;
}

function pawnStartRow(color: QuaterColor): number {
  return (color === 'w' || color === 'g') ? 2 : 5;
}

function isOnBoard(col: number, row: number): boolean {
  return col >= 0 && col < 8 && row >= 0 && row < 8;
}

function generateMoves(
  board: (QuaterPiece | null)[][],
  col: number,
  row: number,
): { col: number; row: number }[] {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;
  const moves: { col: number; row: number }[] = [];

  const empty = (c: number, r: number) => isOnBoard(c, r) && !board[r][c];
  const enemy = (c: number, r: number) => isOnBoard(c, r) && board[r][c] !== null && board[r][c]!.color !== color;
  const moveOrCapture = (c: number, r: number) => {
    if (empty(c, r) || enemy(c, r)) moves.push({ col: c, row: r });
  };

  if (type === 'p') {
    const dir = pawnDir(color);
    const startRow = pawnStartRow(color);
    // Eén stap
    if (empty(col, row + dir)) {
      moves.push({ col, row: row + dir });
      // Twee stappen vanaf startrij
      if (row === startRow && empty(col, row + dir * 2)) {
        moves.push({ col, row: row + dir * 2 });
      }
    }
    // Captures diagonaal
    if (enemy(col - 1, row + dir)) moves.push({ col: col - 1, row: row + dir });
    if (enemy(col + 1, row + dir)) moves.push({ col: col + 1, row: row + dir });
  } else if (type === 'n') {
    for (const [dc, dr] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      moveOrCapture(col + dc, row + dr);
    }
  } else if (type === 'k') {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        moveOrCapture(col + dc, row + dr);
      }
    }
  } else {
    // Sliding: r=straight, b=diagonal, q=both
    const dirs: [number, number][] = [];
    if (type === 'r' || type === 'q') dirs.push([0,1],[0,-1],[1,0],[-1,0]);
    if (type === 'b' || type === 'q') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
    for (const [dc, dr] of dirs) {
      for (let i = 1; i < 8; i++) {
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

    // Zet uitvoeren als legaal doel is aangeklikt
    if (selectedSquare && legalMoves.some((m) => m.col === col && m.row === row)) {
      const fc = selectedSquare.col, fr = selectedSquare.row;
      const newBoard = board.map((r) => [...r]);
      const captured = newBoard[row][col];
      const piece = newBoard[fr][fc]!;
      newBoard[row][col] = piece;
      newBoard[fr][fc] = null;

      let event: QuaterEvent = { type: 'move', color: turn };
      let newActive = [...activePlayers];
      let newStatus = 'playing';
      let newWinner: QuaterColor | null = null;

      if (captured) {
        event = { type: 'capture', color: turn, captured };
        // Koning geslagen = speler uitgeschakeld
        if (captured.type === 'k') {
          newActive = newActive.filter((c) => c !== captured.color);
          // Alle stukken van uitgeschakelde speler verwijderen
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
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

      // Promotie (auto naar dame)
      if (piece.type === 'p') {
        const dir = pawnDir(turn);
        const promoRow = dir === 1 ? 7 : 0;
        if (row === promoRow) {
          newBoard[row][col] = { type: 'q', color: turn };
          event = { type: 'promotion', color: turn, piece: 'q' };
        }
      }

      const newTurn = newStatus === 'finished' ? turn : nextTurn(turn, newActive);
      const files = 'abcdefgh';
      const moveStr = `${files[fc]}${fr + 1}→${files[col]}${row + 1}`;

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
