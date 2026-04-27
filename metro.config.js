const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite (web): bundle wa-sqlite.wasm as a static asset
config.resolver.assetExts.push('wasm');

module.exports = config;
