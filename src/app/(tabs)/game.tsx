import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { QuestionPicker } from "@/components/QuestionPicker";
import seedDecks from "@/data/seed-decks.json";
import type { Deck } from "@/types/deck";

const DECKS = seedDecks as Deck[];

export default function GameScreen() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const selectedDeck = DECKS.find((d) => d.id === selectedDeckId) ?? null;

  return (
    <View style={styles.container}>
      <QuestionPicker decks={DECKS} selectedId={selectedDeckId} onSelect={setSelectedDeckId} />
      <View style={styles.body}>
        <Text style={styles.text}>
          {selectedDeck ? `"${selectedDeck.question}" — ${selectedDeck.cards.length}장` : "질문을 골라 운명을 뽑으세요"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0B1A" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#F4EAD5", fontSize: 18, textAlign: "center", paddingHorizontal: 24 },
});
