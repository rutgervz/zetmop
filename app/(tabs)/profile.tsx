import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppColors } from '@/constants/Colors';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <FontAwesome name="chess-knight" size={40} color={AppColors.primary} />
        </View>
        <Text style={styles.name}>Schaakspeler</Text>
        <Text style={styles.subtitle}>Log in om je voortgang te bewaren</Text>

        <View style={styles.stats}>
          <StatBox label="Partijen" value="0" />
          <StatBox label="Gewonnen" value="0" />
          <StatBox label="ELO" value="1200" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Over Zet &apos;m op!</Text>
          <Text style={styles.about}>
            Een gratis schaak-app voor iedereen. Geen advertenties, geen in-app aankopen.
            Gemaakt met liefde door Generation Now.
          </Text>
          <Pressable style={styles.donateButton}>
            <FontAwesome name="heart" size={16} color={AppColors.secondary} />
            <Text style={styles.donateText}>Steun dit project</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 32,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 90,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textMuted,
    marginTop: 4,
  },
  section: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 12,
  },
  about: {
    fontSize: 14,
    color: AppColors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  donateText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
