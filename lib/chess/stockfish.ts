import { Platform } from 'react-native';

/**
 * Stockfish AI wrapper.
 * On web: uses Stockfish WASM via Web Worker from CDN.
 * On native (iOS/Android): uses a simple random legal move fallback
 * since WASM Web Workers are not available in React Native's JS engine.
 */

// Use the classic (non-NNUE) Stockfish build — it doesn't require
// SharedArrayBuffer, so it works without special COOP/COEP headers.
const STOCKFISH_CDN =
  'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';

type StockfishState = 'idle' | 'loading' | 'ready' | 'busy' | 'disposed';

class StockfishEngine {
  private worker: Worker | null = null;
  private state: StockfishState = 'idle';
  private resolveMove: ((move: string) => void) | null = null;
  private rejectMove: ((err: Error) => void) | null = null;
  private moveTimeout: ReturnType<typeof setTimeout> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.state === 'ready') return;
    if (this.state === 'loading' && this.initPromise) return this.initPromise;

    if (Platform.OS !== 'web') {
      // On native platforms, no real Stockfish — mark as ready for fallback
      this.state = 'ready';
      return;
    }

    this.state = 'loading';
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      // Web Workers can't load cross-origin scripts directly.
      // Fetch the script as a blob and create a same-origin Worker.
      const response = await fetch(STOCKFISH_CDN);
      if (!response.ok) throw new Error(`Failed to fetch Stockfish: ${response.status}`);
      const blob = new Blob([await response.text()], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      this.worker = new Worker(blobUrl);
      URL.revokeObjectURL(blobUrl);

      // Wait for 'uciok' response
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.state = 'idle';
          reject(new Error('Stockfish init timeout'));
        }, 15000);

        this.worker!.onmessage = (event: MessageEvent) => {
          const line = typeof event.data === 'string' ? event.data : String(event.data);
          console.log('[Stockfish]', line);
          if (line.includes('uciok')) {
            clearTimeout(timeout);
            this.state = 'ready';
            // Switch to permanent message handler
            this.worker!.onmessage = (e: MessageEvent) => {
              const msg = typeof e.data === 'string' ? e.data : String(e.data);
              this.handleMessage(msg);
            };
            resolve();
          }
        };

        this.worker!.onerror = (err) => {
          console.error('[Stockfish] Worker error:', err);
          clearTimeout(timeout);
          this.state = 'idle';
          reject(new Error('Failed to load Stockfish worker'));
        };

        this.worker!.postMessage('uci');
      });
    } catch (err) {
      this.state = 'idle';
      this.initPromise = null;
      throw err;
    }
  }

  async getBestMove(fen: string, skillLevel: number = 5): Promise<string> {
    if (this.state === 'disposed') {
      throw new Error('Stockfish engine is disposed');
    }

    // Native fallback: pick a random legal move using chess.js
    if (Platform.OS !== 'web' || !this.worker) {
      return this.getRandomMove(fen);
    }

    if (this.state !== 'ready') {
      await this.init();
    }

    this.state = 'busy';

    return new Promise<string>((resolve, reject) => {
      this.resolveMove = resolve;
      this.rejectMove = reject;

      // Clamp skill level 0-20
      const level = Math.max(0, Math.min(20, Math.round(skillLevel)));

      // Configure skill level — lower = weaker play
      this.send(`setoption name Skill Level value ${level}`);

      // Limit search depth based on skill level for faster responses
      // Kids mode (level 1-5): shallow search; higher levels: deeper
      const depth = Math.max(1, Math.min(20, Math.floor(level / 2) + 3));

      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);

      // Timeout after 5 seconds
      this.moveTimeout = setTimeout(() => {
        if (this.state === 'busy') {
          this.send('stop');
        }
      }, 5000);
    });
  }

  stop(): void {
    if (this.worker && this.state === 'busy') {
      this.send('stop');
    }
  }

  dispose(): void {
    this.state = 'disposed';
    if (this.moveTimeout) {
      clearTimeout(this.moveTimeout);
      this.moveTimeout = null;
    }
    if (this.rejectMove) {
      this.rejectMove(new Error('Engine disposed'));
      this.resolveMove = null;
      this.rejectMove = null;
    }
    if (this.worker) {
      this.send('quit');
      this.worker.terminate();
      this.worker = null;
    }
  }

  private send(command: string): void {
    this.worker?.postMessage(command);
  }

  private handleMessage(line: string): void {
    // Parse 'bestmove' response
    if (line.startsWith('bestmove')) {
      if (this.moveTimeout) {
        clearTimeout(this.moveTimeout);
        this.moveTimeout = null;
      }

      const parts = line.split(' ');
      const move = parts[1];

      this.state = 'ready';

      if (move && move !== '(none)' && this.resolveMove) {
        this.resolveMove(move);
      } else if (this.rejectMove) {
        this.rejectMove(new Error('No valid move found'));
      }

      this.resolveMove = null;
      this.rejectMove = null;
    }
  }

  /**
   * Fallback for native platforms: pick a random legal move.
   * We dynamically import chess.js to evaluate the position.
   */
  private async getRandomMove(fen: string): Promise<string> {
    const { Chess } = await import('chess.js');
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });

    if (moves.length === 0) {
      throw new Error('No legal moves available');
    }

    // Pick a random move and convert to UCI format (e.g. 'e2e4')
    const move = moves[Math.floor(Math.random() * moves.length)];
    let uci = move.from + move.to;
    if (move.promotion) {
      uci += move.promotion;
    }
    return uci;
  }
}

// Singleton instance
let instance: StockfishEngine | null = null;

export function getStockfish(): StockfishEngine {
  if (!instance || (instance as any).state === 'disposed') {
    instance = new StockfishEngine();
  }
  return instance;
}

/**
 * Parse a UCI move string (e.g. 'e2e4', 'e7e8q') into from/to/promotion.
 */
export function parseUciMove(uci: string): {
  from: string;
  to: string;
  promotion?: string;
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}
