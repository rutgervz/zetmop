import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Platform, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { AppColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useGameStore } from '@/stores/gameStore';

// Custom SVG iconen uit de design spec
function IconLokaal() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Rect x={1} y={1} width={12} height={12} rx={1.5} fill="#C4A35A" opacity={0.35} />
      <Rect x={17} y={1} width={12} height={12} rx={1.5} fill="#C4A35A" opacity={0.15} />
      <Rect x={1} y={17} width={12} height={12} rx={1.5} fill="#C4A35A" opacity={0.15} />
      <Rect x={17} y={17} width={12} height={12} rx={1.5} fill="#C4A35A" opacity={0.35} />
      <Circle cx={7} cy={7} r={3} fill="#C4A35A" />
      <Circle cx={23} cy={23} r={3} fill="#9B7E3A" />
    </Svg>
  );
}

function IconComputer() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Rect x={3} y={2} width={24} height={16} rx={3} stroke="#C4A35A" strokeWidth={1.5} />
      <Circle cx={15} cy={10} r={3} fill="#C4A35A" opacity={0.35} />
      <Path d="M10 14h10" stroke="#C4A35A" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M15 18v6M10 24h10" stroke="#C4A35A" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconOnline() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Circle cx={10} cy={10} r={5.5} stroke="#C4A35A" strokeWidth={1.5} />
      <Circle cx={20} cy={10} r={5.5} stroke="#C4A35A" strokeWidth={1.5} />
      <Path d="M10 17c-5 0-8 3-8 6h16c0-3-3-6-8-6z" fill="#C4A35A" opacity={0.2} />
      <Path d="M20 17c-5 0-8 3-8 6h16c0-3-3-6-8-6z" fill="#C4A35A" opacity={0.15} />
    </Svg>
  );
}

function IconQuaternity() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Rect x={3} y={3} width={24} height={24} rx={2} stroke="#C4A35A" strokeWidth={1.5} />
      <Line x1={15} y1={3} x2={15} y2={27} stroke="#C4A35A" strokeWidth={0.8} opacity={0.3} />
      <Line x1={3} y1={15} x2={27} y2={15} stroke="#C4A35A" strokeWidth={0.8} opacity={0.3} />
      <Circle cx={9} cy={9} r={2.5} fill="#C4A35A" />
      <Circle cx={21} cy={9} r={2.5} fill="#C4A35A" opacity={0.7} />
      <Circle cx={9} cy={21} r={2.5} fill="#C4A35A" opacity={0.5} />
      <Circle cx={21} cy={21} r={2.5} fill="#C4A35A" opacity={0.35} />
    </Svg>
  );
}

function CrownIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 18h18v2H3v-2zm1.5-4L6 7l4.5 3L12 4l1.5 6L18 7l1.5 7H4.5z" fill="#C4A35A" />
    </Svg>
  );
}

type GameOption = {
  title: string;
  badge: string;
  icon: React.ReactNode;
  onPress: () => void;
};

export default function PlayScreen() {
  const newGame = useGameStore((s) => s.newGame);
  const { width: ww } = useWindowDimensions();
  const isWide = ww > 700;

  const options: GameOption[] = [
    {
      title: 'Lokaal',
      badge: '2 SPELERS',
      icon: <IconLokaal />,
      onPress: () => { newGame('local'); router.push('/game/local'); },
    },
    {
      title: 'Computer',
      badge: 'STOCKFISH',
      icon: <IconComputer />,
      onPress: () => { newGame('ai'); router.push('/game/ai'); },
    },
    {
      title: 'Online',
      badge: '2 OF 4 SP.',
      icon: <IconOnline />,
      onPress: () => { router.push('/game/online'); },
    },
    {
      title: 'Quaternity',
      badge: '4 SPELERS',
      icon: <IconQuaternity />,
      onPress: () => { router.push('/game/quaternity'); },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Kroonlijn + Logo */}
        <View style={styles.logoRow}>
          <View style={styles.crownLine} />
          <CrownIcon size={18} />
          <Text style={styles.logo}>
            <Text style={styles.logoDefault}>Zet </Text>
            <Text style={styles.logoGold}>&apos;m</Text>
            <Text style={styles.logoDefault}> op!</Text>
          </Text>
          <CrownIcon size={18} />
          <View style={styles.crownLine} />
        </View>

        {/* Tagline */}
        <View style={styles.taglineRow}>
          <Text style={styles.tagline}>SCHAAK VOOR JONG & OUD</Text>
          <View style={styles.taglineDot} />
          <Text style={styles.subtitle}>Samen schaken, samen winnen</Text>
        </View>

        {/* Gouden scheidingslijn */}
        <View style={styles.goldDivider} />
      </View>

      {/* Vier speelknoppen */}
      <View style={[styles.options, isWide && styles.optionsRow]}>
        {options.map((option) => (
          <Pressable
            key={option.title}
            style={({ pressed, hovered }) => [
              styles.card,
              isWide && styles.cardWide,
              hovered && styles.cardHover,
              pressed && styles.cardPressed,
            ]}
            onPress={option.onPress}
          >
            <View style={styles.iconCircle}>
              {option.icon}
            </View>
            <Text style={styles.cardTitle}>{option.title}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{option.badge}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerBrand}>Generation Now Games</Text>
          <Text style={styles.footerSub}>Gratis & open source</Text>
        </View>
        <Pressable style={styles.donateBtn}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={AppColors.cream} />
          </Svg>
          <Text style={styles.donateBtnText}>Doneer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crownLine: {
    width: 40,
    height: 1,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(90deg, transparent, #E8D5A0, transparent)',
      } as any,
      default: {
        backgroundColor: AppColors.goldLight,
      },
    }),
  },
  logo: {
    fontSize: 44,
    fontWeight: '700',
    fontFamily: Fonts.display,
    letterSpacing: -0.5,
  },
  logoDefault: {
    color: AppColors.text,
  },
  logoGold: {
    color: AppColors.gold,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  tagline: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '600',
    color: AppColors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  taglineDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: AppColors.gold,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: Fonts.display,
    fontStyle: 'italic',
    color: AppColors.textMuted,
  },
  goldDivider: {
    width: '100%',
    maxWidth: 700,
    height: 1,
    marginTop: 20,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(90deg, transparent, #E8D5A0, #C4A35A, #E8D5A0, transparent)',
      } as any,
      default: {
        backgroundColor: AppColors.goldLight,
      },
    }),
  },
  options: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    alignItems: 'center',
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: AppColors.goldLight,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 400,
    gap: 12,
    ...Platform.select({
      web: {
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      } as any,
      default: {},
    }),
  },
  cardWide: {
    width: 170,
    flex: undefined,
  },
  cardHover: {
    borderColor: AppColors.gold,
    ...Platform.select({
      web: {
        transform: [{ translateY: -6 }],
        boxShadow: '0 12px 36px rgba(196, 163, 90, 0.1)',
      } as any,
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.goldBg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: Fonts.display,
    color: AppColors.text,
  },
  badge: {
    backgroundColor: AppColors.goldLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Fonts.body,
    color: AppColors.goldDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  footerLeft: {},
  footerBrand: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
  footerSub: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: AppColors.textMuted,
    opacity: 0.6,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.gold,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  donateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.body,
    color: AppColors.cream,
  },
});
