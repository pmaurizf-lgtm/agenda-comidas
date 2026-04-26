import { getDb, initDb } from "./db";

export type MealType = "desayuno" | "comida" | "merienda" | "cena" | "snack" | "otro";
export type PortionSize = "S" | "M" | "L" | null;

export type Mood =
  | "feliz"
  | "emocionado"
  | "contento"
  | "calmado"
  | "neutral"
  | "aliviado"
  | "energia"
  | "aburrido"
  | "cansado"
  | "entumecido"
  | "estresado"
  | "abrumado"
  | "ansioso"
  | "triste"
  | "solo"
  | "culpable"
  | "frustrado"
  | "enojado"
  | null;

export type MealEntry = {
  id: string;
  createdAt: number;
  dayKey: string;
  mealType: MealType;
  title: string;
  mood: Mood;
  portionSize: PortionSize;
  notes: string | null;
};

export function addWaterEntry(params: { id: string; createdAt: number; dayKey: string; amountMl: number }) {
  initDb();
  const db = getDb();
  db.runSync(
    "INSERT INTO water_entries (id, created_at, day_key, amount_ml) VALUES (?, ?, ?, ?)",
    [params.id, params.createdAt, params.dayKey, params.amountMl],
  );
}

export type WaterEntry = {
  id: string;
  createdAt: number;
  dayKey: string;
  amountMl: number;
};

export function getWaterSumForDay(dayKey: string) {
  initDb();
  const db = getDb();
  const row = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE day_key = ?",
    [dayKey],
  );
  return row?.total ?? 0;
}

export function listWaterEntriesForDay(dayKey: string): WaterEntry[] {
  initDb();
  const db = getDb();
  const rows =
    db.getAllSync<{ id: string; created_at: number; day_key: string; amount_ml: number }>(
      "SELECT id, created_at, day_key, amount_ml FROM water_entries WHERE day_key = ? ORDER BY created_at DESC",
      [dayKey],
    ) ?? [];

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    dayKey: r.day_key,
    amountMl: r.amount_ml,
  }));
}

export function getWaterEntryById(id: string): WaterEntry | null {
  initDb();
  const db = getDb();
  const row = db.getFirstSync<{ id: string; created_at: number; day_key: string; amount_ml: number }>(
    "SELECT id, created_at, day_key, amount_ml FROM water_entries WHERE id = ? LIMIT 1",
    [id],
  );
  if (!row) return null;
  return { id: row.id, createdAt: row.created_at, dayKey: row.day_key, amountMl: row.amount_ml };
}

export function updateWaterEntry(params: { id: string; amountMl: number }) {
  initDb();
  const db = getDb();
  db.runSync("UPDATE water_entries SET amount_ml = ? WHERE id = ?", [params.amountMl, params.id]);
}

export function deleteWaterEntry(id: string) {
  initDb();
  const db = getDb();
  db.runSync("DELETE FROM water_entries WHERE id = ?", [id]);
}

export function listWaterSumsForDays(dayKeys: string[]) {
  initDb();
  const db = getDb();
  if (dayKeys.length === 0) return new Map<string, number>();
  const placeholders = dayKeys.map(() => "?").join(", ");
  const rows =
    db.getAllSync<{ day_key: string; total: number }>(
      `SELECT day_key, COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE day_key IN (${placeholders}) GROUP BY day_key`,
      dayKeys,
    ) ?? [];
  const m = new Map<string, number>();
  dayKeys.forEach((k) => m.set(k, 0));
  rows.forEach((r) => m.set(r.day_key, r.total ?? 0));
  return m;
}

export function addMealEntry(params: {
  id: string;
  createdAt: number;
  dayKey: string;
  mealType: MealType;
  title: string;
  mood?: Mood;
  portionSize?: PortionSize;
  notes?: string | null;
}) {
  initDb();
  const db = getDb();
  db.runSync(
    "INSERT INTO meal_entries (id, created_at, day_key, meal_type, title, mood, portion_size, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.id,
      params.createdAt,
      params.dayKey,
      params.mealType,
      params.title,
      params.mood ?? null,
      params.portionSize ?? null,
      params.notes ?? null,
    ],
  );
}

export function listMealsForDay(dayKey: string): MealEntry[] {
  initDb();
  const db = getDb();
  const rows =
    db.getAllSync<{
      id: string;
      created_at: number;
      day_key: string;
      meal_type: string;
      title: string;
      mood: string | null;
      portion_size: string | null;
      notes: string | null;
    }>(
      "SELECT id, created_at, day_key, meal_type, title, mood, portion_size, notes FROM meal_entries WHERE day_key = ? ORDER BY created_at DESC",
      [dayKey],
      dayKey,
    ) ?? [];

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    dayKey: r.day_key,
    mealType: r.meal_type as MealType,
    title: r.title,
    mood: (r.mood as Mood) ?? null,
    portionSize: (r.portion_size as PortionSize) ?? null,
    notes: r.notes,
  }));
}

export function listMealDayKeysInRange(startDayKey: string, endDayKey: string) {
  initDb();
  const db = getDb();
  const rows =
    db.getAllSync<{ day_key: string }>(
      "SELECT DISTINCT day_key FROM meal_entries WHERE day_key BETWEEN ? AND ? ORDER BY day_key ASC",
      [startDayKey, endDayKey],
    ) ?? [];
  return rows.map((r) => r.day_key);
}

export function getMealById(id: string): MealEntry | null {
  initDb();
  const db = getDb();
  const row = db.getFirstSync<{
    id: string;
    created_at: number;
    day_key: string;
    meal_type: string;
    title: string;
    mood: string | null;
    portion_size: string | null;
    notes: string | null;
  }>("SELECT id, created_at, day_key, meal_type, title, mood, portion_size, notes FROM meal_entries WHERE id = ? LIMIT 1", [
    id,
  ]);
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    dayKey: row.day_key,
    mealType: row.meal_type as MealType,
    title: row.title,
    mood: (row.mood as Mood) ?? null,
    portionSize: (row.portion_size as PortionSize) ?? null,
    notes: row.notes,
  };
}

export function updateMealEntry(params: {
  id: string;
  mealType: MealType;
  title: string;
  mood?: Mood;
  portionSize?: PortionSize;
  notes?: string | null;
}) {
  initDb();
  const db = getDb();
  db.runSync("UPDATE meal_entries SET meal_type = ?, title = ?, mood = ?, portion_size = ?, notes = ? WHERE id = ?", [
    params.mealType,
    params.title,
    params.mood ?? null,
    params.portionSize ?? null,
    params.notes ?? null,
    params.id,
  ]);
}

export function deleteMealEntry(id: string) {
  initDb();
  const db = getDb();
  db.runSync("DELETE FROM meal_entries WHERE id = ?", [id]);
}

export function listRecentDayKeys(limit = 30): string[] {
  initDb();
  const db = getDb();
  const rows =
    db.getAllSync<{ day_key: string }>(
      "SELECT day_key FROM (SELECT day_key, MAX(created_at) as last_ts FROM meal_entries GROUP BY day_key UNION ALL SELECT day_key, MAX(created_at) as last_ts FROM water_entries GROUP BY day_key) GROUP BY day_key ORDER BY MAX(last_ts) DESC LIMIT ?",
      [limit],
    ) ?? [];
  return rows.map((r) => r.day_key);
}

