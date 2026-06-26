# Draw Destiny Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "운명을 뽑아라" — 질문을 고르고, 셔플된 카드 덱을 기울이기/화살표로 순환 스크롤하며 가운데 카드를 탭해 플립으로 운명 텍스트를 확인하고, 뽑은 카드를 컬렉션에 모으는 모바일 게임.

**Architecture:** expo-router 3화면(랜딩 → 탭(게임/컬렉션)). 순수 로직(셔플·순환 창·컬렉션 저장)은 jest-expo로 TDD, UI/제스처/애니메이션은 Reanimated 4 + Gesture Handler, 기울임은 expo-sensors, 저장은 AsyncStorage. Rive는 dev client가 필요하므로 1~10단계를 Expo Go에서 완성한 뒤 마지막에 시각 레이어로 얹는다.

**Tech Stack:** Expo SDK 56, expo-router, react-native-reanimated 4, react-native-gesture-handler, expo-sensors, @react-native-async-storage/async-storage, rive-react-native, jest-expo, TypeScript(strict).

## Global Constraints

- 패키지 매니저는 pnpm@11.8.0 고정(`package.json`의 `packageManager` 필드에 명시).
- **새 패키지 추가**는 expo 패키지·일반 패키지 가리지 않고 항상 `pnpm expo install <pkg>` 사용 (Expo CLI가 SDK 56 호환 버전을 해석해 설치). `npm`/`npx`·`pnpm add` 직접 사용 금지.
- 코드 작성 전 https://docs.expo.dev/versions/v56.0.0/ 에서 해당 API의 v56 문서 확인.
- import 경로 별칭: `@/` = `./src/`.
- TypeScript strict 모드. 모든 모듈 함수는 명시적 타입 시그니처.
- 커밋 메시지는 `docs/conventions/commit-convention.md` 준수: `type(scope): subject` (한국어, 50자 이내). 커밋 본문 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- 작업 브랜치: `docs/draw-destiny-design` (설계 커밋이 있는 현재 브랜치)에서 이어서 작업.
- Rive(Task 11)는 Expo Go에서 동작하지 않음 → development build 필요. Task 1~10은 Expo Go로 검증 가능.

## File Structure

```
src/
  app/
    _layout.tsx              # 루트 스택 + GestureHandlerRootView (수정)
    index.tsx                # 랜딩 화면 (수정)
    (tabs)/
      _layout.tsx            # 탭 네비게이터 (생성)
      game.tsx               # 게임 화면 (생성)
      collection.tsx         # 컬렉션 화면 (생성)
  data/
    seed-decks.json          # 질문 + 카드 덱 시드 데이터 (생성)
  types/
    deck.ts                  # Card / Deck 타입 (생성)
  lib/
    deck.ts                  # shuffle / getWindow / step / activeIndexOf 순수 로직 (생성)
    collection.ts            # AsyncStorage 컬렉션 read/write (생성)
  components/
    QuestionPicker.tsx       # 질문 드롭다운 (생성)
    CardCarousel.tsx         # 5장 창 캐러셀 + 화살표 (생성)
    DrawnCard.tsx            # 뽑힌 카드 플립 reveal (생성)
  hooks/
    useTilt.ts               # accelerometer → 스크롤 방향 (생성)
__tests__/
  deck.test.ts               # 순수 로직 테스트 (생성)
  collection.test.ts         # 컬렉션 저장 테스트 (생성)
```

---

### Task 1: 프로젝트 셋업 — 의존성, 테스트 인프라, 루트 래핑

**Files:**
- Modify: `package.json` (의존성 추가 — `expo install`이 수정)
- Create: `jest.config.js`
- Create: `jest-setup.ts`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Produces: jest 테스트 실행 환경(`npm test`), `GestureHandlerRootView`로 감싼 루트 레이아웃.

- [ ] **Step 1: 런타임 의존성 설치**

Run:
```bash
pnpm expo install expo-sensors @react-native-async-storage/async-storage
```
Expected: `package.json` dependencies에 두 패키지가 SDK 56 호환 버전으로 추가됨.

- [ ] **Step 2: 테스트 의존성 설치**

Run:
```bash
pnpm expo install -- --save-dev jest jest-expo @types/jest
```
Expected: devDependencies에 `jest`, `jest-expo`, `@types/jest` 추가.

- [ ] **Step 3: jest 설정 파일 생성**

Create `jest.config.js`:
```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/.*))",
  ],
};
```

