import { Platform } from 'react-native';

/**
 * Função utilitária para emitir eventos de atualização do carrinho
 * de forma consistente em todas as plataformas
 */
export function emitCartUpdated() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    // Web: evento customizado
    window.dispatchEvent(new Event('cartUpdated'));
  } else {
    // Mobile: DeviceEventEmitter
    const { DeviceEventEmitter } = require('react-native');
    DeviceEventEmitter.emit('cartUpdated');
  }
}

/**
 * Função utilitária para escutar eventos de atualização do carrinho
 * de forma consistente em todas as plataformas
 */
export function listenToCartUpdates(callback: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    // Web: evento customizado
    window.addEventListener('cartUpdated', callback);
    return () => window.removeEventListener('cartUpdated', callback);
  } else {
    // Mobile: DeviceEventEmitter
    const { DeviceEventEmitter } = require('react-native');
    const subscription = DeviceEventEmitter.addListener('cartUpdated', callback);
    return () => subscription.remove();
  }
}
