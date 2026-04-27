import * as SQLite from "expo-sqlite";
import { DB_NAME, schemaSql } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

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
