
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';
import { useLocalSearchParams } from 'expo-router';

// Para web: importar Leaflet
let MapComponent: React.FC<any> = () => null;
if (Platform.OS === 'web') {
  // @ts-ignore
  // eslint-disable-next-line
  MapComponent = ({ lat, lng }: { lat: number; lng: number }) => {
    React.useEffect(() => {
      // Adiciona o CSS do Leaflet
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(link);
      }
      // Adiciona o mapa
      const L = require('leaflet');
      const mapId = 'order-tracking-map';
      let map = (window as any)._orderTrackingMap;
      if (!map) {
        map = L.map(mapId).setView([lat, lng], 15);
        (window as any)._orderTrackingMap = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);
        L.marker([lat, lng]).addTo(map).bindPopup('Você').openPopup();
      } 
      else {
        map.setView([lat, lng], 15);
        if (map._lastMarker){
            map.removeLayer(map._lastMarker);
        } 
        
        else {
          map._lastMarker = L.marker([lat, lng]).addTo(map).bindPopup('Você 2').openPopup();
        }
      }
      return () => {
        // Não remove o mapa para evitar problemas de re-render
      };
    }, [lat, lng]);
    // Full screen: ocupa toda a tela, header fica por cima
    return <div id="order-tracking-map" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }} />;
  };
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
            setLocError('Não foi possível obter sua localização.');
          }
        );
      } else {
        setLocError('Geolocalização não suportada.');
      }
    } else {
      // Para mobile, pode usar expo-location futuramente
      setLocError('Mapa disponível apenas na versão web.');
    }
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && location && <MapComponent lat={location.lat} lng={location.lng} />}
      {/* Header transparente absoluto sobre o mapa */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <AppHeaderTransparent />
      </View>
      {locError && (
        <View style={{ position: 'absolute', top: 80, left: 0, width: '100%', zIndex: 200, alignItems: 'center' }}>
          <Text style={{ color: '#FF3B30', marginBottom: 16 }}>{locError}</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008A44',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    color: '#5C5C5C',
    marginBottom: 24,
  },
  status: {
    fontSize: 20,
    color: '#FF7A00',
    fontWeight: '600',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    color: '#5C5C5C',
    textAlign: 'center',
  },
});
