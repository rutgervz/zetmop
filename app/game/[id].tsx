import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ChessBoard from '@/components/board/ChessBoard';
import PromotionModal from '@/components/board/PromotionModal';
import { useGameStore } from '@/stores/gameStore';
import { AppColors } from '@/constants/Colors';
import type { GameMode } from '@/lib/chess/types';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mode = (id === 'ai' ? 'ai' : 'local') as GameMode;

  const [phase, setPhase] = useState<'setup' | 'playing'>('setup');
  const [nameWhite, setNameWhite] = useState('');
  const [nameBlack, setNameBlack] = useState(mode === 'ai' ? 'Computer' : '');
  const [aiLevel, setAiLevelLocal] = useState(5);
  const setAiLevel = useGameStore((s) => s.setAiLevel);

  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const playerWhite = useGameStore((s) => s.playerWhite);
  const playerBlack = useGameStore((s) => s.playerBlack);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const undoMove = useGameStore((s) => s.undoMove);
  const newGame = useGameStore((s) => s.newGame);
  const setPlayerNames = useGameStore((s) => s.setPlayerNames);
  const lastEvent = useGameStore((s) => s.lastEvent);
  const aiThinking = useGameStore((s) => s.aiThinking);

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned'].includes(status);
  const winner =
    status === 'checkmate' && lastEvent?.type === 'checkmate'
      ? lastEvent.winner === 'w' ? playerWhite : playerBlack
      : null;

  const recentMoves = moveHistory.slice(-6);

  const startGame = () => {
    const white = nameWhite.trim() || 'Wit';
    const black = mode === 'ai' ? 'Computer' : (nameBlack.trim() || 'Zwart');
    setPlayerNames(white, black);
    if (mode === 'ai') setAiLevel(aiLevel);
    newGame(mode);
    setPhase('playing');
  };

  const AI_LEVELS = [
    { value: 1, label: 'Beginner', emoji: '🐣' },
    { value: 5, label: 'Makkelijk', emoji: '🐥' },
    { value: 10, label: 'Gemiddeld', emoji: '🦊' },
    { value: 15, label: 'Moeilijk', emoji: '🐺' },
    { value: 20, label: 'Meester', emoji: '🐉' },
  ];

  // Setup scherm: namen invullen
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.setupContainer}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <FontAwesome name="chevron-left" size={18} color="#666" />
          </Pressable>

          <Text style={styles.setupTitle}>
            {mode === 'ai' ? '♟ Tegen de computer' : '♟ Lokaal spelen'}
          </Text>
          <Text style={styles.setupSubtitle}>Wie spelen er mee?</Text>

          <View style={styles.nameFields}>
            <View style={styles.nameRow}>
              <View style={[styles.colorDot, { backgroundColor: '#FFF5E6', borderColor: '#ccc' }]} />
              <TextInput
                style={styles.nameInput}
                placeholder="Naam wit"
                placeholderTextColor="#555"
                value={nameWhite}
                onChangeText={setNameWhite}
                autoFocus
                returnKeyType={mode === 'ai' ? 'go' : 'next'}
                onSubmitEditing={mode === 'ai' ? startGame : undefined}
              />
            </View>

            {mode !== 'ai' && (
              <View style={styles.nameRow}>
                <View style={[styles.colorDot, { backgroundColor: '#2A1810', borderColor: '#555' }]} />
                <TextInput
                  style={styles.nameInput}
                  placeholder="Naam zwart"
                  placeholderTextColor="#555"
                  value={nameBlack}
                  onChangeText={setNameBlack}
                  returnKeyType="go"
                  onSubmitEditing={startGame}
                />
              </View>
            )}

            {mode === 'ai' && (
              <View style={styles.nameRow}>
                <View style={[styles.colorDot, { backgroundColor: '#2A1810', borderColor: '#555' }]} />
                <View style={styles.aiLabel}>
                  <FontAwesome name="desktop" size={16} color={AppColors.accent} />
                  <Text style={styles.aiText}>Computer</Text>
                </View>
              </View>
            )}

            {mode === 'ai' && (
              <View style={styles.levelSection}>
                <Text style={styles.levelTitle}>Hoe sterk?</Text>
                <View style={styles.levelButtons}>
                  {AI_LEVELS.map((lvl) => (
                    <Pressable
                      key={lvl.value}
                      style={[
                        styles.levelBtn,
                        aiLevel === lvl.value && styles.levelBtnActive,
                      ]}
                      onPress={() => setAiLevelLocal(lvl.value)}
                    >
                      <Text style={styles.levelEmoji}>{lvl.emoji}</Text>
                      <Text style={[
                        styles.levelLabel,
                        aiLevel === lvl.value && styles.levelLabelActive,
                      ]}>
                        {lvl.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              pressed && styles.startBtnPressed,
            ]}
            onPress={startGame}
          >
            <Text style={styles.startBtnText}>Speel!</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // Game scherm
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Compacte top bar */}
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
      {aiThinking && (
        <View style={styles.statusBar}>
          <Text style={styles.thinkingText}>Computer denkt na...</Text>
        </View>
      )}
      {!aiThinking && status !== 'playing' && (
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

      {/* Board — maximaal schermvullend */}
      <View style={styles.boardArea}>
        <ChessBoard />
      </View>

      {/* Compacte bottom bar */}
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
            onPress={() => {
              newGame(mode);
              setPhase('setup');
            }}
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
      <View style={[styles.dot, { backgroundColor: color === 'w' ? '#FFF5E6' : '#2A1810' }]} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  // Setup scherm
  setupContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backBtn: {
    marginBottom: 24,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.text,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 16,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  nameFields: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  nameInput: {
    flex: 1,
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '500',
    padding: 0,
  },
  levelSection: {
    marginTop: 8,
  },
  levelTitle: {
    color: AppColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  levelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    minWidth: 62,
  },
  levelBtnActive: {
    backgroundColor: AppColors.primary + '30',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  levelEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  levelLabel: {
    color: AppColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  levelLabelActive: {
    color: AppColors.primary,
  },
  aiLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiText: {
    color: AppColors.accent,
    fontSize: 18,
    fontWeight: '600',
  },
  startBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  startBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  startBtnText: {
    color: '#1A1A2E',
    fontSize: 20,
    fontWeight: '800',
  },
  // Game scherm
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    paddingVertical: 4,
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
    paddingVertical: 2,
  },
  statusText: {
    color: AppColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  thinkingText: {
    color: AppColors.accent,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  movesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
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
    marginTop: 4,
  },
  newGameText: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '700',
  },
});
