import { toDayKey } from "./dayKey";

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const jsDow = x.getDay();
  const delta = (jsDow + 6) % 7;
  x.setDate(x.getDate() - delta);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** Título legible en español para la semana natural (lunes → domingo). */
export function formatWeekSemanaDel(monday: Date, sunday: Date): string {
  const ys = monday.getFullYear();
  const ye = sunday.getFullYear();
  const ms = monday.getMonth();
  const me = sunday.getMonth();
  const ds = monday.getDate();
  const de = sunday.getDate();

  const monthLong = (dt: Date) =>
    new Intl.DateTimeFormat("es-ES", { month: "long" }).format(dt);

  if (ms === me && ys === ye) {
    return `Semana del ${ds} al ${de} de ${monthLong(monday)} de ${ys}`;
  }
  if (ys === ye) {
    return `Semana del ${ds} de ${monthLong(monday)} al ${de} de ${monthLong(sunday)} de ${ys}`;
  }
  return `Semana del ${ds} de ${monthLong(monday)} de ${ys} al ${de} de ${monthLong(sunday)} de ${ye}`;
}

export function getWeekRangeFromMonday(monday: Date) {
  const m = startOfWeekMonday(monday);
  const sunday = addDays(m, 6);
  const startDayKey = toDayKey(m);
  const endDayKey = toDayKey(sunday);
  const title = formatWeekSemanaDel(m, sunday);
  return { monday: m, sunday, startDayKey, endDayKey, title };
}
