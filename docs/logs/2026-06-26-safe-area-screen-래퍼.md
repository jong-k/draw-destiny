# 2026-06-26 · 탭 아이콘 추가와 safe-area 처리 리팩토링

## 배경 / 상황

탭 바(`src/app/(tabs)/_layout.tsx`)에 아이콘이 없어 밋밋해서 `@expo/vector-icons`(Ionicons)로 뽑기·컬렉션 아이콘을 추가했다. 이어서 iOS 시뮬레이터·Android 에뮬레이터로 확인하던 중, 화면 상단의 헤더(질문 드롭다운, 컬렉션 제목)가 상태바·다이내믹 아일랜드와 겹칠 만큼 위에 붙어 있는 문제를 발견했다.

이 과정에서 **에러 발생 → 완전하지 않은 수정 → 리팩토링**의 흐름을 거쳤고, 그 기록이다.

## 알게 된 것

### safe-area inset을 화면마다 직접 더하는 건 "동작하지만" 권장 패턴은 아니다

`react-native-safe-area-context`의 처리 방식은 크게 셋:

| 방식 | 설명 | 적합한 상황 |
|---|---|---|
| `useSafeAreaInsets()` 훅 | inset 숫자값을 직접 받아 padding/margin에 더함 | 값 자체가 필요할 때(스크롤 콘텐츠 패딩, 애니메이션) |
| `<SafeAreaView edges={[...]}>` | inset을 자동으로 padding에 적용(선언적) | 콘텐츠를 안전 영역 안에 배치 |
| 공용 `Screen` 래퍼 | 위를 한 번 더 감싸 배경색·여백까지 묶음 | 화면이 여러 개, 일관된 레이아웃 |

- expo-router는 루트를 자동으로 `SafeAreaProvider`로 감싸주므로, 별도 Provider 설정 없이 위 API를 바로 쓸 수 있다.
- `SafeAreaView`는 기본이 `additive` 모드라, `edges={["top"]}` + `style={{ paddingTop: 16 }}` 를 주면 **inset + 16** 이 적용된다. 탭 화면에서는 하단을 탭 바가 처리하므로 보통 `edges={["top"]}`만 준다.

## 시도 / 해결 과정

### 1차 수정 (완전하지 않았던 방식)

각 화면·컴포넌트에서 `useSafeAreaInsets()`를 호출해 `paddingTop: insets.top + 16` 을 직접 부여했다.

```tsx
const insets = useSafeAreaInsets();
<View style={[styles.wrap, { paddingTop: insets.top + 16 }]}>
```

- 동작은 했지만, 화면이 늘어날 때마다 같은 코드를 반복해야 하는 구조였다.
- safe-area 처리 책임이 여러 파일(`QuestionPicker`, `collection`)에 흩어졌다.

### 2차: 공용 `Screen` 래퍼로 리팩토링

safe-area + 공통 배경색을 한 곳에 모은 래퍼를 만들고, 각 화면을 이걸로 감쌌다.

```tsx
// src/components/Screen.tsx
export function Screen({ children, style }: PropsWithChildren<Props>) {
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}
```

- `game.tsx`: 루트 `View` → `<Screen>`. 중복 배경색 제거. `QuestionPicker`는 safe-area 코드를 걷어내고 원래의 정적 `paddingTop: 16`(헤더 자체 여백)으로 복귀.
- `collection.tsx`: `<Screen>`으로 교체, `useSafeAreaInsets` 제거. 기존 `container` 스타일은 상단 16px 갭만 갖는 `content`로 정리.

## 결론

- 탭 아이콘은 `@expo/vector-icons`(Ionicons)로 추가하고, 선택 시 채워진 아이콘 / 비선택 시 outline으로 전환하도록 했다.
- safe-area 처리는 **화면마다 inset을 반복하는 대신 공용 `Screen` 래퍼 한 곳으로 통합**했다. 새 탭 화면은 `<Screen>`으로 감싸기만 하면 상태바·다이내믹 아일랜드를 자동으로 피한다.
- 타입체크(`tsc --noEmit`)·린트(`expo lint`) 모두 통과 확인.

**교훈**: "일단 동작하는 수정"과 "구조적으로 옳은 수정"은 다르다. inset을 직접 더하는 방식도 틀린 건 아니지만, 반복이 보이기 시작하면 책임을 한 곳으로 모으는 래퍼 패턴을 먼저 검토하자.

## 참고

- `@expo/vector-icons` 아이콘 검색: https://icons.expo.fyi/
- `react-native-safe-area-context` — `SafeAreaView`의 `edges` / `mode`(padding·margin) / `additive`·`maximum` 모드
- 관련 커밋: `feat(tabs): 탭 바에 뽑기·컬렉션 아이콘 추가`
