import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { formatLongDate, getGreeting } from "../utils/date";
import { StatCard } from "../components/StatCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { initDb } from "../db/db";
import { listMealsForDay, getWaterSumForDay, MealEntry } from "../db/repo";
import { toDayKey } from "../utils/dayKey";
import { getWaterGoalMl } from "../settings/settings";
import { mealMetaLine } from "../utils/mealLabels";

function IconDot({ label }: { label: string }) {
  return <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>{label}</Text>;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    initDb();
  }, []);

  const now = new Date();
  const greeting = getGreeting(now);
  const date = formatLongDate(now);

  const [waterMl, setWaterMl] = React.useState(0);
  const [waterGoalMl, setWaterGoalMl] = React.useState(2000);
  const [meals, setMeals] = React.useState<MealEntry[]>([]);

  const reload = React.useCallback(() => {
    const dayKey = toDayKey(new Date());
    setWaterMl(getWaterSumForDay(dayKey));
    setMeals(listMealsForDay(dayKey));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      reload();
      void getWaterGoalMl().then(setWaterGoalMl);
    }, [reload]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <View style={styles.searchBtn}>
            <Text style={{ fontSize: 18 }}>⌕</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <StatCard
            icon={<IconDot label="💧" />}
            title="Agua"
            value={`${waterMl}ml`}
            subtitle={`de ${waterGoalMl}ml`}
          />
          <StatCard
            icon={<IconDot label="🍴" />}
            title="Comidas"
            value={`${meals.length}`}
            subtitle="registradas hoy"
          />
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton
            title="Registrar comida"
            variant="purple"
            style={{ flex: 1 }}
            leftIcon={<Text>＋</Text>}
            onPress={() => navigation.navigate("AddMeal")}
          />
          <PrimaryButton
            title="Registrar agua"
            variant="blue"
            style={{ flex: 1 }}
            leftIcon={<Text>💧</Text>}
            onPress={() => navigation.navigate("AddWater")}
          />
        </View>

        <PrimaryButton
          title="Registro de ánimo"
          variant="green"
          style={{ marginTop: spacing.md }}
          leftIcon={<Text>☺︎</Text>}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comidas de hoy</Text>
        </View>

        {meals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>Sin comidas registradas</Text>
            <Text style={styles.emptySubtitle}>Empieza a registrar tus comidas y cómo te sientes</Text>
            <PrimaryButton
              title="Registra tu primera comida"
              variant="ghost"
              style={{ marginTop: spacing.md }}
              onPress={() => navigation.navigate("AddMeal")}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {meals.map((m) => (
              <Pressable key={m.id} style={styles.mealRow} onPress={() => navigation.navigate("EditMeal", { id: m.id })}>
                <View style={styles.mealIcon}>
                  <Text style={{ fontSize: 16 }}>🍴</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{m.title}</Text>
                  <Text style={styles.mealMeta}>{mealMetaLine(m)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textMuted,
  },
  date: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.text,
    marginTop: 4,
    textTransform: "capitalize",
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cardsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    textAlign: "center",
    color: colors.textMuted,
  },
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
});

