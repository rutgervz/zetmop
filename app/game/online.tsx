import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ChessBoard from '@/components/board/ChessBoard';
import QuaternityBoard from '@/components/board/QuaternityBoard';
import GameLog from '@/components/board/GameLog';
import RoomCodeDisplay from '@/components/online/RoomCodeDisplay';
import RoomCodeInput from '@/components/online/RoomCodeInput';
import PlayerList from '@/components/online/PlayerList';
import ConnectionStatus from '@/components/online/ConnectionStatus';
import ChatPanel from '@/components/online/ChatPanel';
import { useOnlineStore } from '@/stores/onlineStore';
import { useGameStore } from '@/stores/gameStore';
import { useQuaternityStore, type QuaterColor } from '@/stores/quaternityStore';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { useChessMoveLog } from '@/hooks/useChessMoveLog';
import { useQuaternityMoveLog } from '@/hooks/useQuaternityMoveLog';
import { useGameTimer } from '@/hooks/useGameTimer';
import { AppColors } from '@/constants/Colors';
import type { GameType } from '@/lib/online/protocol';

const QUATER_COLORS: QuaterColor[] = ['w', 'r', 'b', 'g'];
const QUATER_LABELS: Record<QuaterColor, string> = { w: 'Wit', r: 'Rood', b: 'Zwart', g: 'Groen' };
const QUATER_DOTS: Record<QuaterColor, string> = { w: '#FFFFFF', r: '#E84040', b: '#1A1A1A', g: '#2AAA6A' };

