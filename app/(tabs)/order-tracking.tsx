import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
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
    } else {
      // Mobile: usar uma localização padrão para teste
      setLocation({ lat: -8.8355, lng: 13.2319 });
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Para Mobile: Mostrar apenas placeholder com coordenadas */}
      {Platform.OS !== 'web' && location && (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            📍 Localização do Pedido
          </Text>
          <Text style={styles.coordinatesText}>
            Lat: {location.lat.toFixed(6)}
          </Text>
          <Text style={styles.coordinatesText}>
            Lng: {location.lng.toFixed(6)}
          </Text>
          <Text style={styles.deliveryText}>
            Entrega sendo preparada...
          </Text>
        </View>
      )}
      
      {/* Para Web: Implementar mapa em versão futura */}
      {Platform.OS === 'web' && (
        <View style={styles.webPlaceholder}>
          <Text style={styles.webPlaceholderText}>
            �️ Mapa Web
          </Text>
          {location && (
            <>
              <Text style={styles.coordinatesText}>
                Lat: {location.lat.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                Lng: {location.lng.toFixed(6)}
              </Text>
            </>
          )}
          <Text style={styles.deliveryText}>
            Recurso de mapa será implementado em breve
          </Text>
        </View>
      )}
      
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 20,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  webPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  deliveryText: {
    fontSize: 16,
    color: '#2E7D32',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
