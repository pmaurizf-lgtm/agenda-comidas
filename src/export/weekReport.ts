import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import type { MealEntry, WaterEntry } from "../db/repo";
import { mealTypeLabel, portionSizeName } from "../utils/mealLabels";
import { addDays } from "../utils/weekRange";
import { toDayKey } from "../utils/dayKey";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDayLabel(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dt);
}

function buildDayKeys(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toDayKey(addDays(monday, i)));
}

export function buildWeeklyReportHtml(params: {
  weekTitle: string;
  userName: string | null;
  meals: MealEntry[];
  waters: WaterEntry[];
  waterGoalMl: number | null;
  monday: Date;
}): string {
  const { weekTitle, userName, meals, waters, waterGoalMl, monday } = params;
  const dayKeys = buildDayKeys(monday);

  const mealsByDay = new Map<string, MealEntry[]>();
  for (const m of meals) {
    const arr = mealsByDay.get(m.dayKey) ?? [];
    arr.push(m);
    mealsByDay.set(m.dayKey, arr);
  }

  const waterSumByDay = new Map<string, number>();
  for (const dk of dayKeys) waterSumByDay.set(dk, 0);
  for (const w of waters) {
    waterSumByDay.set(w.dayKey, (waterSumByDay.get(w.dayKey) ?? 0) + w.amountMl);
  }

  let summaryRows = "";
  for (const dk of dayKeys) {
    const mc = mealsByDay.get(dk)?.length ?? 0;
    const wm = waterSumByDay.get(dk) ?? 0;
    summaryRows += `<tr><td>${escapeHtml(formatDayLabel(dk))}</td><td>${mc}</td><td>${wm}</td></tr>`;
  }

  let mealRows = "";
  for (const m of meals) {
    const mood = m.mood ? escapeHtml(m.mood) : "—";
    const portion = m.portionSize ? escapeHtml(portionSizeName(m.portionSize)) : "—";
    const notes = m.notes ? escapeHtml(m.notes) : "";
    mealRows += `<tr>
      <td>${escapeHtml(formatDayLabel(m.dayKey))}</td>
      <td>${formatTime(m.createdAt)}</td>
      <td>${escapeHtml(mealTypeLabel(m.mealType))}</td>
      <td>${escapeHtml(m.title)}</td>
      <td>${portion}</td>
      <td>${mood}</td>
      <td>${notes}</td>
    </tr>`;
  }
  if (!mealRows) {
    mealRows = `<tr><td colspan="7" class="muted">Sin comidas registradas en esta semana.</td></tr>`;
  }

  let waterRows = "";
  for (const w of waters) {
    waterRows += `<tr>
      <td>${escapeHtml(formatDayLabel(w.dayKey))}</td>
      <td>${formatTime(w.createdAt)}</td>
      <td>${w.amountMl}</td>
    </tr>`;
  }
  if (!waterRows) {
    waterRows = `<tr><td colspan="3" class="muted">Sin registros de agua en esta semana.</td></tr>`;
  }

  const userLine = userName?.trim()
    ? `<p class="user">Usuario: ${escapeHtml(userName.trim())}</p>`
    : `<p class="user">Usuario: —</p>`;

  const goalLine =
    waterGoalMl != null && waterGoalMl > 0
      ? `<p class="meta">Meta diaria de agua: <strong>${waterGoalMl} ml</strong></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px 24px 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; font-size: 13px; line-height: 1.45; background: #fafafa; }
  .sheet { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(17,24,39,0.08); border: 1px solid rgba(17,24,39,0.06); }
  .banner { background: linear-gradient(135deg, #6D5CE7 0%, #8B7CF0 55%, #60A5FA 100%); color: #fff; padding: 26px 28px 22px; }
  .banner h1 { margin: 0 0 10px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .banner .week { margin: 0 0 12px 0; font-size: 16px; font-weight: 700; opacity: 0.98; line-height: 1.35; }
  .banner .user { margin: 0; font-size: 13px; opacity: 0.92; }
  .banner .meta { margin: 10px 0 0 0; font-size: 12px; opacity: 0.9; }
  .inner { padding: 22px 24px 28px; }
  h2 { margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #6D5CE7; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #EEF2FF; padding-bottom: 8px; }
  h2:not(:first-of-type) { margin-top: 26px; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 6px 0; font-size: 12px; }
  th { background: #F3F4F6; text-align: left; padding: 10px 8px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; }
  td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  tr:nth-child(even) td { background: #FAFAFB; }
  .muted { color: #6B7280; font-style: italic; }
  .footer { margin-top: 24px; padding-top: 14px; border-top: 1px dashed #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="banner">
      <h1>Agenda de comidas</h1>
      <p class="week">${escapeHtml(weekTitle)}</p>
      ${userLine}
      ${goalLine}
    </div>
    <div class="inner">
      <h2>Resumen por día</h2>
      <table>
        <thead><tr><th>Día</th><th>Comidas</th><th>Agua total (ml)</th></tr></thead>
        <tbody>${summaryRows}</tbody>
      </table>

      <h2>Detalle de comidas</h2>
      <table>
        <thead><tr><th>Día</th><th>Hora</th><th>Tipo</th><th>Descripción</th><th>Porción</th><th>Ánimo</th><th>Notas</th></tr></thead>
        <tbody>${mealRows}</tbody>
      </table>

      <h2>Registro de agua</h2>
      <table>
        <thead><tr><th>Día</th><th>Hora</th><th>Cantidad (ml)</th></tr></thead>
        <tbody>${waterRows}</tbody>
      </table>

      <p class="footer">Informe generado desde la app · solo uso personal</p>
    </div>
  </div>
</body>
</html>`;
}

