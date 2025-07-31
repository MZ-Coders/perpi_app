
import { Platform, View, Text } from 'react-native';
import React from 'react';

let MapComponentMobile: React.FC<{ lat: number; lng: number }>;
if (Platform.OS !== 'web') {
  // Importar Image só no mobile
  const { Image } = require('react-native');
  const pinMeIcon = require('../../assets/images/pin-me.png');
  MapComponentMobile = function ({ lat, lng }) {
    const [MapView, setMapView] = React.useState<any>(null);
    const [Marker, setMarker] = React.useState<any>(null);
    const [UrlTile, setUrlTile] = React.useState<any>(null);
    React.useEffect(() => {
      (async () => {
        const maps = await import('react-native-maps');
        setMapView(() => maps.default);
        setMarker(() => maps.Marker);
        setUrlTile(() => maps.UrlTile);
      })();
    }, []);
    if (!MapView || !Marker || !UrlTile) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFDFB' }}>
          <Text style={{ color: '#008A44', fontWeight: 'bold' }}>Carregando mapa...</Text>
        </View>
      );
    }
    return (
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        loadingEnabled={true}
      >
        <UrlTile
          urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        <Marker coordinate={{ latitude: lat, longitude: lng }}>
          <Image source={pinMeIcon} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </Marker>
      </MapView>
    );
  };
} else {
  // Placeholder para web, nunca será exibido
  MapComponentMobile = () => <View style={{ flex: 1, backgroundColor: '#FDFDFB', justifyContent: 'center', alignItems: 'center' }}><Text>Mapa não suportado no web</Text></View>;
}

export default MapComponentMobile;