export default function OnlineScreen() {
  const [phase, setPhase] = useState<'setup' | 'create' | 'join' | 'lobby' | 'playing'>('setup');
  const [playerName, setPlayerName] = useState('');
  const [gameType, setGameType] = useState<GameType>('chess');
  const [joinError, setJoinError] = useState<string | null>(null);

  const connectionState = useOnlineStore((s) => s.connectionState);
  const roomCode = useOnlineStore((s) => s.roomCode);
  const isHost = useOnlineStore((s) => s.isHost);
  const lobbyPhase = useOnlineStore((s) => s.lobbyPhase);
  const players = useOnlineStore((s) => s.players);
  const aiSlots = useOnlineStore((s) => s.aiSlots);
  const myColor = useOnlineStore((s) => s.myColor);
  const playerId = useOnlineStore((s) => s.playerId);
  const createRoom = useOnlineStore((s) => s.createRoom);
  const joinRoom = useOnlineStore((s) => s.joinRoom);
  const leaveRoom = useOnlineStore((s) => s.leaveRoom);
  const startGame = useOnlineStore((s) => s.startGame);
  const toggleAiSlot = useOnlineStore((s) => s.toggleAiSlot);
  const onlineError = useOnlineStore((s) => s.error);

  // Transition to lobby when connected
  useEffect(() => {
    if (lobbyPhase === 'waiting' && (phase === 'create' || phase === 'join')) {
      setPhase('lobby');
    }
    if (lobbyPhase === 'playing' && phase !== 'playing') {
      // Game started! Initialize the right game store
      if (gameType === 'chess') {
        const myCol = myColor as 'w' | 'b';
        const opponentName = players.find((p) => p.id !== playerId)?.name || 'Tegenstander';
        const white = myCol === 'w' ? (playerName || 'Jij') : opponentName;
        const black = myCol === 'b' ? (playerName || 'Jij') : opponentName;
        useGameStore.getState().setPlayerNames(white, black);
        useGameStore.getState().newGame('online');
        if (myCol === 'b') {
          useGameStore.setState({ boardFlipped: true });
        }
      } else {
        // Quaternity
        const names: Record<QuaterColor, string> = { w: 'Wit', r: 'Rood', b: 'Zwart', g: 'Groen' };
        for (const p of players) {
          if (p.color) names[p.color as QuaterColor] = p.name;
        }
        for (const ai of aiSlots) {
          names[ai] = 'Computer';
        }
        useQuaternityStore.getState().setPlayerNames(names);
        useQuaternityStore.getState().setAiPlayers(isHost ? aiSlots : []);
        useQuaternityStore.getState().setOnlineMode(true, isHost ? playerId : undefined);
        useQuaternityStore.getState().newGame();
      }
      setPhase('playing');
    }
  }, [lobbyPhase]);

  const handleCreateRoom = async () => {
    const name = playerName.trim() || 'Speler';
    await createRoom(gameType, name);
    setPhase('create');
  };

  const handleJoinRoom = async (code: string) => {
    setJoinError(null);
    const name = playerName.trim() || 'Speler';
    await joinRoom(code, name);
  };

  const handleBack = () => {
    if (phase === 'playing') {
      leaveRoom();
    } else if (phase === 'lobby' || phase === 'create') {
      leaveRoom();
    }
    if (phase === 'setup') {
      router.back();
    } else {
      setPhase('setup');
    }
  };

  const canStart = () => {
    if (gameType === 'chess') return players.length >= 2;
    // Quaternity: need at least 2 total (human + AI)
    return players.length + aiSlots.length >= 2;
  };

  // === SETUP ===
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.setupContainer}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <FontAwesome name="chevron-left" size={18} color="#666" />
          </Pressable>

          <Text style={styles.title}>Online spelen</Text>
          <Text style={styles.subtitle}>Speel tegen vrienden of familie</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Jouw naam</Text>
            <TextInput
              style={styles.nameInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Hoe heet je?"
              placeholderTextColor="#555"
              returnKeyType="done"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Speltype</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeBtn, gameType === 'chess' && styles.typeBtnActive]}
                onPress={() => setGameType('chess')}
              >
                <Text style={styles.typeIcon}>♟</Text>
                <Text style={[styles.typeText, gameType === 'chess' && styles.typeTextActive]}>Schaak</Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, gameType === 'quaternity' && styles.typeBtnActive]}
                onPress={() => setGameType('quaternity')}
              >
                <Text style={styles.typeIcon}>♛</Text>
                <Text style={[styles.typeText, gameType === 'quaternity' && styles.typeTextActive]}>Quaternity</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.createBtn, pressed && styles.btnPressed]}
              onPress={handleCreateRoom}
            >
              <FontAwesome name="plus-circle" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Maak een kamer</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.joinBtn, pressed && styles.btnPressed]}
              onPress={() => setPhase('join')}
            >
              <FontAwesome name="sign-in" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Neem deel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // === JOIN (code input) ===
  if (phase === 'join') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.setupContainer}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <FontAwesome name="chevron-left" size={18} color="#666" />
          </Pressable>

          <Text style={styles.title}>Neem deel</Text>
          <View style={{ marginTop: 40 }}>
            <RoomCodeInput onComplete={handleJoinRoom} error={joinError || onlineError} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // === LOBBY (waiting for players / start) ===
  if (phase === 'lobby' || phase === 'create') {
    const maxPlayers = gameType === 'chess' ? 2 : 4;
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.setupContainer}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <FontAwesome name="chevron-left" size={18} color="#666" />
          </Pressable>

          <Text style={styles.title}>
            {gameType === 'chess' ? '♟ Schaak' : '♛ Quaternity'}
          </Text>

          {roomCode && (
            <View style={{ marginTop: 20 }}>
              <RoomCodeDisplay code={roomCode} />
            </View>
          )}

          <ConnectionStatus state={connectionState} />

          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionLabel}>Spelers</Text>
            <PlayerList
              players={players}
              hostId={playerId}
              aiSlots={aiSlots}
              maxPlayers={maxPlayers}
            />
          </View>

          {/* Quaternity AI slot toggles (host only) */}
          {isHost && gameType === 'quaternity' && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionLabel}>Computer-spelers</Text>
              <View style={styles.aiToggleRow}>
                {QUATER_COLORS.map((color) => {
                  const isAi = aiSlots.includes(color);
                  const isTakenByHuman = players.some((p) => p.color === color);
                  return (
                    <Pressable
                      key={color}
                      style={[styles.aiChip, isAi && styles.aiChipActive]}
                      onPress={() => toggleAiSlot(color)}
                      disabled={isTakenByHuman}
                    >
                      <View style={[styles.aiChipDot, { backgroundColor: QUATER_DOTS[color] }]} />
                      <Text style={[styles.aiChipText, isAi && styles.aiChipTextActive]}>
                        {QUATER_LABELS[color]}
                      </Text>
                      <FontAwesome
                        name={isAi ? 'desktop' : 'user'}
                        size={12}
                        color={isAi ? AppColors.accent : '#666'}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {isHost ? (
            <Pressable
              style={({ pressed }) => [
                styles.startBtn,
                !canStart() && styles.startBtnDisabled,
                pressed && canStart() && styles.btnPressed,
              ]}
              onPress={startGame}
              disabled={!canStart()}
            >
              <Text style={styles.startBtnText}>
                {canStart() ? 'Start!' : 'Wachten op spelers...'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingText}>Wachten tot de host het spel start...</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  // === PLAYING ===
  return <OnlineGameView gameType={gameType} onBack={handleBack} />;
}

/**
 * Separated component to mount the sync hook only during play.
 */
function OnlineGameView({ gameType, onBack }: { gameType: GameType; onBack: () => void }) {
  useOnlineSync();

  const connectionState = useOnlineStore((s) => s.connectionState);

  if (gameType === 'chess') {
    return <ChessOnlineGame onBack={onBack} connectionState={connectionState} />;
  }
  return <QuaternityOnlineGame onBack={onBack} connectionState={connectionState} />;
}

function ChessOnlineGame({ onBack, connectionState }: { onBack: () => void; connectionState: string }) {
  const [chatOpen, setChatOpen] = useState(true);
  const { width: ww } = useWindowDimensions();
  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const playerWhite = useGameStore((s) => s.playerWhite);
  const playerBlack = useGameStore((s) => s.playerBlack);
  const lastEvent = useGameStore((s) => s.lastEvent);
  const myColor = useOnlineStore((s) => s.myColor);
  const unreadCount = useOnlineStore((s) => s.unreadCount);

  const logEntries = useChessMoveLog();
  const elapsed = useGameTimer(!['checkmate', 'stalemate', 'draw', 'resigned'].includes(status));
  const showSideLog = ww > 700;

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned'].includes(status);
  const turnName = turn === 'w' ? playerWhite : playerBlack;
  const isMyTurn = turn === myColor;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color="#666" />
        </Pressable>
        <View style={styles.turnInfo}>
          <View style={[styles.turnDot, { backgroundColor: turn === 'w' ? '#FFF' : '#222' }]} />
          <Text style={styles.turnText}>
            {isGameOver
              ? (status === 'checkmate' && lastEvent?.type === 'checkmate'
                ? `${lastEvent.winner === 'w' ? playerWhite : playerBlack} wint!`
                : 'Remise')
              : isMyTurn ? 'Jij bent aan zet' : `${turnName} denkt na...`
            }
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <ConnectionStatus state={connectionState as any} />
          <ChatToggle onPress={() => setChatOpen(true)} unread={unreadCount} />
        </View>
      </SafeAreaView>

      <View style={[styles.boardArea, showSideLog && styles.boardAreaRow]}>
        {showSideLog && (
          <View style={styles.sideLog}>
            <GameLog entries={logEntries} elapsedSeconds={elapsed} />
          </View>
        )}
        <ChessBoard />
      </View>

      <SafeAreaView style={styles.bottomBar}>
        {!showSideLog && (
          <View style={styles.bottomLog}>
            <GameLog entries={logEntries} elapsedSeconds={elapsed} maxHeight={120} />
          </View>
        )}
      </SafeAreaView>

      <ChatPanel visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

function QuaternityOnlineGame({ onBack, connectionState }: { onBack: () => void; connectionState: string }) {
  const [chatOpen, setChatOpen] = useState(true);
  const { width: ww } = useWindowDimensions();
  const turn = useQuaternityStore((s) => s.turn);
  const status = useQuaternityStore((s) => s.status);
  const playerNames = useQuaternityStore((s) => s.playerNames);
  const activePlayers = useQuaternityStore((s) => s.activePlayers);
  const winner = useQuaternityStore((s) => s.winner);
  const myColor = useOnlineStore((s) => s.myColor);
  const unreadCount = useOnlineStore((s) => s.unreadCount);

  const logEntries = useQuaternityMoveLog();
  const elapsed = useGameTimer(status !== 'finished');
  const showSideLog = ww > 800;

  const isFinished = status === 'finished';
  const turnName = playerNames[turn];
  const isMyTurn = turn === myColor;

  const PLAYER_INFO = [
    { color: 'w' as QuaterColor, dot: '#FFFFFF' },
    { color: 'r' as QuaterColor, dot: '#E84040' },
    { color: 'b' as QuaterColor, dot: '#1A1A1A' },
    { color: 'g' as QuaterColor, dot: '#2AAA6A' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color="#666" />
        </Pressable>
        <View style={styles.turnInfo}>
          {PLAYER_INFO.map((p) => (
            <View
              key={p.color}
              style={[
                styles.turnDot,
                { backgroundColor: p.dot },
                !activePlayers.includes(p.color) && { opacity: 0.2 },
                turn === p.color && !isFinished && styles.turnDotActive,
              ]}
            />
          ))}
          <Text style={styles.turnText}>
            {isFinished
              ? `${playerNames[winner!]} wint!`
              : isMyTurn ? 'Jij bent aan zet' : `${turnName} is aan zet`
            }
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <ConnectionStatus state={connectionState as any} />
          <ChatToggle onPress={() => setChatOpen(true)} unread={unreadCount} />
        </View>
      </SafeAreaView>

      <View style={[styles.boardArea, showSideLog && styles.boardAreaRow]}>
        {showSideLog && (
          <View style={styles.sideLog}>
            <GameLog entries={logEntries} elapsedSeconds={elapsed} />
          </View>
        )}
        <QuaternityBoard />
      </View>

      <SafeAreaView style={styles.bottomBar}>
        {!showSideLog && (
          <View style={styles.bottomLog}>
            <GameLog entries={logEntries} elapsedSeconds={elapsed} maxHeight={120} />
          </View>
        )}
      </SafeAreaView>

      <ChatPanel visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

function ChatToggle({ onPress, unread }: { onPress: () => void; unread: number }) {
  return (
    <Pressable onPress={onPress} style={chatToggleStyles.btn} hitSlop={8}>
      <FontAwesome name="comment" size={18} color={AppColors.primary} />
      {unread > 0 && (
        <View style={chatToggleStyles.badge}>
          <Text style={chatToggleStyles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const chatToggleStyles = StyleSheet.create({
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: AppColors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: AppColors.secondary,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  setupContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: AppColors.text, textAlign: 'center' },
  subtitle: { fontSize: 16, color: AppColors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  section: { marginTop: 20 },
  sectionLabel: { color: AppColors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  nameInput: {
    backgroundColor: AppColors.surface, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    color: AppColors.text, fontSize: 17, fontWeight: '500',
  },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: AppColors.surface, borderRadius: 14,
    paddingVertical: 14, borderWidth: 2, borderColor: 'transparent',
  },
  typeBtnActive: { borderColor: AppColors.primary },
  typeIcon: { fontSize: 20 },
  typeText: { color: AppColors.textMuted, fontSize: 16, fontWeight: '600' },
  typeTextActive: { color: AppColors.primary },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  createBtn: { backgroundColor: AppColors.primary },
  joinBtn: { backgroundColor: AppColors.accent },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  startBtn: {
    backgroundColor: AppColors.secondary, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', marginTop: 32,
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  waitingBox: { marginTop: 32, alignItems: 'center' },
  waitingText: { color: AppColors.textMuted, fontSize: 15, fontStyle: 'italic' },
  aiToggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: AppColors.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  aiChipActive: { backgroundColor: AppColors.accent + '15' },
  aiChipDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#555' },
  aiChipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  aiChipTextActive: { color: AppColors.accent },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 4,
  },
  turnInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  turnDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#555' },
  turnDotActive: { borderColor: AppColors.gold, borderWidth: 2, transform: [{ scale: 1.3 }] },
  turnText: { color: '#999', fontSize: 13, fontWeight: '500', marginLeft: 4 },
  boardArea: { flex: 1, justifyContent: 'flex-start', alignItems: 'center' },
  boardAreaRow: {
    flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 12, paddingHorizontal: 12,
  },
  sideLog: { width: 220, minHeight: 200 },
  bottomLog: { width: '100%', marginBottom: 4 },
  bottomBar: { paddingHorizontal: 12, paddingBottom: 4, alignItems: 'center' },
});
