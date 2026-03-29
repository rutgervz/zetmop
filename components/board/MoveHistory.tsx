import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '@/stores/gameStore';

export default function MoveHistory() {
  const moveHistory = useGameStore((s) => s.moveHistory);

  // Group moves in pairs (white, black)
  const pairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    });
  }

  if (pairs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Nog geen zetten</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {pairs.map((pair) => (
        <View key={pair.number} style={styles.row}>
          <Text style={styles.number}>{pair.number}.</Text>
          <Text style={styles.move}>{pair.white}</Text>
          <Text style={styles.move}>{pair.black || ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 200,
  },
  content: {
    padding: 8,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  number: {
    color: '#888',
    width: 32,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  move: {
    color: '#fff',
    width: 60,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
