import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppColors } from '@/constants/Colors';
import { useGameStore } from '@/stores/gameStore';

type GameOption = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PlayScreen() {
  const newGame = useGameStore((s) => s.newGame);

  const options: GameOption[] = [
    {
      title: 'Lokaal spelen',
      subtitle: 'Twee spelers, één scherm',
      icon: 'handshake-o',
      color: AppColors.primary,
      onPress: () => {
        newGame('local');
        router.push('/game/local');
      },
    },
    {
      title: 'Tegen de computer',
      subtitle: 'Speel tegen Stockfish AI',
      icon: 'desktop',
      color: AppColors.accent,
      onPress: () => {
        newGame('ai');
        router.push('/game/ai');
      },
    },
    {
      title: 'Online spelen',
      subtitle: 'Daag iemand uit in je groep',
      icon: 'globe',
      color: AppColors.gold,
      onPress: () => {},
      disabled: true,
    },
    {
      title: 'Quaternity',
      subtitle: 'Schaak met vier spelers',
      icon: 'th-large',
      color: AppColors.secondary,
      onPress: () => {
        router.push('/game/quaternity');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>♟ Zet &apos;m op!</Text>
        <Text style={styles.tagline}>Samen schaken, samen leren</Text>
      </View>

      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option.title}
            style={({ pressed }) => [
              styles.card,
              pressed && !option.disabled && styles.cardPressed,
              option.disabled && styles.cardDisabled,
            ]}
            onPress={option.onPress}
            disabled={option.disabled}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <FontAwesome name={option.icon} size={28} color={option.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            </View>
            {option.disabled && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Binnenkort</Text>
              </View>
            )}
            {!option.disabled && (
              <FontAwesome name="chevron-right" size={16} color="#555" />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>
        Een Generation Now app · Gratis en open source
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: AppColors.textMuted,
    marginTop: 8,
  },
  options: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: AppColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: AppColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: AppColors.textMuted,
    fontSize: 11,
  },
  footer: {
    color: '#555',
    textAlign: 'center',
    fontSize: 12,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
});
