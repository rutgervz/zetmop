import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Image,
  StyleSheet, Animated, useWindowDimensions, Platform, Keyboard,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AppColors } from '@/constants/Colors';
import { useOnlineStore, type ChatMessage } from '@/stores/onlineStore';

// Tenor free API (anonymous, no key needed for basic search)
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; // Google's public Tenor key
const TENOR_BASE = 'https://tenor.googleapis.com/v2';

type TenorGif = {
  id: string;
  title: string;
  media_formats: {
    tinygif: { url: string; dims: [number, number] };
    gif: { url: string; dims: [number, number] };
  };
};

// Curated emoji set for a family chess app
const EMOJI_CATEGORIES = [
  {
    label: 'Reacties',
    emojis: ['😄', '😂', '🤣', '😎', '🤔', '😱', '😤', '🥳', '👏', '🔥', '💪', '🎉'],
  },
  {
    label: 'Schaak',
    emojis: ['♟️', '♚', '♛', '♜', '♝', '♞', '🏆', '🥇', '🥈', '🥉', '⭐', '💎'],
  },
  {
    label: 'Gezichten',
    emojis: ['😀', '😅', '😇', '🤩', '😏', '😬', '🤯', '😴', '🤡', '👀', '💀', '👻'],
  },
  {
    label: 'Handen',
    emojis: ['👍', '👎', '✌️', '🤞', '🤝', '🙏', '👊', '✊', '🫡', '👋', '🖐️', '🤙'],
  },
];

