import {
  activeCardIndex,
  getWindow,
  shuffle,
  step,
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
    const rng = () => 0; // 항상 0 → Fisher-Yates 각 단계에서 인덱스 0 선택
    const result = shuffle([1, 2, 3], rng);
    expect(result).toEqual([2, 3, 1]);
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
