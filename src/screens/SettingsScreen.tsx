import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { TextField } from "../components/TextField";
import { Chip } from "../components/Chip";
import { getUserName, getWaterGoalMl, setUserName, setWaterGoalMl } from "../settings/settings";
import { useFocusEffect } from "@react-navigation/native";
import { addDays, getWeekRangeFromMonday, startOfWeekMonday } from "../utils/weekRange";
import { listMealsInDayKeyRange, listWaterEntriesInDayKeyRange } from "../db/repo";
import { shareWeekExcel, shareWeekPdf } from "../export/weekReport";

export function SettingsScreen() {
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("2000");
  const [weekMonday, setWeekMonday] = React.useState(() => startOfWeekMonday(new Date()));
  const [exporting, setExporting] = React.useState<null | "pdf" | "xlsx">(null);

  const { title, startDayKey, endDayKey, monday } = React.useMemo(
    () => getWeekRangeFromMonday(weekMonday),
    [weekMonday],
  );

  const fileBaseName = React.useMemo(() => `informe-semana-${startDayKey}`, [startDayKey]);

  const load = React.useCallback(async () => {
    const n = await getUserName();
    setName(n);
    const g = await getWaterGoalMl();
    setGoal(String(g));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    const n = Number(goal);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert("Valor inválido", "Introduce un número en ml (por ejemplo 2000).");
      return;
    }
    try {
      await setUserName(name);
      await setWaterGoalMl(n);
      Alert.alert("Guardado", "Ajustes actualizados.");
    } catch {
      Alert.alert("Error", "No se pudo guardar el objetivo.");
    }
  };

  const runExport = async (kind: "pdf" | "xlsx") => {
    setExporting(kind);
    try {
      const meals = await listMealsInDayKeyRange(startDayKey, endDayKey);
      const waters = await listWaterEntriesInDayKeyRange(startDayKey, endDayKey);
      const userName = await getUserName();
      const waterGoalMl = await getWaterGoalMl();
      const payload = {
        weekTitle: title,
        userName,
        meals,
        waters,
        waterGoalMl,
        monday,
      };
      if (kind === "pdf") {
        await shareWeekPdf(payload);
      } else {
        await shareWeekExcel({ ...payload, fileBaseName });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo generar el archivo.";
      Alert.alert("Exportación", msg);
    } finally {
      setExporting(null);
    }
  };

  const presets = [1500, 2000, 2500, 3000] as const;
  const goalN = Number(goal);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.section}>Perfil</Text>
          <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />

          <Text style={[styles.section, { marginTop: spacing.xl }]}>Objetivos</Text>
          <Text style={styles.helper}>Meta diaria de agua</Text>
          <View style={styles.presetRow}>
            {presets.map((p) => (
              <Chip
                key={p}
                label={`${p}ml`}
                selected={goalN === p}
                onPress={() => setGoal(String(p))}
                style={{ flex: 1, justifyContent: "center" }}
              />
            ))}
          </View>
          <TextField
            label="Personalizado (ml)"
            value={goal}
            onChangeText={(v) => setGoal(v.replace(/[^\d]/g, ""))}
            placeholder="2000"
            keyboardType="number-pad"
          />
          <Pressable onPress={() => void save()} style={styles.saveBtn}>
            <Text style={styles.saveText}>Guardar</Text>
          </Pressable>

          <Text style={[styles.section, { marginTop: spacing.xl }]}>Informes semanales</Text>
          <Text style={styles.helper}>Exporta comidas y agua de la semana que elijas (lunes a domingo).</Text>

          <View style={styles.weekNav}>
            <Pressable
              style={styles.weekArrow}
              onPress={() => setWeekMonday(addDays(weekMonday, -7))}
              accessibilityLabel="Semana anterior"
            >
              <Text style={styles.weekArrowTxt}>‹</Text>
            </Pressable>
            <Text style={styles.weekTitle} numberOfLines={4}>
              {title}
            </Text>
            <Pressable
              style={styles.weekArrow}
              onPress={() => setWeekMonday(addDays(weekMonday, 7))}
              accessibilityLabel="Semana siguiente"
            >
              <Text style={styles.weekArrowTxt}>›</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.exportBtn, styles.exportPdfBtn]}
            onPress={() => void runExport("pdf")}
            disabled={exporting !== null}
          >
            {exporting === "pdf" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.exportBtnText}>Exportar PDF</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.exportBtn, styles.exportExcelBtn]}
            onPress={() => void runExport("xlsx")}
            disabled={exporting !== null}
          >
            {exporting === "xlsx" ? (
              <ActivityIndicator color={colors.purple} />
            ) : (
              <Text style={styles.exportExcelText}>Exportar Excel</Text>
            )}
          </Pressable>

          <Text style={styles.exportHint}>
            Se abrirá el menú para guardar o compartir el archivo (Archivos, Drive, correo…).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  scroll: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "900", color: colors.text },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  section: { fontSize: 14, fontWeight: "800", color: colors.textMuted },
  helper: { marginTop: spacing.md, fontSize: 13, fontWeight: "800", color: "rgba(17,24,39,0.35)" },
  presetRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  saveBtn: {
    marginTop: spacing.xl,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
  },
  weekArrow: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
  },
  weekArrowTxt: { fontSize: 22, fontWeight: "900", color: colors.textMuted },
  weekTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    textTransform: "capitalize",
  },
  exportBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  exportPdfBtn: { backgroundColor: colors.purple, marginTop: spacing.lg },
  exportBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  exportExcelBtn: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 2,
    borderColor: "rgba(109,92,231,0.45)",
  },
  exportExcelText: { color: colors.purple, fontSize: 16, fontWeight: "900" },
  exportHint: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(17,24,39,0.38)",
    textAlign: "center",
  },
});
