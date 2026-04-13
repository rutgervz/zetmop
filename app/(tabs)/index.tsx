import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Svg, Path, Rect, Circle, Line } from 'react-native-svg';
import Colors from '@/constants/Colors';

// === SVG ICONEN ===

function CrownIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 18h18v2H3v-2zm1.5-4L6 7l4.5 3L12 4l1.5 6L18 7l1.5 7H4.5z" fill={Colors.gold} />
    </Svg>
  );
}

function LokaalIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Rect x={1} y={1} width={12} height={12} rx={1.5} fill={Colors.gold} opacity={0.35} />
      <Rect x={17} y={1} width={12} height={12} rx={1.5} fill={Colors.gold} opacity={0.15} />
      <Rect x={1} y={17} width={12} height={12} rx={1.5} fill={Colors.gold} opacity={0.15} />
      <Rect x={17} y={17} width={12} height={12} rx={1.5} fill={Colors.gold} opacity={0.35} />
      <Circle cx={7} cy={7} r={3} fill={Colors.gold} />
      <Circle cx={23} cy={23} r={3} fill={Colors.goldDark} />
    </Svg>
  );
}

function ComputerIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Rect x={3} y={2} width={24} height={16} rx={3} stroke={Colors.gold} strokeWidth={1.5} />
      <Circle cx={15} cy={10} r={3} fill={Colors.gold} opacity={0.35} />
      <Path d="M10 14h10" stroke={Colors.gold} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M15 18v6M10 24h10" stroke={Colors.gold} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function OnlineIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Circle cx={10} cy={10} r={5.5} stroke={Colors.gold} strokeWidth={1.5} />
      <Circle cx={20} cy={10} r={5.5} stroke={Colors.gold} strokeWidth={1.5} />
      <Path d="M10 17c-5 0-8 3-8 6h16c0-3-3-6-8-6z" fill={Colors.gold} opacity={0.2} />
      <Path d="M20 17c-5 0-8 3-8 6h16c0-3-3-6-8-6z" fill={Colors.gold} opacity={0.15} />
    </Svg>
  );
}

function QuaternityIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Rect x={3} y={3} width={24} height={24} rx={2} stroke={Colors.gold} strokeWidth={1.5} />
      <Line x1={15} y1={3} x2={15} y2={27} stroke={Colors.gold} strokeWidth={0.8} opacity={0.3} />
      <Line x1={3} y1={15} x2={27} y2={15} stroke={Colors.gold} strokeWidth={0.8} opacity={0.3} />
      <Circle cx={9} cy={9} r={2.5} fill={Colors.gold} />
      <Circle cx={21} cy={9} r={2.5} fill={Colors.gold} opacity={0.7} />
      <Circle cx={9} cy={21} r={2.5} fill={Colors.gold} opacity={0.5} />
      <Circle cx={21} cy={21} r={2.5} fill={Colors.gold} opacity={0.35} />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={Colors.cream} />
    </Svg>
  );
}

// === MODE DATA ===

const MODES = [
  { key: 'local', title: 'Lokaal', badge: '2 spelers', icon: LokaalIcon, route: '/game/local' },
  { key: 'computer', title: 'Computer', badge: 'Stockfish', icon: ComputerIcon, route: '/game/ai' },
  { key: 'online', title: 'Online', badge: '2 of 4 sp.', icon: OnlineIcon, route: '/game/online' },
  { key: 'quaternity', title: 'Quaternity', badge: '4 spelers', icon: QuaternityIcon, route: '/game/quaternity' },
];

// === COMPONENT ===

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLandscape = width > 768;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        {/* Kroonrij */}
        <View style={styles.crownRow}>
          <View style={styles.crownLine} />
          <CrownIcon />
          <Text style={styles.logoText}>
            Zet <Text style={styles.logoGold}>'m</Text> op!
          </Text>
          <CrownIcon />
          <View style={styles.crownLine} />
        </View>

        {/* Meta rij */}
        <View style={styles.metaRow}>
          <Text style={styles.tagline}>SCHAAK VOOR JONG & OUD</Text>
          <View style={styles.metaDot} />
          <Text style={styles.subtitle}>Samen schaken, samen winnen</Text>
        </View>

        {/* Gouden lijn */}
        <View style={styles.goldLine} />
      </View>

      {/* Vier speelknoppen */}
      <View style={[styles.modesGrid, isLandscape && styles.modesGridRow]}>
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <TouchableOpacity
              key={mode.key}
              style={[styles.modeCard, isLandscape && styles.modeCardWide]}
              onPress={() => router.push(mode.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.modeIconCircle}>
                <Icon />
              </View>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>{mode.badge}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerBrand}>Generation Now Games</Text>
          <Text style={styles.footerSub}>Gratis & open source</Text>
        </View>
        <TouchableOpacity style={styles.donateBtn} activeOpacity={0.8}>
          <HeartIcon />
          <Text style={styles.donateBtnText}>Doneer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// === STYLES ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  crownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  crownLine: {
    width: 50,
    height: 1,
    backgroundColor: Colors.goldLight,
  },
  logoText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 44,
    color: Colors.textDark,
    letterSpacing: -1,
  },
  logoGold: {
    color: Colors.gold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.goldLight,
  },
  subtitle: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    fontSize: 17,
    color: Colors.goldDark,
  },
  goldLine: {
    width: '100%',
    maxWidth: 700,
    height: 1,
    backgroundColor: Colors.goldLight,
    marginTop: 20,
  },

  // Mode cards
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  modesGridRow: {
    // landscape: 4 op een rij
  },
  modeCard: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.goldLight,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '46%',
    minWidth: 140,
  },
  modeCardWide: {
    width: '22%',
  },
  modeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 18,
    color: Colors.textDark,
    marginTop: 14,
  },
  modeBadge: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 8,
  },
  modeBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: Colors.goldDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.goldLight,
  },
  footerBrand: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 13,
    color: Colors.goldDark,
  },
  footerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
  },
  donateBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: Colors.cream,
    letterSpacing: 0.5,
  },
});
