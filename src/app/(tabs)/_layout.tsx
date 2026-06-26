import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="game" options={{ title: "뽑기" }} />
      <Tabs.Screen name="collection" options={{ title: "컬렉션" }} />
    </Tabs>
  );
}
