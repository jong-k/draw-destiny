import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { Card } from "@/types/deck";

interface Props {
  card: Card;
  onClose: () => void;
}

export function DrawnCard({ card, onClose }: Props) {
  const progress = useSharedValue(0); // 0=뒷면, 1=앞면

  useEffect(() => {
    progress.value = withTiming(1, { duration: 600 });
  }, [progress]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: "hidden",
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: "hidden",
    opacity: progress.value < 0.5 ? 0 : 1,
  }));

  return (
    <View style={styles.overlay}>
      <View style={styles.cardWrap}>
        <Animated.View style={[styles.face, styles.back, backStyle]}>
          <Text style={styles.backGlyph}>🔮</Text>
        </Animated.View>
        <Animated.View style={[styles.face, styles.front, frontStyle]}>
          <Text style={styles.symbol}>{card.symbol}</Text>
          <Text style={styles.text}>{card.text}</Text>
        </Animated.View>
      </View>
      <Pressable style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>다시 뽑기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8,6,16,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  cardWrap: { width: 220, height: 320 },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  back: { backgroundColor: "#2A2342", borderWidth: 1, borderColor: "#3D3460" },
  front: {
    backgroundColor: "#3A2E5C",
    borderWidth: 1,
    borderColor: "#7C5CFF",
    gap: 16,
  },
  backGlyph: { fontSize: 64 },
  symbol: { fontSize: 56 },
  text: {
    color: "#F4EAD5",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#7C5CFF",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
