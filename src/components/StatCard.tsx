import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  icon?: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  style?: ViewStyle;
};

export function StatCard({ icon, title, value, subtitle, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.icon}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    minHeight: 110,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  value: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});

