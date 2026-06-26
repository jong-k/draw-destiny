import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CardCarousel } from "@/components/CardCarousel";
import { DrawnCard } from "@/components/DrawnCard";
import { QuestionPicker } from "@/components/QuestionPicker";
import { Screen } from "@/components/Screen";
import { COLORS, SPACING } from "@/constants/theme";
import seedDecks from "@/data/seed-decks.json";
import { addToCollection } from "@/lib/collection";
import { shuffle } from "@/lib/deck";
import type { Card, Deck } from "@/types/deck";

const DECKS = seedDecks as Deck[];

export default function GameScreen() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  // 값이 바뀔 때마다 같은 덱을 다시 셔플한다(캐러셀이 연출을 재생).
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const selectedDeck = DECKS.find((d) => d.id === selectedDeckId) ?? null;

  const shuffledCards = useMemo<Card[]>(
    () => (selectedDeck ? shuffle(selectedDeck.cards) : []),
    // shuffleNonce는 본문에서 직접 쓰이진 않지만, 값이 바뀌면 같은 덱을 다시 섞기 위해 의도적으로 넣는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDeck, shuffleNonce],
  );

  const handleDraw = (card: Card) => {
    setDrawnCard(card);
    void addToCollection(card.id);
  };

  const handleShuffle = () => {
    setDrawnCard(null); // 결과가 떠 있으면 닫고
    setShuffleNonce((n) => n + 1); // 재셔플 트리거
  };

  return (
    <Screen>
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
          shuffleNonce={shuffleNonce}
        />
      ) : (
        <View style={styles.body}>
          <Text style={styles.text}>질문을 골라 운명을 뽑으세요</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          disabled={selectedDeck === null}
          onPress={handleShuffle}
          style={({ pressed }) => [
            styles.shuffleButton,
            selectedDeck === null && styles.shuffleButtonDisabled,
            pressed && styles.shuffleButtonPressed,
          ]}
        >
          <Text style={styles.shuffleLabel}>카드 섞기</Text>
        </Pressable>
      </View>

      {drawnCard && (
        <DrawnCard card={drawnCard} onClose={() => setDrawnCard(null)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: {
    color: COLORS.text,
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  bottomBar: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: 12,
    paddingBottom: 24,
  },
  shuffleButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  shuffleButtonPressed: { opacity: 0.85 },
  shuffleButtonDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.5,
  },
  shuffleLabel: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
});
