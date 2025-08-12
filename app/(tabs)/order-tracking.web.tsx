import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';

// Componente de mapa para web usando Leaflet via CDN
function WebMapComponent({ lat, lng }: { lat: number; lng: number }) {
  React.useEffect(() => {
    // Carregar CSS do Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Carregar JS do Leaflet
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const L = (window as any).L;
      const mapId = 'order-tracking-map';
      
      // Limpar mapa anterior se existir
      if ((window as any)._orderTrackingMap) {
        (window as any)._orderTrackingMap.remove();
      }

      const map = L.map(mapId).setView([lat, lng], 15);
      (window as any)._orderTrackingMap = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© Perpi 2025',
      }).addTo(map);

      // Ícone padrão ou personalizado
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup('Você está aqui').openPopup();
    }

    return () => {
      if ((window as any)._orderTrackingMap) {
        (window as any)._orderTrackingMap.remove();
        (window as any)._orderTrackingMap = null;
      }
    };
  }, [lat, lng]);
  
  return (
    <div 
      id="order-tracking-map" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 1 
      }} 
    />
  );
}

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    // Web: usar navigator.geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error('Erro de geolocalização:', err);
          setLocError('Não foi possível obter sua localização.');
          // Localização padrão para Luanda
          setLocation({ lat: -8.8355, lng: 13.2319 });
        }
      );
    } else {
      setLocError('Geolocalização não suportada.');
      // Localização padrão para Luanda
      setLocation({ lat: -8.8355, lng: 13.2319 });
    }
  }, []);

  return (
    <View style={styles.container}>
      {location && <WebMapComponent lat={location.lat} lng={location.lng} />}
      
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
