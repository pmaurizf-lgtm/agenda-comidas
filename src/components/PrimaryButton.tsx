import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "purple" | "blue" | "green" | "ghost";
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
};

export function PrimaryButton({ title, onPress, variant = "purple", style, leftIcon }: Props) {
  const bg =
    variant === "purple"
      ? colors.purple
      : variant === "blue"
        ? colors.blue
        : variant === "green"
          ? colors.green
          : "transparent";

  const textColor = variant === "ghost" ? colors.purple : "#FFFFFF";
  const borderColor = variant === "ghost" ? colors.purple : "transparent";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      {leftIcon ? <>{leftIcon}</> : null}
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
});

