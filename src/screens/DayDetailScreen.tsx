import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { formatDayKeyLabel } from "../utils/dateLabel";
import { getWaterSumForDay, listMealsForDay, type MealEntry } from "../db/repo";
import { PrimaryButton } from "../components/PrimaryButton";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { mealMetaLine } from "../utils/mealLabels";

type Props = {
  route: { params: { dayKey: string } };
  navigation: { goBack: () => void };
};

export function DayDetailScreen({ route, navigation }: Props) {
  const nav = useNavigation<any>();
  const { dayKey } = route.params;
  const [water, setWater] = React.useState(0);
  const [meals, setMeals] = React.useState<MealEntry[]>([]);

  const reload = React.useCallback(async () => {
    setWater(await getWaterSumForDay(dayKey));
    setMeals(await listMealsForDay(dayKey));
  }, [dayKey]);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {formatDayKeyLabel(dayKey)}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.summary}>
          <Text style={styles.summaryLine}>Agua: {water} ml</Text>
          <Text style={styles.summaryLine}>Comidas: {meals.length}</Text>
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton title="Añadir comida" variant="purple" style={{ flex: 1 }} onPress={() => nav.navigate("AddMeal")} />
          <PrimaryButton title="Añadir agua" variant="blue" style={{ flex: 1 }} onPress={() => nav.navigate("AddWater")} />
        </View>

        <Text style={styles.sectionTitle}>Comidas</Text>
        {meals.length === 0 ? (
          <Text style={styles.muted}>No hay comidas este día.</Text>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {meals.map((m) => (
              <Pressable key={m.id} style={styles.mealRow} onPress={() => nav.navigate("EditMeal", { id: m.id })}>
                <View style={styles.mealIcon}>
                  <Text style={{ fontSize: 16 }}>🍴</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{m.title}</Text>
                  <Text style={styles.mealMeta}>{mealMetaLine(m)}</Text>
                </View>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 16, fontWeight: "900", color: colors.text, textTransform: "capitalize" },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLine: { fontSize: 14, fontWeight: "800", color: colors.text },
  actionsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  sectionTitle: { marginTop: spacing.xl, fontSize: 18, fontWeight: "900", color: colors.text },
  muted: { marginTop: spacing.md, color: colors.textMuted },
  mealRow: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mealIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  mealTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  mealMeta: { marginTop: 4, fontSize: 13, color: colors.textMuted, textTransform: "capitalize" },
  chev: { fontSize: 22, fontWeight: "900", color: "rgba(17,24,39,0.35)" },
});

