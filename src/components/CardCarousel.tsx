import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from "react-native-reanimated";

import { useTilt } from "@/hooks/useTilt";
import { activeCardIndex, getWindow, step, WINDOW_SIZE } from "@/lib/deck";
import type { Card } from "@/types/deck";

interface Props {
  deck: Card[];
  onDrawActive: (card: Card) => void;
  tiltEnabled: boolean;
}

const CENTER_SLOT = Math.floor(WINDOW_SIZE / 2); // 2

// 부채꼴 배치/애니메이션 상수 (실기기에서 조정 가능)
const CARD_W = 84;
const CARD_H = 126;
const SLOT_ANGLES = [-44, -22, 0, 22, 44]; // 왼→오 슬롯별 회전각(deg)
const LIFT = CARD_H / 2; // 선택 카드 상승량: 솟은 카드 세로 중앙 = 미상승 카드 윗면
const ACTIVE_SCALE = 1.08;
const RISE_DELAY = 140; // 새 선택 카드가 올라오기까지의 텀(ms)
const SPRING = { damping: 16, stiffness: 140 };

export function CardCarousel({ deck, onDrawActive, tiltEnabled }: Props) {
  const [windowStart, setWindowStart] = useState(0);
  const moveWindow = (direction: 1 | -1) =>
    setWindowStart((s) => step(s, direction, deck.length));

  useTilt(moveWindow, tiltEnabled);

  const visible = getWindow(deck, windowStart);
  const activeCard = deck[activeCardIndex(windowStart, deck.length)];

  return (
    <View style={styles.container}>
      <View style={styles.fanArea}>
        {visible.map((card, slot) => (
          <CarouselCard
            key={card.id}
            slot={slot}
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

function CarouselCard({
  slot,
  isActive,
  onPress,
}: {
  slot: number;
  isActive: boolean;
  onPress: () => void;
}) {
  // 비활성 카드의 lift는 즉시 0으로 내려가고, 활성 카드만 RISE_DELAY 뒤 올라가
  // "이전 카드 내림 → 텀 → 새 카드 올림" 순차 연출이 만들어진다.
  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: slot, // 왼쪽(0) 아래 → 오른쪽(4) 위로 쌓임
    transform: [
      { rotate: `${withSpring(SLOT_ANGLES[slot], SPRING)}deg` },
      {
        translateY: withDelay(
          isActive ? RISE_DELAY : 0,
          withSpring(isActive ? -LIFT : 0, SPRING),
        ),
      },
      { scale: withSpring(isActive ? ACTIVE_SCALE : 1, SPRING) },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      style={[styles.cardWrap, animatedStyle]}
    >
      <Pressable onPress={onPress} disabled={!isActive}>
        <View style={[styles.card, isActive && styles.cardActive]}>
          <Text style={styles.cardBack}>🔮</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  fanArea: {
    height: 300,
    width: "100%",
  },
  cardWrap: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -CARD_W / 2,
    width: CARD_W,
    height: CARD_H,
    transformOrigin: "50% 100%", // 아래 중앙을 공유 회전축으로 부채꼴 펼침
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    backgroundColor: "#2A2342",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3D3460",
  },
  cardActive: {
    backgroundColor: "#3A2E5C",
    borderColor: "#7C5CFF",
    shadowColor: "#7C5CFF",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardBack: { fontSize: 34 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 48,
  },
  arrow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1C1730",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: "#F4EAD5", fontSize: 20 },
  hint: { color: "#B9A6E0", fontSize: 12, flex: 1, textAlign: "center" },
});
