import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';

// Componente de mapa para web usando Google Maps
function WebMapComponent({ lat, lng }: { lat: number; lng: number }) {
  React.useEffect(() => {
    const apiKey = 'AIzaSyCnpCyj24lpS3TzZ-8fy8Y4E9VWQ3i26t8'; // Sua chave da API do Google Maps

    // Carregar Google Maps JS API
    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else if ((window as any).google && (window as any).google.maps) {
      initMap();
    } else {
      // Aguardar o script carregar
      const checkGoogle = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkGoogle);
          initMap();
        }
      }, 100);
    }

    function initMap() {
      const google = (window as any).google;
      const mapId = 'order-tracking-map';
      
      // Limpar mapa anterior se existir
      const mapElement = document.getElementById(mapId);
      if (!mapElement) return;

      const map = new google.maps.Map(mapElement, {
        center: { lat, lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

      // Marcador
      new google.maps.Marker({
        position: { lat, lng },
        map,
        title: 'Você está aqui',
      });

      // Salvar referência para limpeza
      (window as any)._orderTrackingMap = map;
    }

    return () => {
      // Limpeza se necessário
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
