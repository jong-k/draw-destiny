# 카드 섞기 기능 설계

> 작성일: 2026-06-26
> 대상: Draw Destiny 게임 화면의 카드 덱 셔플 기능

## 1. 목표

게임 화면에 **"카드 섞기"** 버튼을 추가한다. 누르면 현재 선택된 덱을 한 번 재셔플하고,
"부채꼴 → 가운데로 모음 → 살짝 흔들기 → 새 순서로 다시 펼치기" 애니메이션을 보여준다.

## 2. 현재 상태

- `shuffle<T>(arr, rng=Math.random)`: Fisher-Yates 셔플. `src/lib/deck.ts:3`. 단위테스트 존재.
- `src/app/(tabs)/game.tsx`: 덱 선택 시 `shuffledCards = useMemo(() => shuffle(deck.cards), [selectedDeck])`
  로 1회 셔플. `CardCarousel`을 `key={selectedDeckId}`로 렌더.
- `src/components/CardCarousel.tsx`: 5장 부채꼴 배치. 각 `CarouselCard`가 `useSharedValue`로
  `angle`/`lift`/`scale`를 갖고 슬롯·활성 변화 시 `withSpring`으로 애니메이션.
  부채꼴은 `transformOrigin`을 카드 아래 한 점(`50% 150%`)으로 둔 회전으로 펼쳐진다.

→ 셔플 로직은 이미 존재한다. 추가할 것은 **버튼 UI**, **같은 덱 재셔플 트리거**, **셔플 애니메이션**뿐이다.

## 3. 확정된 요구사항

- **애니메이션 연출**: 모았다 다시 펼치기 (collapse → wiggle → re-fan).
- **버튼 위치**: 화면 하단 고정 바, 라벨 "카드 섞기", 항상 표시.
- **덱 미선택 시**: 버튼 비활성(`disabled`) — 섞을 대상이 없음.
- **결과(reveal)가 떠 있을 때 누르면**: 결과를 닫고 재셔플.
- **셔플 진행 중**: 기울임/화살표/카드 탭 입력 잠금.

## 4. 접근법 결정

| 접근 | 내용 | 결정 |
|------|------|------|
| **A. 캐러셀이 셔플 애니메이션 소유** | 부모는 셔플 카운터+데이터만, 연출은 `CardCarousel` 내부 | **채택** — 애니메이션이 부채꼴 변환과 같은 곳에 있어 응집도 높음 |
| B. key 리마운트 | 캐러셀 `key`를 바꿔 재마운트 | 기각 — "모으는" 단계가 사라져 페이드 교체에 그침 |
| C. 부모가 phase 관리 | 부모가 deck prop 주입 시점을 단계별로 제어 | 기각 — 부모-자식 prop 왕복이 많아 경계가 지저분 |

## 5. 상세 설계

### 5.1 부모: `src/app/(tabs)/game.tsx`

- 상태 추가: `const [shuffleNonce, setShuffleNonce] = useState(0)`.
- 재셔플 가능하도록 의존성 확장:
  `const shuffledCards = useMemo(() => (selectedDeck ? shuffle(selectedDeck.cards) : []), [selectedDeck, shuffleNonce])`.
- 핸들러: `handleShuffle = () => { setDrawnCard(null); setShuffleNonce((n) => n + 1); }`.
- 캐러셀에 `shuffleNonce`를 prop으로 전달. `key`는 **`selectedDeckId`만** 유지
  (셔플로는 리마운트하지 않아 애니메이션 연속성을 확보).
- 하단 고정 바에 `ShuffleButton` 배치. `disabled={selectedDeck === null}`.

### 5.2 셔플 버튼

- 기존 화면 구조(`Screen` 래퍼) 안에서 하단에 고정되는 넓은 `Pressable`.
- 라벨 "카드 섞기". 테마 색상은 기존 카드/컨트롤 팔레트(`#1C1730`, `#7C5CFF`, `#F4EAD5`)를 따른다.
- 비활성 시 흐리게 표시.
- 별도 컴포넌트로 분리하지 않고 game 화면 내 작은 프레젠테이션 요소로 둘 수 있으나,
  스타일·상태가 단순하므로 game.tsx 내 인라인 또는 같은 파일 내 함수형 컴포넌트로 둔다(YAGNI).

