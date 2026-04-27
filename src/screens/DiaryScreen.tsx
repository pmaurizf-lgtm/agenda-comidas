import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { formatDayKeyLabel } from "../utils/dateLabel";
import { listMealDayKeysInRange, listMealsForDay, type MealEntry } from "../db/repo";
import { mealTypeIcon, mealTypeLabel, moodEmoji, portionSizeName } from "../utils/mealLabels";
import { Calendar } from "react-native-calendars";
import { toDayKey } from "../utils/dayKey";
import { PastelTableclothBackground } from "../components/PastelTableclothBackground";

/** Mes completo (como la referencia) o franjas de 7 / 14 días (lunes → domingo). */
type CalendarViewMode = "month" | "oneWeek" | "twoWeeks";

/** Título del calendario en español para modos semana / dos semanas */
function formatSpanishRangeTitle(start: Date, end: Date, mode: "oneWeek" | "twoWeeks"): string {
  const ys = start.getFullYear();
  const ye = end.getFullYear();
  const ms = start.getMonth();
  const me = end.getMonth();
  const ds = start.getDate();
  const de = end.getDate();

  const monthLong = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", { month: "long" }).format(d);

  if (mode === "oneWeek") {
    if (ms === me && ys === ye) {
      return `Semana del ${ds} al ${de} de ${monthLong(start)} de ${ys}`;
    }
    if (ys === ye) {
      return `Semana del ${ds} de ${monthLong(start)} al ${de} de ${monthLong(end)} de ${ys}`;
    }
    return `Semana del ${ds} de ${monthLong(start)} de ${ys} al ${de} de ${monthLong(end)} de ${ye}`;
  }

  if (ms === me && ys === ye) {
    return `Dos semanas: del ${ds} al ${de} de ${monthLong(start)} de ${ys}`;
  }
  if (ys === ye) {
    return `Dos semanas: del ${ds} de ${monthLong(start)} al ${de} de ${monthLong(end)} de ${ys}`;
  }
  return `Dos semanas: del ${ds} de ${monthLong(start)} de ${ys} al ${de} de ${monthLong(end)} de ${ye}`;
}

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
  const jsDow = date.getDay();
  const delta = (jsDow + 6) % 7;
  return addDays(date, -delta);
}

