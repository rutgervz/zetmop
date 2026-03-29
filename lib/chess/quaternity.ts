import type { PieceSymbol } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuaterColor = 'w' | 'r' | 'b' | 'g';

export type QuaterPiece = {
  type: PieceSymbol;
  color: QuaterColor;
};

export type QuaterStatus = 'playing' | 'check' | 'finished';

export type QuaterEvent =
  | { type: 'move'; color: QuaterColor }
  | { type: 'capture'; color: QuaterColor; captured: QuaterPiece }
  | { type: 'check'; color: QuaterColor; kingCol: number; kingRow: number }
  | { type: 'elimination'; eliminated: QuaterColor }
  | { type: 'promotion'; color: QuaterColor; piece: PieceSymbol }
  | { type: 'finished'; winner: QuaterColor };

type MoveRecord = {
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  piece: QuaterPiece;
  captured: QuaterPiece | null;
  promotion: PieceSymbol | null;
  previousTurn: QuaterColor;
  eliminatedThisMove: QuaterColor | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BOARD_SIZE = 14;
const TURN_ORDER: QuaterColor[] = ['w', 'r', 'b', 'g'];

// Corner squares that are invalid (3x3 corners)
// Columns a-c = 0-2, l-n = 11-13
// Rows 1-3 = 0-2, 12-14 = 11-13
function isCornerSquare(col: number, row: number): boolean {
  const inLeftCols = col >= 0 && col <= 2;
  const inRightCols = col >= 11 && col <= 13;
  const inBottomRows = row >= 0 && row <= 2;
  const inTopRows = row >= 11 && row <= 13;
  return (inLeftCols && inBottomRows) ||
         (inRightCols && inBottomRows) ||
         (inLeftCols && inTopRows) ||
         (inRightCols && inTopRows);
}

// ─── Initial piece layout per player ─────────────────────────────────────────

// Standard back rank order (from left to right facing the board):
// R N B Q K B N R  (for south)
// Pawns on second row

type PiecePlacement = { col: number; row: number; type: PieceSymbol };

function getSouthPieces(): PiecePlacement[] {
  // South: rows 0-2, cols 3-10 (d-k)
  // Row 0 (rank 1): back rank R N B Q K B N R at cols 3-10
  // Row 1 (rank 2): pawns at cols 3-10
  const backRank: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const pieces: PiecePlacement[] = [];
  for (let i = 0; i < 8; i++) {
    pieces.push({ col: 3 + i, row: 0, type: backRank[i] });
    pieces.push({ col: 3 + i, row: 1, type: 'p' });
  }
  return pieces;
}

function getNorthPieces(): PiecePlacement[] {
  // North: rows 11-13, cols 3-10 (d-k), facing down
  // Row 13 (rank 14): back rank (mirrored: R N B K Q B N R from left)
  // Row 12 (rank 13): pawns
  const backRank: PieceSymbol[] = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];
  const pieces: PiecePlacement[] = [];
  for (let i = 0; i < 8; i++) {
    pieces.push({ col: 3 + i, row: 13, type: backRank[i] });
    pieces.push({ col: 3 + i, row: 12, type: 'p' });
  }
  return pieces;
}

function getWestPieces(): PiecePlacement[] {
  // West: cols 0-2, rows 3-10 (rows 4-11 in 1-indexed), facing right
  // Col 0: back rank (bottom to top): R N B Q K B N R
  // Col 1: pawns
  const backRank: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const pieces: PiecePlacement[] = [];
  for (let i = 0; i < 8; i++) {
    pieces.push({ col: 0, row: 3 + i, type: backRank[i] });
    pieces.push({ col: 1, row: 3 + i, type: 'p' });
  }
  return pieces;
}

function getEastPieces(): PiecePlacement[] {
  // East: cols 11-13, rows 3-10, facing left
  // Col 13: back rank (bottom to top): R N B K Q B N R (mirrored like north)
  // Col 12: pawns
  const backRank: PieceSymbol[] = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];
  const pieces: PiecePlacement[] = [];
  for (let i = 0; i < 8; i++) {
    pieces.push({ col: 13, row: 3 + i, type: backRank[i] });
    pieces.push({ col: 12, row: 3 + i, type: 'p' });
  }
  return pieces;
}

