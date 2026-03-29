# CLAUDE.md — Zet 'm op!

## Wat is Zet 'm op!

Een gratis, open-source schaak-app voor alle leeftijden. Traditioneel schaken, schaaklessen, en Quaternity (4-speler schaak). Geen advertenties, geen in-app aankopen, geen backdoors. Donatie-gebaseerd.

**Publisher**: Generation Now
**Engelse naam**: Make Your Move

## Tech Stack

- **Framework**: React Native + Expo (SDK 54, expo-router 6)
- **Platforms**: iPad (primair), Android, Web
- **Chess logic**: chess.js (standaard schaak), custom engine (Quaternity)
- **Chess engine**: Stockfish (WASM web, native module iOS/Android) — nog niet gebouwd
- **3D effecten**: Three.js via @react-three/fiber — nog niet gebouwd
- **Backend**: Firebase (Auth, Firestore, Realtime DB) — nog niet gebouwd
- **State**: Zustand
- **Taal UI**: Nederlands

## Huidige Status

### Fase 1: Core schaak (KLAAR)
- Tab navigator: Spelen, Leren, Groepen, Profiel
- GameEngine class wrapping chess.js (volledige regels)
- Zustand game store met selectie, legale zetten, undo, promotie
- ChessBoard + Square + Piece componenten (Unicode stukken)
- Promotie-modal (Nederlands)
- Zet-historie panel
- Game scherm met speler-bars, status banner, acties
- Placeholder schermen voor Leren, Groepen, Profiel

### Nog te bouwen
- Fase 2: Stockfish AI tegenstander
- Fase 3: Three.js 3D effecten (explosies, confetti, glow)
- Fase 4: Firebase + Auth + Online spelen
- Fase 5: Groepen + ELO Rankings
- Fase 6: Schaaklessen (puzzels, curriculum)
- Fase 7: Quaternity 4-speler schaak
- Fase 8: Donaties + Polish

## Code Conventies

### Taal
- UI teksten en comments: Nederlands
- Variabele namen en code: Engels

### Stijl
- Dark theme als default (background: #1A1A2E)
- Accent kleuren: teal (#4ECDC4), koraal (#FF6B6B), blauw (#45B7D1), goud (#FFD93D)
- Nooit dash/hyphen bullets in UI copy
- Schrijfstijl: luchtig, uitnodigend, niet competitief

### Naamgeving
- App: "Zet 'm op!" (niet "Schaakmeester")
- Publisher: "Generation Now"

## Projectstructuur

```
zetmop/
├── app/                    # Expo Router pages
│   ├── (tabs)/             # Tab screens (index=Spelen, learn, groups, profile)
│   └── game/[id].tsx       # Actief spelscherm
├── components/
│   └── board/              # ChessBoard, Square, Piece, PromotionModal, MoveHistory
├── lib/chess/              # rules.ts (GameEngine), types.ts
├── stores/                 # gameStore.ts (Zustand)
├── constants/Colors.ts     # Thema kleuren
└── assets/                 # Fonts, images
```

## Ontwikkelen

```bash
npx expo start --web        # Web
npx expo start --ios        # iOS Simulator
npx expo start --android    # Android Emulator
```
