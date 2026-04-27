import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { TextField } from "../components/TextField";
import { Chip } from "../components/Chip";
import { getUserName, getWaterGoalMl, setUserName, setWaterGoalMl } from "../settings/settings";
import { useFocusEffect } from "@react-navigation/native";

export function SettingsScreen() {
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("2000");

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

  const presets = [1500, 2000, 2500, 3000] as const;
  const goalN = Number(goal);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
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
});

