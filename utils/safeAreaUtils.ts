import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook seguro para obter o overflow da tab bar
 * Funciona tanto com Bottom Tab Navigator quanto com Drawer Navigator
 */
export function useSafeBottomTabOverflow() {
  try {
    const insets = useSafeAreaInsets();
    
    // No iOS, usar safe area bottom para compensar o home indicator
    if (Platform.OS === 'ios') {
      return insets.bottom || 0;
    }
    
    // No Android e Web, retornar 0 pois não há tab bar nativa
    return 0;
  } catch (error) {
    // Fallback se o SafeAreaProvider não estiver disponível
    console.warn('SafeAreaProvider not available, using fallback');
    return 0;
  }
}

/**
 * Hook compatível com a API existente, mas mais robusto
 */
export function useBottomTabOverflowSafe() {
  return useSafeBottomTabOverflow();
}
