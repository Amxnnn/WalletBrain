import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Animated,
} from "react-native";
import { useWalletStore } from "../../stores/walletStore";
import { useUIStore } from "../../stores/uiStore";
import { useAI } from "../../hooks/useAI";
import ConfessionBooth from "../../components/ConfessionBooth";
import { COLORS, SPACING, FONTS } from "../../constants/theme";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "What's my portfolio health?",
  "Should I stake my SOL?",
  "Analyze my recent trades",
  "What are my top tokens?",
  "How much did I spend on fees?",
  "Which dApps should I try?",
];

// ── 3-dot typing indicator ────────────────────────────────────────────────────
function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(3 * 180 - i * 180),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              opacity: dot,
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const { walletData, transactions } = useWalletStore();
  const { sendMessage } = useAI();

  const pendingChatMessage = useUIStore((s) => s.pendingChatMessage);
  const setPendingChatMessage = useUIStore((s) => s.setPendingChatMessage);

  // ── Auto-send pending message from Home insight tap ───────────────────
  useEffect(() => {
    if (pendingChatMessage) {
      const msg = pendingChatMessage;
      setPendingChatMessage(null);
      setTimeout(() => handleSend(msg), 300);
    }
  }, [pendingChatMessage]);

  // ── Core send logic ───────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsThinking(true);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const reply = await sendMessage(trimmed, walletData ?? null, transactions);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: "Sorry, I ran into an error. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsThinking(false);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }
    },
    [isThinking, walletData, transactions, sendMessage]
  );

  // ── Suggestion chips ──────────────────────────────────────────────────
  const renderSuggestions = () => (
    <View style={styles.suggestionsWrap}>
      <Text style={styles.suggestionsTitle}>Ask WalletBrain 🧠</Text>
      <View style={styles.suggestionsGrid}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.chip}
            onPress={() => handleSend(s)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Message bubble ────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowAI,
        ]}
      >
        {!isUser && <Text style={styles.aiBubbleIcon}>🧠</Text>}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ── Confession Booth — collapsible, above chat ── */}
        <ConfessionBooth walletData={walletData ?? null} transactions={transactions} />

        {messages.length === 0 && !isThinking ? (
          renderSuggestions()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isThinking ? (
                <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
                  <Text style={styles.aiBubbleIcon}>🧠</Text>
                  <View style={[styles.bubble, styles.bubbleAI]}>
                    <TypingIndicator />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your wallet..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend(input)}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isThinking) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend(input)}
            disabled={!input.trim() || isThinking}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: { flex: 1 },
  // suggestions
  suggestionsWrap: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.md,
    justifyContent: "center",
  },
  suggestionsTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    justifyContent: "center",
  },
  chip: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    width: "47%",
    alignItems: "center",
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: "center",
  },
  // list
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  // bubbles
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAI: {
    justifyContent: "flex-start",
  },
  aiBubbleIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FONTS.body,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: "#fff",
  },
  bubbleTextAI: {
    color: COLORS.text,
  },
  // typing dots
  typingRow: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
  // input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderTopColor: COLORS.cardBorder,
    borderTopWidth: 1,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.body,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
});
