import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppColors } from '@/constants/Colors';
import type { LobbyPlayer } from '@/lib/online/protocol';

const COLOR_MAP: Record<string, string> = {
  w: '#FFFFFF', b: '#1A1A1A', r: '#E84040', g: '#2AAA6A',
};

type Props = {
  players: LobbyPlayer[];
  hostId: string;
  aiSlots?: string[];
  maxPlayers: number;
};

export default function PlayerList({ players, hostId, aiSlots = [], maxPlayers }: Props) {
  const emptySlots = maxPlayers - players.length - aiSlots.length;

  return (
    <View style={styles.container}>
      {players.map((p) => (
        <View key={p.id} style={styles.row}>
          <View style={[styles.dot, p.color ? { backgroundColor: COLOR_MAP[p.color] || '#888' } : {}]}>
            {!p.connected && <View style={styles.disconnected} />}
          </View>
          <Text style={styles.name}>{p.name}</Text>
          {p.id === hostId && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Host</Text>
            </View>
          )}
          {p.connected ? (
            <FontAwesome name="circle" size={8} color={AppColors.success} style={styles.status} />
          ) : (
            <FontAwesome name="circle-o" size={8} color={AppColors.error} style={styles.status} />
          )}
        </View>
      ))}
      {aiSlots.map((color) => (
        <View key={`ai-${color}`} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLOR_MAP[color] || '#888' }]} />
          <Text style={styles.name}>Computer</Text>
          <View style={[styles.badge, { backgroundColor: AppColors.accent + '20' }]}>
            <Text style={[styles.badgeText, { color: AppColors.accent }]}>AI</Text>
          </View>
        </View>
      ))}
      {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
        <View key={`empty-${i}`} style={[styles.row, styles.emptyRow]}>
          <View style={[styles.dot, styles.emptyDot]} />
          <Text style={styles.emptyText}>Wachten op speler...</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: AppColors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  emptyRow: { opacity: 0.4 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#555',
    backgroundColor: '#444',
  },
  emptyDot: { borderStyle: 'dashed' },
  disconnected: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,0,0,0.4)', borderRadius: 10,
  },
  name: { flex: 1, color: AppColors.text, fontSize: 16, fontWeight: '600' },
  emptyText: { flex: 1, color: '#555', fontSize: 14, fontStyle: 'italic' },
  badge: {
    backgroundColor: AppColors.gold + '20',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  badgeText: { color: AppColors.gold, fontSize: 11, fontWeight: '700' },
  status: { marginLeft: 4 },
});
