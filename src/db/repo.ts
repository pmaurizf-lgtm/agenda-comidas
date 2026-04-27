import type { SQLiteDatabase } from "expo-sqlite";
import { getDb, initDb, serializeWebSQLite } from "./db";

async function runDb<T>(operation: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  return serializeWebSQLite(async () => {
    await initDb();
    const db = await getDb();
    return operation(db);
  });
}

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

export async function addWaterEntry(params: { id: string; createdAt: number; dayKey: string; amountMl: number }) {
  await runDb(async (db) => {
    await db.runAsync(
      "INSERT INTO water_entries (id, created_at, day_key, amount_ml) VALUES (?, ?, ?, ?)",
      params.id,
      params.createdAt,
      params.dayKey,
      params.amountMl,
    );
  });
}

export type WaterEntry = {
  id: string;
  createdAt: number;
  dayKey: string;
  amountMl: number;
};

export async function getWaterSumForDay(dayKey: string) {
  return runDb(async (db) => {
    const row = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE day_key = ?",
      dayKey,
    );
    return row?.total ?? 0;
  });
}

export async function listWaterEntriesForDay(dayKey: string): Promise<WaterEntry[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{ id: string; created_at: number; day_key: string; amount_ml: number }>(
        "SELECT id, created_at, day_key, amount_ml FROM water_entries WHERE day_key = ? ORDER BY created_at DESC",
        dayKey,
      )) ?? [];

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      dayKey: r.day_key,
      amountMl: r.amount_ml,
    }));
  });
}

export async function getWaterEntryById(id: string): Promise<WaterEntry | null> {
  return runDb(async (db) => {
    const row = await db.getFirstAsync<{ id: string; created_at: number; day_key: string; amount_ml: number }>(
      "SELECT id, created_at, day_key, amount_ml FROM water_entries WHERE id = ? LIMIT 1",
      id,
    );
    if (!row) return null;
    return { id: row.id, createdAt: row.created_at, dayKey: row.day_key, amountMl: row.amount_ml };
  });
}

export async function updateWaterEntry(params: { id: string; amountMl: number }) {
  await runDb(async (db) => {
    await db.runAsync("UPDATE water_entries SET amount_ml = ? WHERE id = ?", params.amountMl, params.id);
  });
}

export async function deleteWaterEntry(id: string) {
  await runDb(async (db) => {
    await db.runAsync("DELETE FROM water_entries WHERE id = ?", id);
  });
}

export async function listWaterSumsForDays(dayKeys: string[]) {
  return runDb(async (db) => {
    if (dayKeys.length === 0) return new Map<string, number>();
    const placeholders = dayKeys.map(() => "?").join(", ");
    const rows =
      (await db.getAllAsync<{ day_key: string; total: number }>(
        `SELECT day_key, COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE day_key IN (${placeholders}) GROUP BY day_key`,
        ...dayKeys,
      )) ?? [];
    const m = new Map<string, number>();
    dayKeys.forEach((k) => m.set(k, 0));
    rows.forEach((r) => m.set(r.day_key, r.total ?? 0));
    return m;
  });
}

export async function addMealEntry(params: {
  id: string;
  createdAt: number;
  dayKey: string;
  mealType: MealType;
  title: string;
  mood?: Mood;
  portionSize?: PortionSize;
  notes?: string | null;
}) {
  await runDb(async (db) => {
    await db.runAsync(
      "INSERT INTO meal_entries (id, created_at, day_key, meal_type, title, mood, portion_size, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params.id,
      params.createdAt,
      params.dayKey,
      params.mealType,
      params.title,
      params.mood ?? null,
      params.portionSize ?? null,
      params.notes ?? null,
    );
  });
}

export async function listMealsForDay(dayKey: string): Promise<MealEntry[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{
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
        dayKey,
      )) ?? [];

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
  });
}

export async function listMealDayKeysInRange(startDayKey: string, endDayKey: string) {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{ day_key: string }>(
        "SELECT DISTINCT day_key FROM meal_entries WHERE day_key BETWEEN ? AND ? ORDER BY day_key ASC",
        startDayKey,
        endDayKey,
      )) ?? [];
    return rows.map((r) => r.day_key);
  });
}

export async function getMealById(id: string): Promise<MealEntry | null> {
  return runDb(async (db) => {
    const row = await db.getFirstAsync<{
      id: string;
      created_at: number;
      day_key: string;
      meal_type: string;
      title: string;
      mood: string | null;
      portion_size: string | null;
      notes: string | null;
    }>("SELECT id, created_at, day_key, meal_type, title, mood, portion_size, notes FROM meal_entries WHERE id = ? LIMIT 1", id);
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
  });
}

