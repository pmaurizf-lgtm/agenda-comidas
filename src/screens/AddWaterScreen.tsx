import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { TextField } from "../components/TextField";
import { PrimaryButton } from "../components/PrimaryButton";
import { newId } from "../utils/id";
import { toDayKey } from "../utils/dayKey";
import { addWaterEntry } from "../db/repo";

type Props = {
  navigation: { goBack: () => void };
};

const QUICK_AMOUNTS = [200, 300, 500] as const;

export function AddWaterScreen({ navigation }: Props) {
  const [amount, setAmount] = React.useState("");

  const save = (ml?: number) => {
    void (async () => {
      const parsed = ml ?? Number(amount);
      const amt = Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
      if (amt <= 0) {
        Alert.alert("Cantidad inválida", "Introduce una cantidad en ml (por ejemplo 250).");
        return;
      }
      await addWaterEntry({
        id: newId(),
        createdAt: Date.now(),
        dayKey: toDayKey(new Date()),
        amountMl: amt,
      });
      navigation.goBack();
    })();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Registrar agua</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.section}>Atajos</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((ml) => (
            <Pressable key={ml} onPress={() => save(ml)} style={styles.quickPill}>
              <Text style={styles.quickText}>{ml} ml</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Cantidad personalizada (ml)"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^\d]/g, ""))}
          placeholder="250"
          keyboardType="number-pad"
        />

        <PrimaryButton title="Guardar" variant="blue" style={{ marginTop: spacing.xl }} onPress={() => save()} />
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
  title: { fontSize: 18, fontWeight: "900", color: colors.text },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  section: { fontSize: 14, fontWeight: "800", color: colors.textMuted },
  quickRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  quickPill: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { fontSize: 15, fontWeight: "800", color: colors.text },
});

