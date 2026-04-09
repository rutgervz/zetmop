import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { AppColors } from '@/constants/Colors';

type Props = {
  onComplete: (code: string) => void;
  error?: string | null;
};

export default function RoomCodeInput({ onComplete, error }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const clean = text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    setValue(clean);
    if (clean.length === 6) {
      onComplete(clean);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Voer de kamercode in</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder="ABCDEF"
          placeholderTextColor="#444"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.hint}>6 letters, deel de code met je tegenstander</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  label: { color: AppColors.textMuted, fontSize: 14, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    width: 260, height: 56, borderRadius: 12,
    backgroundColor: AppColors.surface,
    borderWidth: 2, borderColor: AppColors.surfaceLight,
    color: AppColors.text, fontSize: 28, fontWeight: '800',
    textAlign: 'center', letterSpacing: 8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'SpaceMono',
  },
  error: { color: AppColors.error, fontSize: 13, fontWeight: '500' },
  hint: { color: '#555', fontSize: 12 },
});
