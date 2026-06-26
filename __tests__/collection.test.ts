import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  addToCollection,
  COLLECTION_KEY,
  loadCollection,
} from "@/lib/collection";

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
