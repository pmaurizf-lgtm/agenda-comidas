import AsyncStorage from "@react-native-async-storage/async-storage";

const WATER_GOAL_KEY = "settings.waterGoalMl";
const USER_NAME_KEY = "settings.userName";

export async function getWaterGoalMl() {
  const raw = await AsyncStorage.getItem(WATER_GOAL_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 2000;
}

export async function setWaterGoalMl(value: number) {
  const n = Number.isFinite(value) ? Math.trunc(value) : 0;
  if (n <= 0) throw new Error("invalid_value");
  await AsyncStorage.setItem(WATER_GOAL_KEY, String(n));
}

export async function getUserName() {
  const raw = await AsyncStorage.getItem(USER_NAME_KEY);
  const v = (raw ?? "").trim();
  return v.length ? v : "";
}

export async function setUserName(name: string) {
  const v = (name ?? "").trim();
  if (!v.length) {
    await AsyncStorage.removeItem(USER_NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(USER_NAME_KEY, v);
}

