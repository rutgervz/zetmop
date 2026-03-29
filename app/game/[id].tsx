import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ChessBoard from '@/components/board/ChessBoard';
import PromotionModal from '@/components/board/PromotionModal';
import { useGameStore } from '@/stores/gameStore';
import { AppColors } from '@/constants/Colors';

export default function GameScreen() {
  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const playerWhite = useGameStore((s) => s.playerWhite);
  const playerBlack = useGameStore((s) => s.playerBlack);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const undoMove = useGameStore((s) => s.undoMove);
  const newGame = useGameStore((s) => s.newGame);
  const lastEvent = useGameStore((s) => s.lastEvent);

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned'].includes(status);
  const winner =
    status === 'checkmate' && lastEvent?.type === 'checkmate'
      ? lastEvent.winner === 'w' ? playerWhite : playerBlack
      : null;

  // Compact move display: last few moves
  const recentMoves = moveHistory.slice(-6);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Minimale top bar */}
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color="#666" />
        </Pressable>

        <View style={styles.players}>
          <PlayerChip name={playerBlack} color="b" active={turn === 'b' && !isGameOver} />
          <Text style={styles.vs}>vs</Text>
          <PlayerChip name={playerWhite} color="w" active={turn === 'w' && !isGameOver} />
        </View>

        <Pressable onPress={undoMove} hitSlop={12}>
          <FontAwesome name="undo" size={16} color="#666" />
        </Pressable>
      </SafeAreaView>

      {/* Status */}
      {status !== 'playing' && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {status === 'check' && 'Schaak!'}
            {status === 'checkmate' && `Schaakmat! ${winner} wint`}
            {status === 'stalemate' && 'Pat — remise'}
            {status === 'draw' && 'Remise'}
            {status === 'resigned' && 'Opgegeven'}
          </Text>
        </View>
      )}

      {/* 2D Board met 3D effects overlay */}
      <View style={styles.boardArea}>
        <ChessBoard />
      </View>

      {/* Minimale bottom bar */}
      <SafeAreaView style={styles.bottomBar}>
        {recentMoves.length > 0 && (
          <View style={styles.movesRow}>
            {recentMoves.map((move, i) => (
              <Text key={i} style={[
                styles.moveText,
                i === recentMoves.length - 1 && styles.moveTextLast,
              ]}>
                {move}
              </Text>
            ))}
          </View>
        )}

        {isGameOver && (
          <Pressable
            style={styles.newGameBtn}
            onPress={() => newGame('local')}
          >
            <Text style={styles.newGameText}>Nieuw spel</Text>
          </Pressable>
        )}
      </SafeAreaView>

      <PromotionModal />
    </View>
  );
}

function PlayerChip({ name, color, active }: { name: string; color: 'w' | 'b'; active: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <View style={[styles.dot, { backgroundColor: color === 'w' ? '#F0D9B5' : '#463624' }]} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  players: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vs: {
    color: '#444',
    fontSize: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  chipText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  statusBar: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusText: {
    color: AppColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  movesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  moveText: {
    color: '#555',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  moveTextLast: {
    color: '#999',
    fontWeight: '600',
  },
  newGameBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  newGameText: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '700',
  },
});
