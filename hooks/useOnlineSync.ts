import { useEffect, useRef } from 'react';
import { getOnlineService } from '@/lib/online/OnlineGameService';
import { useOnlineStore } from '@/stores/onlineStore';
import { useGameStore } from '@/stores/gameStore';
import { useQuaternityStore } from '@/stores/quaternityStore';
import type { OnlineMessage, ChessMoveMsg, QuaterMoveMsg, QuaterPassMsg } from '@/lib/online/protocol';
import type { Square } from '@/lib/chess/types';

/**
 * Sync hook: bridges game stores ↔ Supabase Realtime.
 * Must be mounted inside the online game screen while in 'playing' phase.
 */
export function useOnlineSync() {
  const gameType = useOnlineStore((s) => s.gameType);
  const myColor = useOnlineStore((s) => s.myColor);
  const incrementMoveNumber = useOnlineStore((s) => s.incrementMoveNumber);
  const isRemoteMove = useRef(false);

  // Subscribe to incoming remote messages
  useEffect(() => {
    const service = getOnlineService();

    const unsub = service.onMessage((msg: OnlineMessage) => {
      if (gameType === 'chess') {
        handleChessMessage(msg);
      } else {
        handleQuaternityMessage(msg);
      }
    });

    return unsub;
  }, [gameType]);

  // Watch local chess moves and broadcast them
  useEffect(() => {
    if (gameType !== 'chess') return;

    return useGameStore.subscribe((state, prevState) => {
      if (isRemoteMove.current) return;
      if (!state.lastMove || state.lastMove === prevState.lastMove) return;

      // A new local move happened
      const service = getOnlineService();
      const engine = state.engine;
      const history = engine.getHistorySan();
      const moveNumber = incrementMoveNumber();

      service.send({
        event: 'chess_move',
        from: state.lastMove.from,
        to: state.lastMove.to,
        promotion: undefined, // TODO: detect from move
        fen: engine.getFen(),
        san: history[history.length - 1] || '',
        moveNumber,
      });
    });
  }, [gameType]);

  // Watch local quaternity moves and broadcast them
  useEffect(() => {
    if (gameType !== 'quaternity') return;

    return useQuaternityStore.subscribe((state, prevState) => {
      if (isRemoteMove.current) return;
      if (!state.lastMove || state.lastMove === prevState.lastMove) return;

      const service = getOnlineService();
      const moveNumber = incrementMoveNumber();

      service.send({
        event: 'quater_move',
        fromCol: state.lastMove.fromCol,
        fromRow: state.lastMove.fromRow,
        toCol: state.lastMove.toCol,
        toRow: state.lastMove.toRow,
        moveNumber,
      });
    });
  }, [gameType]);

  function handleChessMessage(msg: OnlineMessage) {
    if (msg.event === 'chess_move') {
      const move = msg as ChessMoveMsg;
      isRemoteMove.current = true;
      useGameStore.getState().applyRemoteMove(
        move.from as Square,
        move.to as Square,
        move.promotion,
      );
      isRemoteMove.current = false;
    } else if (msg.event === 'chess_resign') {
      useGameStore.getState().resign(msg.color);
    }
  }

  function handleQuaternityMessage(msg: OnlineMessage) {
    if (msg.event === 'quater_move') {
      const move = msg as QuaterMoveMsg;
      isRemoteMove.current = true;
      useQuaternityStore.getState().applyRemoteMove(
        move.fromCol, move.fromRow, move.toCol, move.toRow, move.promoteTo,
      );
      isRemoteMove.current = false;
    } else if (msg.event === 'quater_pass') {
      useQuaternityStore.getState().pass();
    } else if (msg.event === 'quater_resign') {
      useQuaternityStore.getState().resign(msg.color);
    }
  }

  return { myColor, isRemoteMove };
}