- [ ] **Step 4: jest 셋업 파일 생성 (AsyncStorage 모킹)**

Create `jest-setup.ts`:
```typescript
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);
```

- [ ] **Step 5: test 스크립트 추가**

Modify `package.json` scripts에 추가:
```json
"test": "jest"
```

- [ ] **Step 6: 동작 확인용 임시 테스트로 인프라 검증**

Create temporary `__tests__/smoke.test.ts`:
```typescript
test("jest runs", () => {
  expect(1 + 1).toBe(2);
});
```

Run: `npm test -- smoke`
Expected: PASS (1 test passed). 통과하면 `__tests__/smoke.test.ts` 삭제.

- [ ] **Step 7: 루트 레이아웃에 GestureHandlerRootView 적용**

Modify `src/app/_layout.tsx`:
```tsx
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 8: 커밋**

```bash
rm -f __tests__/smoke.test.ts
git add -A
git commit -m "chore(setup): 센서·저장·테스트 의존성 추가 및 루트 래핑

expo-sensors, async-storage, jest-expo 설치. GestureHandlerRootView로
루트 레이아웃을 감싸 제스처 사용 준비.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 타입 정의 + 시드 데이터

**Files:**
- Create: `src/types/deck.ts`
- Create: `src/data/seed-decks.json`

**Interfaces:**
- Produces: `Card { id: string; text: string; symbol: string }`, `Deck { id: string; question: string; cards: Card[] }`. `seedDecks: Deck[]` (json import). 각 덱의 `cards`는 최소 8장.

- [ ] **Step 1: 타입 정의 작성**

Create `src/types/deck.ts`:
```typescript
export interface Card {
  id: string;
  text: string;
  symbol: string;
}

export interface Deck {
  id: string;
  question: string;
  cards: Card[];
}
```

- [ ] **Step 2: 시드 데이터 작성 (질문 2개, 각 8장)**

Create `src/data/seed-decks.json`:
```json
[
  {
    "id": "caution-today",
    "question": "오늘 조심해야 할 것은?",
    "cards": [
      { "id": "caution-1", "text": "말보다 행동을 앞세우지 마세요", "symbol": "🌙" },
      { "id": "caution-2", "text": "서두르면 놓칩니다", "symbol": "🐢" },
      { "id": "caution-3", "text": "직감을 믿으세요", "symbol": "✨" },
      { "id": "caution-4", "text": "작은 약속을 가볍게 여기지 마세요", "symbol": "🪶" },
      { "id": "caution-5", "text": "지갑과 마음을 동시에 단속하세요", "symbol": "🔒" },
      { "id": "caution-6", "text": "익숙한 길에서 방심하지 마세요", "symbol": "🛤️" },
      { "id": "caution-7", "text": "화는 하루만 묵혀 두세요", "symbol": "🔥" },
      { "id": "caution-8", "text": "남의 말보다 내 기준을 보세요", "symbol": "🧭" }
    ]
  },
  {
    "id": "luck-today",
    "question": "오늘의 행운은?",
    "cards": [
      { "id": "luck-1", "text": "예상치 못한 좋은 소식이 옵니다", "symbol": "🍀" },
      { "id": "luck-2", "text": "오래된 인연이 도움을 줍니다", "symbol": "🤝" },
      { "id": "luck-3", "text": "작은 지출이 큰 기쁨이 됩니다", "symbol": "🎁" },
      { "id": "luck-4", "text": "용기를 낸 만큼 보상이 따릅니다", "symbol": "⭐" },
      { "id": "luck-5", "text": "잃어버린 것을 되찾습니다", "symbol": "🔑" },
      { "id": "luck-6", "text": "오늘의 미소가 행운을 부릅니다", "symbol": "😊" },
      { "id": "luck-7", "text": "기다리던 답장이 도착합니다", "symbol": "📩" },
      { "id": "luck-8", "text": "우연이 기회로 바뀝니다", "symbol": "🎲" }
    ]
  }
]
```

- [ ] **Step 3: 커밋**

