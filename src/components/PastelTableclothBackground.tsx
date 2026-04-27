import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: W, height: H } = Dimensions.get("window");

/**
 * Fondo tipo referencia: bloques pastel + rejilla suave (mantel de cuadros).
 */
export function PastelTableclothBackground() {
  const rows = 11;
  const cols = 7;
  const checkerA = "rgba(255,255,255,0.14)";
  const checkerB = "rgba(255,255,255,0.06)";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#FFF5E6", "#FFE8EF", "#E8F4FC", "#F5F0FF", "#FFF9E6"]}
        locations={[0, 0.22, 0.48, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.blob, blobStyles.yellow]} />
      <View style={[styles.blob, blobStyles.pink]} />
      <View style={[styles.blob, blobStyles.blue]} />
      <View style={[styles.blob, blobStyles.mint]} />

      <LinearGradient
        colors={["rgba(255,255,255,0.5)", "transparent", "rgba(255,255,255,0.35)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
      />

      <View style={styles.checkerWrap}>
        {Array.from({ length: rows }).map((_, r) => (
          <View key={`r-${r}`} style={styles.checkerRow}>
            {Array.from({ length: cols }).map((_, c) => (
              <View
                key={`c-${r}-${c}`}
                style={[styles.checkerCell, { backgroundColor: (r + c) % 2 === 0 ? checkerA : checkerB }]}
              />
            ))}
          </View>
        ))}
      </View>

      <LinearGradient
        colors={["rgba(244,245,247,0.15)", "transparent", "rgba(244,245,247,0.2)"]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const blobStyles = {
  yellow: {
    top: H * 0.06,
    left: -W * 0.12,
    width: W * 0.62,
    height: W * 0.48,
    backgroundColor: "rgba(255, 213, 128, 0.42)",
    transform: [{ rotate: "-11deg" }],
    borderRadius: 48,
  },
  pink: {
    top: H * 0.28,
    right: -W * 0.1,
    width: W * 0.55,
    height: W * 0.44,
    backgroundColor: "rgba(248, 187, 208, 0.38)",
    transform: [{ rotate: "10deg" }],
    borderRadius: 44,
  },
  blue: {
    bottom: H * 0.02,
    left: W * 0.08,
    width: W * 0.72,
    height: W * 0.42,
    backgroundColor: "rgba(144, 202, 249, 0.36)",
    transform: [{ rotate: "4deg" }],
    borderRadius: 52,
  },
  mint: {
    bottom: H * 0.22,
    right: W * 0.02,
    width: W * 0.38,
    height: W * 0.34,
    backgroundColor: "rgba(165, 214, 167, 0.34)",
    borderRadius: 36,
  },
};

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
  },
  checkerWrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
    flexDirection: "column",
  },
  checkerRow: {
    flex: 1,
    flexDirection: "row",
  },
  checkerCell: {
    flex: 1,
    margin: 0.5,
    borderRadius: 3,
  },
});
