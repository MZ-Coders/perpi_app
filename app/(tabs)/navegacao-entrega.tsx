import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AppHeader from '../../components/AppHeader';
import { EntregadorService } from '../../services/entregadorService';

export default function NavegacaoEntregaScreen() {
  const params = useLocalSearchParams();
  const pedidoId = params.pedidoId as string;
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  useEffect(() => {
    initializeLocation();
    // Simular destino - em produção, buscar do pedido
    setDestination({ lat: -19.8347, lng: 34.8516 });
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    if (tracking && userLocation) {
      // Atualizar localização a cada 10 segundos
      const startTracking = async () => {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // 10 segundos
            distanceInterval: 50, // 50 metros
          },
          (location) => {
            setUserLocation(location);
            // Registrar localização no banco
            EntregadorService.registrarLocalizacao(
              pedidoId,
              location.coords.latitude,
              location.coords.longitude
            );
          }
        );
      };

      startTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [tracking, userLocation, pedidoId]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à localização para navegação.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
  };

  const calculateDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (userLocation && destination) {
      const dist = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        destination.lat,
        destination.lng
      );
      setDistance(dist);
      setEstimatedTime(Math.ceil(dist * 3)); // 3 min por km estimado
    }
  }, [userLocation, destination]);

  const openExternalNavigation = () => {
    if (!destination) return;

    const latitude = destination.lat;
    const longitude = destination.lng;

    Alert.alert(
      'Abrir Navegação',
      'Escolha o app de navegação:',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `maps://app?daddr=${latitude},${longitude}`,
              android: `google.navigation:q=${latitude},${longitude}`,
            });
            if (url) {
              Linking.openURL(url).catch(() => {
                // Fallback para browser
                Linking.openURL(`https://maps.google.com/maps?daddr=${latitude},${longitude}`);
              });
            }
          }
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://ul?ll=${latitude},${longitude}&navigate=yes`;
            Linking.openURL(url).catch(() => {
              // Fallback para browser
              Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}`);
            });
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const toggleTracking = () => {
    setTracking(!tracking);
    if (!tracking) {
      Alert.alert(
        'Rastreamento Iniciado',
        'Sua localização será compartilhada com o cliente durante a entrega.'
      );
    }
  };

  const marcarComoColetado = () => {
    Alert.alert(
      'Confirmar Coleta',
      'Você coletou o pedido no restaurante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Coletado',
          onPress: async () => {
            const { error } = await EntregadorService.atualizarStatusPedido(
              pedidoId,
              'coletado',
              'Pedido coletado no estabelecimento'
            );
            
            if (error) {
              Alert.alert('Erro', 'Não foi possível atualizar o status.');
              return;
            }

            Alert.alert('Status Atualizado', 'Pedido marcado como coletado.');
          }
        }
      ]
    );
  };

  const marcarEmTransito = () => {
    Alert.alert(
      'Confirmar Saída',
      'Você está indo para o endereço de entrega?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Em Trânsito',
          onPress: async () => {
            const { error } = await EntregadorService.atualizarStatusPedido(
              pedidoId,
              'em_transito',
              'A caminho do endereço de entrega'
            );
            
            if (error) {
              Alert.alert('Erro', 'Não foi possível atualizar o status.');
              return;
            }

            Alert.alert('Status Atualizado', 'Pedido em trânsito para entrega.');
            setTracking(true); // Iniciar rastreamento automaticamente
          }
        }
      ]
    );
  };

  const irParaConfirmacao = () => {
    router.push({
      pathname: '/confirmacao-entrega',
      params: { pedidoId }
    });
  };

  const region = userLocation && destination ? {
    latitude: (userLocation.coords.latitude + destination.lat) / 2,
    longitude: (userLocation.coords.longitude + destination.lng) / 2,
    latitudeDelta: Math.abs(userLocation.coords.latitude - destination.lat) * 1.5 + 0.01,
    longitudeDelta: Math.abs(userLocation.coords.longitude - destination.lng) * 1.5 + 0.01,
  } : userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined;

  return (
    <View style={styles.container}>
      <AppHeader title="Navegação - Entrega" />
      
      {region && (
        <MapView
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={tracking}
        >
          {/* Marcador do usuário */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              title="Sua Localização"
              description="Entregador"
              pinColor="blue"
            />
          )}
          
          {/* Marcador do destino */}
          {destination && (
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title="Local de Entrega"
              description="Destino do pedido"
              pinColor="red"
            />
          )}

          {/* Rota */}
          {userLocation && destination && (
            <Polyline
              coordinates={[
                {
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                },
                {
                  latitude: destination.lat,
                  longitude: destination.lng,
                },
              ]}
              strokeColor="#2196F3"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}

      {/* Informações da entrega */}
      <View style={styles.infoPanel}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>📦 Pedido #{pedidoId.slice(-6)}</Text>
          <View style={styles.trackingIndicator}>
            <View style={[styles.trackingDot, tracking && styles.trackingActive]} />
            <Text style={styles.trackingText}>
              {tracking ? 'Rastreando' : 'Pausado'}
            </Text>
          </View>
        </View>

        {distance && estimatedTime && (
          <View style={styles.infoStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{distance.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distância</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{estimatedTime} min</Text>
              <Text style={styles.statLabel}>Estimado</Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Pressable
            style={styles.navigationButton}
            onPress={openExternalNavigation}
          >
            <Text style={styles.navigationButtonText}>🧭 Abrir Navegação</Text>
          </Pressable>

          {/* <Pressable
            style={[styles.trackingButton, tracking ? styles.trackingButtonActive : styles.trackingButtonInactive]}
            onPress={toggleTracking}
          >
            <Text style={styles.trackingButtonText}>
              {tracking ? '⏸️ Pausar' : '▶️ Iniciar'} Rastreamento
            </Text>
          </Pressable> */}
        </View>

        {/* <View style={styles.statusButtons}>
          <Pressable style={styles.statusButton} onPress={marcarComoColetado}>
            <Text style={styles.statusButtonText}>✅ Coletado</Text>
          </Pressable>
          
          <Pressable style={styles.statusButton} onPress={marcarEmTransito}>
            <Text style={styles.statusButtonText}>🚚 Em Trânsito</Text>
          </Pressable>
          
          <Pressable style={[styles.statusButton, styles.deliveredButton]} onPress={irParaConfirmacao}>
            <Text style={[styles.statusButtonText, styles.deliveredButtonText]}>📋 Entregue</Text>
          </Pressable>
        </View> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
    marginRight: 8,
  },
  trackingActive: {
    backgroundColor: '#4CAF50',
  },
  trackingText: {
    fontSize: 12,
    color: '#666',
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navigationButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  trackingButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButtonActive: {
    backgroundColor: '#FF5722',
  },
  trackingButtonInactive: {
    backgroundColor: '#4CAF50',
  },
  trackingButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#008A44',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  deliveredButton: {
    backgroundColor: '#FF9800',
  },
  deliveredButtonText: {
    color: 'white',
  },
});