```bash
git add src/types/deck.ts src/data/seed-decks.json
git commit -m "feat(data): 카드 덱 타입 및 시드 데이터 추가

질문 2종(조심/행운) 각 8장의 운명 카드 시드 데이터와 Card/Deck 타입 정의.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 덱 순수 로직 (셔플 / 순환 창 / 스크롤 / 활성 인덱스) — TDD

**Files:**
- Create: `src/lib/deck.ts`
- Test: `__tests__/deck.test.ts`

**Interfaces:**
- Consumes: `Card` from `@/types/deck`.
- Produces:
  - `shuffle<T>(arr: T[], rng?: () => number): T[]` — 원본 불변, 새 배열 반환.
  - `WINDOW_SIZE = 5` (상수).
  - `step(start: number, direction: 1 | -1, length: number): number` — 순환 인덱스 한 칸 이동.
  - `getWindow<T>(deck: T[], start: number): T[]` — start부터 WINDOW_SIZE개를 순환으로 반환.
  - `activeIndexOf(start: number): number` — 창 내 가운데(start+2)의 덱 인덱스 (정규화 전, 호출부에서 length로 mod). 실제 반환은 `(start + Math.floor(WINDOW_SIZE / 2))`를 length로 정규화한 값 — 시그니처는 `activeCardIndex(start: number, length: number): number`.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `__tests__/deck.test.ts`:
```typescript
import {
  shuffle,
  step,
  getWindow,
  activeCardIndex,
  WINDOW_SIZE,
} from "@/lib/deck";

