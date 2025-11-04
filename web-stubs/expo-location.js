// Stub para expo-location no web
// Este módulo vazio previne erros de bundling quando expo-location é importado no web

export async function requestForegroundPermissionsAsync() {
  return { status: 'granted' };
}

export async function getCurrentPositionAsync() {
  return {
    coords: {
      latitude: 0,
      longitude: 0,
    },
  };
}

// Exportação padrão para compatibilidade
module.exports = {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
};
