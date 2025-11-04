// Stub para react-native-maps no web
// Este módulo vazio previne erros de bundling quando react-native-maps é importado no web

export default function MapView() {
  return null;
}

export function Marker() {
  return null;
}

export function UrlTile() {
  return null;
}

// Exportação padrão para compatibilidade
module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.UrlTile = UrlTile;
