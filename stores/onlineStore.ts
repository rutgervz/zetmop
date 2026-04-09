import { create } from 'zustand';
import { getOnlineService, resetOnlineService, type ConnectionState } from '@/lib/online/OnlineGameService';
import { getPlayerId } from '@/lib/online/playerId';
import type {
  GameType, LobbyPlayer, OnlineMessage,
  LobbyStateMsg, GameStartMsg, ChatMsg,
} from '@/lib/online/protocol';
import type { Color } from '@/lib/chess/types';
import type { QuaterColor } from '@/stores/quaternityStore';

type LobbyPhase = 'idle' | 'creating' | 'joining' | 'waiting' | 'playing';

export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  text?: string;
  gifUrl?: string;
  gifPreview?: string;
  ts: number;
  isOwn: boolean;
};

type OnlineState = {
  connectionState: ConnectionState;
  roomCode: string | null;
  playerId: string;
  playerName: string;
  isHost: boolean;
  error: string | null;

  lobbyPhase: LobbyPhase;
  gameType: GameType;
  players: LobbyPlayer[];
  aiSlots: QuaterColor[];
  myColor: Color | QuaterColor | null;
  moveNumber: number;

  // Chat
  chatMessages: ChatMessage[];
  unreadCount: number;

  // Actions
  createRoom: (gameType: GameType, playerName: string) => Promise<void>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startGame: () => void;
  toggleAiSlot: (color: QuaterColor) => void;
  setPlayerName: (name: string) => void;
  incrementMoveNumber: () => number;
  sendChatMessage: (text?: string, gifUrl?: string, gifPreview?: string) => void;
  markChatRead: () => void;
  reset: () => void;
};

const CHESS_COLORS: Color[] = ['w', 'b'];
const QUATER_COLORS: QuaterColor[] = ['w', 'r', 'b', 'g'];

