import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { DB_NAME, schemaSql } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Cadena para que en web solo una operación SQLite corra a la vez (evita conflicto OPFS/sync access handles). */
let webSqliteChain: Promise<unknown> = Promise.resolve();

/**
 * expo-sqlite en navegador usa WASM + archivo OPFS con `createSyncAccessHandle`: solo puede haber
 * un handle abierto. Dos `getAllAsync` en paralelo lanzan NoModificationAllowedError.
 */
export async function serializeWebSQLite<T>(task: () => Promise<T>): Promise<T> {
  if (Platform.OS !== "web") {
    return task();
  }
  const next = webSqliteChain.then(task, task);
  webSqliteChain = next.then(
    () => {},
    () => {},
  );
  return next as Promise<T>;
}

async function tryRun(db: SQLite.SQLiteDatabase, sql: string) {
  try {
    await db.runAsync(sql);
  } catch {
    // migraciones idempotentes
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(schemaSql);
      await tryRun(db, "ALTER TABLE meal_entries ADD COLUMN mood TEXT");
      await tryRun(db, "ALTER TABLE meal_entries ADD COLUMN portion_size TEXT");
      return db;
    })();
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  await getDb();
}
