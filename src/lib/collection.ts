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