export const useOnlineStore = create<OnlineState>((set, get) => {
  // Message handler — wired up on createRoom/joinRoom
  function handleMessage(msg: OnlineMessage) {
    const state = get();
    console.log('[Online]', state.isHost ? 'HOST' : 'CLIENT', 'received:', msg.event, msg);

    switch (msg.event) {
      case 'player_join': {
        if (!state.isHost) break;
        // Host adds this player and broadcasts lobby state
        const newPlayer: LobbyPlayer = {
          id: msg.playerId,
          name: msg.name,
          connected: true,
        };
        const exists = state.players.some((p) => p.id === msg.playerId);
        const players = exists
          ? state.players.map((p) => p.id === msg.playerId ? { ...p, name: msg.name, connected: true } : p)
          : [...state.players, newPlayer];
        set({ players });
        broadcastLobbyState(players);
        break;
      }

      case 'lobby_state': {
        // Non-host clients receive this
        if (state.isHost) break;
        const lobby = msg as LobbyStateMsg;
        set({
          players: lobby.players,
          gameType: lobby.gameType,
          aiSlots: lobby.aiSlots,
          lobbyPhase: 'waiting',
        });
        break;
      }

      case 'player_leave': {
        const players = state.players.filter((p) => p.id !== msg.playerId);
        set({ players });
        if (state.isHost) broadcastLobbyState(players);
        break;
      }

      case 'game_start': {
        const start = msg as GameStartMsg;
        const myAssignment = start.assignments.find((a) => a.playerId === state.playerId);
        set({
          lobbyPhase: 'playing',
          myColor: (myAssignment?.color as Color | QuaterColor) ?? null,
          aiSlots: start.aiSlots,
          moveNumber: 0,
        });
        break;
      }

      case 'chat_message': {
        const chat = msg as ChatMsg;
        const newMsg: ChatMessage = {
          id: `${chat.playerId}-${chat.ts}`,
          playerId: chat.playerId,
          playerName: chat.playerName,
          text: chat.text,
          gifUrl: chat.gifUrl,
          gifPreview: chat.gifPreview,
          ts: chat.ts,
          isOwn: false,
        };
        set({
          chatMessages: [...state.chatMessages, newMsg],
          unreadCount: state.unreadCount + 1,
        });
        break;
      }

      case 'ping': {
        // Update player connected status
        const players = state.players.map((p) =>
          p.id === msg.playerId ? { ...p, connected: true } : p
        );
        set({ players });
        break;
      }

      default:
        // Game messages (chess_move, quater_move, etc.) are handled by useOnlineSync hook
        break;
    }
  }

  function broadcastLobbyState(players: LobbyPlayer[]) {
    const state = get();
    const service = getOnlineService();
    service.send({
      event: 'lobby_state',
      hostId: state.playerId,
      gameType: state.gameType,
      players,
      aiSlots: state.aiSlots,
    });
  }

  function handleConnectionChange(connState: ConnectionState) {
    set({ connectionState: connState });
    if (connState === 'error') {
      set({ error: 'Verbinding verbroken' });
    }
  }

  return {
    connectionState: 'idle',
    roomCode: null,
    playerId: '',
    playerName: '',
    isHost: false,
    error: null,
    lobbyPhase: 'idle',
    gameType: 'chess',
    players: [],
    aiSlots: [],
    myColor: null,
    moveNumber: 0,
    chatMessages: [],
    unreadCount: 0,

    createRoom: async (gameType, playerName) => {
      set({ lobbyPhase: 'creating', error: null, gameType });
      const service = getOnlineService();
      const pid = await getPlayerId();
      set({ playerId: pid, playerName: playerName });

      const unsub1 = service.onMessage(handleMessage);
      const unsub2 = service.onConnectionChange(handleConnectionChange);

      const code = await service.createRoom(gameType, pid, playerName);

      const hostPlayer: LobbyPlayer = { id: pid, name: playerName, connected: true };
      set({
        roomCode: code,
        isHost: true,
        lobbyPhase: 'waiting',
        players: [hostPlayer],
      });
    },

    joinRoom: async (code, playerName) => {
      set({ lobbyPhase: 'joining', error: null });
      const service = getOnlineService();
      const pid = await getPlayerId();
      set({ playerId: pid, playerName: playerName });

      service.onMessage(handleMessage);
      service.onConnectionChange(handleConnectionChange);

      try {
        await service.joinRoom(code, pid, playerName);
        set({ roomCode: code.toUpperCase(), isHost: false, lobbyPhase: 'waiting' });
      } catch {
        set({ error: 'Kon niet verbinden met kamer', lobbyPhase: 'idle' });
      }
    },

    leaveRoom: () => {
      const service = getOnlineService();
      service.leaveRoom();
      resetOnlineService();
      set({
        connectionState: 'idle',
        roomCode: null,
        isHost: false,
        lobbyPhase: 'idle',
        players: [],
        error: null,
        myColor: null,
        moveNumber: 0,
        aiSlots: [],
      });
    },

    startGame: () => {
      const state = get();
      if (!state.isHost) return;

      const service = getOnlineService();
      const humanPlayers = state.players;

      let assignments: { playerId: string; color: string }[];
      let finalAiSlots = [...state.aiSlots] as QuaterColor[];

      if (state.gameType === 'chess') {
        // Randomly assign white/black
        const shuffled = [...humanPlayers].sort(() => Math.random() - 0.5);
        assignments = shuffled.map((p, i) => ({
          playerId: p.id,
          color: CHESS_COLORS[i],
        }));
      } else {
        // Quaternity: assign available (non-AI) slots to humans, rest becomes AI
        const available = QUATER_COLORS.filter((c) => !state.aiSlots.includes(c));
        assignments = humanPlayers.slice(0, available.length).map((p, i) => ({
          playerId: p.id,
          color: available[i],
        }));
        // Auto-fill remaining slots as AI
        const assignedColors = new Set(assignments.map((a) => a.color));
        const autoAi = available.filter((c) => !assignedColors.has(c));
        finalAiSlots = [...state.aiSlots, ...autoAi] as QuaterColor[];
      }

      // Broadcast start
      const startMsg: GameStartMsg = {
        event: 'game_start',
        gameType: state.gameType,
        assignments,
        aiSlots: finalAiSlots,
      };
      service.send(startMsg);

      // Also apply locally (host doesn't receive own broadcast)
      const myAssignment = assignments.find((a) => a.playerId === state.playerId);
      set({
        lobbyPhase: 'playing',
        myColor: (myAssignment?.color as Color | QuaterColor) ?? null,
        aiSlots: finalAiSlots,
        players: state.players.map((p) => {
          const a = assignments.find((x) => x.playerId === p.id);
          return a ? { ...p, color: a.color as any } : p;
        }),
        moveNumber: 0,
      });
    },

    toggleAiSlot: (color) => {
      const state = get();
      if (!state.isHost || state.gameType !== 'quaternity') return;
      const aiSlots = state.aiSlots.includes(color)
        ? state.aiSlots.filter((c) => c !== color)
        : [...state.aiSlots, color];
      set({ aiSlots });
      broadcastLobbyState(state.players);
    },

    setPlayerName: (name) => set({ playerName: name }),

    incrementMoveNumber: () => {
      const next = get().moveNumber + 1;
      set({ moveNumber: next });
      return next;
    },

    sendChatMessage: (text, gifUrl, gifPreview) => {
      const { playerId, playerName } = get();
      const ts = Date.now();
      const service = getOnlineService();

      // Add locally
      const localMsg: ChatMessage = {
        id: `${playerId}-${ts}`,
        playerId,
        playerName,
        text,
        gifUrl,
        gifPreview,
        ts,
        isOwn: true,
      };
      set({ chatMessages: [...get().chatMessages, localMsg] });

      // Broadcast
      service.send({
        event: 'chat_message',
        playerId,
        playerName,
        text,
        gifUrl,
        gifPreview,
        ts,
      });
    },

    markChatRead: () => set({ unreadCount: 0 }),

    reset: () => {
      resetOnlineService();
      set({
        connectionState: 'idle',
        roomCode: null,
        playerId: '',
        playerName: '',
        isHost: false,
        error: null,
        lobbyPhase: 'idle',
        gameType: 'chess',
        players: [],
        aiSlots: [],
        myColor: null,
        moveNumber: 0,
        chatMessages: [],
        unreadCount: 0,
      });
    },
  };
});
