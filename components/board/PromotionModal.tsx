import React from 'react';
import { Modal, View, Pressable, StyleSheet, Text } from 'react-native';
import Piece from './Piece';
import { useGameStore } from '@/stores/gameStore';
import type { PieceSymbol } from '@/lib/chess/types';

const PROMOTION_PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];
const PIECE_NAMES: Record<PieceSymbol, string> = {
  q: 'Dame',
  r: 'Toren',
  b: 'Loper',
  n: 'Paard',
  k: 'Koning',
  p: 'Pion',
};

export default function PromotionModal() {
  const pendingPromotion = useGameStore((s) => s.pendingPromotion);
  const setPromotion = useGameStore((s) => s.setPromotion);
  const cancelPromotion = useGameStore((s) => s.cancelPromotion);
  const turn = useGameStore((s) => s.turn);

  if (!pendingPromotion) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Kies een stuk</Text>
          <View style={styles.pieces}>
            {PROMOTION_PIECES.map((piece) => (
              <Pressable
                key={piece}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => setPromotion(piece)}
              >
                <Piece type={piece} color={turn} size={60} />
                <Text style={styles.label}>{PIECE_NAMES[piece]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.cancel} onPress={cancelPromotion}>
            <Text style={styles.cancelText}>Annuleren</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  pieces: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#3C3C3C',
    minWidth: 70,
  },
  optionPressed: {
    backgroundColor: '#5C5C5C',
  },
  label: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  cancel: {
    marginTop: 16,
    padding: 8,
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
  },
});
