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
