import * as Crypto from "expo-crypto";

export function newId() {
  // RFC4122 v4-like, suficiente para IDs locales offline
  try {
    const fn = globalThis.crypto?.randomUUID;
    if (typeof fn === "function") {
      const uuid = fn.call(globalThis.crypto);
      if (uuid) return uuid;
    }
  } catch {}
  return Crypto.randomUUID();
}

