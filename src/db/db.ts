import * as SQLite from "expo-sqlite";
import { DB_NAME, schemaSql } from "./schema";

let initialized = false;

export function getDb() {
  return SQLite.openDatabaseSync(DB_NAME);
}

function tryRun(db: SQLite.SQLiteDatabase, sql: string) {
  try {
    db.runSync(sql);
  } catch {
    // migraciones idempotentes: si la columna ya existe, sqlite lanzará error
  }
}

export function initDb() {
  if (initialized) return;
  const db = getDb();
  db.execSync(schemaSql);

  // Migraciones para instalaciones existentes
  tryRun(db, "ALTER TABLE meal_entries ADD COLUMN mood TEXT");
  tryRun(db, "ALTER TABLE meal_entries ADD COLUMN portion_size TEXT");

  initialized = true;
}

