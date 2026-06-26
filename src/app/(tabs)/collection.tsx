import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import seedDecks from "@/data/seed-decks.json";
import { loadCollection } from "@/lib/collection";
import type { Card, Deck } from "@/types/deck";

const ALL_CARDS: Card[] = (seedDecks as Deck[]).flatMap((d) => d.cards);

export default function CollectionScreen() {
  const [owned, setOwned] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadCollection().then((ids) => {
        if (active) setOwned(ids);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>컬렉션 {owned.length}/{ALL_CARDS.length}</Text>
      <FlatList
        data={ALL_CARDS}
        keyExtractor={(c) => c.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isOwned = owned.includes(item.id);
          return (
            <View style={[styles.cell, isOwned ? styles.cellOwned : styles.cellLocked]}>
              {isOwned ? (
                <>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.text}>{item.text}</Text>
                </>
              ) : (
                <Text style={styles.lock}>🔒</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0B1A", paddingTop: 16 },
  title: { color: "#F4EAD5", fontSize: 20, fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },
  grid: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { gap: 8, marginBottom: 8 },
  cell: { flex: 1, aspectRatio: 0.7, borderRadius: 12, alignItems: "center", justifyContent: "center", padding: 8 },
  cellOwned: { backgroundColor: "#3A2E5C", borderWidth: 1, borderColor: "#7C5CFF", gap: 6 },
  cellLocked: { backgroundColor: "#1C1730", borderWidth: 1, borderColor: "#2A2342" },
  symbol: { fontSize: 28 },
  text: { color: "#F4EAD5", fontSize: 11, textAlign: "center" },
  lock: { fontSize: 24, opacity: 0.4 },
});
