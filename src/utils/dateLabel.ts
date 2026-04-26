export function formatDayKeyLabel(dayKey: string, locale = "es-ES") {
  const [y, m, d] = dayKey.split("-").map((x) => Number(x));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

