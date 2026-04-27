import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { toDayKey } from "../utils/dayKey";
import {
  addWaterEntry,
  deleteWaterEntry,
  getWaterSumForDay,
  listWaterEntriesForDay,
  listWaterSumsForDays,
  WaterEntry,
} from "../db/repo";
import { LinearGradient } from "expo-linear-gradient";
import { getWaterGoalMl } from "../settings/settings";
import { newId } from "../utils/id";

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function WaterScreen() {
  const navigation = useNavigation<any>();
  const todayKey = toDayKey(new Date());
  const [total, setTotal] = React.useState(0);
  const [goal, setGoal] = React.useState(2000);
  const [entries, setEntries] = React.useState<WaterEntry[]>([]);
  const [week, setWeek] = React.useState<{ dayKey: string; total: number; label: string }[]>([]);

  const percent = Math.min(100, Math.max(0, goal > 0 ? Math.round((total / goal) * 100) : 0));
  const progress = goal > 0 ? Math.min(1, Math.max(0, total / goal)) : 0;
  const weekMax = React.useMemo(() => week.reduce((m, w) => Math.max(m, w.total), 0), [week]);

  const reload = React.useCallback(async () => {
    setTotal(await getWaterSumForDay(todayKey));
    setEntries(await listWaterEntriesForDay(todayKey));

    const base = new Date();
    const keys: string[] = [];
    const labels = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
    // Construimos semana lun->dom que termina en domingo de la semana actual
    const jsDow = base.getDay(); // 0 dom ... 6 sáb
    const deltaToMonday = (jsDow + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - deltaToMonday);

    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      keys.push(toDayKey(dt));
    }
    const sums = await listWaterSumsForDays(keys);
    setWeek(keys.map((k, idx) => ({ dayKey: k, total: sums.get(k) ?? 0, label: labels[idx] ?? "" })));
  }, [todayKey]);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
      void getWaterGoalMl().then(setGoal);
    }, [reload]),
  );

  const remove = (id: string) => {
    Alert.alert("Borrar agua", "¿Quieres borrar este registro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await deleteWaterEntry(id);
            await reload();
          })();
        },
      },
    ]);
  };

  const quickAdd = (amountMl: number) => {
    void (async () => {
      await addWaterEntry({
        id: newId(),
        createdAt: Date.now(),
        dayKey: todayKey,
        amountMl,
      });
      await reload();
    })();
  };

  const QUICK = [
    { label: "150ml", icon: "☕", amount: 150 },
    { label: "250ml", icon: "🥤", amount: 250 },
    { label: "330ml", icon: "🧃", amount: 330 },
    { label: "500ml", icon: "💧", amount: 500 },
    { label: "750ml", icon: "🫖", amount: 750 },
    { label: "1L", icon: "🫙", amount: 1000 },
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Seguimiento de agua</Text>
        <Pressable onPress={() => navigation.navigate("Ajustes")} style={styles.settingsBtn}>
          <Text style={{ fontSize: 18 }}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#3B82F6", "#60A5FA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroDrop}>💧</Text>
              <Text style={styles.heroTitle}>Hidratación de hoy</Text>
            </View>
            <View style={styles.heroPctPill}>
              <Text style={styles.heroPctText}>{percent}%</Text>
            </View>
          </View>

          <View style={styles.heroNumbers}>
            <Text style={styles.heroBig}>{total}</Text>
            <Text style={styles.heroBigUnit}>ml</Text>
          </View>
          <Text style={styles.heroGoal}>de {goal}ml de meta</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </LinearGradient>

        <Text style={styles.section}>Añadir rápido</Text>
        <View style={styles.quickCard}>
          <View style={styles.quickGrid}>
            {QUICK.map((q) => (
              <Pressable key={q.label} style={styles.quickItem} onPress={() => quickAdd(q.amount)}>
                <Text style={styles.quickIcon}>{q.icon}</Text>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.section, { marginTop: spacing.xl }]}>Esta semana</Text>
        <View style={styles.weekCard}>
          <View style={styles.weekChart}>
            <View style={styles.weekDashedLine} />
            <View style={styles.weekBarsRow}>
              {week.map((w) => {
                const h = weekMax > 0 ? Math.max(4, Math.round((w.total / weekMax) * 70)) : 4;
                return (
                  <View key={w.dayKey} style={styles.weekBarCol}>
                    <View style={styles.weekBarTrack}>
                      <View style={[styles.weekBar, { height: h }]} />
                    </View>
                    <Text style={styles.weekLabel}>{w.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.registryHeader}>
          <Text style={styles.section}>Registro de hoy</Text>
          <Text style={styles.count}>{entries.length} entradas</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 34, marginBottom: spacing.md }}>💧</Text>
            <Text style={styles.emptyTitle}>Sin agua registrada</Text>
            <Text style={styles.emptySubtitle}>Usa los botones de añadir rápido arriba</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {entries.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => navigation.navigate("EditWater", { id: e.id })}
                onLongPress={() => remove(e.id)}
                style={styles.row}
              >
                <View style={styles.icon}>
                  <Text style={{ fontSize: 16 }}>💧</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amount}>{e.amountMl} ml</Text>
                  <Text style={styles.meta}>{formatTime(e.createdAt)} · Toca para editar · Mantén para borrar</Text>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: "900", color: colors.text },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  hero: {
    borderRadius: 22,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroDrop: { fontSize: 18, opacity: 0.95 },
  heroTitle: { fontSize: 15, fontWeight: "900", color: "rgba(255,255,255,0.85)" },
  heroPctPill: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPctText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  heroNumbers: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: spacing.lg },
  heroBig: { fontSize: 54, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  heroBigUnit: { fontSize: 18, fontWeight: "900", color: "rgba(255,255,255,0.85)", marginBottom: 10 },
  heroGoal: { marginTop: 6, fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.65)" },
  progressTrack: {
    marginTop: spacing.lg,
    height: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "rgba(255,255,255,0.75)" },

  section: { marginTop: spacing.xl, fontSize: 18, fontWeight: "900", color: colors.text },
  quickCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickItem: {
    width: "30%",
    height: 86,
    borderRadius: 18,
    backgroundColor: "#F3F8FF",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 15, fontWeight: "900", color: colors.blue },

  weekCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekChart: { height: 120, justifyContent: "flex-end" },
  weekDashedLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(17,24,39,0.06)",
    borderStyle: "dashed",
  },
  weekBarsRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  weekBarCol: { alignItems: "center", width: "12%" },
  weekBarTrack: { width: 10, height: 80, borderRadius: 6, backgroundColor: "rgba(59,130,246,0.10)", overflow: "hidden" },
  weekBar: { width: "100%", backgroundColor: "rgba(59,130,246,0.45)", borderRadius: 6 },
  weekLabel: { marginTop: 10, fontSize: 12, fontWeight: "800", color: "rgba(17,24,39,0.35)" },

  registryHeader: { marginTop: spacing.xl, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  count: { fontSize: 13, fontWeight: "800", color: "rgba(17,24,39,0.35)" },
  emptyCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: colors.textMuted, textAlign: "center" },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  amount: { fontSize: 16, fontWeight: "900", color: colors.text },
  meta: { marginTop: 4, fontSize: 13, color: colors.textMuted },
});

