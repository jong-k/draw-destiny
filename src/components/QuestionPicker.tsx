import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Deck } from "@/types/deck";

interface Props {
  decks: Deck[];
  selectedId: string | null;
  onSelect: (deckId: string) => void;
}

export function QuestionPicker({ decks, selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const selected = decks.find((d) => d.id === selectedId);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>
          {selected ? selected.question : "질문을 선택하세요"}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={decks}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowText}>{item.question}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 16 },
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C1730",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  triggerText: { color: "#F4EAD5", fontSize: 16 },
  chevron: { color: "#B9A6E0", fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  sheet: { backgroundColor: "#1C1730", borderRadius: 16, overflow: "hidden" },
  row: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#332B4D" },
  rowText: { color: "#F4EAD5", fontSize: 16 },
});
