import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useCoachChat } from "@/hooks/useCoachChat";
import { COLORS } from "@/lib/constants";

export default function CoachChatScreen() {
  const { messages, isStreaming, send, reset } = useCoachChat();
  const [input, setInput] = useState("");

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    void send(text);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat con el Coach</Text>
        <TouchableOpacity onPress={reset} style={styles.newBtn}>
          <Ionicons name="add-circle-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messageList}
          inverted={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>¿Qué quieres saber?</Text>
              <Text style={styles.emptySub}>
                Pregúntame sobre tu entrenamiento, recuperación o plan de carrera.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === "user" ? styles.userText : styles.assistantText,
                ]}
              >
                {item.content}
                {item.streaming && (
                  <Text style={styles.cursor}> ▋</Text>
                )}
              </Text>
            </View>
          )}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={COLORS.textDim}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Ionicons
              name="send"
              size={18}
              color={!input.trim() || isStreaming ? COLORS.textDim : COLORS.bg}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, alignItems: "center" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  newBtn: { width: 40, alignItems: "center" },
  messageList: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: COLORS.bg },
  assistantText: { color: COLORS.text },
  cursor: { color: COLORS.accent },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surface,
  },
});
