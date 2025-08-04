// ATENÇÃO: Para funcionamento do mapa no mobile, instale as dependências abaixo:
// expo install react-native-maps expo-location
// Veja a documentação: https://docs.expo.dev/versions/latest/sdk/map-view/ e https://docs.expo.dev/versions/latest/sdk/location/
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';

// Para mobile, mantém o require
const pinMeIcon = require('../../assets/images/pin-me.png');

// Para web: importar Leaflet


let MapComponent: React.FC<any>;
if (Platform.OS === 'web') {
  // @ts-ignore
  MapComponent = ({ lat, lng }: { lat: number; lng: number }) => {
    React.useEffect(() => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const L = require('leaflet');
      const mapId = 'order-tracking-map';
      let map = (window as any)._orderTrackingMap;
      if (!map) {
        map = L.map(mapId).setView([lat, lng], 50);
        (window as any)._orderTrackingMap = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '©Perpi 2025',
        }).addTo(map);
        const customIcon = L.icon({
          iconUrl: '/images/pin-me.png',
          iconSize: [80, 80],
          iconAnchor: [40, 80],
          popupAnchor: [0, -80],
          shadowUrl: null,
        });
        L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup('Você está aqui');
      } else {
        map.setView([lat, lng], 15);
        if (map._lastMarker) map.removeLayer(map._lastMarker);
        const customIcon = L.icon({
          iconUrl: '/images/pin-me.png',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
          shadowUrl: null,
        });
        map._lastMarker = L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup('Você está aqui');
      }
      return () => {};
    }, [lat, lng]);
    return <div id="order-tracking-map" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 1 
    }} />;
  };
} else {
  MapComponent = require('./MapComponentMobile').default;
}

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            console.error('Erro de geolocalização:', err);
            setLocError('Não foi possível obter sua localização.');
          }
        );
      } else {
        setLocError('Geolocalização não suportada.');
      }
    } else {
      // Mobile: usar expo-location para obter localização
      (async () => {
        try {
          const { status } = await (await import('expo-location')).requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLocError('Permissão de localização negada.');
            return;
          }
          const locationObj = await (await import('expo-location')).getCurrentPositionAsync({});
          setLocation({ lat: locationObj.coords.latitude, lng: locationObj.coords.longitude });
        } catch (e) {
          setLocError('Não foi possível obter sua localização.');
        }
      })();
    }
  }, []);

  return (
    <View style={styles.container}>
      {location && <MapComponent lat={location.lat} lng={location.lng} />}
      
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        zIndex: 100 
      }}>
        <AppHeaderTransparent onBack={() => router.replace('/orders')} />
      </View>
      
      {locError && (
        <View style={{ 
          position: 'absolute', 
          top: 80, 
          left: 0, 
          width: '100%', 
          zIndex: 200, 
          alignItems: 'center' 
        }}>
          <Text style={{ color: '#FF3B30', marginBottom: 16 }}>
            {locError}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFB',
  },
});