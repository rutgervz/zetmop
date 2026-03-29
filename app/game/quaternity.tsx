import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { router, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import QuaternityBoard from '@/components/board/QuaternityBoard';
import { useQuaternityStore, type QuaterColor } from '@/stores/quaternityStore';
import { AppColors } from '@/constants/Colors';

const PLAYER_INFO: { color: QuaterColor; label: string; bg: string; dot: string }[] = [
  { color: 'w', label: 'Zuid', bg: '#FFFFFF', dot: '#FFFFFF' },
  { color: 'r', label: 'West', bg: '#E84040', dot: '#E84040' },
  { color: 'b', label: 'Noord', bg: '#1A1A1A', dot: '#1A1A1A' },
  { color: 'g', label: 'Oost', bg: '#2AAA6A', dot: '#2AAA6A' },
];

export default function QuaternityScreen() {
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup');
  const [names, setNames] = useState({ w: '', r: '', b: '', g: '' });

  const turn = useQuaternityStore((s) => s.turn);
  const status = useQuaternityStore((s) => s.status);
  const activePlayers = useQuaternityStore((s) => s.activePlayers);
  const playerNames = useQuaternityStore((s) => s.playerNames);
  const winner = useQuaternityStore((s) => s.winner);
  const lastEvent = useQuaternityStore((s) => s.lastEvent);
  const newGame = useQuaternityStore((s) => s.newGame);
  const setPlayerNames = useQuaternityStore((s) => s.setPlayerNames);
  const moveHistory = useQuaternityStore((s) => s.moveHistory);

  const recentMoves = moveHistory.slice(-4);

  const startGame = () => {
    setPlayerNames({
      w: names.w.trim() || 'Wit',
      r: names.r.trim() || 'Rood',
      b: names.b.trim() || 'Zwart',
      g: names.g.trim() || 'Groen',
    });
    newGame();
    setPhase('playing');
  };

  // Setup scherm
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.setupContainer}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <FontAwesome name="chevron-left" size={18} color="#666" />
          </Pressable>

          <Text style={styles.setupTitle}>♟ Quaternity</Text>
          <Text style={styles.setupSubtitle}>Schaak met vier spelers</Text>

          <View style={styles.nameFields}>
            {PLAYER_INFO.map((p) => (
              <View key={p.color} style={styles.nameRow}>
                <View style={[styles.colorDot, { backgroundColor: p.dot, borderColor: p.color === 'b' ? '#555' : '#ccc' }]} />
                <TextInput
                  style={styles.nameInput}
                  placeholder={`${p.label} speler`}
                  placeholderTextColor="#555"
                  value={names[p.color]}
                  onChangeText={(t) => setNames({ ...names, [p.color]: t })}
                  returnKeyType={p.color === 'g' ? 'go' : 'next'}
                  onSubmitEditing={p.color === 'g' ? startGame : undefined}
                />
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
            onPress={startGame}
          >
            <Text style={styles.startBtnText}>Speel!</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // Game scherm
  const turnName = playerNames[turn];
  const isFinished = status === 'finished';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color="#666" />
        </Pressable>

        <View style={styles.turnIndicator}>
          {PLAYER_INFO.map((p) => (
            <View
              key={p.color}
              style={[
                styles.turnDot,
                { backgroundColor: p.dot },
                !activePlayers.includes(p.color) && styles.turnDotEliminated,
                turn === p.color && !isFinished && styles.turnDotActive,
              ]}
            />
          ))}
          <Text style={styles.turnText}>
            {isFinished
              ? `${playerNames[winner!]} wint!`
              : `${turnName} is aan zet`
            }
          </Text>
        </View>

        <View style={{ width: 18 }} />
      </SafeAreaView>

      {/* Eliminatie melding */}
      {lastEvent?.type === 'elimination' && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {playerNames[lastEvent.eliminated]} is uitgeschakeld!
          </Text>
        </View>
      )}

      <View style={styles.boardArea}>
        <QuaternityBoard />
      </View>

      <SafeAreaView style={styles.bottomBar}>
        {recentMoves.length > 0 && (
          <View style={styles.movesRow}>
            {recentMoves.map((move, i) => (
              <Text key={i} style={[styles.moveText, i === recentMoves.length - 1 && styles.moveTextLast]}>
                {move}
              </Text>
            ))}
          </View>
        )}
        {isFinished && (
          <Pressable
            style={styles.newGameBtn}
            onPress={() => { newGame(); setPhase('setup'); }}
          >
            <Text style={styles.newGameText}>Nieuw spel</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  setupContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 24 },
  setupTitle: { fontSize: 28, fontWeight: '800', color: AppColors.text, textAlign: 'center' },
  setupSubtitle: { fontSize: 16, color: AppColors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  nameFields: { gap: 12 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: AppColors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
  },
  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  nameInput: { flex: 1, color: AppColors.text, fontSize: 17, fontWeight: '500', padding: 0 },
  startBtn: {
    backgroundColor: AppColors.secondary, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', marginTop: 32,
  },
  startBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  startBtnText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 4,
  },
  turnIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  turnDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#555' },
  turnDotActive: { borderColor: AppColors.gold, borderWidth: 2, transform: [{ scale: 1.3 }] },
  turnDotEliminated: { opacity: 0.2 },
  turnText: { color: '#999', fontSize: 13, fontWeight: '500', marginLeft: 4 },
  statusBar: { alignItems: 'center', paddingVertical: 2 },
  statusText: { color: AppColors.gold, fontSize: 14, fontWeight: '600' },
  boardArea: { flex: 1, justifyContent: 'flex-start', alignItems: 'center' },
  bottomBar: { paddingHorizontal: 12, paddingBottom: 4, alignItems: 'center' },
  movesRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  moveText: { color: '#555', fontSize: 12, fontVariant: ['tabular-nums'] },
  moveTextLast: { color: '#999', fontWeight: '600' },
  newGameBtn: {
    backgroundColor: AppColors.secondary, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, marginTop: 4,
  },
  newGameText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
