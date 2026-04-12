import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';

export type MoveLogEntry = {
  moveNumber: number;
  playerName: string;
  playerColor: string;       // hex kleur voor de dot
  notation: string;          // SAN: "e4", "Nf3", "O-O", "exd5" of Quaternity: "Kb1→c2"
  piece?: string;            // unicode stuksymbool: ♞, ♝, etc.
  pieceName?: string;        // Nederlands: "paard", "loper", etc.
  from?: string;             // bronveld: "e2"
  to?: string;               // doelveld: "e4"
  isCapture: boolean;
  capturedPiece?: string;    // unicode: ♟, ♞, etc.
  capturedPieceName?: string;// Nederlands: "pion", "paard", etc.
  isCheck?: boolean;
  isCheckmate?: boolean;
  isPromotion?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  isPass?: boolean;
  description?: string;      // bijv. "korte rokade", "en passant", "schaak"
  special?: string;          // event: "Schaakmat!", "Opgegeven"
  result?: string;           // "1-0", "0-1", "½-½"
};

type GameLogProps = {
  entries: MoveLogEntry[];
  elapsedSeconds: number;
  maxHeight?: number;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PIECE_NAMES: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

export function pieceSymbol(type: string): string {
  return PIECE_NAMES[type] || type;
}

export default function GameLog({ entries, elapsedSeconds, maxHeight }: GameLogProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [entries.length]);

  return (
    <View style={[styles.container, maxHeight ? { maxHeight } : undefined]}>
      {/* Terminal header */}
      <View style={styles.header}>
        <View style={styles.headerDots}>
          <View style={[styles.headerDot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.headerDot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.headerDot, { backgroundColor: '#28C840' }]} />
        </View>
        <Text style={styles.headerTitle}>partij.log</Text>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
      </View>

      {/* Log entries */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 && (
          <Text style={styles.emptyLine}>
            <Text style={styles.prompt}>{'>'}</Text> wachten op eerste zet...
          </Text>
        )}
        {entries.map((entry, i) => (
          <LogLine key={i} entry={entry} />
        ))}
      </ScrollView>
    </View>
  );
}

function LogLine({ entry }: { entry: MoveLogEntry }) {
  // Resultaat regel (1-0, 0-1, ½-½)
  if (entry.result && entry.special) {
    return (
      <View>
        <Text style={styles.divider}>{'─'.repeat(32)}</Text>
        <Text style={styles.specialLine}>
          <Text style={styles.specialText}>  {entry.special}</Text>
        </Text>
        <Text style={styles.resultLine}>
          <Text style={styles.resultText}>  {entry.result}</Text>
        </Text>
      </View>
    );
  }

  // Special event zonder result
  if (entry.special) {
    return (
      <View>
        <Text style={styles.divider}>{'─'.repeat(32)}</Text>
        <Text style={styles.specialLine}>
          <Text style={styles.specialText}>  {entry.special}</Text>
        </Text>
      </View>
    );
  }

  // Pas
  if (entry.isPass) {
    return (
      <Text style={styles.logLine}>
        <Text style={styles.moveNum}>{String(entry.moveNumber).padStart(3, ' ')}. </Text>
        <Text style={[styles.playerDot, { color: entry.playerColor }]}>{'●'} </Text>
        <Text style={styles.playerName}>{entry.playerName} </Text>
        <Text style={styles.passText}>pas</Text>
      </Text>
    );
  }

  // Stuk symbool voor de notatie
  const piecePrefix = entry.piece && entry.pieceName !== 'pion' ? entry.piece : '';

  // Veld info (from → to)
  const fieldInfo = entry.from && entry.to ? `${entry.from}→${entry.to}` : '';

  // Beschrijving tags
  const tags: { text: string; style: any }[] = [];
  if (entry.isCapture && entry.capturedPiece) {
    tags.push({ text: `×${entry.capturedPiece}`, style: styles.captureTag });
  }
  if (entry.isCastling) {
    tags.push({ text: entry.description || 'rokade', style: styles.castlingTag });
  }
  if (entry.isEnPassant) {
    tags.push({ text: 'e.p.', style: styles.epTag });
  }
  if (entry.isPromotion && entry.description) {
    tags.push({ text: entry.description, style: styles.promoTag });
  }
  if (entry.isCheckmate) {
    tags.push({ text: 'mat!', style: styles.matTag });
  } else if (entry.isCheck) {
    tags.push({ text: 'schaak', style: styles.checkTag });
  }

  return (
    <Text style={styles.logLine}>
      <Text style={styles.moveNum}>{String(entry.moveNumber).padStart(3, ' ')}. </Text>
      <Text style={[styles.playerDot, { color: entry.playerColor }]}>{'●'} </Text>
      <Text style={styles.playerName}>{entry.playerName} </Text>
      {piecePrefix ? <Text style={styles.pieceIcon}>{piecePrefix}</Text> : null}
      <Text style={[styles.notation, entry.isCapture && styles.captureNotation]}>
        {entry.notation}
      </Text>
      {fieldInfo && !entry.notation.includes('→') ? (
        <Text style={styles.fieldInfo}> {fieldInfo}</Text>
      ) : null}
      {tags.map((tag, i) => (
        <Text key={i} style={tag.style}> {tag.text}</Text>
      ))}
    </Text>
  );
}