export default function ChatPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width: ww } = useWindowDimensions();
  const panelWidth = Math.min(340, ww * 0.85);

  const slideAnim = useRef(new Animated.Value(panelWidth)).current;
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<TenorGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const chatMessages = useOnlineStore((s) => s.chatMessages);
  const sendChatMessage = useOnlineStore((s) => s.sendChatMessage);
  const markChatRead = useOnlineStore((s) => s.markChatRead);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : panelWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
    if (visible) markChatRead();
  }, [visible]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatMessages.length]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendChatMessage(text);
    setInputText('');
    setShowEmoji(false);
    setShowGif(false);
  };

  const handleEmojiPress = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleGifSelect = (gif: TenorGif) => {
    sendChatMessage(
      undefined,
      gif.media_formats.gif.url,
      gif.media_formats.tinygif.url,
    );
    setShowGif(false);
    setGifQuery('');
    setGifResults([]);
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      // Trending GIFs
      setGifLoading(true);
      try {
        const res = await fetch(`${TENOR_BASE}/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif,tinygif`);
        const data = await res.json();
        setGifResults(data.results || []);
      } catch {}
      setGifLoading(false);
      return;
    }
    setGifLoading(true);
    try {
      const res = await fetch(`${TENOR_BASE}/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=20&media_filter=gif,tinygif`);
      const data = await res.json();
      setGifResults(data.results || []);
    } catch {}
    setGifLoading(false);
  };

  useEffect(() => {
    if (showGif) {
      const timer = setTimeout(() => searchGifs(gifQuery), 400);
      return () => clearTimeout(timer);
    }
  }, [gifQuery, showGif]);

  return (
    <Animated.View
      style={[
        styles.panel,
        {
          width: panelWidth,
          transform: [{ translateX: slideAnim }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <FontAwesome name="times" size={18} color="#888" />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {chatMessages.length === 0 && (
          <Text style={styles.emptyText}>Nog geen berichten. Stuur een bericht!</Text>
        )}
        {chatMessages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
      </ScrollView>

      {/* Emoji picker */}
      {showEmoji && (
        <View style={styles.pickerContainer}>
          <ScrollView style={styles.emojiScroll}>
            {EMOJI_CATEGORIES.map((cat) => (
              <View key={cat.label}>
                <Text style={styles.emojiCategoryLabel}>{cat.label}</Text>
                <View style={styles.emojiGrid}>
                  {cat.emojis.map((emoji) => (
                    <Pressable key={emoji} onPress={() => handleEmojiPress(emoji)} style={styles.emojiBtn}>
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* GIF picker */}
      {showGif && (
        <View style={styles.pickerContainer}>
          <TextInput
            style={styles.gifSearch}
            value={gifQuery}
            onChangeText={setGifQuery}
            placeholder="Zoek GIFs..."
            placeholderTextColor="#555"
            autoFocus
          />
          <ScrollView style={styles.gifScroll}>
            {gifLoading && <Text style={styles.gifLoadingText}>Laden...</Text>}
            <View style={styles.gifGrid}>
              {gifResults.map((gif) => (
                <Pressable key={gif.id} onPress={() => handleGifSelect(gif)} style={styles.gifItem}>
                  <Image
                    source={{ uri: gif.media_formats.tinygif.url }}
                    style={styles.gifPreview}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.tenorCredit}>Powered by Tenor</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <Pressable
          onPress={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
          style={[styles.iconBtn, showEmoji && styles.iconBtnActive]}
          hitSlop={8}
        >
          <Text style={{ fontSize: 20 }}>😊</Text>
        </Pressable>
        <Pressable
          onPress={() => { setShowGif(!showGif); setShowEmoji(false); }}
          style={[styles.iconBtn, showGif && styles.iconBtnActive]}
          hitSlop={8}
        >
          <Text style={styles.gifLabel}>GIF</Text>
        </Pressable>
        <TextInput
          style={styles.chatInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Bericht..."
          placeholderTextColor="#555"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable onPress={handleSend} style={styles.sendBtn} hitSlop={8}>
          <FontAwesome name="paper-plane" size={16} color={inputText.trim() ? AppColors.primary : '#555'} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View style={[styles.bubble, msg.isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
      {!msg.isOwn && <Text style={styles.bubbleName}>{msg.playerName}</Text>}
      {msg.gifUrl && (
        <Image
          source={{ uri: msg.gifPreview || msg.gifUrl }}
          style={styles.gifInBubble}
          resizeMode="contain"
        />
      )}
      {msg.text && (
        <Text style={[styles.bubbleText, msg.isOwn && styles.bubbleTextOwn]}>{msg.text}</Text>
      )}
      <Text style={styles.bubbleTime}>
        {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: AppColors.cream,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.goldLight,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '-4px 0 20px rgba(0,0,0,0.5)' } as any,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.goldLight,
  },
  headerTitle: { color: AppColors.text, fontSize: 18, fontWeight: '700' },
  messages: { flex: 1 },
  messagesContent: { padding: 12, gap: 8 },
  emptyText: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwn: {
    backgroundColor: AppColors.primary + '25',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: AppColors.ivory,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleName: { color: AppColors.accent, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  bubbleText: { color: AppColors.text, fontSize: 14, lineHeight: 20 },
  bubbleTextOwn: { color: AppColors.text },
  bubbleNameOther: { color: AppColors.goldDark },
  bubbleTime: { color: '#555', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  gifInBubble: { width: 180, height: 135, borderRadius: 8, marginBottom: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.goldLight,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconBtnActive: { backgroundColor: AppColors.primary + '20' },
  gifLabel: { color: AppColors.accent, fontSize: 12, fontWeight: '800' },
  chatInput: {
    flex: 1,
    backgroundColor: '#252538',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: AppColors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerContainer: {
    height: 220,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 163, 90, 0.2)',
    backgroundColor: '#252538',
  },
  emojiScroll: { padding: 8 },
  emojiCategoryLabel: { color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  emojiBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  emojiText: { fontSize: 22 },
  gifSearch: {
    margin: 8,
    backgroundColor: '#252538',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: AppColors.text,
    fontSize: 14,
  },
  gifScroll: { flex: 1, paddingHorizontal: 8 },
  gifGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gifItem: { borderRadius: 8, overflow: 'hidden' },
  gifPreview: { width: 96, height: 72, borderRadius: 8 },
  gifLoadingText: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 20 },
  tenorCredit: { color: '#444', fontSize: 10, textAlign: 'center', paddingVertical: 4 },
});
