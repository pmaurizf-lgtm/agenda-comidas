import * as Crypto from "expo-crypto";

export function newId() {
  // RFC4122 v4-like, suficiente para IDs locales offline
  try {
    // @ts-expect-error randomUUID no siempre está tipado en RN
    const uuid = globalThis?.crypto?.randomUUID?.();
    if (uuid) return uuid as string;
  } catch {}
  return Crypto.randomUUID();
}

