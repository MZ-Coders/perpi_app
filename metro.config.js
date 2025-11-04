const { getDefaultConfig } = require('@expo/metro-config');

// Use the Expo default Metro config without custom aliases to ensure correct behavior across platforms.
module.exports = getDefaultConfig(__dirname);
