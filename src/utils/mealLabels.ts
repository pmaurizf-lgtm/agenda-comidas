import type { MealEntry, Mood, PortionSize } from "../db/repo";

export function moodEmoji(mood: Mood) {
  switch (mood) {
    case "feliz":
      return "😊";
    case "emocionado":
      return "🤩";
    case "contento":
      return "🙂";
    case "calmado":
      return "😌";
    case "neutral":
      return "😐";
    case "aliviado":
      return "😮‍💨";
    case "energia":
      return "⚡";
    case "aburrido":
      return "😑";
    case "cansado":
      return "🥱";
    case "entumecido":
      return "😶";
    case "estresado":
      return "😰";
    case "abrumado":
      return "😵‍💫";
    case "ansioso":
      return "😟";
    case "triste":
      return "😢";
    case "solo":
      return "🥺";
    case "culpable":
      return "😔";
    case "frustrado":
      return "😤";
    case "enojado":
      return "😠";
    default:
      return "";
  }
}

export function portionLabel(size: PortionSize) {
  if (!size) return "";
  return size; // S/M/L
}

export function portionSizeName(size: PortionSize) {
  switch (size) {
    case "S":
      return "Pequeño";
    case "M":
      return "Mediano";
    case "L":
      return "Grande";
    default:
      return "";
  }
}

export function mealTypeLabel(mealType: string) {
  switch (mealType) {
    case "desayuno":
      return "Desayuno";
    case "comida":
      return "Comida";
    case "merienda":
      return "Merienda";
    case "cena":
      return "Cena";
    case "snack":
      return "Snack";
    case "otro":
      return "Otro";
    default:
      return mealType;
  }
}

export function mealTypeIcon(mealType: string) {
  switch (mealType) {
    case "cena":
      return "🌙";
    case "desayuno":
      return "🌅";
    case "comida":
      return "🌞";
    case "merienda":
      return "🍎";
    case "snack":
      return "🍪";
    case "otro":
      return "🍽️";
    default:
      return "🍴";
  }
}

export function mealMetaLine(m: Pick<MealEntry, "mealType" | "mood" | "portionSize">) {
  const parts: string[] = [];
  parts.push(m.mealType);
  const pe = moodEmoji(m.mood);
  if (pe) parts.push(pe);
  const ps = portionLabel(m.portionSize);
  if (ps) parts.push(ps);
  return parts.join(" · ");
}

