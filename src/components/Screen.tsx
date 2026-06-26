import type { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/constants/theme";

interface Props {
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, style }: PropsWithChildren<Props>) {
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
});
