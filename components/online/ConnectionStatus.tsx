import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConnectionState } from '@/lib/online/OnlineGameService';
import { AppColors } from '@/constants/Colors';

const STATUS_CONFIG: Record<ConnectionState, { color: string; text: string } | null> = {
  idle: null,
  connecting: { color: AppColors.warning, text: 'Verbinden...' },
  connected: null, // Don't show when connected
  disconnected: { color: AppColors.error, text: 'Verbinding herstellen...' },
  error: { color: AppColors.error, text: 'Verbinding verbroken' },
};

type Props = {
  state: ConnectionState;
};

export default function ConnectionStatus({ state }: Props) {
  const config = STATUS_CONFIG[state];
  if (!config) return null;

  return (
    <View style={[styles.pill, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, alignSelf: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 13, fontWeight: '600' },
});
