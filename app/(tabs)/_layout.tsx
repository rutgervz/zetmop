import React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Tabs } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

// Custom SVG tab iconen per design spec
function CrownIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 18h18v2H3v-2zm1.5-4L6 7l4.5 3L12 4l1.5 6L18 7l1.5 7H4.5z" fill={color} />
    </Svg>
  );
}

function LerenIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function GroepenIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={7} r={4} stroke={color} strokeWidth={1.5} />
      <Path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2" stroke={color} strokeWidth={1.5} />
      <Path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function ProfielIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={5} stroke={color} strokeWidth={1.5} />
      <Path d="M3 21v-2a7 7 0 0114 0v2" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.goldDark,
        tabBarInactiveTintColor: '#9B99A8',
        tabBarStyle: {
          backgroundColor: AppColors.cream,
          borderTopColor: AppColors.goldLight,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.body,
        },
        headerStyle: {
          backgroundColor: AppColors.cream,
        },
        headerTintColor: AppColors.text,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Spelen',
          tabBarIcon: ({ color }) => <CrownIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Leren',
          tabBarIcon: ({ color }) => <LerenIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groepen',
          tabBarIcon: ({ color }) => <GroepenIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profiel',
          tabBarIcon: ({ color }) => <ProfielIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
