import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { listenToCartUpdates } from '../utils/cartEvents';

interface AppHeaderTransparentProps {
  onBack?: () => void;
  showCart?: boolean;
  mode?: 'back' | 'menu';
}

const AppHeaderTransparent: React.FC<AppHeaderTransparentProps> = ({ onBack, showCart = true, mode = 'back' }) => {
  const router = useRouter();
  const [cartCount, setCartCount] = React.useState(0);

  // Atualiza quantidade do carrinho ao montar e ao receber evento
  React.useEffect(() => {
    function syncCart() {
      import('@react-native-async-storage/async-storage').then(AsyncStorageModule => {
        const AsyncStorage = AsyncStorageModule.default;
        AsyncStorage.getItem('cart').then(stored => {
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setCartCount(Array.isArray(parsed) ? parsed.length : 0);
            } catch {
              setCartCount(0);
            }
          } else {
            setCartCount(0);
          }
        });
      });
    }
    
    // Sincroniza inicialmente
    syncCart();
    
    // Escuta eventos de atualização do carrinho usando utilitário
    return listenToCartUpdates(syncCart);
  }, []);

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.headerRow}>
        {/* Botão de voltar ou menu personalizado */}
        {mode === 'menu' ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Emite evento para abrir drawer (deve ser capturado pelo layout do Drawer)
              DeviceEventEmitter.emit('openDrawer');
            }}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack ? onBack : () => router.back()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {/* Botão de carrinho à direita */}
        {showCart && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <Icon name="shopping-cart" size={24} color="#fff" />
            {cartCount > 0 && (
              <View style={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: '#FF7A00',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
                zIndex: 10,
              }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 45,
    paddingHorizontal: 20,
    width: '100%',
    zIndex: 10,
    position: 'absolute',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default AppHeaderTransparent;
