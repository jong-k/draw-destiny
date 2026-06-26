import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { CardCarousel } from "@/components/CardCarousel";
import { DrawnCard } from "@/components/DrawnCard";
import { QuestionPicker } from "@/components/QuestionPicker";
import seedDecks from "@/data/seed-decks.json";
import { addToCollection } from "@/lib/collection";
import { shuffle } from "@/lib/deck";
import type { Card, Deck } from "@/types/deck";

const DECKS = seedDecks as Deck[];

export default function GameScreen() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const selectedDeck = DECKS.find((d) => d.id === selectedDeckId) ?? null;

  const shuffledCards = useMemo<Card[]>(
    () => (selectedDeck ? shuffle(selectedDeck.cards) : []),
    [selectedDeck],
  );

  const handleDraw = (card: Card) => {
    setDrawnCard(card);
    void addToCollection(card.id);
  };

  return (
    <View style={styles.container}>
      <QuestionPicker
        decks={DECKS}
        selectedId={selectedDeckId}
        onSelect={setSelectedDeckId}
      />
      {selectedDeck ? (
        <CardCarousel
          key={selectedDeckId}
          deck={shuffledCards}
          onDrawActive={handleDraw}
          tiltEnabled={drawnCard === null}
        />
      ) : (
        <View style={styles.body}>
          <Text style={styles.text}>질문을 골라 운명을 뽑으세요</Text>
        </View>
      )}
      {drawnCard && (
        <DrawnCard card={drawnCard} onClose={() => setDrawnCard(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0B1A" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: {
    color: "#F4EAD5",
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
