import { create } from 'zustand';
import type { PieceSymbol } from '@/lib/chess/types';

export type QuaterColor = 'w' | 'r' | 'b' | 'g';
export type PawnDir = 'up' | 'down' | 'left' | 'right';

export type QuaterPiece = {
  type: PieceSymbol;
  color: QuaterColor;
  owner: QuaterColor;          // originele eigenaar (voor kleur), kan veranderen bij assimilatie
  pawnDir?: PawnDir;           // alleen voor pionnen
  isAdvancedCentral?: boolean; // Advanced Central Pawn: mag links/rechts kiezen
};

export type QuaterEvent =
  | { type: 'move'; color: QuaterColor }
  | { type: 'capture'; color: QuaterColor; captured: QuaterPiece }
  | { type: 'checkmate'; checkmated: QuaterColor; by: QuaterColor }
  | { type: 'promotion'; color: QuaterColor; piece: PieceSymbol }
  | { type: 'pass'; color: QuaterColor }
  | { type: 'finished'; winner: QuaterColor };

type PlayerStatus = 'active' | 'frozen' | 'defeated';

export type QuaterMoveLogEntry = {
  moveNumber: number;
  color: QuaterColor;
  notation: string;
  isCapture: boolean;
  capturedPieceType?: string;
  capturedColor?: QuaterColor;
  isCheckmate?: boolean;
  checkmatedColor?: QuaterColor;
  isPass?: boolean;
  isPromotion?: boolean;
  special?: string;
};

type QuaternityState = {
  board: (QuaterPiece | null)[][];  // 12×12, [row][col]
  turn: QuaterColor;
  activePlayers: QuaterColor[];
  playerStatus: Record<QuaterColor, PlayerStatus>;
  status: string;
  selectedSquare: { col: number; row: number } | null;
  legalMoves: { col: number; row: number }[];
  lastMove: { fromCol: number; fromRow: number; toCol: number; toRow: number } | null;
  lastEvent: QuaterEvent | null;
  winner: QuaterColor | null;
  playerNames: Record<QuaterColor, string>;
  moveHistory: string[];
  moveLog: QuaterMoveLogEntry[];
  pendingPromotion: { col: number; row: number } | null;
  aiPlayers: Set<QuaterColor>;
  aiThinking: boolean;

  isOnlineMode: boolean;
  onlineHostId: string | null;

  newGame: () => void;
  selectSquare: (col: number, row: number) => void;
  applyRemoteMove: (fromCol: number, fromRow: number, toCol: number, toRow: number, promoteTo?: PieceSymbol) => void;
  promote: (piece: PieceSymbol) => void;
  pass: () => void;
  resign: (color: QuaterColor) => void;
  undoMove: () => void;
  setPlayerNames: (names: Record<QuaterColor, string>) => void;
  setAiPlayers: (ai: QuaterColor[]) => void;
  setOnlineMode: (isOnline: boolean, hostId?: string) => void;
};

const BOARD_SIZE = 12;

// === EXACTE QUATERNITY OPSTELLING ===
// Kolommen: A=0..L=11, Rijen: 1=0..12=11
// Bron: quaternity.com, geverifieerd door Rutger

function p(type: PieceSymbol, color: QuaterColor, pawnDir?: PawnDir, isAdvancedCentral?: boolean): QuaterPiece {
  const piece: QuaterPiece = { type, color, owner: color };
  if (pawnDir) piece.pawnDir = pawnDir;
  if (isAdvancedCentral) piece.isAdvancedCentral = true;
  return piece;
}

