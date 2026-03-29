import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppColors } from '@/constants/Colors';

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="graduation-cap" size={48} color={AppColors.textMuted} />
        <Text style={styles.title}>Schaaklessen</Text>
        <Text style={styles.subtitle}>
          Van beginner tot gevorderd. Interactieve lessen en puzzels komen binnenkort!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
