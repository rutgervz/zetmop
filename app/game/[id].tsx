import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { router, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ChessBoard from '@/components/board/ChessBoard';
import MoveHistory from '@/components/board/MoveHistory';
import PromotionModal from '@/components/board/PromotionModal';
import { useGameStore } from '@/stores/gameStore';
import { AppColors } from '@/constants/Colors';

const STATUS_TEXT: Record<string, string> = {
  playing: '',
  check: 'Schaak!',
  checkmate: 'Schaakmat!',
  stalemate: 'Pat!',
  draw: 'Remise!',
  resigned: 'Opgegeven',
};

export default function GameScreen() {
  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const playerWhite = useGameStore((s) => s.playerWhite);
  const playerBlack = useGameStore((s) => s.playerBlack);
  const undoMove = useGameStore((s) => s.undoMove);
  const flipBoard = useGameStore((s) => s.flipBoard);
  const newGame = useGameStore((s) => s.newGame);
  const lastEvent = useGameStore((s) => s.lastEvent);

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned'].includes(status);
  const currentPlayer = turn === 'w' ? playerWhite : playerBlack;
  const winner =
    status === 'checkmate' && lastEvent?.type === 'checkmate'
      ? lastEvent.winner === 'w'
        ? playerWhite
        : playerBlack
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Partij',
          headerStyle: { backgroundColor: AppColors.background },
          headerTintColor: AppColors.text,
        }}
      />

      {/* Top player bar */}
      <PlayerBar
        name={playerBlack}
        color="b"
        isActive={turn === 'b' && !isGameOver}
      />

      {/* Status banner */}
      {status !== 'playing' && (
        <View
          style={[
            styles.statusBanner,
            isGameOver && styles.statusBannerGameOver,
          ]}
        >
          <Text style={styles.statusText}>
            {STATUS_TEXT[status]}
            {winner ? ` ${winner} wint!` : ''}
          </Text>
        </View>
      )}

      {/* Chess board */}
      <ChessBoard />

      {/* Bottom player bar */}
      <PlayerBar
        name={playerWhite}
        color="w"
        isActive={turn === 'w' && !isGameOver}
      />

      {/* Move history */}
      <MoveHistory />

      {/* Action buttons */}
      <View style={styles.actions}>
        {!isGameOver && (
          <>
            <ActionButton icon="undo" label="Terug" onPress={undoMove} />
            <ActionButton icon="refresh" label="Draai" onPress={flipBoard} />
          </>
        )}
        {isGameOver && (
          <ActionButton
            icon="plus-circle"
            label="Nieuw spel"
            onPress={() => {
              newGame('local');
            }}
            primary
          />
        )}
        <ActionButton
          icon="arrow-left"
          label="Menu"
          onPress={() => router.back()}
        />
      </View>

      <PromotionModal />
    </SafeAreaView>
  );
}

function PlayerBar({
  name,
  color,
  isActive,
}: {
  name: string;
  color: 'w' | 'b';
  isActive: boolean;
}) {
  return (
    <View style={[styles.playerBar, isActive && styles.playerBarActive]}>
      <View
        style={[
          styles.playerDot,
          { backgroundColor: color === 'w' ? '#F0D9B5' : '#463624' },
        ]}
      />
      <Text style={[styles.playerName, isActive && styles.playerNameActive]}>
        {name}
      </Text>
      {isActive && <Text style={styles.turnIndicator}>Aan zet</Text>}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        pressed && styles.actionButtonPressed,
      ]}
      onPress={onPress}
    >
      <FontAwesome
        name={icon}
        size={18}
        color={primary ? AppColors.background : AppColors.text}
      />
      <Text
        style={[
          styles.actionLabel,
          primary && styles.actionLabelPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  playerBarActive: {
    backgroundColor: AppColors.surface,
  },
  playerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  playerName: {
    color: AppColors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  playerNameActive: {
    color: AppColors.text,
    fontWeight: '700',
  },
  turnIndicator: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  statusBanner: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusBannerGameOver: {
    backgroundColor: AppColors.surface,
  },
  statusText: {
    color: AppColors.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionButtonPrimary: {
    backgroundColor: AppColors.primary,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  actionLabelPrimary: {
    color: AppColors.background,
  },
});