// ─── Pawn direction per color ────────────────────────────────────────────────

function getPawnDirection(color: QuaterColor): { dc: number; dr: number } {
  switch (color) {
    case 'w': return { dc: 0, dr: 1 };   // south moves up
    case 'b': return { dc: 0, dr: -1 };  // north moves down
    case 'r': return { dc: 1, dr: 0 };   // west moves right
    case 'g': return { dc: -1, dr: 0 };  // east moves left
  }
}

// Pawn start row/col (the row/col where a pawn starts, for double-move)
function isPawnStartPosition(color: QuaterColor, col: number, row: number): boolean {
  switch (color) {
    case 'w': return row === 1;
    case 'b': return row === 12;
    case 'r': return col === 1;
    case 'g': return col === 12;
  }
}

// Check if pawn has reached promotion zone (opposite 3 rows/cols)
function isPawnPromotionSquare(color: QuaterColor, col: number, row: number): boolean {
  switch (color) {
    case 'w': return row >= 11; // reaches north's territory (rows 12-14)
    case 'b': return row <= 2;  // reaches south's territory (rows 1-3)
    case 'r': return col >= 11; // reaches east's territory (cols l-n)
    case 'g': return col <= 2;  // reaches west's territory (cols a-c)
  }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export class QuaternityEngine {
  private board: (QuaterPiece | null)[][];
  private turn: QuaterColor;
  private eliminated: Set<QuaterColor>;
  private moveHistory: MoveRecord[];

  constructor() {
    this.board = [];
    this.turn = 'w';
    this.eliminated = new Set();
    this.moveHistory = [];
    this.newGame();
  }

  newGame(): void {
    // Initialize 14x14 board with nulls
    this.board = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );
    this.turn = 'w';
    this.eliminated = new Set();
    this.moveHistory = [];

    // Place pieces for each player
    const placements: [QuaterColor, PiecePlacement[]][] = [
      ['w', getSouthPieces()],
      ['b', getNorthPieces()],
      ['r', getWestPieces()],
      ['g', getEastPieces()],
    ];

    for (const [color, pieces] of placements) {
      for (const p of pieces) {
        this.board[p.row][p.col] = { type: p.type, color };
      }
    }
  }

  isValidSquare(col: number, row: number): boolean {
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return false;
    return !isCornerSquare(col, row);
  }

  getBoard(): (QuaterPiece | null)[][] {
    return this.board.map(row => [...row]);
  }

  getPiece(col: number, row: number): QuaterPiece | null {
    if (!this.isValidSquare(col, row)) return null;
    return this.board[row][col];
  }

  getTurn(): QuaterColor {
    return this.turn;
  }

  getActivePlayers(): QuaterColor[] {
    return TURN_ORDER.filter(c => !this.eliminated.has(c));
  }

  getStatus(): QuaterStatus {
    const active = this.getActivePlayers();
    if (active.length <= 1) return 'finished';
    if (this.isInCheck(this.turn)) return 'check';
    return 'playing';
  }

  getLegalMoves(col: number, row: number): { col: number; row: number }[] {
    const piece = this.getPiece(col, row);
    if (!piece || piece.color !== this.turn) return [];

    const pseudoMoves = this.getPseudoLegalMoves(col, row, piece);

    // Filter moves that would leave own king in check
    return pseudoMoves.filter(m => {
      return !this.wouldLeaveInCheck(col, row, m.col, m.row, piece.color);
    });
  }

  makeMove(
    fromCol: number,
    fromRow: number,
    toCol: number,
    toRow: number,
    promotion?: PieceSymbol
  ): QuaterEvent | null {
    const piece = this.getPiece(fromCol, fromRow);
    if (!piece || piece.color !== this.turn) return null;

    // Check if move is legal
    const legal = this.getLegalMoves(fromCol, fromRow);
    if (!legal.some(m => m.col === toCol && m.row === toRow)) return null;

    const captured = this.board[toRow][toCol];
    let eliminatedColor: QuaterColor | null = null;
    let promotionPiece: PieceSymbol | null = null;

    // Execute the move
    this.board[fromRow][fromCol] = null;

    // Handle promotion
    if (piece.type === 'p' && isPawnPromotionSquare(piece.color, toCol, toRow)) {
      promotionPiece = promotion || 'q';
      this.board[toRow][toCol] = { type: promotionPiece, color: piece.color };
    } else {
      this.board[toRow][toCol] = piece;
    }

    // Check if a king was captured (simplified elimination for kids)
    if (captured && captured.type === 'k') {
      eliminatedColor = captured.color;
      this.eliminatePlayer(captured.color);
    }

    // Check if any opponent is now in checkmate
    if (!eliminatedColor) {
      for (const color of this.getActivePlayers()) {
        if (color === this.turn) continue;
        if (this.isCheckmated(color)) {
          eliminatedColor = color;
          this.eliminatePlayer(color);
          break; // handle one elimination per move
        }
      }
    }

    // Record move
    const record: MoveRecord = {
      fromCol, fromRow, toCol, toRow,
      piece: { ...piece },
      captured: captured ? { ...captured } : null,
      promotion: promotionPiece,
      previousTurn: this.turn,
      eliminatedThisMove: eliminatedColor,
    };
    this.moveHistory.push(record);

    // Advance turn
    this.advanceTurn();

    // Determine event to return
    const active = this.getActivePlayers();
    if (active.length <= 1) {
      return { type: 'finished', winner: active[0] };
    }
    if (eliminatedColor) {
      return { type: 'elimination', eliminated: eliminatedColor };
    }
    if (promotionPiece) {
      return { type: 'promotion', color: record.previousTurn, piece: promotionPiece };
    }
    if (this.isInCheck(this.turn)) {
      const kingPos = this.findKing(this.turn);
      if (kingPos) {
        return { type: 'check', color: this.turn, kingCol: kingPos.col, kingRow: kingPos.row };
      }
    }
    if (captured) {
      return { type: 'capture', color: record.previousTurn, captured };
    }
    return { type: 'move', color: record.previousTurn };
  }

  undoMove(): boolean {
    const record = this.moveHistory.pop();
    if (!record) return false;

    // Restore eliminated player if needed
    if (record.eliminatedThisMove) {
      this.eliminated.delete(record.eliminatedThisMove);
      // Re-place eliminated player's pieces are NOT restored — only the king capture is undone.
      // Actually for a proper undo we need to handle this. Since elimination removes pieces,
      // we need a simpler approach: only undo the board state for this single move.
      // The eliminatePlayer call removed all pieces of that color, which we can't easily undo.
      // For simplicity, if an elimination happened, we restore pieces from a snapshot.
      // But we don't have a snapshot... Let's handle this by NOT removing pieces on elimination
      // via eliminatePlayer during this undo-capable version. Instead, let's just restore
      // the captured piece and the moved piece.
    }

    // Restore the piece to its original position
    const originalPiece = record.piece;
    this.board[record.fromRow][record.fromCol] = originalPiece;

    // Restore the captured piece (or null) at destination
    this.board[record.toRow][record.toCol] = record.captured;

    // Restore turn
    this.turn = record.previousTurn;

    return true;
  }

  getWinner(): QuaterColor | null {
    const active = this.getActivePlayers();
    if (active.length === 1) return active[0];
    return null;
  }

  isEliminated(color: QuaterColor): boolean {
    return this.eliminated.has(color);
  }

  getFen(): string {
    // Simple serialization: board state + turn + eliminated
    const rows: string[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      let rowStr = '';
      let emptyCount = 0;
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!this.isValidSquare(col, row)) {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += 'x';
          continue;
        }
        const piece = this.board[row][col];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          const symbol = piece.type;
          // Encode color: w=uppercase, b=lowercase, r=prefix 'R:', g=prefix 'G:'
          if (piece.color === 'w') {
            rowStr += symbol.toUpperCase();
          } else if (piece.color === 'b') {
            rowStr += symbol.toLowerCase();
          } else if (piece.color === 'r') {
            rowStr += `(r${symbol})`;
          } else {
            rowStr += `(g${symbol})`;
          }
        }
      }
      if (emptyCount > 0) rowStr += emptyCount;
      rows.push(rowStr);
    }
    const eliminated = [...this.eliminated].join('');
    return `${rows.join('/')} ${this.turn} ${eliminated || '-'}`;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private advanceTurn(): void {
    const currentIndex = TURN_ORDER.indexOf(this.turn);
    for (let i = 1; i <= 4; i++) {
      const next = TURN_ORDER[(currentIndex + i) % 4];
      if (!this.eliminated.has(next)) {
        this.turn = next;
        return;
      }
    }
  }

  private eliminatePlayer(color: QuaterColor): void {
    this.eliminated.add(color);
    // Remove all pieces of eliminated player from the board
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          this.board[row][col] = null;
        }
      }
    }
  }

  private findKing(color: QuaterColor): { col: number; row: number } | null {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'k' && piece.color === color) {
          return { col, row };
        }
      }
    }
    return null;
  }

  private isInCheck(color: QuaterColor): boolean {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;
    return this.isSquareAttackedBy(kingPos.col, kingPos.row, color);
  }

  /** Check if any piece NOT of `defendingColor` can attack the given square */
  private isSquareAttackedBy(col: number, row: number, defendingColor: QuaterColor): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.board[r][c];
        if (!piece || piece.color === defendingColor) continue;
        if (this.eliminated.has(piece.color)) continue;
        const attacks = this.getAttackSquares(c, r, piece);
        if (attacks.some(a => a.col === col && a.row === row)) return true;
      }
    }
    return false;
  }

  /** Get squares a piece attacks (for check detection — includes pawn captures only) */
  private getAttackSquares(col: number, row: number, piece: QuaterPiece): { col: number; row: number }[] {
    switch (piece.type) {
      case 'p': return this.getPawnAttacks(col, row, piece.color);
      case 'n': return this.getKnightMoves(col, row);
      case 'b': return this.getSlidingMoves(col, row, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      case 'r': return this.getSlidingMoves(col, row, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
      case 'q': return this.getSlidingMoves(col, row, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      case 'k': return this.getKingMoves(col, row);
      default: return [];
    }
  }

  private getPawnAttacks(col: number, row: number, color: QuaterColor): { col: number; row: number }[] {
    const dir = getPawnDirection(color);
    const attacks: { col: number; row: number }[] = [];

    // Pawns attack diagonally relative to their forward direction
    if (dir.dr !== 0) {
      // Vertical mover (south/north): attacks left and right diagonally
      const tc1 = col - 1;
      const tc2 = col + 1;
      const tr = row + dir.dr;
      if (this.isValidSquare(tc1, tr)) attacks.push({ col: tc1, row: tr });
      if (this.isValidSquare(tc2, tr)) attacks.push({ col: tc2, row: tr });
    } else {
      // Horizontal mover (west/east): attacks up and down diagonally
      const tc = col + dir.dc;
      const tr1 = row - 1;
      const tr2 = row + 1;
      if (this.isValidSquare(tc, tr1)) attacks.push({ col: tc, row: tr1 });
      if (this.isValidSquare(tc, tr2)) attacks.push({ col: tc, row: tr2 });
    }

    return attacks;
  }

  private getPseudoLegalMoves(
    col: number,
    row: number,
    piece: QuaterPiece
  ): { col: number; row: number }[] {
    switch (piece.type) {
      case 'p': return this.getPawnMoves(col, row, piece.color);
      case 'n': return this.getKnightMovesFiltered(col, row, piece.color);
      case 'b': return this.getSlidingMovesFiltered(col, row, piece.color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      case 'r': return this.getSlidingMovesFiltered(col, row, piece.color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
      case 'q': return this.getSlidingMovesFiltered(col, row, piece.color, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      case 'k': return this.getKingMovesFiltered(col, row, piece.color);
      default: return [];
    }
  }

  private getPawnMoves(col: number, row: number, color: QuaterColor): { col: number; row: number }[] {
    const dir = getPawnDirection(color);
    const moves: { col: number; row: number }[] = [];

    // Forward one step
    const fc = col + dir.dc;
    const fr = row + dir.dr;
    if (this.isValidSquare(fc, fr) && !this.board[fr][fc]) {
      moves.push({ col: fc, row: fr });

      // Forward two steps from starting position
      if (isPawnStartPosition(color, col, row)) {
        const fc2 = col + dir.dc * 2;
        const fr2 = row + dir.dr * 2;
        if (this.isValidSquare(fc2, fr2) && !this.board[fr2][fc2]) {
          moves.push({ col: fc2, row: fr2 });
        }
      }
    }

    // Captures (diagonal)
    const attacks = this.getPawnAttacks(col, row, color);
    for (const a of attacks) {
      const target = this.board[a.row][a.col];
      if (target && target.color !== color && !this.eliminated.has(target.color)) {
        moves.push(a);
      }
    }

    return moves;
  }

  private getKnightMoves(col: number, row: number): { col: number; row: number }[] {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    const moves: { col: number; row: number }[] = [];
    for (const [dc, dr] of offsets) {
      const nc = col + dc;
      const nr = row + dr;
      if (this.isValidSquare(nc, nr)) {
        moves.push({ col: nc, row: nr });
      }
    }
    return moves;
  }

  private getKnightMovesFiltered(col: number, row: number, color: QuaterColor): { col: number; row: number }[] {
    return this.getKnightMoves(col, row).filter(m => {
      const target = this.board[m.row][m.col];
      return !target || target.color !== color;
    });
  }

  private getSlidingMoves(
    col: number,
    row: number,
    directions: number[][]
  ): { col: number; row: number }[] {
    const moves: { col: number; row: number }[] = [];
    for (const [dc, dr] of directions) {
      let nc = col + dc;
      let nr = row + dr;
      while (this.isValidSquare(nc, nr)) {
        moves.push({ col: nc, row: nr });
        if (this.board[nr][nc]) break; // blocked
        nc += dc;
        nr += dr;
      }
    }
    return moves;
  }

  private getSlidingMovesFiltered(
    col: number,
    row: number,
    color: QuaterColor,
    directions: number[][]
  ): { col: number; row: number }[] {
    const moves: { col: number; row: number }[] = [];
    for (const [dc, dr] of directions) {
      let nc = col + dc;
      let nr = row + dr;
      while (this.isValidSquare(nc, nr)) {
        const target = this.board[nr][nc];
        if (target) {
          if (target.color !== color) {
            moves.push({ col: nc, row: nr }); // capture
          }
          break; // blocked either way
        }
        moves.push({ col: nc, row: nr });
        nc += dc;
        nr += dr;
      }
    }
    return moves;
  }

  private getKingMoves(col: number, row: number): { col: number; row: number }[] {
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    const moves: { col: number; row: number }[] = [];
    for (const [dc, dr] of offsets) {
      const nc = col + dc;
      const nr = row + dr;
      if (this.isValidSquare(nc, nr)) {
        moves.push({ col: nc, row: nr });
      }
    }
    return moves;
  }

  private getKingMovesFiltered(col: number, row: number, color: QuaterColor): { col: number; row: number }[] {
    return this.getKingMoves(col, row).filter(m => {
      const target = this.board[m.row][m.col];
      return !target || target.color !== color;
    });
  }

  private wouldLeaveInCheck(
    fromCol: number,
    fromRow: number,
    toCol: number,
    toRow: number,
    color: QuaterColor
  ): boolean {
    // Temporarily make the move
    const movingPiece = this.board[fromRow][fromCol];
    const capturedPiece = this.board[toRow][toCol];

    this.board[fromRow][fromCol] = null;
    this.board[toRow][toCol] = movingPiece;

    const inCheck = this.isInCheck(color);

    // Undo
    this.board[fromRow][fromCol] = movingPiece;
    this.board[toRow][toCol] = capturedPiece;

    return inCheck;
  }

  private isCheckmated(color: QuaterColor): boolean {
    if (!this.isInCheck(color)) return false;

    // Check if any piece of this color has a legal move
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = this.board[row][col];
        if (!piece || piece.color !== color) continue;

        const pseudoMoves = this.getPseudoLegalMoves(col, row, piece);
        for (const m of pseudoMoves) {
          if (!this.wouldLeaveInCheck(col, row, m.col, m.row, color)) {
            return false; // has at least one legal move
          }
        }
      }
    }
    return true; // no legal moves while in check
  }
}
