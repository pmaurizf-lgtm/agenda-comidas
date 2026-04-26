import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { PrimaryButton } from "../components/PrimaryButton";
import { newId } from "../utils/id";
import { toDayKey } from "../utils/dayKey";
import { Chip } from "../components/Chip";
import { addMealEntry, MealType, Mood, PortionSize, getMealById, updateMealEntry, deleteMealEntry } from "../db/repo";

type Props = {
  navigation: { goBack: () => void };
  route?: { params?: { id?: string } };
};

const MEAL_TYPES: { id: MealType; label: string; icon: string }[] = [
  { id: "desayuno", label: "Desayuno", icon: "🌅" },
  { id: "comida", label: "Almuerzo", icon: "🌞" },
  { id: "cena", label: "Cena", icon: "🌙" },
  { id: "merienda", label: "Merienda", icon: "🍎" },
  { id: "otro", label: "Otro", icon: "🍽️" },
];

const MOODS: { id: Exclude<Mood, null>; label: string; icon: string }[] = [
  { id: "feliz", label: "Feliz", icon: "😊" },
  { id: "emocionado", label: "Emocionado", icon: "🤩" },
  { id: "contento", label: "Contento", icon: "🙂" },
  { id: "calmado", label: "Calmado", icon: "😌" },
  { id: "neutral", label: "Neutral", icon: "😐" },
  { id: "aliviado", label: "Aliviado", icon: "😮‍💨" },
  { id: "energia", label: "Con energía", icon: "⚡" },
  { id: "aburrido", label: "Aburrido", icon: "😑" },
  { id: "cansado", label: "Cansado", icon: "🥱" },
  { id: "entumecido", label: "Entumecido", icon: "😶" },
  { id: "estresado", label: "Estresado", icon: "😰" },
  { id: "abrumado", label: "Abrumado", icon: "😵‍💫" },
  { id: "ansioso", label: "Ansioso", icon: "😟" },
  { id: "triste", label: "Triste", icon: "😢" },
  { id: "solo", label: "Solo", icon: "🥺" },
  { id: "culpable", label: "Culpable", icon: "😔" },
  { id: "frustrado", label: "Frustrado", icon: "😤" },
  { id: "enojado", label: "Enojado", icon: "😠" },
];

export function AddMealScreen({ navigation }: Props) {
  const route = (arguments[0] as Props).route;
  const editingId = route?.params?.id;
  const editing = typeof editingId === "string" && editingId.length > 0;

  const [mealType, setMealType] = React.useState<MealType>("comida");
  const [mood, setMood] = React.useState<Mood>(null);
  const [portionSize, setPortionSize] = React.useState<PortionSize>("M");
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!editingId) return;
    const existing = getMealById(editingId);
    if (!existing) return;
    setMealType(existing.mealType);
    setTitle(existing.title);
    setMood(existing.mood ?? null);
    setPortionSize(existing.portionSize ?? "M");
    setNotes(existing.notes ?? "");
  }, [editingId]);

  const save = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("Falta información", "Escribe qué has comido (por ejemplo: \"Pasta con pollo\").");
      return;
    }
    if (editingId) {
      updateMealEntry({
        id: editingId,
        mealType,
        title: t,
        mood,
        portionSize,
        notes: notes.trim() ? notes.trim() : null,
      });
    } else {
      addMealEntry({
        id: newId(),
        createdAt: Date.now(),
        dayKey: toDayKey(new Date()),
        mealType,
        title: t,
        mood,
        portionSize,
        notes: notes.trim() ? notes.trim() : null,
      });
    }
    navigation.goBack();
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert("Borrar comida", "¿Seguro que quieres borrar esta comida?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => {
          deleteMealEntry(editingId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{editing ? "Editar comida" : "Registrar comida"}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} accessibilityRole="button">
          <Text style={{ fontSize: 18, fontWeight: "900" }}>×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🍴</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="¿Qué comiste?"
            placeholderTextColor="rgba(17,24,39,0.35)"
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionTitle}>Tipo de comida</Text>
        <View style={styles.grid}>
          {MEAL_TYPES.map((t) => (
            <Chip
              key={t.id}
              label={t.label}
              selected={t.id === mealType}
              left={<Text>{t.icon}</Text>}
              onPress={() => setMealType(t.id)}
              style={styles.gridItem}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>¿Cómo te sientes?</Text>
        <View style={styles.moodsGrid}>
          {MOODS.map((m) => (
            <Chip
              key={m.id}
              label={m.label}
              selected={mood === m.id}
              left={<Text>{m.icon}</Text>}
              onPress={() => setMood(mood === m.id ? null : m.id)}
              style={styles.moodItem}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Tamaño de la porción</Text>
        <View style={styles.portionRow}>
          <Pressable
            onPress={() => setPortionSize("S")}
            style={[styles.portionPill, portionSize === "S" ? styles.portionPillActive : null]}
          >
            <Text style={[styles.portionBig, portionSize === "S" ? styles.portionTextActive : null]}>S</Text>
            <Text style={[styles.portionSmall, portionSize === "S" ? styles.portionTextActive : null]}>Pequeño</Text>
          </Pressable>
          <Pressable
            onPress={() => setPortionSize("M")}
            style={[styles.portionPill, portionSize === "M" ? styles.portionPillActive : null]}
          >
            <Text style={[styles.portionBig, portionSize === "M" ? styles.portionTextActive : null]}>M</Text>
            <Text style={[styles.portionSmall, portionSize === "M" ? styles.portionTextActive : null]}>Mediano</Text>
          </Pressable>
          <Pressable
            onPress={() => setPortionSize("L")}
            style={[styles.portionPill, portionSize === "L" ? styles.portionPillActive : null]}
          >
            <Text style={[styles.portionBig, portionSize === "L" ? styles.portionTextActive : null]}>L</Text>
            <Text style={[styles.portionSmall, portionSize === "L" ? styles.portionTextActive : null]}>Grande</Text>
          </Pressable>
        </View>

        <View style={styles.notesWrap}>
          <Text style={styles.notesIcon}>≡</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas (opcional)"
            placeholderTextColor="rgba(17,24,39,0.35)"
            style={styles.notesInput}
            multiline
          />
        </View>

        <PrimaryButton title="Guardar registro" variant="purple" style={{ marginTop: spacing.xl }} onPress={save} />
        {editing ? <PrimaryButton title="Borrar" variant="ghost" style={{ marginTop: spacing.md }} onPress={remove} /> : null}
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
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: colors.text },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  searchInputWrap: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  searchIcon: { fontSize: 18, opacity: 0.55 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },

  sectionTitle: { marginTop: spacing.xl, fontSize: 14, fontWeight: "900", color: colors.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  gridItem: { width: "47%" },

  moodsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  moodItem: { width: "30%" },

  portionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  portionPill: {
    flex: 1,
    height: 86,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  portionPillActive: { backgroundColor: "rgba(16,185,129,0.12)", borderColor: colors.green },
  portionBig: { fontSize: 26, fontWeight: "900", color: colors.textMuted },
  portionSmall: { marginTop: 4, fontSize: 13, fontWeight: "800", color: colors.textMuted },
  portionTextActive: { color: colors.green },

  notesWrap: {
    marginTop: spacing.xl,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  notesIcon: { fontSize: 18, opacity: 0.45, marginTop: 2 },
  notesInput: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text, minHeight: 26 },
});

