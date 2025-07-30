import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useLocalSearchParams } from 'expo-router';

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;

  // Aqui você pode buscar status detalhado do pedido pelo orderId
  // Exemplo: status, etapas, localização, previsão de entrega, etc.

  return (
    <View style={styles.container}>
      <AppHeader title={`Rastreamento #${orderId}`} />
      <View style={styles.content}>
        <Text style={styles.title}>Rastreamento do Pedido</Text>
        <Text style={styles.orderId}>Pedido #{orderId}</Text>
        {/* Aqui você pode exibir etapas, status, localização, etc. */}
        <Text style={styles.status}>Seu pedido está a caminho! 🚚</Text>
        <Text style={styles.info}>Em breve você poderá acompanhar o status detalhado do seu pedido aqui.</Text>
      </View>
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
