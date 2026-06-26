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