describe("shuffle", () => {
  test("원본을 변형하지 않고 같은 원소를 반환", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test("주어진 rng로 결정적으로 섞임", () => {
    const rng = () => 0; // 항상 0 → 각 단계에서 첫 인덱스 선택
    const result = shuffle([1, 2, 3], rng);
    expect([...result].sort()).toEqual([1, 2, 3]);
  });
});

describe("step", () => {
  test("오른쪽(+1)으로 한 칸, 경계에서 순환", () => {
    expect(step(0, 1, 8)).toBe(1);
    expect(step(7, 1, 8)).toBe(0);
  });

  test("왼쪽(-1)으로 한 칸, 경계에서 순환", () => {
    expect(step(0, -1, 8)).toBe(7);
    expect(step(3, -1, 8)).toBe(2);
  });
});

describe("getWindow", () => {
  test("start부터 WINDOW_SIZE개를 순환으로 반환", () => {
    const deck = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(getWindow(deck, 0)).toEqual(["a", "b", "c", "d", "e"]);
    expect(getWindow(deck, 6)).toEqual(["g", "h", "a", "b", "c"]);
  });

  test("창 크기는 항상 WINDOW_SIZE", () => {
    const deck = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(getWindow(deck, 3)).toHaveLength(WINDOW_SIZE);
  });
});

describe("activeCardIndex", () => {
  test("창 가운데(3번째) 카드의 덱 인덱스를 순환으로 반환", () => {
    expect(activeCardIndex(0, 8)).toBe(2);
    expect(activeCardIndex(6, 8)).toBe(0);
    expect(activeCardIndex(7, 8)).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- deck`
Expected: FAIL — "Cannot find module '@/lib/deck'".

- [ ] **Step 3: 최소 구현 작성**

Create `src/lib/deck.ts`:
```typescript
export const WINDOW_SIZE = 5;

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function step(start: number, direction: 1 | -1, length: number): number {
  return (start + direction + length) % length;
}

export function getWindow<T>(deck: T[], start: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < WINDOW_SIZE; i++) {
    result.push(deck[(start + i) % deck.length]);
  }
  return result;
}

export function activeCardIndex(start: number, length: number): number {
  return (start + Math.floor(WINDOW_SIZE / 2)) % length;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- deck`
Expected: PASS (모든 테스트 통과).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/deck.ts __tests__/deck.test.ts
git commit -m "feat(deck): 셔플·순환 창·활성 인덱스 순수 로직 추가

Fisher-Yates 셔플(rng 주입 가능), 5장 순환 창 슬라이스, 한 칸 스크롤,
가운데 활성 카드 인덱스 계산을 TDD로 구현.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 컬렉션 저장 모듈 (AsyncStorage) — TDD

**Files:**
- Create: `src/lib/collection.ts`
- Test: `__tests__/collection.test.ts`

**Interfaces:**
- Produces:
  - `COLLECTION_KEY = "collection"` (상수).
  - `loadCollection(): Promise<string[]>` — 저장된 카드 id 배열. 없거나 파싱 실패 시 `[]`.
  - `addToCollection(cardId: string): Promise<string[]>` — 중복 무시하고 추가, 갱신된 배열 반환.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `__tests__/collection.test.ts`:
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadCollection, addToCollection, COLLECTION_KEY } from "@/lib/collection";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("loadCollection", () => {
  test("저장된 값이 없으면 빈 배열", async () => {
    expect(await loadCollection()).toEqual([]);
  });

  test("손상된 JSON이면 빈 배열로 폴백", async () => {
    await AsyncStorage.setItem(COLLECTION_KEY, "not-json{");
    expect(await loadCollection()).toEqual([]);
  });

  test("저장된 배열을 반환", async () => {
    await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(["a", "b"]));
    expect(await loadCollection()).toEqual(["a", "b"]);
  });
});

describe("addToCollection", () => {
  test("새 카드를 추가하고 갱신된 배열 반환", async () => {
    const result = await addToCollection("luck-1");
    expect(result).toEqual(["luck-1"]);
    expect(await loadCollection()).toEqual(["luck-1"]);
  });

  test("중복은 무시", async () => {
    await addToCollection("luck-1");
    const result = await addToCollection("luck-1");
    expect(result).toEqual(["luck-1"]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- collection`
Expected: FAIL — "Cannot find module '@/lib/collection'".

- [ ] **Step 3: 최소 구현 작성**

Create `src/lib/collection.ts`:
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

export const COLLECTION_KEY = "collection";

export async function loadCollection(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addToCollection(cardId: string): Promise<string[]> {
  const current = await loadCollection();
  if (current.includes(cardId)) return current;
  const updated = [...current, cardId];
  await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(updated));
  return updated;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- collection`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/collection.ts __tests__/collection.test.ts
git commit -m "feat(collection): AsyncStorage 컬렉션 저장 모듈 추가

뽑은 카드 id를 중복 없이 저장/로드. 손상 데이터 시 빈 배열 폴백을 TDD로 구현.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 라우팅 골격 — 랜딩 + 탭(게임/컬렉션)

**Files:**
- Modify: `src/app/index.tsx`
- Create: `src/app/(tabs)/_layout.tsx`
- Create: `src/app/(tabs)/game.tsx`
- Create: `src/app/(tabs)/collection.tsx`

**Interfaces:**
- Produces: 랜딩 화면의 "게임 시작" 버튼 → `/(tabs)/game` 이동. 게임/컬렉션 탭 전환 가능. game/collection은 이후 태스크에서 내용을 채우는 placeholder 화면.

- [ ] **Step 1: 랜딩 화면 작성**

Modify `src/app/index.tsx`:
```tsx
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Landing() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Draw Destiny</Text>
      <Text style={styles.tagline}>운명을 뽑아라</Text>
      <Pressable
        style={styles.button}
        onPress={() => router.replace("/(tabs)/game")}
      >
        <Text style={styles.buttonText}>게임 시작</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E0B1A",
    gap: 12,
  },
  logo: { fontSize: 40, fontWeight: "800", color: "#F4EAD5" },
  tagline: { fontSize: 16, color: "#B9A6E0", marginBottom: 32 },
  button: {
    backgroundColor: "#7C5CFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
```

- [ ] **Step 2: 탭 레이아웃 작성**

Create `src/app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="game" options={{ title: "뽑기" }} />
      <Tabs.Screen name="collection" options={{ title: "컬렉션" }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: 게임 화면 placeholder 작성**

Create `src/app/(tabs)/game.tsx`:
```tsx
import { StyleSheet, Text, View } from "react-native";

export default function GameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>게임 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0E0B1A" },
  text: { color: "#F4EAD5", fontSize: 20 },
});
```

- [ ] **Step 4: 컬렉션 화면 placeholder 작성**

Create `src/app/(tabs)/collection.tsx`:
```tsx
import { StyleSheet, Text, View } from "react-native";

export default function CollectionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>컬렉션 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0E0B1A" },
  text: { color: "#F4EAD5", fontSize: 20 },
});
```

- [ ] **Step 5: 타입체크 + 실행 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

Run: `npm run ios` (또는 `npm run web`)으로 앱 실행 → 랜딩에서 "게임 시작" 탭 → 게임/컬렉션 탭 전환 확인. 뒤로가기로 랜딩이 다시 보이지 않는지 확인(`router.replace` 동작).

- [ ] **Step 6: 커밋**

```bash
git add src/app
git commit -m "feat(routing): 랜딩과 게임·컬렉션 탭 화면 골격 추가

랜딩에서 게임 시작 시 탭 네비게이터로 진입(replace). 게임/컬렉션은
이후 채워질 placeholder 화면.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 질문 선택 드롭다운

**Files:**
- Create: `src/components/QuestionPicker.tsx`
- Modify: `src/app/(tabs)/game.tsx`

**Interfaces:**
- Consumes: `Deck` from `@/types/deck`, `seedDecks` from `@/data/seed-decks.json`.
- Produces: `QuestionPicker` 컴포넌트 — props `{ decks: Deck[]; selectedId: string | null; onSelect: (deckId: string) => void }`. Modal 기반 선택 UI. game 화면에 선택 상태(`selectedDeckId`) 추가.

- [ ] **Step 1: QuestionPicker 컴포넌트 작성**

Create `src/components/QuestionPicker.tsx`:
```tsx
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
```

- [ ] **Step 2: 게임 화면에 통합**

Modify `src/app/(tabs)/game.tsx`:
```tsx
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
```

> JSON import는 tsconfig가 `expo/tsconfig.base`를 extends하므로 `resolveJsonModule`이 기본 활성. 별도 설정 불필요.

- [ ] **Step 3: 타입체크 + 실행 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

실행 후: 게임 탭에서 드롭다운을 열어 질문 선택 → 선택된 질문과 카드 수가 본문에 표시되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/QuestionPicker.tsx "src/app/(tabs)/game.tsx"
git commit -m "feat(game): 질문 선택 드롭다운 추가

Modal 기반 질문 선택 UI와 게임 화면 선택 상태 연결. 선택 시 해당 덱 정보 표시.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 캐러셀 UI + 화살표 순환 스크롤 (Reanimated, 센서 없이)

**Files:**
- Create: `src/components/CardCarousel.tsx`
- Modify: `src/app/(tabs)/game.tsx`

**Interfaces:**
- Consumes: `Card` from `@/types/deck`, `getWindow`/`step`/`activeCardIndex`/`WINDOW_SIZE` from `@/lib/deck`.
- Produces: `CardCarousel` — props `{ deck: Card[]; onDrawActive: (card: Card) => void }`. 내부에서 `windowStart` 상태 관리, 좌우 화살표로 `step` 호출. 가운데 카드를 위로 띄움. `onDrawActive`는 Task 9에서 사용(지금은 가운데 카드 탭 시 호출만 연결).

- [ ] **Step 1: CardCarousel 컴포넌트 작성**

Create `src/components/CardCarousel.tsx`:
```tsx
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { activeCardIndex, getWindow, step, WINDOW_SIZE } from "@/lib/deck";
import type { Card } from "@/types/deck";

interface Props {
  deck: Card[];
  onDrawActive: (card: Card) => void;
}

const CENTER_SLOT = Math.floor(WINDOW_SIZE / 2); // 2

export function CardCarousel({ deck, onDrawActive }: Props) {
  const [windowStart, setWindowStart] = useState(0);
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
        <Pressable style={styles.arrow} onPress={() => setWindowStart((s) => step(s, -1, deck.length))}>
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
        <Text style={styles.hint}>기울이거나 화살표로 카드를 넘기세요</Text>
        <Pressable style={styles.arrow} onPress={() => setWindowStart((s) => step(s, 1, deck.length))}>
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
```

- [ ] **Step 2: 게임 화면에 캐러셀 연결 (셔플된 덱 주입)**

Modify `src/app/(tabs)/game.tsx`:
```tsx
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CardCarousel } from "@/components/CardCarousel";
import { QuestionPicker } from "@/components/QuestionPicker";
import seedDecks from "@/data/seed-decks.json";
import { shuffle } from "@/lib/deck";
import type { Card, Deck } from "@/types/deck";

const DECKS = seedDecks as Deck[];

export default function GameScreen() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const selectedDeck = DECKS.find((d) => d.id === selectedDeckId) ?? null;

  const shuffledCards = useMemo<Card[]>(
    () => (selectedDeck ? shuffle(selectedDeck.cards) : []),
    [selectedDeck],
  );

  const handleDraw = (card: Card) => {
    // Task 9에서 플립/저장 연결
    console.log("draw", card.id);
  };

  return (
    <View style={styles.container}>
      <QuestionPicker decks={DECKS} selectedId={selectedDeckId} onSelect={setSelectedDeckId} />
      {selectedDeck ? (
        <CardCarousel deck={shuffledCards} onDrawActive={handleDraw} />
      ) : (
        <View style={styles.body}>
          <Text style={styles.text}>질문을 골라 운명을 뽑으세요</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0B1A" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#F4EAD5", fontSize: 18, textAlign: "center", paddingHorizontal: 24 },
});
```

- [ ] **Step 3: 타입체크 + 실행 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

실행 후: 질문 선택 → 카드 5장 부채꼴 표시, 가운데 카드가 떠오름. 좌우 화살표로 창이 순환 이동(끝에서 처음으로 이어짐)하는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/CardCarousel.tsx "src/app/(tabs)/game.tsx"
git commit -m "feat(carousel): 화살표 순환 스크롤 카드 캐러셀 추가

5장 창을 순환 스크롤하고 가운데 카드를 띄우는 캐러셀. 셔플된 덱을
게임 화면에서 주입. 가운데 카드 탭 시 뽑기 콜백 연결.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 기울이기 입력 (expo-sensors accelerometer)

**Files:**
- Create: `src/hooks/useTilt.ts`
- Modify: `src/components/CardCarousel.tsx`

**Interfaces:**
- Consumes: `expo-sensors` Accelerometer.
- Produces: `useTilt(onStep: (direction: 1 | -1) => void, enabled: boolean): void` — accelerometer x값을 스무딩/임계값/디바운스 처리해 한 칸 스크롤 방향을 콜백. `enabled=false`면 구독 해제.

- [ ] **Step 1: useTilt 훅 작성**

Create `src/hooks/useTilt.ts`:
```typescript
import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";

const THRESHOLD = 0.35; // 이 이상 기울면 한 칸 이동
const RESET = 0.18; // 이 아래로 돌아와야 다음 이동 허용 (디바운스)
const SMOOTHING = 0.2; // 저역통과 계수

export function useTilt(onStep: (direction: 1 | -1) => void, enabled: boolean): void {
  const smoothed = useRef(0);
  const armed = useRef(true);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x }) => {
      smoothed.current = smoothed.current * (1 - SMOOTHING) + x * SMOOTHING;
      const value = smoothed.current;

      if (armed.current && Math.abs(value) > THRESHOLD) {
        // x>0 → 오른쪽 기울임 → 오른쪽으로 한 칸(+1)
        onStepRef.current(value > 0 ? 1 : -1);
        armed.current = false;
      } else if (!armed.current && Math.abs(value) < RESET) {
        armed.current = true;
      }
    });

    return () => sub.remove();
  }, [enabled]);
}
```

> v56 문서 확인 대상: `Accelerometer.addListener`, `setUpdateInterval` 시그니처 — https://docs.expo.dev/versions/v56.0.0/sdk/accelerometer/

- [ ] **Step 2: 캐러셀에서 useTilt 연결**

Modify `src/components/CardCarousel.tsx` — `useState` import에 `useTilt` 추가하고 컴포넌트 본문에 훅 호출:

상단 import 추가:
```tsx
import { useTilt } from "@/hooks/useTilt";
```

`CardCarousel` 본문에서 `windowStart` 선언 직후 추가:
```tsx
  const moveWindow = (direction: 1 | -1) =>
    setWindowStart((s) => step(s, direction, deck.length));

  useTilt(moveWindow, true);
```

그리고 화살표 `onPress`를 `moveWindow` 사용으로 교체:
```tsx
        <Pressable style={styles.arrow} onPress={() => moveWindow(-1)}>
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
```
```tsx
        <Pressable style={styles.arrow} onPress={() => moveWindow(1)}>
          <Text style={styles.arrowText}>▶</Text>
        </Pressable>
```

- [ ] **Step 3: 타입체크 + 실기기 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

실기기(또는 시뮬레이터 센서)에서: 폰을 좌우로 기울이면 카드 창이 한 칸씩 순환 이동. 한 번 기울였다 중앙으로 돌아와야 다음 이동이 되는지(연속 이동 방지) 확인. 화살표도 여전히 동작.

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/useTilt.ts src/components/CardCarousel.tsx
git commit -m "feat(tilt): 기울이기로 카드 스크롤하는 센서 입력 추가

accelerometer x값을 저역통과·임계값·디바운스 처리해 한 칸씩 순환 이동.
화살표와 동일한 스크롤 동작 공유.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: 카드 뽑기 + 플립 reveal + 컬렉션 저장

**Files:**
- Create: `src/components/DrawnCard.tsx`
- Modify: `src/app/(tabs)/game.tsx`
- Modify: `src/components/CardCarousel.tsx`

**Interfaces:**
- Consumes: `Card` from `@/types/deck`, `addToCollection` from `@/lib/collection`.
- Produces: `DrawnCard` — props `{ card: Card; onClose: () => void }`. 마운트 시 제자리 플립(뒷면→앞면) 후 텍스트 노출, "다시 뽑기" 버튼. game 화면이 `drawnCard` 상태를 들고 뽑기 시 오버레이로 표시. 뽑힌 동안 캐러셀 기울임 정지(`enabled` prop화).

- [ ] **Step 1: 캐러셀의 tilt를 외부 제어 가능하게 enabled prop 추가**

Modify `src/components/CardCarousel.tsx` — props 인터페이스와 useTilt 호출 수정:
```tsx
interface Props {
  deck: Card[];
  onDrawActive: (card: Card) => void;
  tiltEnabled: boolean;
}
```
```tsx
export function CardCarousel({ deck, onDrawActive, tiltEnabled }: Props) {
```
```tsx
  useTilt(moveWindow, tiltEnabled);
```

- [ ] **Step 2: DrawnCard 컴포넌트 작성 (플립)**

Create `src/components/DrawnCard.tsx`:
```tsx
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
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: "hidden",
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` }],
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,6,16,0.92)", alignItems: "center", justifyContent: "center", gap: 32 },
  cardWrap: { width: 220, height: 320 },
  face: { ...StyleSheet.absoluteFillObject, borderRadius: 20, alignItems: "center", justifyContent: "center", padding: 24 },
  back: { backgroundColor: "#2A2342", borderWidth: 1, borderColor: "#3D3460" },
  front: { backgroundColor: "#3A2E5C", borderWidth: 1, borderColor: "#7C5CFF", gap: 16 },
  backGlyph: { fontSize: 64 },
  symbol: { fontSize: 56 },
  text: { color: "#F4EAD5", fontSize: 20, textAlign: "center", fontWeight: "600" },
  button: { backgroundColor: "#7C5CFF", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
```

> `backfaceVisibility`/`rotateY` 동작은 Reanimated 4 + RN 0.85 기준. 실기기에서 앞/뒷면 전환이 자연스러운지 검증.

- [ ] **Step 3: 게임 화면에서 뽑기 → 오버레이 + 저장 연결**

Modify `src/app/(tabs)/game.tsx` — 상태/핸들러/렌더 수정:
```tsx
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
      <QuestionPicker decks={DECKS} selectedId={selectedDeckId} onSelect={setSelectedDeckId} />
      {selectedDeck ? (
        <CardCarousel deck={shuffledCards} onDrawActive={handleDraw} tiltEnabled={drawnCard === null} />
      ) : (
        <View style={styles.body}>
          <Text style={styles.text}>질문을 골라 운명을 뽑으세요</Text>
        </View>
      )}
      {drawnCard && <DrawnCard card={drawnCard} onClose={() => setDrawnCard(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0B1A" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#F4EAD5", fontSize: 18, textAlign: "center", paddingHorizontal: 24 },
});
```

- [ ] **Step 4: 타입체크 + 실행 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

실행 후: 가운데 카드 탭 → 오버레이에서 카드가 플립되며 운명 텍스트/심볼 노출. "다시 뽑기"로 복귀. 뽑힌 동안 기울임이 멈추는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/DrawnCard.tsx src/components/CardCarousel.tsx "src/app/(tabs)/game.tsx"
git commit -m "feat(draw): 카드 플립 reveal 및 컬렉션 저장 추가

가운데 카드 탭 시 플립 오버레이로 운명 텍스트 공개, 뽑은 카드를
AsyncStorage에 저장. 뽑힌 동안 기울임 입력 정지.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: 컬렉션 화면 (도감 그리드)

**Files:**
- Modify: `src/app/(tabs)/collection.tsx`

**Interfaces:**
- Consumes: `seedDecks` from `@/data/seed-decks.json`, `loadCollection` from `@/lib/collection`, `useFocusEffect` from `expo-router`.
- Produces: 전체 카드를 그리드로 표시, 뽑은 카드는 앞면(텍스트), 미수집 카드는 잠김. 탭 포커스 시마다 컬렉션 재로딩.

- [ ] **Step 1: 컬렉션 화면 작성**

Modify `src/app/(tabs)/collection.tsx`:
```tsx
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
```

> v56 문서 확인 대상: `useFocusEffect`의 expo-router export 여부 — https://docs.expo.dev/versions/v56.0.0/ (없으면 `@react-navigation/native`의 `useFocusEffect` 사용).

- [ ] **Step 2: 타입체크 + 실행 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

실행 후: 게임에서 카드 몇 장 뽑은 뒤 컬렉션 탭 → 뽑은 카드는 앞면, 나머지는 자물쇠. 카운터(`n/16`) 갱신 확인.

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(tabs)/collection.tsx"
git commit -m "feat(collection): 도감 그리드 화면 구현

전체 카드를 그리드로 표시하고 뽑은 카드는 앞면, 미수집 카드는 잠금.
탭 포커스 시 컬렉션 재로딩.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Rive 연동 (development build 필요)

> **선행 조건:** Rive는 네이티브 모듈이라 Expo Go에서 동작하지 않음. 이 태스크는 development build에서 진행한다. Community 무료 `.riv` 에셋을 사용하며, 상태 머신/인풋 이름은 실제 받은 에셋에 맞춰 조정한다. 에셋 미확보 시 이 태스크는 보류하고 Task 1~10 결과물로 MVP를 완료한 것으로 본다.

**Files:**
- Modify: `package.json`, `app.json` (Rive 설치/플러그인)
- Create: `assets/rive/<asset>.riv` (Community 에셋)
- Modify: `src/app/index.tsx` (랜딩 Rive 연출)
- Modify: `src/components/DrawnCard.tsx` (reveal Rive)

**Interfaces:**
- Consumes: `rive-react-native` `<Rive />` 컴포넌트, `useRef<RiveRef>`.
- Produces: 랜딩에 Rive 애니메이션, reveal 시 Rive 재생. 실패 시 기존 정적/Reanimated 폴백 유지.

- [ ] **Step 1: Rive 설치 및 dev build 준비**

Run:
```bash
pnpm expo install rive-react-native
```
Expected: dependencies에 추가.

v56 문서 및 Rive RN 문서에서 Expo config plugin/네이티브 설정 확인 후 `app.json` plugins에 필요한 항목 추가. 그 뒤:
```bash
npx expo prebuild
npm run ios   # 또는 eas build로 dev client
```

- [ ] **Step 2: Community .riv 에셋 배치**

Rive Community에서 카드/캐릭터 reveal에 어울리는 무료 `.riv`를 받아 `assets/rive/`에 저장. 에셋의 artboard / state machine / input 이름을 기록(다음 스텝에서 사용).

- [ ] **Step 3: 랜딩에 Rive 연출 추가**

Modify `src/app/index.tsx` — 로고 위에 Rive 추가 (state machine/asset 이름은 실제 에셋에 맞게 교체):
```tsx
import Rive from "rive-react-native";
```
로고 `<Text>` 위에 삽입:
```tsx
      <Rive
        resourceName="<asset-name>"
        stateMachineName="<state-machine>"
        style={{ width: 220, height: 220 }}
        autoplay
      />
```

- [ ] **Step 4: reveal 시 Rive 재생 연결**

Modify `src/components/DrawnCard.tsx` — 플립 완료 시점(`withTiming` 콜백)에 Rive reveal 트리거를 재생하도록 `<Rive ref>` 추가 및 `riveRef.current?.fireState("<sm>", "<input>")` 호출. 로드 실패 시 기존 텍스트 앞면이 그대로 보이도록 Rive를 텍스트 위 레이어로 둔다.

- [ ] **Step 5: dev build 실행 검증**

dev client에서: 랜딩 Rive 재생, 카드 뽑기 시 reveal Rive 재생, Rive 비활성/실패 시에도 텍스트가 보이는지(폴백) 확인.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(rive): 랜딩 연출 및 카드 reveal Rive 애니메이션 연동

Community .riv 에셋으로 랜딩/뽑기 시각 효과 추가. 로드 실패 시 기존
정적·Reanimated 폴백 유지.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 검증 요약

- 순수 로직(Task 3, 4): `npm test` 자동 검증.
- UI/제스처/센서/애니메이션(Task 5~10): `npx tsc --noEmit` + Expo Go 실행 검증.
- Rive(Task 11): development build 실행 검증.

## 단계별 의존 관계

Task 1 → 2 → (3, 4 병렬 가능) → 5 → 6 → 7 → 8 → 9 → 10 → 11.
Task 11은 dev build/에셋 확보 전까지 보류 가능하며, Task 1~10으로 Expo Go MVP가 완성된다.
