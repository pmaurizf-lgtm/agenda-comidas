import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  left?: React.ReactNode;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, left, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.base, selected ? styles.selected : null, style]}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <Text style={[styles.text, selected ? styles.textSelected : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selected: {
    backgroundColor: "rgba(109,92,231,0.10)",
    borderColor: colors.purple,
  },
  left: {
    width: 22,
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMuted,
  },
  textSelected: {
    color: colors.purple,
  },
});

