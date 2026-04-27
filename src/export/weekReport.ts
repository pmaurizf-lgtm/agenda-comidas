import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
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

/** Cabecera corta para columnas del resumen semanal (ej. Lun 27). */
function formatShortDayHeader(dayKey: string) {
  const [y, mo, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, (mo ?? 1) - 1, d ?? 1);
  const wd = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(dt);
  const label = wd.charAt(0).toUpperCase() + wd.slice(1).replace(/\.$/, "").trim();
  return `${label} ${d ?? ""}`;
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

  let summaryMatrixHeader = "<th class=\"corner\"></th>";
  let summaryRowMeals = `<th scope="row">Nº comidas</th>`;
  let summaryRowWater = `<th scope="row">Agua total (ml)</th>`;
  let summaryRowGoalPct = `<th scope="row">% meta agua</th>`;
  for (const dk of dayKeys) {
    summaryMatrixHeader += `<th>${escapeHtml(formatShortDayHeader(dk))}</th>`;
    const mc = mealsByDay.get(dk)?.length ?? 0;
    const wm = waterSumByDay.get(dk) ?? 0;
    summaryRowMeals += `<td class="num">${mc}</td>`;
    summaryRowWater += `<td class="num">${wm}</td>`;
    const pct =
      waterGoalMl != null && waterGoalMl > 0 ? Math.round(Math.min(150, (wm / waterGoalMl) * 100)) : null;
    summaryRowGoalPct += `<td class="num">${pct != null ? `${pct}%` : "—"}</td>`;
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
      <td class="num">${w.amountMl}</td>
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

  const goalNote =
    waterGoalMl != null && waterGoalMl > 0
      ? `<p class="goal-note">«% meta agua»: porcentaje del día respecto a la meta (tope mostrado 150%).</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    padding: 8px 10px 14px;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111827;
    font-size: 10px;
    line-height: 1.35;
    background: #fff;
  }
  .sheet { width: 100%; max-width: 100%; margin: 0 auto; background: #fff; }
  .banner {
    border: 2px solid #374151;
    border-bottom: none;
    padding: 10px 14px;
    background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  }
  .banner h1 { margin: 0 0 4px 0; font-size: 14px; font-weight: 800; letter-spacing: -0.02em; color: #111827; }
  .banner .week { margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #374151; text-transform: capitalize; }
  .banner .user { margin: 0; font-size: 10px; color: #4b5563; }
  .banner .meta { margin: 6px 0 0 0; font-size: 10px; color: #4b5563; }
  .goal-note { margin: 8px 0 0 0; font-size: 9px; color: #6b7280; }

  .inner { padding: 0; }

  h2 {
    margin: 12px 0 6px 0;
    font-size: 10px;
    font-weight: 800;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 8px;
    background: #e5e7eb;
    border: 2px solid #374151;
    border-bottom: none;
  }
  h2.first-block { margin-top: 0; border-top: 2px solid #374151; }

  table.report {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin: 0 0 10px 0;
    font-size: 9px;
    border: 2px solid #374151;
  }
  table.report thead { display: table-header-group; }
  table.report th,
  table.report td {
    border: 1px solid #374151;
    padding: 5px 6px;
    vertical-align: middle;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  table.report thead th {
    background: #d1d5db;
    font-weight: 800;
    color: #111827;
    text-align: center;
  }
  table.report tbody th {
    background: #f3f4f6;
    font-weight: 700;
    text-align: left;
    color: #1f2937;
  }
  table.report tbody td.num { text-align: center; font-variant-numeric: tabular-nums; }
  table.report .corner { background: #f9fafb; width: 14%; }
  table.report tbody tr:nth-child(even) td { background: #fafafa; }

  table.detail { font-size: 9px; }
  table.detail thead th { text-align: left; }
  table.detail tbody tr:nth-child(even) td { background: #f9fafb; }

  .muted { color: #6b7280; font-style: italic; text-align: center; }
  .footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #d1d5db; font-size: 8px; color: #9ca3af; text-align: center; }

  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="banner">
      <h1>Informe semanal · Agenda de comidas</h1>
      <p class="week">${escapeHtml(weekTitle)}</p>
      ${userLine}
      ${goalLine}
      ${goalNote}
    </div>
    <div class="inner">
      <h2 class="first-block">Resumen de la semana (por día)</h2>
      <table class="report matrix" aria-label="Resumen semanal">
        <thead>
          <tr>${summaryMatrixHeader}</tr>
        </thead>
        <tbody>
          <tr>${summaryRowMeals}</tr>
          <tr>${summaryRowWater}</tr>
          <tr>${summaryRowGoalPct}</tr>
        </tbody>
      </table>

      <h2>Detalle de comidas</h2>
      <table class="report detail">
        <thead>
          <tr>
            <th style="width:14%">Día</th>
            <th style="width:7%">Hora</th>
            <th style="width:11%">Tipo</th>
            <th style="width:22%">Descripción</th>
            <th style="width:9%">Porción</th>
            <th style="width:11%">Ánimo</th>
            <th style="width:26%">Notas</th>
          </tr>
        </thead>
        <tbody>${mealRows}</tbody>
      </table>

      <h2>Tomas de agua</h2>
      <table class="report detail">
        <thead>
          <tr><th style="width:34%">Día</th><th style="width:18%">Hora</th><th style="width:14%">Ml</th></tr>
        </thead>
        <tbody>${waterRows}</tbody>
      </table>

      <p class="footer">Informe generado desde la app · uso personal · orientación recomendada: horizontal (A4)</p>
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

/** En web, `expo-print` solo llama a `window.print()` y no usa el HTML → se ve la app, no el informe. */
function printHtmlDocumentWeb(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("La impresión del informe solo está disponible en el navegador."));
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute(
      "style",
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none",
    );
    document.body.appendChild(iframe);

    const idoc = iframe.contentDocument;
    const iwin = iframe.contentWindow;
    if (!idoc || !iwin) {
      iframe.remove();
      reject(new Error("No se pudo preparar la vista de impresión."));
      return;
    }

    idoc.open();
    idoc.write(html);
    idoc.close();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        iframe.remove();
      } catch {
        /* noop */
      }
      resolve();
    };

    iwin.addEventListener("afterprint", finish, { once: true });
    iwin.focus();
    iwin.print();
    setTimeout(finish, 2500);
  });
}

function downloadXlsxWorkbookWeb(fileName: string, wb: XLSX.WorkBook): void {
  if (typeof document === "undefined") return;
  const array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
  const blob = new Blob([Uint8Array.from(array)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

  if (Platform.OS === "web") {
    await printHtmlDocumentWeb(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 792,
    height: 612,
  });
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

  if (Platform.OS === "web") {
    downloadXlsxWorkbookWeb(`${params.fileBaseName}.xlsx`, wb);
    return;
  }

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
