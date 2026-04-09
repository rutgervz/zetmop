import { supabase } from '@/lib/supabase';
import { generateRoomCode } from './roomCode';
import type { OnlineMessage, GameType } from './protocol';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type MessageHandler = (msg: OnlineMessage) => void;
type ConnectionHandler = (state: ConnectionState) => void;

export class OnlineGameService {
  private channel: RealtimeChannel | null = null;
  private roomCode: string | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private connectionState: ConnectionState = 'idle';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private playerId: string = '';
  private playerName: string = '';
  private gameType: GameType = 'chess';

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  async createRoom(gameType: GameType, playerId: string, playerName: string): Promise<string> {
    this.gameType = gameType;
    this.playerId = playerId;
    this.playerName = playerName;
    this.roomCode = generateRoomCode();
    await this.connectToChannel();
    return this.roomCode;
  }

  async joinRoom(code: string, playerId: string, playerName: string): Promise<void> {
    this.roomCode = code.toUpperCase();
    this.playerId = playerId;
    this.playerName = playerName;
    await this.connectToChannel();

    // Announce ourselves
    this.send({
      event: 'player_join',
      playerId: this.playerId,
      name: this.playerName,
    });
  }

  send(msg: OnlineMessage): void {
    if (!this.channel) {
      console.warn('[Online] send() called without channel');
      return;
    }
    console.log('[Online] sending:', msg.event, msg);
    this.channel.send({
      type: 'broadcast',
      event: 'game',
      payload: msg,
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => { this.messageHandlers.delete(handler); };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => { this.connectionHandlers.delete(handler); };
  }

  leaveRoom(): void {
    if (this.channel) {
      this.send({
        event: 'player_leave',
        playerId: this.playerId,
      });
    }
    this.cleanup();
  }

  destroy(): void {
    this.cleanup();
  }

  // --- Private ---

  private connectToChannel(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setConnectionState('connecting');

      const channelName = `room:${this.roomCode}`;
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false, ack: true },
        },
      });

      this.channel.on('broadcast', { event: 'game' }, (payload) => {
        const msg = payload.payload as OnlineMessage;
        this.messageHandlers.forEach((h) => h(msg));
      });

      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.setConnectionState('connected');
          this.reconnectAttempt = 0;
          this.startPing();
          resolve();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.setConnectionState('disconnected');
          this.attemptReconnect();
          reject(new Error('Channel subscription failed'));
        }
      });
    });
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionHandlers.forEach((h) => h(state));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempt >= 5) {
      this.setConnectionState('error');
      return;
    }

    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempt), 30000);
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(async () => {
      if (this.connectionState === 'connected') return;
      this.cleanup(false);
      try {
        await this.connectToChannel();
        // Re-announce after reconnect
        this.send({
          event: 'player_join',
          playerId: this.playerId,
          name: this.playerName,
        });
      } catch {
        this.attemptReconnect();
      }
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({
        event: 'ping',
        playerId: this.playerId,
        ts: Date.now(),
      });
    }, 10000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanup(full = true): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (full) {
      this.roomCode = null;
      this.messageHandlers.clear();
      this.connectionHandlers.clear();
      this.setConnectionState('idle');
    }
  }
}

// Singleton instance
let instance: OnlineGameService | null = null;

export function getOnlineService(): OnlineGameService {
  if (!instance) {
    instance = new OnlineGameService();
  }
  return instance;
}

export function resetOnlineService(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
