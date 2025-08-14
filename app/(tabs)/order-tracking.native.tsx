import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    getUserLocation();
    // Localização padrão para entrega (pode vir de uma API)
    setLocation({ lat: -19.8333, lng: 34.8500 }); // Beira, Sofala
  }, []);

  const getUserLocation = async () => {
    try {
      // Solicitar permissão de localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permissão de localização negada');
        return;
      }

      // Obter localização atual
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setLocationError('Erro ao obter localização');
    }
  };

  if (locationError) {
    return (
      <View style={styles.container}>
        <AppHeaderTransparent onBack={() => router.replace('/orders')} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
          <Text style={styles.infoText}>
            Usando localização padrão da Beira, Sofala
          </Text>
        </View>
        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              title="Local de Entrega"
              description="Seu pedido será entregue aqui"
              pinColor="red"
            />
          </MapView>
        )}
      </View>
    );
  }

  // Exibir o mapa com localização do usuário
  const region = userLocation && location ? {
    // Calcular região que inclui ambos os pontos
    latitude: (userLocation.coords.latitude + location.lat) / 2,
    longitude: (userLocation.coords.longitude + location.lng) / 2,
    latitudeDelta: Math.abs(userLocation.coords.latitude - location.lat) * 1.5 + 0.01,
    longitudeDelta: Math.abs(userLocation.coords.longitude - location.lng) * 1.5 + 0.01,
  } : userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : location ? {
    latitude: location.lat,
    longitude: location.lng,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: -19.8333,
    longitude: 34.8500,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
      >
        {/* Marcador da localização do usuário */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="Você está aqui"
            description="Sua localização atual"
          />
        )}
        
        {/* Marcador do local de entrega */}
        {location && (
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            title="Local de Entrega"
            description="Seu pedido será entregue aqui"
            pinColor="red"
          />
        )}

        {/* Rota entre usuário e local de entrega */}
        {userLocation && location && (
          <Polyline
            coordinates={[
              {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              },
              {
                latitude: location.lat,
                longitude: location.lng,
              },
            ]}
            strokeColor="#FF6B6B" // Cor vermelha para a rota
            strokeWidth={4}
            lineDashPattern={[5, 5]} // Linha tracejada
          />
        )}
      </MapView>
      
      <View style={styles.headerContainer}>
        <AppHeaderTransparent onBack={() => router.replace('/orders')} />
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.orderInfo}>
          📦 Pedido #{orderId || '12345'}
        </Text>
        <Text style={styles.statusText}>
          🚚 Em rota de entrega
        </Text>
        {userLocation && location && (
          <Text style={styles.distanceText}>
            📍 Distância estimada: {
              Math.round(
                Math.sqrt(
                  Math.pow(userLocation.coords.latitude - location.lat, 2) +
                  Math.pow(userLocation.coords.longitude - location.lng, 2)
                ) * 111 // Conversão aproximada para km
              ) || 1
            } km
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFB',
  },
  map: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#008A44',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
});
