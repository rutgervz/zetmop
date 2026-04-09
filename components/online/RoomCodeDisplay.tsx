import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppColors } from '@/constants/Colors';

type Props = {
  code: string;
};

export default function RoomCodeDisplay({ code }: Props) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kamercode</Text>
      <View style={styles.codeRow}>
        {code.split('').map((char, i) => (
          <View key={i} style={styles.charBox}>
            <Text style={styles.charText}>{char}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={copyCode} style={styles.copyBtn} hitSlop={12}>
        <FontAwesome name={copied ? 'check' : 'copy'} size={16} color={AppColors.primary} />
        <Text style={styles.copyText}>{copied ? 'Gekopieerd!' : 'Kopieer code'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  label: { color: AppColors.textMuted, fontSize: 14, fontWeight: '500' },
  codeRow: { flexDirection: 'row', gap: 8 },
  charBox: {
    width: 44, height: 52, borderRadius: 10,
    backgroundColor: AppColors.surface,
    borderWidth: 2, borderColor: AppColors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  charText: {
    color: AppColors.text, fontSize: 24, fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'SpaceMono',
    letterSpacing: 2,
  },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  copyText: { color: AppColors.primary, fontSize: 14, fontWeight: '600' },
});
