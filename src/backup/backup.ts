import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  listAllMeals,
  listAllWaterEntries,
  replaceAllEntries,
  type MealEntry,
  type WaterEntry,
} from "../db/repo";
import { getUserName, getWaterGoalMl, setUserName, setWaterGoalMl } from "../settings/settings";

export const BACKUP_APP_ID = "food-tracker" as const;

export type BackupPayloadV1 = {
  formatVersion: 1;
  appId: typeof BACKUP_APP_ID;
  exportedAt: string;
  settings: {
    userName: string;
    waterGoalMl: number;
  };
  meals: MealEntry[];
  waters: WaterEntry[];
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string";
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function coerceMeal(row: unknown): MealEntry | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  if (
    !isNonEmptyString(o.id) ||
    !isFiniteNumber(o.createdAt) ||
    !isNonEmptyString(o.dayKey) ||
    !isNonEmptyString(o.mealType) ||
    !isNonEmptyString(o.title)
  ) {
    return null;
  }
  return {
    id: o.id,
    createdAt: Math.trunc(o.createdAt),
    dayKey: o.dayKey,
    mealType: o.mealType as MealEntry["mealType"],
    title: o.title,
    mood: (o.mood ?? null) as MealEntry["mood"],
    portionSize: (o.portionSize ?? null) as MealEntry["portionSize"],
    notes: typeof o.notes === "string" ? o.notes : null,
  };
}

function coerceWater(row: unknown): WaterEntry | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  if (!isNonEmptyString(o.id) || !isFiniteNumber(o.createdAt) || !isNonEmptyString(o.dayKey) || !isFiniteNumber(o.amountMl)) {
    return null;
  }
  return {
    id: o.id,
    createdAt: Math.trunc(o.createdAt),
    dayKey: o.dayKey,
    amountMl: Math.trunc(o.amountMl),
  };
}

export function parseBackupPayload(jsonText: string): BackupPayloadV1 {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error("El archivo no es JSON válido.");
  }
  if (!raw || typeof raw !== "object") {
    throw new Error("Copia de seguridad inválida.");
  }
  const o = raw as Record<string, unknown>;
  if (o.formatVersion !== 1 || o.appId !== BACKUP_APP_ID) {
    throw new Error("Este archivo no es una copia de esta app.");
  }
  const settingsRaw = o.settings;
  if (!settingsRaw || typeof settingsRaw !== "object") {
    throw new Error("Copia incompleta: falta la sección de ajustes.");
  }
  const sr = settingsRaw as Record<string, unknown>;
  const waterGoalMl = sr.waterGoalMl;
  const userName = sr.userName;
  if (!isFiniteNumber(waterGoalMl) || waterGoalMl <= 0) {
    throw new Error("Meta de agua en la copia no es válida.");
  }
  if (typeof userName !== "string") {
    throw new Error("Nombre en la copia no es válido.");
  }

  const mealsIn = Array.isArray(o.meals) ? o.meals : [];
  const watersIn = Array.isArray(o.waters) ? o.waters : [];
  const meals: MealEntry[] = [];
  const waters: WaterEntry[] = [];
  for (const r of mealsIn) {
    const m = coerceMeal(r);
    if (m) meals.push(m);
  }
  for (const r of watersIn) {
    const w = coerceWater(r);
    if (w) waters.push(w);
  }

  return {
    formatVersion: 1,
    appId: BACKUP_APP_ID,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(),
    settings: {
      userName: userName.trim(),
      waterGoalMl: Math.trunc(waterGoalMl),
    },
    meals,
    waters,
  };
}

export async function buildBackupPayload(): Promise<BackupPayloadV1> {
  const meals = await listAllMeals();
  const waters = await listAllWaterEntries();
  const [userName, waterGoalMl] = await Promise.all([getUserName(), getWaterGoalMl()]);
  return {
    formatVersion: 1,
    appId: BACKUP_APP_ID,
    exportedAt: new Date().toISOString(),
    settings: {
      userName,
      waterGoalMl,
    },
    meals,
    waters,
  };
}

function backupFileBaseName(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `copia-food-tracker-${y}-${m}-${day}`;
}

/** Genera JSON y abre el menú para guardar en archivos, Drive, etc. */
export async function shareBackupJson(): Promise<void> {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const base = FileSystem.cacheDirectory;
  if (!base) {
    throw new Error("No se pudo acceder a la caché del dispositivo.");
  }
  const path = `${base}${backupFileBaseName()}.json`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
  const can = await Sharing.isAvailableAsync();
  if (!can) {
    throw new Error("Compartir no está disponible aquí (p. ej. algunos navegadores).");
  }
  await Sharing.shareAsync(path, {
    mimeType: "application/json",
    dialogTitle: "Guardar copia de seguridad",
    UTI: "public.json",
  });
}

export async function restoreFromBackupPayload(payload: BackupPayloadV1): Promise<void> {
  await replaceAllEntries({ meals: payload.meals, waters: payload.waters });
  await setWaterGoalMl(payload.settings.waterGoalMl);
  await setUserName(payload.settings.userName);
}

/** Lee un archivo JSON elegido por el usuario y devuelve el texto. */
export async function pickAndReadBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  if (!uri) {
    throw new Error("No se pudo leer la ruta del archivo.");
  }

  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const text = await res.text();
    if (uri.startsWith("blob:")) {
      URL.revokeObjectURL(uri);
    }
    return text;
  }

  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}
