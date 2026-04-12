import React from 'react';
import { Modal, View, Pressable, StyleSheet, Text } from 'react-native';
import Piece from './Piece';
import { useGameStore } from '@/stores/gameStore';
import { AppColors } from '@/constants/Colors';
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
    backgroundColor: '#FBF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8D5A0',
    padding: 24,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    color: AppColors.text,
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
    backgroundColor: '#F5F0E4',
    borderWidth: 1,
    borderColor: '#E8D5A0',
    minWidth: 70,
  },
  optionPressed: {
    backgroundColor: '#E8D5A0',
  },
  label: {
    color: '#6B6B7B',
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
