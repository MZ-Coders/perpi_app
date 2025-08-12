const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuração simplificada para resolver módulos nativos no web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Usar alias para redirecionar módulos nativos para stubs no web
config.resolver.alias = {
  'react-native-maps': path.resolve(__dirname, 'web-stubs/react-native-maps.js'),
  'expo-location': path.resolve(__dirname, 'web-stubs/expo-location.js'),
};

module.exports = config;
