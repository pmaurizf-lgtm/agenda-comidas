export const DB_NAME = "food-tracker.db";

export const schemaSql = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS water_entries (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  day_key TEXT NOT NULL,
  amount_ml INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_water_entries_day_key ON water_entries(day_key);

CREATE TABLE IF NOT EXISTS meal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  day_key TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  mood TEXT,
  portion_size TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_meal_entries_day_key ON meal_entries(day_key);
`;