const FONT_MONO = Platform.select({
  web: 'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", Menlo, monospace',
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C0C14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E1E30',
    overflow: 'hidden',
    flex: 1,
    ...Platform.select({
      web: { boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)' } as any,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#161625',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E30',
  },
  headerDots: {
    flexDirection: 'row',
    gap: 5,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#555',
    fontSize: 11,
    fontFamily: FONT_MONO,
    letterSpacing: 0.5,
  },
  timer: {
    color: '#C4A35A',
    fontSize: 12,
    fontFamily: FONT_MONO,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emptyLine: {
    color: '#444',
    fontSize: 12,
    fontFamily: FONT_MONO,
    fontStyle: 'italic',
    paddingVertical: 2,
  },
  prompt: {
    color: '#C4A35A',
  },
  logLine: {
    fontSize: 12,
    fontFamily: FONT_MONO,
    paddingVertical: 1.5,
    lineHeight: 18,
  },
  divider: {
    color: '#2A2A3A',
    fontSize: 11,
    fontFamily: FONT_MONO,
    paddingTop: 4,
  },
  specialLine: {
    fontSize: 12,
    fontFamily: FONT_MONO,
    paddingVertical: 2,
    lineHeight: 18,
  },
  resultLine: {
    fontSize: 14,
    fontFamily: FONT_MONO,
    paddingBottom: 4,
    lineHeight: 20,
  },
  resultText: {
    color: '#C4A35A',
    fontWeight: '800',
    fontSize: 14,
  },
  moveNum: {
    color: '#444',
    fontSize: 11,
  },
  playerDot: {
    fontSize: 10,
  },
  playerName: {
    color: '#777',
    fontSize: 11,
  },
  pieceIcon: {
    fontSize: 12,
    color: '#AAA',
  },
  notation: {
    color: '#E0E0E0',
    fontWeight: '600',
    fontSize: 12,
  },
  captureNotation: {
    color: '#CC4444',
  },
  fieldInfo: {
    color: '#555',
    fontSize: 10,
  },
  captureTag: {
    color: '#CC4444',
    fontSize: 11,
    fontWeight: '600',
  },
  castlingTag: {
    color: '#C4A35A',
    fontSize: 10,
    fontStyle: 'italic',
  },
  epTag: {
    color: '#C89BFF',
    fontSize: 10,
    fontStyle: 'italic',
  },
  promoTag: {
    color: '#FFD93D',
    fontSize: 10,
    fontStyle: 'italic',
  },
  matTag: {
    color: '#FF4444',
    fontWeight: '800',
    fontSize: 12,
  },
  checkTag: {
    color: '#FFD93D',
    fontWeight: '700',
    fontSize: 11,
  },
  specialText: {
    color: '#FFD93D',
    fontWeight: '700',
    fontSize: 12,
  },
  passText: {
    color: '#555',
    fontStyle: 'italic',
    fontSize: 12,
  },
});