const WEEKDAY_LABELS_MON_FIRST = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export function DiaryScreen() {
  const navigation = useNavigation<any>();
  const [selectedDayKey, setSelectedDayKey] = React.useState(() => toDayKey(new Date()));
  const [calendarView, setCalendarView] = React.useState<CalendarViewMode>("month");
  const [cursorDayKey, setCursorDayKey] = React.useState(() => toDayKey(new Date()));
  const [meals, setMeals] = React.useState<MealEntry[]>([]);

  const isToday = selectedDayKey === toDayKey(new Date());

  useFocusEffect(
    React.useCallback(() => {
      void listMealsForDay(selectedDayKey).then(setMeals);
    }, [selectedDayKey]),
  );

  const [mealDays, setMealDays] = React.useState(() => new Set<string>());

  const weekRange = React.useMemo(() => {
    if (calendarView === "month") return { days: [] as { dayKey: string; date: Date }[] };
    const anchor = parseDayKey(cursorDayKey);
    const monday = startOfWeekMonday(anchor);
    const count = calendarView === "oneWeek" ? 7 : 14;
    const days: { dayKey: string; date: Date }[] = [];
    for (let i = 0; i < count; i++) {
      const dt = addDays(monday, i);
      days.push({ dayKey: toDayKey(dt), date: dt });
    }
    return { days };
  }, [cursorDayKey, calendarView]);

  React.useEffect(() => {
    void (async () => {
      if (calendarView === "month") {
        const base = parseDayKey(cursorDayKey);
        const start = new Date(base.getFullYear(), base.getMonth(), 1);
        const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        const keys = await listMealDayKeysInRange(toDayKey(start), toDayKey(end));
        setMealDays(new Set(keys));
      } else {
        const d = weekRange.days;
        if (d.length === 0) return;
        const keys = await listMealDayKeysInRange(d[0]!.dayKey, d[d.length - 1]!.dayKey);
        setMealDays(new Set(keys));
      }
    })();
  }, [cursorDayKey, calendarView, weekRange.days]);

  const markedDates = React.useMemo(() => {
    const m: Record<string, any> = {};
    mealDays.forEach((k) => {
      m[k] = { marked: true, dotColor: "#14B8A6" };
    });
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
    if (calendarView === "month") {
      const dt = cursorMonth;
      dt.setMonth(dt.getMonth() - 1);
      setCursorDayKey(toDayKey(dt));
    } else {
      setCursorDayKey(toDayKey(addDays(parseDayKey(cursorDayKey), -7)));
    }
  };

  const goNext = () => {
    if (calendarView === "month") {
      const dt = cursorMonth;
      dt.setMonth(dt.getMonth() + 1);
      setCursorDayKey(toDayKey(dt));
    } else {
      setCursorDayKey(toDayKey(addDays(parseDayKey(cursorDayKey), 7)));
    }
  };

  const calendarTitle = React.useMemo(() => {
    if (calendarView === "month") return headerMonthLabel;
    if (weekRange.days.length === 0) return headerMonthLabel;
    const start = weekRange.days[0]!.date;
    const end = weekRange.days[weekRange.days.length - 1]!.date;
    if (calendarView === "oneWeek") return formatSpanishRangeTitle(start, end, "oneWeek");
    return formatSpanishRangeTitle(start, end, "twoWeeks");
  }, [calendarView, weekRange.days, headerMonthLabel]);

  return (
    <View style={styles.root}>
      <PastelTableclothBackground />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Diario de comidas</Text>
          <Pressable style={styles.searchBtn}>
            <Text style={{ fontSize: 18 }}>⌕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarNavRow}>
            <Pressable onPress={goPrev} style={styles.arrowBtn}>
              <Text style={styles.arrowTxt}>‹</Text>
            </Pressable>
            <Text
              style={[
                styles.calendarMonth,
                calendarView === "month" ? styles.calendarMonthCapitalize : null,
              ]}
              numberOfLines={3}
              adjustsFontSizeToFit={calendarView !== "month"}
              minimumFontScale={0.82}
            >
              {calendarTitle}
            </Text>
            <Pressable onPress={goNext} style={styles.arrowBtn}>
              <Text style={styles.arrowTxt}>›</Text>
            </Pressable>
          </View>
          <View style={styles.viewModeToggles}>
            <Pressable
              onPress={() => setCalendarView("month")}
              style={[styles.modePill, calendarView === "month" ? styles.modePillActive : null]}
            >
              <Text style={[styles.modePillText, calendarView === "month" ? styles.modePillTextActive : null]}>Mes</Text>
            </Pressable>
            <Pressable
              onPress={() => setCalendarView("oneWeek")}
              style={[styles.modePill, calendarView === "oneWeek" ? styles.modePillActive : null]}
            >
              <Text style={[styles.modePillText, calendarView === "oneWeek" ? styles.modePillTextActive : null]}>1 semana</Text>
            </Pressable>
            <Pressable
              onPress={() => setCalendarView("twoWeeks")}
              style={[styles.modePill, calendarView === "twoWeeks" ? styles.modePillActive : null]}
            >
              <Text style={[styles.modePillText, calendarView === "twoWeeks" ? styles.modePillTextActive : null]}>2 semanas</Text>
            </Pressable>
          </View>

          {calendarView === "month" ? (
            <Calendar
              key={`month-${cursorDayKey}`}
              current={cursorDayKey}
              markedDates={markedDates}
              markingType="dot"
              onDayPress={(d) => {
                setSelectedDayKey(d.dateString);
                setCursorDayKey(d.dateString);
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
                {WEEKDAY_LABELS_MON_FIRST.map((d) => (
                  <Text key={d} style={styles.weekHeaderCell}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={styles.weekGrid}>
                {weekRange.days.map(({ dayKey, date }) => {
                  const selected = dayKey === selectedDayKey;
                  const hasMeals = mealDays.has(dayKey);
                  return (
                    <Pressable
                      key={dayKey}
                      onPress={() => {
                        setSelectedDayKey(dayKey);
                        setCursorDayKey(dayKey);
                      }}
                      style={styles.weekCell}
                    >
                      <View style={[styles.weekDayCircle, selected ? styles.weekDayCircleSelected : null]}>
                        <Text
                          style={[styles.weekDayText, selected ? styles.weekDayTextSelected : null]}
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
        </View>

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

                    {m.mood ? (
                      <View style={styles.chipsRow}>
                        <View style={styles.smallChip}>
                          <Text style={styles.smallChipText}>
                            {mood} {m.mood}
                          </Text>
                        </View>
                      </View>
                    ) : null}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF5E6" },
  safe: { flex: 1, backgroundColor: "transparent" },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
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
  calendarCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    zIndex: 1,
  },
  calendarNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  calendarMonth: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    paddingHorizontal: spacing.xs,
  },
  calendarMonthCapitalize: {
    textTransform: "capitalize",
  },
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
  viewModeToggles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  modePill: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  modePillActive: {
    backgroundColor: "rgba(109,92,231,0.14)",
    borderColor: "rgba(109,92,231,0.45)",
  },
  modePillText: { fontSize: 12, fontWeight: "900", color: colors.textMuted },
  modePillTextActive: { color: colors.purple },
  dayHeader: { marginTop: spacing.lg, fontSize: 18, fontWeight: "900", color: colors.text, zIndex: 1 },

  mealCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
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
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: colors.textMuted },

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
