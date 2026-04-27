import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { formatDayKeyLabel } from "../utils/dateLabel";
import { listMealDayKeysInRange, listMealsForDay, type MealEntry } from "../db/repo";
import { mealTypeIcon, mealTypeLabel, moodEmoji, portionSizeName } from "../utils/mealLabels";
import { Calendar } from "react-native-calendars";
import { toDayKey } from "../utils/dayKey";

type CalendarMode = "week" | "month";

function parseDayKey(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeekMonday(date: Date) {
  // JS: 0=dom ... 6=sab. Queremos lunes como inicio.
  const jsDow = date.getDay();
  const delta = (jsDow + 6) % 7; // lunes->0, domingo->6
  return addDays(date, -delta);
}

export function DiaryScreen() {
  const navigation = useNavigation<any>();
  const [selectedDayKey, setSelectedDayKey] = React.useState(() => toDayKey(new Date()));
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [mode, setMode] = React.useState<CalendarMode>("month");
  const [cursorDayKey, setCursorDayKey] = React.useState(() => toDayKey(new Date()));
  const [meals, setMeals] = React.useState<MealEntry[]>([]);

  const isToday = selectedDayKey === toDayKey(new Date());

  useFocusEffect(
    React.useCallback(() => {
      void listMealsForDay(selectedDayKey).then(setMeals);
    }, [selectedDayKey]),
  );

  const [mealDays, setMealDays] = React.useState(() => new Set<string>());

  const weekDays = React.useMemo(() => ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], []);

  const weekGrid = React.useMemo(() => {
    const selected = parseDayKey(cursorDayKey);
    const start = addDays(startOfWeekMonday(selected), -7);
    const days: { dayKey: string; date: Date }[] = [];
    for (let i = 0; i < 14; i++) {
      const dt = addDays(start, i);
      days.push({ dayKey: toDayKey(dt), date: dt });
    }
    return { start, days };
  }, [cursorDayKey]);

  React.useEffect(() => {
    if (!calendarOpen) return;

    void (async () => {
      if (mode === "month") {
        const base = parseDayKey(cursorDayKey);
        const start = new Date(base.getFullYear(), base.getMonth(), 1);
        const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        const keys = await listMealDayKeysInRange(toDayKey(start), toDayKey(end));
        setMealDays(new Set(keys));
      } else {
        const startKey = weekGrid.days[0]?.dayKey ?? cursorDayKey;
        const endKey = weekGrid.days[weekGrid.days.length - 1]?.dayKey ?? cursorDayKey;
        const keys = await listMealDayKeysInRange(startKey, endKey);
        setMealDays(new Set(keys));
      }
    })();
  }, [calendarOpen, cursorDayKey, mode, weekGrid.days]);

  const markedDates = React.useMemo(() => {
    const m: Record<string, any> = {};
    // Puntitos: días con comidas
    mealDays.forEach((k) => {
      m[k] = { marked: true, dotColor: "#14B8A6" }; // turquesa
    });
    // Día seleccionado: círculo morado + puntito turquesa
    m[selectedDayKey] = {
      ...(m[selectedDayKey] ?? {}),
      selected: true,
      selectedColor: colors.purple,
      selectedTextColor: "#fff",
      marked: true,
      dotColor: "#14B8A6",
    };
    return m;
  }, [mealDays, selectedDayKey]);

  const headerMonthLabel = React.useMemo(() => {
    const dt = new Date(parseDayKey(cursorDayKey));
    dt.setDate(1);
    return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(dt);
  }, [cursorDayKey]);

  function formatTime(ts: number) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  const cursorMonth = React.useMemo(() => {
    const dt = parseDayKey(cursorDayKey);
    return new Date(dt.getFullYear(), dt.getMonth(), 1);
  }, [cursorDayKey]);

  const goPrev = () => {
    if (mode === "month") {
      const dt = cursorMonth;
      dt.setMonth(dt.getMonth() - 1);
      setCursorDayKey(toDayKey(dt));
    } else {
      setCursorDayKey(toDayKey(addDays(parseDayKey(cursorDayKey), -7)));
    }
  };

  const goNext = () => {
    if (mode === "month") {
      const dt = cursorMonth;
      dt.setMonth(dt.getMonth() + 1);
      setCursorDayKey(toDayKey(dt));
    } else {
      setCursorDayKey(toDayKey(addDays(parseDayKey(cursorDayKey), 7)));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Diario de comidas</Text>
        <Pressable style={styles.searchBtn}>
          <Text style={{ fontSize: 18 }}>⌕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.calendarTrigger}
          onPress={() => {
            setCursorDayKey(selectedDayKey);
            setCalendarOpen(true);
          }}
        >
          <Text style={styles.calendarTriggerText}>{headerMonthLabel}</Text>
          <Text style={styles.calendarTriggerChevron}>›</Text>
        </Pressable>

        <Text style={styles.dayHeader}>{isToday ? "Hoy" : formatDayKeyLabel(selectedDayKey)}</Text>

        {meals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin comidas registradas</Text>
            <Text style={styles.emptySubtitle}>Registra una comida y aparecerá aquí.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {meals.map((m) => {
              const mood = moodEmoji(m.mood);
              const portion = portionSizeName(m.portionSize);
              const subtitle = `${mealTypeLabel(m.mealType)}${portion ? ` · ${portion}` : ""} · ${formatTime(m.createdAt)}`;
              return (
                <Pressable key={m.id} onPress={() => navigation.navigate("EditMeal", { id: m.id })} style={styles.mealCard}>
                  <View style={styles.mealLeftIcon}>
                    <Text style={{ fontSize: 20 }}>{mealTypeIcon(m.mealType)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTitle} numberOfLines={2}>
                      {m.title}
                    </Text>
                    <Text style={styles.mealSubtitle}>{subtitle}</Text>

                    <View style={styles.chipsRow}>
                      {m.mood ? (
                        <View style={styles.smallChip}>
                          <Text style={styles.smallChipText}>
                            {mood} {m.mood}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.askChip}>
                        <Text style={styles.askChipText}>🤖 Preguntar</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.mealRight}>
                    {mood ? (
                      <View style={styles.moodCircle}>
                        <Text>{mood}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.chev}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCalendarOpen(false)}>
          <Pressable style={styles.calendarCard} onPress={() => {}}>
            <View style={styles.calendarHeaderRow}>
              <Pressable onPress={goPrev} style={styles.arrowBtn}>
                <Text style={styles.arrowTxt}>‹</Text>
              </Pressable>
              <Text style={styles.calendarMonth}>{headerMonthLabel}</Text>
              <Pressable onPress={() => setMode((m) => (m === "month" ? "week" : "month"))} style={styles.twoWeeksPill}>
                <Text style={styles.twoWeeksText}>{mode === "month" ? "Month" : "Week"}</Text>
              </Pressable>
              <Pressable onPress={goNext} style={styles.arrowBtn}>
                <Text style={styles.arrowTxt}>›</Text>
              </Pressable>
            </View>

            {mode === "month" ? (
              <Calendar
                key={`month-${cursorDayKey}`}
                current={cursorDayKey}
                markedDates={markedDates}
                markingType="dot"
                onDayPress={(d) => {
                  setSelectedDayKey(d.dateString);
                  setCalendarOpen(false);
                }}
                hideExtraDays={false}
                firstDay={1}
                hideArrows
                renderHeader={() => null}
                theme={{
                  backgroundColor: "transparent",
                  calendarBackground: "transparent",
                  textSectionTitleColor: "rgba(17,24,39,0.35)",
                  monthTextColor: colors.text,
                  dayTextColor: colors.text,
                  textDisabledColor: "rgba(17,24,39,0.25)",
                  todayTextColor: colors.purple,
                  selectedDayBackgroundColor: colors.purple,
                  selectedDayTextColor: "#fff",
                  textDayFontWeight: "700",
                  textMonthFontWeight: "900",
                  textDayHeaderFontWeight: "700",
                }}
              />
            ) : (
              <View style={styles.weekWrap}>
                <View style={styles.weekHeaderRow}>
                  {weekDays.map((d) => (
                    <Text key={d} style={styles.weekHeaderCell}>
                      {d}
                    </Text>
                  ))}
                </View>
                <View style={styles.weekGrid}>
                  {weekGrid.days.map(({ dayKey, date }) => {
                    const selected = dayKey === selectedDayKey;
                    const inMonth = date.getMonth() === parseDayKey(cursorDayKey).getMonth();
                    const hasMeals = mealDays.has(dayKey);
                    return (
                      <Pressable
                        key={dayKey}
                        onPress={() => {
                          setSelectedDayKey(dayKey);
                          setCalendarOpen(false);
                        }}
                        style={styles.weekCell}
                      >
                        <View style={[styles.weekDayCircle, selected ? styles.weekDayCircleSelected : null]}>
                          <Text
                            style={[
                              styles.weekDayText,
                              !inMonth ? styles.weekDayTextDisabled : null,
                              selected ? styles.weekDayTextSelected : null,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                        {selected || hasMeals ? (
                          <View
                            style={[
                              styles.weekDot,
                              { opacity: selected ? 1 : 0.8 },
                              selected ? styles.weekDotSelected : null,
                            ]}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  title: { fontSize: 22, fontWeight: "900", color: colors.text },
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
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  calendarTrigger: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarTriggerText: { fontSize: 14, fontWeight: "900", color: colors.text, textTransform: "capitalize" },
  calendarTriggerChevron: { fontSize: 18, fontWeight: "900", color: "rgba(17,24,39,0.35)" },
  dayHeader: { marginTop: spacing.lg, fontSize: 18, fontWeight: "900", color: colors.text },

  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  mealLeftIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  mealTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  mealSubtitle: { marginTop: 6, fontSize: 13, color: colors.textMuted },
  chipsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  smallChip: {
    height: 34,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallChipText: { fontSize: 13, fontWeight: "800", color: colors.textMuted, textTransform: "capitalize" },
  askChip: {
    height: 34,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: "rgba(109,92,231,0.10)",
    borderWidth: 1,
    borderColor: "rgba(109,92,231,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  askChipText: { fontSize: 13, fontWeight: "900", color: colors.purple },
  mealRight: { alignItems: "center", gap: 10, paddingTop: 2 },
  moodCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  chev: { fontSize: 22, fontWeight: "900", color: "rgba(17,24,39,0.35)" },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: colors.textMuted },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.25)",
    justifyContent: "flex-start",
    paddingTop: 90,
    paddingHorizontal: spacing.xl,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  calendarMonth: { fontSize: 18, fontWeight: "900", color: colors.text, textTransform: "capitalize" },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
  },
  arrowTxt: { fontSize: 20, fontWeight: "900", color: colors.textMuted },
  twoWeeksPill: {
    height: 34,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  twoWeeksText: { fontSize: 13, fontWeight: "900", color: colors.textMuted },

  weekWrap: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  weekHeaderRow: { flexDirection: "row" },
  weekHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(17,24,39,0.35)",
    paddingBottom: spacing.sm,
    textTransform: "lowercase",
  },
  weekGrid: { flexDirection: "row", flexWrap: "wrap" },
  weekCell: { width: "14.2857%", paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  weekDayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  weekDayCircleSelected: { backgroundColor: colors.purple },
  weekDayText: { fontSize: 14, fontWeight: "800", color: colors.text },
  weekDayTextDisabled: { color: "rgba(17,24,39,0.25)" },
  weekDayTextSelected: { color: "#FFFFFF" },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#14B8A6",
    marginTop: 6,
  },
  weekDotSelected: {
    backgroundColor: "#14B8A6",
  },
});