function createInitialBoard(): (QuaterPiece | null)[][] {
  const b: (QuaterPiece | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
  const s = (col: number, row: number, piece: QuaterPiece) => { b[row][col] = piece; };

  // === WIT (linksonder, hoek a1) ===
  s(0, 0, p('k', 'w'));                                    // a1: Koning
  s(3, 0, p('r', 'w'));                                    // d1: Toren
  s(4, 0, p('p', 'w', 'right'));                           // e1: Pion →
  s(1, 1, p('q', 'w'));                                    // b2: Dame
  s(2, 1, p('b', 'w'));                                    // c2: Loper
  s(3, 1, p('p', 'w', 'right'));                           // d2: Pion →
  s(2, 2, p('b', 'w'));                                    // c3: Loper
  s(3, 2, p('p', 'w', 'right'));                           // d3: Pion →
  s(0, 3, p('r', 'w'));                                    // a4: Toren
  s(1, 3, p('n', 'w'));                                    // b4: Paard
  s(2, 3, p('n', 'w'));                                    // c4: Paard
  // d4 = Advanced Central Pawn (keuze up of right)
  s(3, 3, p('p', 'w', 'up', true));                        // d4: ACP ↑/→
  s(0, 4, p('p', 'w', 'up'));                              // a5: Pion ↑
  s(1, 4, p('p', 'w', 'up'));                              // b5: Pion ↑
  s(2, 4, p('p', 'w', 'up'));                              // c5: Pion ↑
  // e5 = Advanced Central Pawn (keuze up of right)
  s(4, 4, p('p', 'w', 'up', true));                        // e5: ACP ↑/→

  // === ROOD (linksboven, hoek a12) ===
  s(0, 11, p('k', 'r'));                                   // a12: Koning
  s(3, 11, p('r', 'r'));                                   // d12: Toren
  s(4, 11, p('p', 'r', 'right'));                          // e12: Pion →
  s(1, 10, p('q', 'r'));                                   // b11: Dame
  s(3, 10, p('n', 'r'));                                   // d11: Paard
  s(4, 10, p('p', 'r', 'right'));                          // e11: Pion →
  s(3, 9, p('n', 'r'));                                    // d10: Paard
  s(4, 9, p('p', 'r', 'right'));                           // e10: Pion →
  s(0, 8, p('r', 'r'));                                    // a9: Toren
  s(1, 8, p('b', 'r'));                                    // b9: Loper
  s(2, 8, p('b', 'r'));                                    // c9: Loper
  // d9 = Advanced Central Pawn (keuze down of right)
  s(3, 8, p('p', 'r', 'down', true));                     // d9: ACP ↓/→
  s(0, 7, p('p', 'r', 'down'));                            // a8: Pion ↓
  s(1, 7, p('p', 'r', 'down'));                            // b8: Pion ↓
  s(2, 7, p('p', 'r', 'down'));                            // c8: Pion ↓
  // e8 = Advanced Central Pawn (keuze down of right)
  s(4, 7, p('p', 'r', 'down', true));                     // e8: ACP ↓/→

  // === ZWART (rechtsboven, hoek l12) ===
  s(11, 11, p('k', 'b'));                                  // l12: Koning
  s(8, 11, p('r', 'b'));                                   // i12: Toren
  s(7, 11, p('p', 'b', 'left'));                           // h12: Pion ←
  s(10, 10, p('q', 'b'));                                  // k11: Dame
  s(8, 10, p('b', 'b'));                                   // i11: Loper
  s(7, 10, p('p', 'b', 'left'));                           // h11: Pion ←
  s(8, 9, p('b', 'b'));                                    // i10: Loper
  s(7, 9, p('p', 'b', 'left'));                            // h10: Pion ←
  s(11, 8, p('r', 'b'));                                   // l9: Toren
  s(10, 8, p('n', 'b'));                                   // k9: Paard
  s(9, 8, p('n', 'b'));                                    // j9: Paard
  // i9 = Advanced Central Pawn (keuze down of left)
  s(8, 8, p('p', 'b', 'down', true));                     // i9: ACP ↓/←
  s(7, 7, p('p', 'b', 'down'));                            // h8: Pion ↓
  s(9, 7, p('p', 'b', 'down'));                            // j8: Pion ↓
  s(10, 7, p('p', 'b', 'down'));                           // k8: Pion ↓
  // h8 already set above; l8 = Pion ↓
  s(11, 7, p('p', 'b', 'down'));                           // l8: Pion ↓

  // === GROEN (rechtsonder, hoek l1) ===
  s(11, 0, p('k', 'g'));                                   // l1: Koning
  s(8, 0, p('r', 'g'));                                    // i1: Toren
  s(7, 0, p('p', 'g', 'left'));                            // h1: Pion ←
  s(10, 1, p('q', 'g'));                                   // k2: Dame
  s(8, 1, p('n', 'g'));                                    // i2: Paard
  s(7, 1, p('p', 'g', 'left'));                            // h2: Pion ←
  s(8, 2, p('n', 'g'));                                    // i3: Paard
  s(7, 2, p('p', 'g', 'left'));                            // h3: Pion ←
  s(11, 3, p('r', 'g'));                                   // l4: Toren
  s(10, 3, p('b', 'g'));                                   // k4: Loper
  s(9, 3, p('b', 'g'));                                    // j4: Loper
  // i4 = Advanced Central Pawn (keuze up of left)
  s(8, 3, p('p', 'g', 'up', true));                        // i4: ACP ↑/←
  // h5 = Advanced Central Pawn (keuze up of left)
  s(7, 4, p('p', 'g', 'up', true));                        // h5: ACP ↑/←
  s(9, 4, p('p', 'g', 'up'));                              // j5: Pion ↑
  s(10, 4, p('p', 'g', 'up'));                             // k5: Pion ↑
  s(11, 4, p('p', 'g', 'up'));                             // l5: Pion ↑

  return b;
}

// === ZETGENERATIE ===

function isOnBoard(col: number, row: number): boolean {
  return col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE;
}

/**
 * Geeft de twee mogelijke richtingen van een Advanced Central Pawn.
 * Elke ACP staat op het kruispunt van de verticale en horizontale pion-muur.
 */
function getACPDirections(color: QuaterColor): [PawnDir, PawnDir] {
  if (color === 'w') return ['up', 'right'];
  if (color === 'r') return ['down', 'right'];
  if (color === 'b') return ['down', 'left'];
  return ['up', 'left']; // groen
}

/**
 * Is het veld op de hoofddiagonaal van de ACP?
 * "If an Advanced Central Pawn captures on the main diagonal, it keeps the power to choose."
 * De hoofddiagonaal is de diagonaal vanuit de hoek van de speler.
 */
function isOnMainDiagonal(col: number, row: number, color: QuaterColor): boolean {
  if (color === 'w') return col === row;                    // a1→l12 diagonaal
  if (color === 'r') return col === (11 - row);             // a12→l1 diagonaal
  if (color === 'b') return (11 - col) === (11 - row);     // l12→a1 diagonaal = col === row
  if (color === 'g') return (11 - col) === row;             // l1→a12 diagonaal
  return false;
}

function dirToDelta(dir: PawnDir): [number, number] {
  if (dir === 'up') return [0, 1];
  if (dir === 'down') return [0, -1];
  if (dir === 'right') return [1, 0];
  return [-1, 0]; // left
}

function generatePawnMoves(
  board: (QuaterPiece | null)[][],
  piece: QuaterPiece,
  col: number,
  row: number,
): { col: number; row: number }[] {
  const { color, pawnDir, isAdvancedCentral } = piece;
  if (!pawnDir) return [];
  const moves: { col: number; row: number }[] = [];

  const empty = (c: number, r: number) => isOnBoard(c, r) && !board[r][c];
  const enemy = (c: number, r: number) =>
    isOnBoard(c, r) && board[r][c] !== null && board[r][c]!.owner !== color;

  if (isAdvancedCentral) {
    // Advanced Central Pawn: kan in beide richtingen bewegen
    const [dir1, dir2] = getACPDirections(color);
    for (const dir of [dir1, dir2]) {
      const [dc, dr] = dirToDelta(dir);

      // Eén stap vooruit (NOOIT twee stappen in Quaternity)
      if (empty(col + dc, row + dr)) {
        moves.push({ col: col + dc, row: row + dr });
      }

      // Captures diagonaal t.o.v. looprichting
      if (dc !== 0) {
        // Horizontale richting: captures op (col+dc, row±1)
        if (enemy(col + dc, row + 1)) moves.push({ col: col + dc, row: row + 1 });
        if (enemy(col + dc, row - 1)) moves.push({ col: col + dc, row: row - 1 });
      } else {
        // Verticale richting: captures op (col±1, row+dr)
        if (enemy(col + 1, row + dr)) moves.push({ col: col + 1, row: row + dr });
        if (enemy(col - 1, row + dr)) moves.push({ col: col - 1, row: row + dr });
      }
    }
  } else {
    // Normale pion: vaste richting
    const [dc, dr] = dirToDelta(pawnDir);

    // Eén stap vooruit (NOOIT twee stappen in Quaternity)
    if (empty(col + dc, row + dr)) {
      moves.push({ col: col + dc, row: row + dr });
    }

    // Captures diagonaal t.o.v. looprichting
    if (dc !== 0) {
      if (enemy(col + dc, row + 1)) moves.push({ col: col + dc, row: row + 1 });
      if (enemy(col + dc, row - 1)) moves.push({ col: col + dc, row: row - 1 });
    } else {
      if (enemy(col + 1, row + dr)) moves.push({ col: col + 1, row: row + dr });
      if (enemy(col - 1, row + dr)) moves.push({ col: col - 1, row: row + dr });
    }
  }

  // Dedup (ACP kan dubbele captures genereren op dezelfde diagonaal)
  const seen = new Set<string>();
  return moves.filter(m => {
    const key = `${m.col},${m.row}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateMoves(
  board: (QuaterPiece | null)[][],
  col: number,
  row: number,
  controlledColors: QuaterColor[],
): { col: number; row: number }[] {
  const piece = board[row]?.[col];
  if (!piece) return [];

  // Speler mag alleen stukken bewegen die hij controleert
  if (!controlledColors.includes(piece.owner)) return [];

  const { type, color } = piece;

  // Niet-pion bewegen als eigen kleur: geen friendly fire op eigen of gecontroleerde stukken
  const isFriendly = (c: number, r: number) =>
    isOnBoard(c, r) && board[r][c] !== null && controlledColors.includes(board[r][c]!.owner);

  if (type === 'p') {
    return generatePawnMoves(board, piece, col, row);
  }

  const moves: { col: number; row: number }[] = [];

  if (type === 'n') {
    for (const [dc, dr] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nc = col + dc, nr = row + dr;
      if (isOnBoard(nc, nr) && !isFriendly(nc, nr)) {
        moves.push({ col: nc, row: nr });
      }
    }
  } else if (type === 'k') {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nc = col + dc, nr = row + dr;
        if (isOnBoard(nc, nr) && !isFriendly(nc, nr)) {
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
          if (!isFriendly(nc, nr)) moves.push({ col: nc, row: nr });
          break;
        }
      }
    }
  }
  return moves;
}

// === SCHAAK/MAT DETECTIE ===

/** Vindt de positie van de koning van een kleur */
function findKing(board: (QuaterPiece | null)[][], color: QuaterColor): { col: number; row: number } | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return { col: c, row: r };
      }
    }
  }
  return null;
}

/** Is het veld aangevallen door een vijandelijke speler? */
function isSquareAttacked(
  board: (QuaterPiece | null)[][],
  col: number,
  row: number,
  byColors: QuaterColor[], // welke kleuren vallen aan?
): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || !byColors.includes(piece.owner)) continue;
      // Genereer alle zetten van dit stuk (zonder friendly-fire check, gewoon alle aanvallen)
      const attacks = generateMoves(board, c, r, [piece.owner]);
      if (attacks.some(m => m.col === col && m.row === row)) return true;
    }
  }
  return false;
}

/** Is de koning van `color` schaak? */
function isInCheck(board: (QuaterPiece | null)[][], color: QuaterColor, allPlayers: QuaterColor[]): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  const enemies = allPlayers.filter(c => c !== color);
  return isSquareAttacked(board, king.col, king.row, enemies);
}

/**
 * Kan speler `color` het schaak ontwijken met eigen stukken?
 * "Checkmate is completed at the moment a Player cannot defend the King with their own pieces."
 */
function isCheckmated(
  board: (QuaterPiece | null)[][],
  color: QuaterColor,
  controlledColors: QuaterColor[],
  allPlayers: QuaterColor[],
): boolean {
  if (!isInCheck(board, color, allPlayers)) return false;

  // Probeer elke zet van de speler's stukken
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || !controlledColors.includes(piece.owner)) continue;
      const moves = generateMoves(board, c, r, controlledColors);
      for (const move of moves) {
        // Simuleer de zet
        const testBoard = board.map(row => [...row]);
        testBoard[move.row][move.col] = testBoard[r][c];
        testBoard[r][c] = null;
        // Is de koning nog steeds schaak na deze zet?
        if (!isInCheck(testBoard, color, allPlayers)) {
          return false; // Er is een ontsnapping
        }
      }
    }
  }
  return true; // Geen ontsnapping mogelijk
}

/** Heeft een speler legale zetten? */
function hasLegalMoves(
  board: (QuaterPiece | null)[][],
  controlledColors: QuaterColor[],
): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || !controlledColors.includes(piece.owner)) continue;
      const moves = generateMoves(board, c, r, controlledColors);
      if (moves.length > 0) return true;
    }
  }
  return false;
}

// === BEURTLOGICA ===

const TURN_ORDER: QuaterColor[] = ['w', 'r', 'b', 'g'];

function nextTurn(current: QuaterColor, activePlayers: QuaterColor[]): QuaterColor {
  const idx = TURN_ORDER.indexOf(current);
  for (let i = 1; i <= 4; i++) {
    const next = TURN_ORDER[(idx + i) % 4];
    if (activePlayers.includes(next)) return next;
  }
  return current;
}

/**
 * Welke kleuren controleert een speler?
 * Bij assimilatie bezit je de stukken van verslagen spelers.
 */
function getControlledColors(
  board: (QuaterPiece | null)[][],
  player: QuaterColor,
  activePlayers: QuaterColor[],
  defeatedBy: Record<QuaterColor, QuaterColor | null>,
): QuaterColor[] {
  const controlled = [player];
  // Recursief: als ik speler X versloeg, controleer ik X's stukken
  // En als X eerder Y versloeg, controleer ik ook Y's stukken
  const addDefeated = (owner: QuaterColor) => {
    for (const [defeated, by] of Object.entries(defeatedBy)) {
      if (by === owner && !controlled.includes(defeated as QuaterColor)) {
        controlled.push(defeated as QuaterColor);
        addDefeated(defeated as QuaterColor);
      }
    }
  };
  addDefeated(player);
  return controlled;
}

const COL_LABELS = 'abcdefghijkl';

const PIECE_LABEL: Record<string, string> = { k: 'K', q: 'D', r: 'T', b: 'L', n: 'P', p: '' };

function buildMoveLogEntry(
  moveNumber: number,
  color: QuaterColor,
  notation: string,
  piece: QuaterPiece,
  captured: QuaterPiece | null,
  event: QuaterEvent,
): QuaterMoveLogEntry {
  const entry: QuaterMoveLogEntry = {
    moveNumber,
    color,
    notation: PIECE_LABEL[piece.type] + notation,
    isCapture: !!captured,
  };
  if (captured) {
    entry.capturedPieceType = captured.type;
    entry.capturedColor = captured.color;
  }
  if (event.type === 'checkmate') {
    entry.isCheckmate = true;
    entry.checkmatedColor = event.checkmated;
  }
  return entry;
}

/**
 * Bepaal de richting van een ACP na een zet.
 * Als de ACP op de hoofddiagonaal sloeg, blijft hij uncommitted.
 */
function resolveACPDirection(
  piece: QuaterPiece,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
  captured: QuaterPiece | null,
): QuaterPiece {
  if (!piece.isAdvancedCentral) return piece;

  const dcMove = toCol - fromCol;
  const drMove = toRow - fromRow;

  // Bepaal welke richting deze zet impliceert
  let chosenDir: PawnDir | null = null;
  if (dcMove !== 0 && drMove === 0) {
    // Horizontale beweging
    chosenDir = dcMove > 0 ? 'right' : 'left';
  } else if (drMove !== 0 && dcMove === 0) {
    // Verticale beweging
    chosenDir = drMove > 0 ? 'up' : 'down';
  } else if (captured) {
    // Diagonale capture: bepaal richting op basis van de component
    // Maar check eerst of het op de hoofddiagonaal is
    if (isOnMainDiagonal(toCol, toRow, piece.color)) {
      // "captures on the main diagonal: keeps the power to choose"
      return { ...piece, pawnDir: piece.pawnDir }; // blijft ACP
    }
    // Niet op hoofddiagonaal: commit op basis van de overheersende bewegingsrichting
    if (Math.abs(dcMove) > Math.abs(drMove)) {
      chosenDir = dcMove > 0 ? 'right' : 'left';
    } else {
      chosenDir = drMove > 0 ? 'up' : 'down';
    }
  }

  if (chosenDir) {
    // Committed! Niet langer ACP
    return { ...piece, pawnDir: chosenDir, isAdvancedCentral: false };
  }
  return piece;
}

// === AI ENGINE ===

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 100,
};

/**
 * Eenvoudige heuristische AI voor Quaternity.
 * Evalueert alle mogelijke zetten en kiest de beste op basis van:
 * - Stukwaarde van captures
 * - Centrumcontrole
 * - Vermijd eigen stukken te verliezen
 */
function pickAiMove(
  board: (QuaterPiece | null)[][],
  player: QuaterColor,
  controlled: QuaterColor[],
  activePlayers: QuaterColor[],
): { fromCol: number; fromRow: number; toCol: number; toRow: number } | null {
  const allMoves: { fc: number; fr: number; tc: number; tr: number; score: number }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || !controlled.includes(piece.owner)) continue;
      const moves = generateMoves(board, c, r, controlled);
      for (const m of moves) {
        let score = 0;
        const target = board[m.row]?.[m.col];

        // Capture waarde
        if (target) {
          score += PIECE_VALUES[target.type] * 10;
          // Koning slaan = hoogste prioriteit
          if (target.type === 'k') score += 500;
        }

        // Centrum bonus (velden 4-7 zijn het centrum)
        const centerDist = Math.abs(m.col - 5.5) + Math.abs(m.row - 5.5);
        score += Math.max(0, 6 - centerDist) * 0.3;

        // Vermijd koning te bewegen tenzij nodig
        if (piece.type === 'k') score -= 2;

        // Voorwaartse beweging is goed voor pionnen
        if (piece.type === 'p') score += 0.5;

        // Beetje willekeur zodat het niet te voorspelbaar is
        score += Math.random() * 2;

        allMoves.push({ fc: c, fr: r, tc: m.col, tr: m.row, score });
      }
    }
  }

  if (allMoves.length === 0) return null;

  // Sorteer op score, pak de beste
  allMoves.sort((a, b) => b.score - a.score);
  return { fromCol: allMoves[0].fc, fromRow: allMoves[0].fr, toCol: allMoves[0].tc, toRow: allMoves[0].tr };
}

export const useQuaternityStore = create<QuaternityState>((set, get) => ({
  board: createInitialBoard(),
  turn: 'w',
  activePlayers: ['w', 'r', 'b', 'g'],
  playerStatus: { w: 'active', r: 'active', b: 'active', g: 'active' },
  status: 'playing',
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  lastEvent: null,
  winner: null,
  playerNames: { w: 'Wit', r: 'Rood', b: 'Zwart', g: 'Groen' },
  moveHistory: [],
  moveLog: [],
  pendingPromotion: null,
  aiPlayers: new Set<QuaterColor>(),
  aiThinking: false,
  isOnlineMode: false,
  onlineHostId: null,

  newGame: () => {
    const { aiPlayers } = get();
    set({
      board: createInitialBoard(),
      turn: 'w',
      activePlayers: ['w', 'r', 'b', 'g'],
      playerStatus: { w: 'active', r: 'active', b: 'active', g: 'active' },
      status: 'playing',
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      lastEvent: null,
      winner: null,
      moveHistory: [],
      moveLog: [],
      pendingPromotion: null,
      aiThinking: false,
    });
    // Trigger AI als eerste speler een computer is
    setTimeout(() => triggerAiIfNeeded(), 300);
  },

  selectSquare: (col: number, row: number) => {
    const { board, turn, selectedSquare, legalMoves, activePlayers, status, playerStatus, isOnlineMode } = get();
    if (status === 'finished') return;
    if (playerStatus[turn] !== 'active') return;

    // Online mode: only allow moves on your own turn (but let AI through on host)
    if (isOnlineMode) {
      const { aiPlayers } = get();
      if (!aiPlayers.has(turn)) {
        const { useOnlineStore } = require('@/stores/onlineStore');
        const myColor = useOnlineStore.getState().myColor;
        if (turn !== myColor) return;
      }
    }

    // Bepaal welke kleuren de huidige speler controleert
    // (vereenvoudigd: voor nu alleen eigen kleur, assimilatie hieronder)
    const defeatedBy: Record<QuaterColor, QuaterColor | null> = { w: null, r: null, b: null, g: null };
    // Kijk welke spelers verslagen zijn en door wie (op basis van owner-velden op het bord)
    for (const color of TURN_ORDER) {
      if (playerStatus[color] === 'defeated') {
        // Zoek wie de stukken controleert
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece && piece.color === color && piece.owner !== color) {
              defeatedBy[color] = piece.owner;
              break;
            }
          }
          if (defeatedBy[color]) break;
        }
      }
    }
    const controlled = getControlledColors(board, turn, activePlayers, defeatedBy);

    // Zet uitvoeren als legaal doel is aangeklikt
    if (selectedSquare && legalMoves.some((m) => m.col === col && m.row === row)) {
      const fc = selectedSquare.col, fr = selectedSquare.row;
      const newBoard = board.map((r) => [...r]);
      const captured = newBoard[row][col];
      let piece = { ...newBoard[fr][fc]! };

      // ACP richting committeren
      if (piece.isAdvancedCentral) {
        piece = resolveACPDirection(piece, fc, fr, col, row, captured);
      }

      newBoard[row][col] = piece;
      newBoard[fr][fc] = null;

      let event: QuaterEvent = { type: 'move', color: turn };
      let newActive = [...activePlayers];
      let newPlayerStatus = { ...playerStatus };
      let newStatus = 'playing';
      let newWinner: QuaterColor | null = null;

      if (captured) {
        event = { type: 'capture', color: turn, captured };

        if (captured.type === 'k') {
          // SCHAAKMAT: stukken gaan naar de overwinnaar
          // "the defeated King is removed and their remaining Pieces and pawns
          //  now belong to the Player that completed the Checkmate position"
          const checkmatedColor = captured.color;
          newActive = newActive.filter((c) => c !== checkmatedColor);
          newPlayerStatus[checkmatedColor] = 'defeated';

          // Alle stukken van verslagen speler overdragen aan overwinnaar
          // Pionnen behouden hun originele richting
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (newBoard[r][c]?.color === checkmatedColor) {
                newBoard[r][c] = {
                  ...newBoard[r][c]!,
                  owner: turn, // nieuwe eigenaar
                  // color en pawnDir blijven intact (originele kleur/richting)
                };
              }
            }
          }

          event = { type: 'checkmate', checkmated: checkmatedColor, by: turn };

          if (newActive.length === 1) {
            newStatus = 'finished';
            newWinner = newActive[0];
            event = { type: 'finished', winner: newWinner };
          }
        }
      }

      // Promotie check: pion bereikt de overkant
      if (piece.type === 'p' && piece.pawnDir) {
        const promote = (
          (piece.pawnDir === 'up' && row === 11) ||
          (piece.pawnDir === 'down' && row === 0) ||
          (piece.pawnDir === 'right' && col === 11) ||
          (piece.pawnDir === 'left' && col === 0)
        );
        if (promote) {
          // Speler kiest promotiestuk
          const moveStr = `${COL_LABELS[fc]}${fr + 1}→${COL_LABELS[col]}${row + 1}`;
          const logEntry = buildMoveLogEntry(get().moveLog.length + 1, turn, moveStr, piece, captured, event);
          logEntry.isPromotion = true;
          set({
            board: newBoard,
            activePlayers: newActive,
            playerStatus: newPlayerStatus,
            status: newStatus,
            selectedSquare: null,
            legalMoves: [],
            lastMove: { fromCol: fc, fromRow: fr, toCol: col, toRow: row },
            lastEvent: event,
            winner: newWinner,
            moveHistory: [...get().moveHistory, moveStr],
            moveLog: [...get().moveLog, logEntry],
            pendingPromotion: { col, row },
          });
          return;
        }
      }

      const newTurn = newStatus === 'finished' ? turn : nextTurn(turn, newActive);
      const moveStr = `${COL_LABELS[fc]}${fr + 1}→${COL_LABELS[col]}${row + 1}`;
      const logEntries = [...get().moveLog, buildMoveLogEntry(get().moveLog.length + 1, turn, moveStr, piece, captured, event)];
      if (newStatus === 'finished' && newWinner) {
        logEntries.push({ moveNumber: logEntries.length + 1, color: newWinner, notation: '', isCapture: false, special: `${get().playerNames[newWinner]} wint!` });
      }

      set({
        board: newBoard,
        turn: newTurn,
        activePlayers: newActive,
        playerStatus: newPlayerStatus,
        status: newStatus,
        selectedSquare: null,
        legalMoves: [],
        lastMove: { fromCol: fc, fromRow: fr, toCol: col, toRow: row },
        lastEvent: event,
        winner: newWinner,
        moveHistory: [...get().moveHistory, moveStr],
        moveLog: logEntries,
      });

      // Trigger AI voor volgende speler als die computer is
      if (newStatus !== 'finished') {
        setTimeout(() => triggerAiIfNeeded(), 400);
      }
      return;
    }

    // Eigen stuk selecteren (of gecontroleerd stuk)
    const piece = board[row]?.[col];
    if (piece && controlled.includes(piece.owner)) {
      const moves = generateMoves(board, col, row, controlled);
      set({ selectedSquare: { col, row }, legalMoves: moves });
      return;
    }

    set({ selectedSquare: null, legalMoves: [] });
  },

  promote: (promoteTo: PieceSymbol) => {
    const { pendingPromotion, board, turn, activePlayers, playerStatus } = get();
    if (!pendingPromotion) return;

    const { col, row } = pendingPromotion;
    const newBoard = board.map((r) => [...r]);
    const piece = newBoard[row][col];
    if (!piece) return;

    // Promoveer: behoud kleur en owner
    newBoard[row][col] = { type: promoteTo, color: piece.color, owner: piece.owner };
    const newTurn = nextTurn(turn, activePlayers);

    set({
      board: newBoard,
      turn: newTurn,
      lastEvent: { type: 'promotion', color: turn, piece: promoteTo },
      pendingPromotion: null,
    });
  },

  pass: () => {
    const { turn, activePlayers, status } = get();
    if (status === 'finished') return;
    // "If in a game with more than 2 active Players, a Player has no legal move
    //  they can declare a Pass"
    if (activePlayers.length <= 2) return; // Niet bij 2 spelers

    const newTurn = nextTurn(turn, activePlayers);
    set({
      turn: newTurn,
      lastEvent: { type: 'pass', color: turn },
      selectedSquare: null,
      legalMoves: [],
      moveLog: [...get().moveLog, { moveNumber: get().moveLog.length + 1, color: turn, notation: '', isCapture: false, isPass: true }],
    });
  },

  resign: (color: QuaterColor) => {
    const { activePlayers, playerStatus, turn } = get();
    // "A Player that resigns leaves their army frozen"
    const newPlayerStatus = { ...playerStatus, [color]: 'frozen' as PlayerStatus };
    const newActive = activePlayers.filter(c => c !== color);

    if (newActive.length === 1) {
      set({
        activePlayers: newActive,
        playerStatus: newPlayerStatus,
        status: 'finished',
        winner: newActive[0],
        lastEvent: { type: 'finished', winner: newActive[0] },
      });
    } else {
      const newTurn = color === turn ? nextTurn(turn, newActive) : turn;
      set({
        activePlayers: newActive,
        playerStatus: newPlayerStatus,
        turn: newTurn,
      });
    }
  },

  undoMove: () => {},

  setPlayerNames: (names) => set({ playerNames: names }),

  setAiPlayers: (ai: QuaterColor[]) => set({ aiPlayers: new Set(ai) }),

  setOnlineMode: (isOnline, hostId) => set({ isOnlineMode: isOnline, onlineHostId: hostId ?? null }),

  applyRemoteMove: (fromCol, fromRow, toCol, toRow, promoteTo) => {
    // Simulate the move on our local board (same logic as selectSquare, but no turn guards)
    const { board, turn, activePlayers, playerStatus } = get();
    const newBoard = board.map((r) => [...r]);
    const captured = newBoard[toRow][toCol];
    let piece = { ...newBoard[fromRow][fromCol]! };
    if (!piece) return;

    // ACP direction
    if (piece.isAdvancedCentral) {
      piece = resolveACPDirection(piece, fromCol, fromRow, toCol, toRow, captured);
    }

    // Promotion
    if (promoteTo) {
      piece = { type: promoteTo, color: piece.color, owner: piece.owner };
    }

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    let event: QuaterEvent = { type: 'move', color: turn };
    let newActive = [...activePlayers];
    let newPlayerStatus = { ...playerStatus };
    let newStatus = 'playing';
    let newWinner: QuaterColor | null = null;

    if (captured) {
      event = { type: 'capture', color: turn, captured };
      if (captured.type === 'k') {
        const checkmatedColor = captured.color;
        newActive = newActive.filter((c) => c !== checkmatedColor);
        newPlayerStatus[checkmatedColor] = 'defeated';
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (newBoard[r][c]?.color === checkmatedColor) {
              newBoard[r][c] = { ...newBoard[r][c]!, owner: turn };
            }
          }
        }
        event = { type: 'checkmate', checkmated: checkmatedColor, by: turn };
        if (newActive.length === 1) {
          newStatus = 'finished';
          newWinner = newActive[0];
          event = { type: 'finished', winner: newWinner };
        }
      }
    }

    const newTurn = newStatus === 'finished' ? turn : nextTurn(turn, newActive);
    const moveStr = `${COL_LABELS[fromCol]}${fromRow + 1}→${COL_LABELS[toCol]}${toRow + 1}`;
    const logEntry = buildMoveLogEntry(get().moveLog.length + 1, turn, moveStr, piece, captured, event);
    if (promoteTo) logEntry.isPromotion = true;
    const logEntries = [...get().moveLog, logEntry];
    if (newStatus === 'finished' && newWinner) {
      logEntries.push({ moveNumber: logEntries.length + 1, color: newWinner, notation: '', isCapture: false, special: `${get().playerNames[newWinner]} wint!` });
    }

    set({
      board: newBoard,
      turn: newTurn,
      activePlayers: newActive,
      playerStatus: newPlayerStatus,
      status: newStatus,
      selectedSquare: null,
      legalMoves: [],
      lastMove: { fromCol, fromRow, toCol, toRow },
      lastEvent: event,
      winner: newWinner,
      moveHistory: [...get().moveHistory, moveStr],
      moveLog: logEntries,
      pendingPromotion: null,
    });

    // After applying a remote move, trigger AI if the next turn is an AI player (host only)
    setTimeout(() => triggerAiIfNeeded(), 400);
  },
}));

/**
 * Als de huidige speler een AI is, voer automatisch een zet uit.
 * Herhaalt zichzelf als de volgende speler ook AI is.
 */
function triggerAiIfNeeded(): void {
  const state = useQuaternityStore.getState();
  const { board, turn, activePlayers, playerStatus, aiPlayers, status, aiThinking } = state;

  if (status === 'finished' || aiThinking) return;
  if (!aiPlayers.has(turn)) return;
  if (playerStatus[turn] !== 'active') return;

  useQuaternityStore.setState({ aiThinking: true });

  setTimeout(() => {
    const current = useQuaternityStore.getState();
    if (current.status === 'finished' || !current.aiPlayers.has(current.turn)) {
      useQuaternityStore.setState({ aiThinking: false });
      return;
    }

    // Bepaal gecontroleerde kleuren
    const defeatedBy: Record<QuaterColor, QuaterColor | null> = { w: null, r: null, b: null, g: null };
    for (const color of TURN_ORDER) {
      if (current.playerStatus[color] === 'defeated') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = current.board[r][c];
            if (piece && piece.color === color && piece.owner !== color) {
              defeatedBy[color] = piece.owner;
              break;
            }
          }
          if (defeatedBy[color]) break;
        }
      }
    }
    const controlled = getControlledColors(current.board, current.turn, current.activePlayers, defeatedBy);

    const move = pickAiMove(current.board, current.turn, controlled, current.activePlayers);
    useQuaternityStore.setState({ aiThinking: false });

    if (!move) {
      // Geen zetten: pass
      current.pass();
      return;
    }

    // Simuleer de zet via selectSquare (hergebruik bestaande logica)
    // Eerst selecteren, dan doelveld
    useQuaternityStore.getState().selectSquare(move.fromCol, move.fromRow);
    // Kleine delay voor visueel effect
    setTimeout(() => {
      const s = useQuaternityStore.getState();
      // Auto-promotie naar dame voor AI
      if (s.pendingPromotion) {
        s.promote('q');
      } else {
        s.selectSquare(move.toCol, move.toRow);
        // Check of er een promotie pending is na de zet
        setTimeout(() => {
          const s2 = useQuaternityStore.getState();
          if (s2.pendingPromotion) {
            s2.promote('q');
          }
        }, 50);
      }
    }, 100);
  }, 300 + Math.random() * 400); // Variabele denktijd
}