### 5.3 캐러셀: `src/components/CardCarousel.tsx`

Props에 `shuffleNonce: number` 추가.

내부 상태/공유값:
- `displayDeck` (state): 현재 화면에 렌더 중인 카드 배열. 초기값은 `deck` prop.
- `windowStart` (state): 기존 그대로.
- `collapse` (shared value, 0~1): 0=완전히 펼침, 1=가운데 한 더미로 모임.
- `isShuffling` (state 또는 shared): 입력 잠금용.

`shuffleNonce` 변화 감지(`useEffect`, 초기 마운트는 무시) 시 상태머신 실행:
1. **collapse 0→1** (`withTiming`, ~200ms): 모든 카드 `angle→0`로 가운데 겹침
   (낮은 피벗 회전 구조라 angle만 0으로 보내면 자연스럽게 한 더미로 쌓임). `lift→0`, `scale→1`.
2. **wiggle**: 모인 상태에서 `fanArea`(또는 collapse 컨테이너)를 좌우로 짧게 흔드는
   `withSequence`(예: +6 → -6 → 0 deg/px, 각 60~80ms)로 섞는 느낌.
3. **swap** (`runOnJS` 완료 콜백): `setDisplayDeck(deck)` + `setWindowStart(0)`.
4. **collapse 1→0** (`withSpring`, 기존 `SPRING` 상수): 새 순서로 다시 부채꼴 전개.
5. 종료 시 `isShuffling=false`.

`CarouselCard`의 transform 보간:
- 각 카드의 목표 `angle`/`lift`/`scale`를 `collapse`로 보간한다.
  예: 유효 angle = `slotAngle * (1 - collapse)`, 유효 lift = `baseLift * (1 - collapse)`,
  유효 scale = `1 + (targetScale - 1) * (1 - collapse)`.
- 기존 슬롯/활성 변화 스프링 로직은 유지하되, 최종 transform에 `collapse` 게이트를 곱한다.
- 구현상 `collapse`를 prop(shared value)으로 각 카드에 내려, `useAnimatedStyle` 안에서 보간한다.

입력 잠금:
- `isShuffling`이 true인 동안 `moveWindow`, 화살표 `onPress`, 카드 `onPress`를 무시.
- `useTilt`에는 `tiltEnabled && !isShuffling` 형태로 전달.

### 5.4 데이터/책임 경계

- `deck.ts`의 `shuffle()`는 변경 없이 재사용.
- **부모**: "언제/무엇을 섞을지"(nonce + shuffledCards) 소유.
- **캐러셀**: "어떻게 보일지"(collapse 상태머신, 입력 잠금) 소유.
- swap 시점을 캐러셀이 제어하므로, 새 deck prop이 도착해도 collapse가 끝난 뒤에야 화면에 반영된다.

## 6. 엣지 케이스

- 셔플 도중 다시 셔플 버튼을 눌러 `shuffleNonce`가 또 증가하는 경우: 진행 중이면
  버튼을 잠그거나(권장), 새 nonce를 받아 진행 중 애니메이션을 중단하고 재시작한다.
  → 단순화를 위해 **셔플 진행 중에는 버튼도 잠근다**(입력 잠금에 포함).
- 덱 변경(`selectedDeckId` 변경)으로 캐러셀이 리마운트되면 `displayDeck`/`collapse`는 초기 상태로
  자연 리셋된다.

## 7. 테스트/검증

- `shuffle()` 순수 로직은 기존 단위테스트로 커버됨. 새로 추가되는 순수 로직은 거의 없음.
- 애니메이션·상태머신·입력 잠금은 `pnpm exec tsc --noEmit` 통과 + 실기기 육안 검증
  (현 프로젝트 관례와 동일).
- 검증 포인트: ① 버튼이 항상 보이고 덱 미선택 시 비활성 ② 누르면 모았다 펼치기 연출
  ③ 펼친 뒤 카드 순서가 실제로 바뀜 ④ 결과가 떠 있을 때 누르면 결과 닫고 재셔플
  ⑤ 셔플 도중 입력 잠금.

## 8. 범위 밖 (YAGNI)

- 셔플 사운드/햅틱.
- 셔플 횟수 카운트나 통계.
- 리플(riffle)·페이드 등 대체 연출 (이번엔 모았다 펼치기만).
