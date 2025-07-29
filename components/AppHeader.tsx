import { Feather as Icon, MaterialCommunityIcons as MCIcon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthUser } from '../hooks/useAuthUser';

interface AppHeaderProps {
  title?: string;
  onMenuPress?: () => void;
  showCart?: boolean;
  showUser?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title = '', onMenuPress, showCart = true, showUser = true }) => {
  const router = useRouter();
  const navigation = useNavigation();
  const user = useAuthUser();
  const [cartCount, setCartCount] = React.useState(0);
  const [profile, setProfile] = React.useState<any>(null);

  // Carrega quantidade do carrinho
  React.useEffect(() => {
    function syncCart() {
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
    }
    syncCart();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('cartUpdated', syncCart);
      return () => window.removeEventListener('cartUpdated', syncCart);
    }
    return undefined;
  }, []);

  // Busca perfil se quiser mostrar avatar
  React.useEffect(() => {
    async function fetchProfile() {
      if (user && user.email) {
        try {
          const { supabase } = await import('../lib/supabaseClient');
          const { data, error } = await supabase
            .from('users_')
            .select('*')
            .eq('email', user.email)
            .single();
          if (!error && data) {
            setProfile(data);
          } else {
            setProfile(null);
          }
        } catch (err) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }
    fetchProfile();
  }, [user]);

  return (
    <LinearGradient colors={["#008A44", "#00C851"]} style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          onPress={() => {
            if (onMenuPress) {
              onMenuPress();
            } else {
              navigation.dispatch(DrawerActions.openDrawer());
            }
          }}
          style={styles.iconButton}
          accessibilityLabel="Abrir menu"
        >
          <Icon name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showCart && (
            <TouchableOpacity
              style={styles.cartIconBtn}
              onPress={() => router.push('/cart')}
              accessibilityLabel="Abrir carrinho"
            >
              <Icon name="shopping-cart" size={24} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {showUser && user && (
            <TouchableOpacity
              style={[styles.cartIconBtn, { marginLeft: 8, padding: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityLabel="Ir para o perfil"
            >
              {profile && profile.profile_picture_url ? (
                <Image
                  source={{ uri: profile.profile_picture_url }}
                  style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff', backgroundColor: '#eee' }}
                  resizeMode="cover"
                />
              ) : profile && (profile.nome || profile.email) ? (
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' }}>
                  <Text style={{ fontWeight: 'bold', color: '#008A44', fontSize: 16 }}>
                    {((profile.nome || profile.email || '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2))}
                  </Text>
                </View>
              ) : (
                <MCIcon name="account-circle" size={28} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    elevation: 4,
    shadowColor: '#008A44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    color: '#fff',
    letterSpacing: 1,
  },
  cartIconBtn: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF7A00',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AppHeader;
