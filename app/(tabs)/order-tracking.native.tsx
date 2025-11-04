import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';
import { supabase } from '../../lib/supabaseClient';
import { EntregadorService } from '../../services/entregadorService';

interface DeliveryLocation {
  lat: number;
  lng: number;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  created_at: string;
}

interface OrderData {
  id: number;
  endereco_entrega: string;
  latitude_entrega: number;
  longitude_entrega: number;
}

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const previousHeading = useRef<number>(0);
  
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Coordenada animada para movimento suave do marcador
  const [animatedCoordinate] = useState(
    new AnimatedRegion({
      latitude: -19.8333,
      longitude: 34.85,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  );

  useEffect(() => {
    fetchOrderData();
    fetchDriverLocation();
    
    // Animação de pulso contínua
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Atualizar localização do entregador a cada 5 segundos
    const interval = setInterval(() => {
      fetchDriverLocation();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderData = async () => {
    if (!orderId) {
      console.log('❌ [CLIENTE] Nenhum orderId fornecido');
      return;
    }
    
    console.log(`🔍 [CLIENTE] Buscando dados do pedido: ${orderId}`);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, endereco_entrega, latitude_entrega, longitude_entrega')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ [CLIENTE] Erro ao buscar pedido:', error);
        return;
      }

      if (data) {
        console.log('✅ [CLIENTE] Dados do pedido encontrados:', data);
        setOrderData(data);
        
        if (data.latitude_entrega && data.longitude_entrega) {
          setDeliveryLocation({
            lat: data.latitude_entrega,
            lng: data.longitude_entrega,
          });
          console.log('📍 [CLIENTE] Local de entrega:', {
            lat: data.latitude_entrega,
            lng: data.longitude_entrega,
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ [CLIENTE] Erro ao buscar dados do pedido:', error);
      setLoading(false);
    }
  };

  const fetchDriverLocation = async () => {
    if (!orderId) {
      return;
    }
    
    console.log(`🔍 [CLIENTE] Buscando localização do entregador para pedido: ${orderId}`);
    
    try {
      const { data: driverData, error } = await EntregadorService.buscarLocalizacaoEntregador(String(orderId));
      
      if (error) {
        console.error('❌ [CLIENTE] Erro ao buscar localização:', error);
        return;
      }
      
      if (driverData) {
        const newLocation: DriverLocation = {
          lat: driverData.latitude,
          lng: driverData.longitude,
          heading: driverData.heading || previousHeading.current,
          speed: driverData.speed,
          created_at: driverData.created_at,
        };
        
        console.log('✅ [CLIENTE] Localização do entregador encontrada:', {
          latitude: driverData.latitude,
          longitude: driverData.longitude,
          heading: driverData.heading,
          speed: driverData.speed,
          created_at: driverData.created_at
        });
        
        // Salvar heading para próxima iteração
        if (newLocation.heading) {
          previousHeading.current = newLocation.heading;
        }
        
        setDriverLocation(newLocation);
        
        // Ajustar câmera para mostrar ambos os marcadores
        if (mapRef.current && deliveryLocation) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: newLocation.lat, longitude: newLocation.lng },
              { latitude: deliveryLocation.lat, longitude: deliveryLocation.lng },
            ],
            {
              edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        console.log('⚠️ [CLIENTE] Nenhuma localização do entregador encontrada');
        setDriverLocation(null);
      }
    } catch (error) {
      console.error('❌ [CLIENTE] Erro ao buscar localização do entregador:', error);
    }
  };

  // Calcular região do mapa para mostrar ambos os marcadores
  const calculateRegion = () => {
    // Se temos ambas as localizações, calcular região que inclui as duas
    if (deliveryLocation && driverLocation) {
      const midLat = (deliveryLocation.lat + driverLocation.lat) / 2;
      const midLng = (deliveryLocation.lng + driverLocation.lng) / 2;
      const deltaLat = Math.abs(deliveryLocation.lat - driverLocation.lat) * 1.5 + 0.01;
      const deltaLng = Math.abs(deliveryLocation.lng - driverLocation.lng) * 1.5 + 0.01;
      
      console.log('🗺️ [CLIENTE] Região calculada (entrega + entregador):', {
        midLat,
        midLng,
        deltaLat,
        deltaLng
      });
      
      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: deltaLat,
        longitudeDelta: deltaLng,
      };
    }
    
    // Se temos só a localização de entrega
    if (deliveryLocation) {
      console.log('🗺️ [CLIENTE] Região baseada no local de entrega');
      return {
        latitude: deliveryLocation.lat,
        longitude: deliveryLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    
    // Se temos só a localização do entregador
    if (driverLocation) {
      console.log('🗺️ [CLIENTE] Região baseada no entregador');
      return {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    
    // Fallback: região padrão (Beira)
    console.log('🗺️ [CLIENTE] Usando região padrão (Beira)');
    return {
      latitude: -19.8333,
      longitude: 34.8500,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  // Calcular distância entre dois pontos (fórmula de Haversine simplificada)
  const calculateDistance = () => {
    if (!deliveryLocation || !driverLocation) return null;
    
    const R = 6371; // Raio da Terra em km
    const dLat = ((driverLocation.lat - deliveryLocation.lat) * Math.PI) / 180;
    const dLng = ((driverLocation.lng - deliveryLocation.lng) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((deliveryLocation.lat * Math.PI) / 180) *
        Math.cos((driverLocation.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeaderTransparent onBack={() => router.replace('/orders')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008A44" />
          <Text style={styles.loadingText}>Carregando rastreamento...</Text>
        </View>
      </View>
    );
  }

  const region = calculateRegion();
  const distance = calculateDistance();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsTraffic={true}
      >
        {/* Marcador do local de entrega com animação de pulso */}
        {deliveryLocation && (
          <Marker
            coordinate={{ 
              latitude: deliveryLocation.lat, 
              longitude: deliveryLocation.lng 
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.destinationMarker}>
              <Animated.View style={[
                styles.destinationPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [0.3, 0],
                  }),
                },
              ]} />
              <View style={styles.destinationPin}>
                <Text style={styles.destinationText}>🏠</Text>
              </View>
            </View>
          </Marker>
        )}
        
        {/* Marcador do entregador com rotação baseada em heading */}
        {driverLocation && (
          <Marker
            coordinate={{ 
              latitude: driverLocation.lat, 
              longitude: driverLocation.lng 
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View style={styles.deliveryMarker}>
              <Animated.View style={[
                styles.deliveryPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [0.2, 0],
                  }),
                },
              ]} />
              <View style={[
                styles.deliveryIcon,
                {
                  transform: [
                    { rotate: `${driverLocation.heading || 0}deg` }
                  ]
                }
              ]}>
                <Text style={styles.deliveryIconText}>🚗</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Linha entre entregador e local de entrega */}
        {deliveryLocation && driverLocation && (
          <Polyline
            coordinates={[
              {
                latitude: driverLocation.lat,
                longitude: driverLocation.lng,
              },
              {
                latitude: deliveryLocation.lat,
                longitude: deliveryLocation.lng,
              },
            ]}
            strokeColor="#FF6B6B"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
      
      <View style={styles.headerContainer}>
        <AppHeaderTransparent onBack={() => router.replace('/orders')} />
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.orderInfo}>
          📦 Pedido #{orderId || '...'}
        </Text>
        <Text style={styles.statusText}>
          {driverLocation ? '🚚 Entregador em rota' : '⏳ Aguardando entregador...'}
        </Text>
        {distance && (
          <Text style={styles.distanceText}>
            📍 Distância até entrega: {distance} km
          </Text>
        )}
        {!driverLocation && deliveryLocation && (
          <Text style={styles.infoText}>
            Endereço de entrega: {orderData?.endereco_entrega}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
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
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Marcadores personalizados estilo Uber/Yango
  deliveryMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  deliveryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFF',
    zIndex: 2,
  },
  deliveryIconText: {
    fontSize: 24,
  },
  deliveryPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  destinationPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  destinationText: {
    fontSize: 24,
  },
  destinationPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(52, 199, 89, 0.3)',
    zIndex: 1,
  },
});
