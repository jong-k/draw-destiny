# 2026-06-26 · 부채꼴 카드가 1장으로만 보인 문제 (Reanimated 4)

## 배경 / 상황

카드 덱을 부채꼴(손에 쥔 카드 모양)로 배열하는 작업을 했다. `CardCarousel`에서 5장을 같은 위치에 겹쳐 놓고, 각자 **아래 한 점(`transformOrigin`)을 회전축**으로 `[-44°, -22°, 0°, +22°, +44°]` 펼치는 방식이다. 가운데(선택) 카드만 위로 솟게 했다.

`tsc`·`eslint`·테스트는 모두 통과했는데, iOS 시뮬레이터로 띄우니 **카드가 5장이 아니라 1장(가운데 카드)만** 보였다. 나머지 4장은 흔적도 없었다.

## 알게 된 것

### 1. `useAnimatedStyle` 안에서 `withSpring(상수)`을 직접 호출하면 Reanimated 4에서 애니메이션이 시작되지 않는다

처음엔 이렇게 작성했다.

```tsx
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { rotate: `${withSpring(SLOT_ANGLES[slot])}deg` }, // ❌ 회전이 0으로 고정됨
    { translateY: withDelay(isActive ? RISE_DELAY : 0, withSpring(isActive ? -LIFT : 0)) },
    { scale: withSpring(isActive ? ACTIVE_SCALE : 1) },
  ],
}));
```

- `withSpring`의 목표값을 **shared value가 아니라 JS 상수/prop**(`SLOT_ANGLES[slot]`)에서 바로 읽어 worklet 안에서 호출하면, Reanimated 4는 목표값 변화를 감지하지 못해 애니메이션을 시작하지 않았다. 결과적으로 회전값이 **0에 머물렀다.**
- 회전이 전부 0이면 5장이 **똑바로 선 채 정확히 같은 위치에 겹쳐서** 픽셀 단위로 포개진다 → 화면상 1장처럼 보인다. (어두운 배경 + 어두운 카드라 더 구분이 안 됐다.)

### 2. 애니메이션 transform이 적용되면 StyleSheet의 `transformOrigin`이 무시된다

`transformOrigin: "50% 100%"`를 `StyleSheet`에만 두면, Reanimated가 애니메이션 `transform`을 적용할 때 이 정적 origin이 덮여 회전축이 카드 중앙으로 돌아갔다. → `useAnimatedStyle`이 반환하는 객체 안에 `transformOrigin`을 **함께 넣어야** 회전축이 유지된다.

## 시도 / 해결 과정

추측만으로 원인을 좁히기 어려워, **격리 테스트**로 변수를 하나씩 제거했다.

1. **정적 transform으로 치환** — `useAnimatedStyle`/`withSpring`을 걷어내고 일반 `<View>`에 `transform: [{ rotate: '${SLOT_ANGLES[slot]}deg' }]`(상수)만 적용. 비활성 카드는 빨간색으로.
   → **5장이 부채꼴로 정상 펼쳐짐.** 즉 렌더 개수(5장)와 `transformOrigin` 자체는 멀쩡하고, **범인은 애니메이션 방식**임을 확정.
2. `entering`/`exiting`(FadeIn/FadeOut) 레이아웃 애니메이션 제거 — 여전히 1장. → 레이아웃 애니메이션은 무관.
3. **`useSharedValue` + `useEffect` 정석 패턴으로 전환** — 해결.

```tsx
const angle = useSharedValue(SLOT_ANGLES[slot]);     // 초기값 = 목표값 → 마운트 즉시 부채꼴
const lift = useSharedValue(isActive ? -LIFT : 0);
const scale = useSharedValue(isActive ? ACTIVE_SCALE : 1);

useEffect(() => { angle.value = withSpring(SLOT_ANGLES[slot], SPRING); }, [slot, angle]);
useEffect(() => {
  lift.value = withDelay(isActive ? RISE_DELAY : 0, withSpring(isActive ? -LIFT : 0, SPRING));
  scale.value = withSpring(isActive ? ACTIVE_SCALE : 1, SPRING);
}, [isActive, lift, scale]);

const animatedStyle = useAnimatedStyle(() => ({
  transformOrigin: FAN_PIVOT, // 애니메이션 스타일 안에서 함께 반환해야 회전축이 유지됨
  transform: [
    { rotate: `${angle.value}deg` },
    { translateY: lift.value },
    { scale: scale.value },
  ],
}));
```

- shared value의 **초기값을 목표값으로** 두면 마운트 시점에 곧장 제 위치(부채꼴)로 그려지고, `slot`/`isActive`가 바뀔 때만 `useEffect`에서 `withSpring`으로 부드럽게 이동한다.
- "이전 카드 내림 → 텀 → 새 카드 올림" 순차 연출도 이 패턴에서 자연스럽게 나온다: 비활성 `lift`는 `withDelay(0, ...)`로 즉시 0, 활성 `lift`만 `withDelay(RISE_DELAY, ...)`로 늦게 올라간다.

## 결론

- **원인:** `useAnimatedStyle` 안에서 `withSpring`을 JS 상수 기반으로 직접 호출 → 애니메이션 미발동 → 회전 0 → 5장이 겹쳐 1장처럼 보임.
- **해결:** 애니메이션 대상은 `useSharedValue`로 들고, `useEffect`에서 `withSpring`/`withDelay`로 갱신하는 정석 패턴으로 전환. `transformOrigin`은 애니메이션 스타일 객체 안에서 함께 반환.
- 부채꼴 가로 간격은 회전축을 카드 아래로 내릴수록(`FAN_PIVOT = "50% 150%"`) 반경이 커져 넓어진다(기울기는 유지). `"50% 100%"`는 너무 몰리고, `"50% 220%"`는 겹침이 사라져 흩어졌다.

**교훈**

- `tsc`/lint/테스트가 통과해도 **시각 결과는 별개다.** 정적 검증과 실제 렌더 확인은 둘 다 필요하다.
- 애니메이션 버그는 **정적(애니메이션 제거) 버전으로 먼저 격리**하면 "렌더 문제냐 / 애니메이션 문제냐"를 빠르게 가를 수 있다.
- Reanimated에서 `withSpring`은 **shared value에 할당**해 쓰는 게 기본. worklet 안에서 prop을 바로 감싸 호출하는 패턴은 피한다.

## 참고

- 관련 커밋:
  - `fix(carousel): 부채꼴 회전이 안 먹던 애니메이션 방식 수정`
  - `style(carousel): 부채꼴 카드 가로 간격 확대`
- Reanimated 문서 — `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withDelay`
- 디버깅 시 활용: `xcrun simctl io booted screenshot <path>` 로 시뮬레이터 화면을 캡쳐해 단계별 비교