function buildExcelRows(params: {
  weekTitle: string;
  userName: string | null;
  meals: MealEntry[];
  waters: WaterEntry[];
  waterGoalMl: number | null;
  monday: Date;
}): (string | number)[][] {
  const { weekTitle, userName, meals, waters, waterGoalMl, monday } = params;
  const dayKeys = buildDayKeys(monday);

  const mealsByDay = new Map<string, MealEntry[]>();
  for (const m of meals) {
    const arr = mealsByDay.get(m.dayKey) ?? [];
    arr.push(m);
    mealsByDay.set(m.dayKey, arr);
  }
  const waterSumByDay = new Map<string, number>();
  for (const dk of dayKeys) waterSumByDay.set(dk, 0);
  for (const w of waters) {
    waterSumByDay.set(w.dayKey, (waterSumByDay.get(w.dayKey) ?? 0) + w.amountMl);
  }

  const rows: (string | number)[][] = [];
  rows.push(["Agenda de comidas"]);
  rows.push([weekTitle]);
  rows.push(["Usuario", userName?.trim() || "—"]);
  rows.push(["Meta agua (ml/día)", waterGoalMl && waterGoalMl > 0 ? waterGoalMl : "—"]);
  rows.push([]);
  rows.push(["Resumen por día"]);
  rows.push(["Día", "Nº comidas", "Agua total (ml)"]);
  for (const dk of dayKeys) {
    rows.push([
      formatDayLabel(dk),
      mealsByDay.get(dk)?.length ?? 0,
      waterSumByDay.get(dk) ?? 0,
    ]);
  }
  rows.push([]);
  rows.push(["Detalle de comidas"]);
  rows.push(["Día", "Hora", "Tipo", "Descripción", "Porción", "Ánimo", "Notas"]);
  for (const m of meals) {
    rows.push([
      formatDayLabel(m.dayKey),
      formatTime(m.createdAt),
      mealTypeLabel(m.mealType),
      m.title,
      m.portionSize ? portionSizeName(m.portionSize) : "—",
      m.mood ?? "—",
      m.notes ?? "",
    ]);
  }
  rows.push([]);
  rows.push(["Registro de agua"]);
  rows.push(["Día", "Hora", "Cantidad (ml)"]);
  for (const w of waters) {
    rows.push([formatDayLabel(w.dayKey), formatTime(w.createdAt), w.amountMl]);
  }
  return rows;
}

export async function shareWeekPdf(params: {
  weekTitle: string;
  userName: string | null;
  meals: MealEntry[];
  waters: WaterEntry[];
  waterGoalMl: number | null;
  monday: Date;
}): Promise<void> {
  const html = buildWeeklyReportHtml(params);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const can = await Sharing.isAvailableAsync();
  if (!can) {
    throw new Error("Compartir no disponible en este dispositivo.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Exportar informe PDF",
    UTI: "com.adobe.pdf",
  });
}

export async function shareWeekExcel(params: {
  weekTitle: string;
  userName: string | null;
  meals: MealEntry[];
  waters: WaterEntry[];
  waterGoalMl: number | null;
  monday: Date;
  fileBaseName: string;
}): Promise<void> {
  const rows = buildExcelRows(params);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 36 }, { wch: 12 }, { wch: 14 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Informe semanal");
  const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const base = FileSystem.cacheDirectory;
  if (!base) {
    throw new Error("No se pudo acceder a la caché del dispositivo.");
  }
  const path = `${base}${params.fileBaseName}.xlsx`;
  await FileSystem.writeAsStringAsync(path, b64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const can = await Sharing.isAvailableAsync();
  if (!can) {
    throw new Error("Compartir no disponible en este dispositivo.");
  }
  await Sharing.shareAsync(path, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "Exportar Excel",
  });
}
