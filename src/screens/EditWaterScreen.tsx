import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";
import { deleteWaterEntry, getWaterEntryById, updateWaterEntry } from "../db/repo";

type Props = {
  route: { params: { id: string } };
  navigation: { goBack: () => void };
};

export function EditWaterScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [amount, setAmount] = React.useState("");

  React.useEffect(() => {
    void (async () => {
      const existing = await getWaterEntryById(id);
      if (existing) setAmount(String(existing.amountMl));
    })();
  }, [id]);

  const save = () => {
    void (async () => {
      const n = Number(amount);
      const amt = Number.isFinite(n) ? Math.trunc(n) : 0;
      if (amt <= 0) {
        Alert.alert("Cantidad inválida", "Introduce una cantidad en ml (por ejemplo 250).");
        return;
      }
      await updateWaterEntry({ id, amountMl: amt });
      navigation.goBack();
    })();
  };

  const remove = () => {
    Alert.alert("Borrar registro", "¿Seguro que quieres borrar este registro de agua?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await deleteWaterEntry(id);
            navigation.goBack();
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Editar agua</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        <TextField
          label="Cantidad (ml)"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^\d]/g, ""))}
          placeholder="250"
          keyboardType="number-pad"
        />
        <PrimaryButton title="Guardar" variant="blue" style={{ marginTop: spacing.xl }} onPress={save} />
        <PrimaryButton title="Borrar" variant="ghost" style={{ marginTop: spacing.md }} onPress={remove} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
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
});