export async function updateMealEntry(params: {
  id: string;
  mealType: MealType;
  title: string;
  mood?: Mood;
  portionSize?: PortionSize;
  notes?: string | null;
}) {
  await runDb(async (db) => {
    await db.runAsync(
      "UPDATE meal_entries SET meal_type = ?, title = ?, mood = ?, portion_size = ?, notes = ? WHERE id = ?",
      params.mealType,
      params.title,
      params.mood ?? null,
      params.portionSize ?? null,
      params.notes ?? null,
      params.id,
    );
  });
}

export async function deleteMealEntry(id: string) {
  await runDb(async (db) => {
    await db.runAsync("DELETE FROM meal_entries WHERE id = ?", id);
  });
}

export async function listRecentDayKeys(limit = 30): Promise<string[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{ day_key: string }>(
        "SELECT day_key FROM (SELECT day_key, MAX(created_at) as last_ts FROM meal_entries GROUP BY day_key UNION ALL SELECT day_key, MAX(created_at) as last_ts FROM water_entries GROUP BY day_key) GROUP BY day_key ORDER BY MAX(last_ts) DESC LIMIT ?",
        limit,
      )) ?? [];
    return rows.map((r) => r.day_key);
  });
}

export async function listMealsInDayKeyRange(startDayKey: string, endDayKey: string): Promise<MealEntry[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{
        id: string;
        created_at: number;
        day_key: string;
        meal_type: string;
        title: string;
        mood: string | null;
        portion_size: string | null;
        notes: string | null;
      }>(
        "SELECT id, created_at, day_key, meal_type, title, mood, portion_size, notes FROM meal_entries WHERE day_key BETWEEN ? AND ? ORDER BY day_key ASC, created_at ASC",
        startDayKey,
        endDayKey,
      )) ?? [];

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
  });
}

export async function listWaterEntriesInDayKeyRange(startDayKey: string, endDayKey: string): Promise<WaterEntry[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{ id: string; created_at: number; day_key: string; amount_ml: number }>(
        "SELECT id, created_at, day_key, amount_ml FROM water_entries WHERE day_key BETWEEN ? AND ? ORDER BY day_key ASC, created_at ASC",
        startDayKey,
        endDayKey,
      )) ?? [];

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      dayKey: r.day_key,
      amountMl: r.amount_ml,
    }));
  });
}

export async function listAllMeals(): Promise<MealEntry[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{
        id: string;
        created_at: number;
        day_key: string;
        meal_type: string;
        title: string;
        mood: string | null;
        portion_size: string | null;
        notes: string | null;
      }>("SELECT id, created_at, day_key, meal_type, title, mood, portion_size, notes FROM meal_entries ORDER BY day_key ASC, created_at ASC")) ?? [];

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
  });
}

export async function listAllWaterEntries(): Promise<WaterEntry[]> {
  return runDb(async (db) => {
    const rows =
      (await db.getAllAsync<{ id: string; created_at: number; day_key: string; amount_ml: number }>(
        "SELECT id, created_at, day_key, amount_ml FROM water_entries ORDER BY day_key ASC, created_at ASC",
      )) ?? [];

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      dayKey: r.day_key,
      amountMl: r.amount_ml,
    }));
  });
}

/** Sustituye todo el contenido de las tablas de datos (copia de seguridad / restauración). */
export async function replaceAllEntries(params: { meals: MealEntry[]; waters: WaterEntry[] }): Promise<void> {
  await runDb(async (db) => {
    await db.withTransactionAsync(async () => {
      await db.execAsync("DELETE FROM meal_entries;");
      await db.execAsync("DELETE FROM water_entries;");
      for (const m of params.meals) {
        await db.runAsync(
          "INSERT INTO meal_entries (id, created_at, day_key, meal_type, title, mood, portion_size, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          m.id,
          m.createdAt,
          m.dayKey,
          m.mealType,
          m.title,
          m.mood ?? null,
          m.portionSize ?? null,
          m.notes ?? null,
        );
      }
      for (const w of params.waters) {
        await db.runAsync(
          "INSERT INTO water_entries (id, created_at, day_key, amount_ml) VALUES (?, ?, ?, ?)",
          w.id,
          w.createdAt,
          w.dayKey,
          w.amountMl,
        );
      }
    });
  });
}
