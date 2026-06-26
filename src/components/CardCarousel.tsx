import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { activeCardIndex, getWindow, step, WINDOW_SIZE } from "@/lib/deck";
import type { Card } from "@/types/deck";
import { useTilt } from "@/hooks/useTilt";

interface Props {
  deck: Card[];
  onDrawActive: (card: Card) => void;
}

const CENTER_SLOT = Math.floor(WINDOW_SIZE / 2); // 2

export function CardCarousel({ deck, onDrawActive }: Props) {
  const [windowStart, setWindowStart] = useState(0);
  const moveWindow = (direction: 1 | -1) =>
    setWindowStart((s) => step(s, direction, deck.length));

  useTilt(moveWindow, true);

  const visible = getWindow(deck, windowStart);
  const activeCard = deck[activeCardIndex(windowStart, deck.length)];

  return (
    <View style={styles.container}>
      <View style={styles.cardRow}>
        {visible.map((card, slot) => (
          <CarouselCard
            key={`${card.id}-${slot}`}
            isActive={slot === CENTER_SLOT}
            onPress={() => slot === CENTER_SLOT && onDrawActive(activeCard)}
          />
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.arrow} onPress={() => moveWindow(-1)}>
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
        <Text style={styles.hint}>기울이거나 화살표로 카드를 넘기세요</Text>
        <Pressable style={styles.arrow} onPress={() => moveWindow(1)}>
          <Text style={styles.arrowText}>▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CarouselCard({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(isActive ? -28 : 0) },
      { scale: withSpring(isActive ? 1.12 : 0.92) },
    ],
  }));

  return (
    <Pressable onPress={onPress} disabled={!isActive}>
      <Animated.View style={[styles.card, isActive && styles.cardActive, animatedStyle]}>
        <Text style={styles.cardBack}>🔮</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  cardRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: -8 },
  card: {
    width: 64,
    height: 96,
    borderRadius: 12,
    backgroundColor: "#2A2342",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3D3460",
  },
  cardActive: { backgroundColor: "#3A2E5C", borderColor: "#7C5CFF", shadowColor: "#7C5CFF", shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  cardBack: { fontSize: 28 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 48 },
  arrow: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1C1730", alignItems: "center", justifyContent: "center" },
  arrowText: { color: "#F4EAD5", fontSize: 20 },
  hint: { color: "#B9A6E0", fontSize: 12, flex: 1, textAlign: "center" },
});
