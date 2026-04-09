import type { QuaterColor } from '@/stores/quaternityStore';
import type { Color, PieceSymbol, Square } from '@/lib/chess/types';

export type GameType = 'chess' | 'quaternity';

export type LobbyPlayer = {
  id: string;
  name: string;
  color?: Color | QuaterColor;
  connected: boolean;
};

// === Lobby messages ===

export type PlayerJoinMsg = {
  event: 'player_join';
  playerId: string;
  name: string;
};

export type LobbyStateMsg = {
  event: 'lobby_state';
  hostId: string;
  gameType: GameType;
  players: LobbyPlayer[];
  aiSlots: QuaterColor[];
};

export type PlayerLeaveMsg = {
  event: 'player_leave';
  playerId: string;
};

export type GameStartMsg = {
  event: 'game_start';
  gameType: GameType;
  assignments: { playerId: string; color: string }[];
  aiSlots: QuaterColor[];
};

export type PingMsg = {
  event: 'ping';
  playerId: string;
  ts: number;
};

// === Chess game messages ===

export type ChessMoveMsg = {
  event: 'chess_move';
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  fen: string;
  san: string;
  moveNumber: number;
};

export type ChessResignMsg = {
  event: 'chess_resign';
  color: Color;
};

// === Quaternity game messages ===

export type QuaterMoveMsg = {
  event: 'quater_move';
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  promoteTo?: PieceSymbol;
  moveNumber: number;
};

export type QuaterPassMsg = {
  event: 'quater_pass';
  color: QuaterColor;
  moveNumber: number;
};

export type QuaterResignMsg = {
  event: 'quater_resign';
  color: QuaterColor;
};

// === Chat messages ===

export type ChatMsg = {
  event: 'chat_message';
  playerId: string;
  playerName: string;
  text?: string;
  gifUrl?: string;       // Tenor GIF URL
  gifPreview?: string;   // Tenor preview (smaller)
  ts: number;
};

// === Reconnection ===

export type ReconnectRequestMsg = {
  event: 'reconnect_request';
  playerId: string;
  lastMoveNumber: number;
};

export type ReconnectStateMsg = {
  event: 'reconnect_state';
  gameType: GameType;
  // Chess: FEN string. Quaternity: serialized board + state
  state: any;
  moveHistory: string[];
  moveNumber: number;
};

// Union type
export type OnlineMessage =
  | PlayerJoinMsg
  | LobbyStateMsg
  | PlayerLeaveMsg
  | GameStartMsg
  | PingMsg
  | ChatMsg
  | ChessMoveMsg
  | ChessResignMsg
  | QuaterMoveMsg
  | QuaterPassMsg
  | QuaterResignMsg
  | ReconnectRequestMsg
  | ReconnectStateMsg;
