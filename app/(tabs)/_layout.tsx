// As rotas de Favoritos e Perfil são declaradas dentro do componente, não fora!


import { Colors } from '../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthUser } from '../../hooks/useAuthUser';
import DrawerUserHeader from '../components/DrawerUserHeader';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthUser();
  const router = useRouter();
  // Só renderiza após checar o estado do usuário (undefined = carregando)
  const [checked, setChecked] = React.useState(false);
  const [headerRefresh, setHeaderRefresh] = React.useState(0);
  const [cartCount, setCartCount] = React.useState(0);

  // Atualiza a quantidade de itens do carrinho sempre que a tela recebe foco
  // Atualiza badge ao receber foco ou evento customizado
  React.useEffect(() => {
    const updateCartCount = async () => {
      const data = await AsyncStorage.getItem('cart');
      if (data) {
        try {
          const arr = JSON.parse(data);
          setCartCount(Array.isArray(arr) ? arr.length : 0);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };
    updateCartCount();
    // Escuta evento customizado disparado em cart.tsx
    const handler = () => updateCartCount();
    window.addEventListener('cartUpdated', handler);
    return () => {
      window.removeEventListener('cartUpdated', handler);
    };
  }, [user]);
  React.useEffect(() => {
    setChecked(true);
  }, [user]);
  React.useEffect(() => { setHeaderRefresh(r => r + 1); }, [user]);
  if (!checked) return null;
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        // You can customize the drawer style and header here
      }}
      drawerContent={props => {
        // Renderiza manualmente os itens do Drawer para garantir apenas labels em português
        const { navigation, state } = props;
        const screens = [
          { key: 'index', label: 'Catálogo', icon: 'home' },
          ...(user ? [
            { key: 'orders', label: 'Minhas Compras', icon: 'clipboard' },
            { key: 'favorites', label: 'Favoritos', icon: 'heart' },
            { key: 'profile', label: 'Perfil', icon: 'user' },
          ] : []),
          { key: 'explore', label: 'Explorar', icon: 'search' },
        ];
        return (
          <DrawerContentScrollView {...props}>
            <DrawerUserHeader trigger={headerRefresh} />
            {!user && (
              <TouchableOpacity
                onPress={() => navigation.navigate('login')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: '#008A44',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
                accessibilityLabel="Fazer login ou registrar"
              >
                <Icon name="log-in" size={22} color="#fff" style={{ marginRight: 16 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entrar ou Registrar</Text>
              </TouchableOpacity>
            )}
            {screens.map(screen => (
              <TouchableOpacity
                key={screen.key}
                onPress={() => navigation.navigate(screen.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: state.routeNames[state.index] === screen.key ? 'rgba(0,138,68,0.08)' : 'transparent',
                  borderRadius: 8,
                  marginBottom: 2,
                }}
                accessibilityLabel={screen.label}
              >
                <Icon name={screen.icon} size={22} color={state.routeNames[state.index] === screen.key ? '#008A44' : '#888'} style={{ marginRight: 16 }} />
                <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>{screen.label}</Text>
              </TouchableOpacity>
            ))}
          </DrawerContentScrollView>
        );
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Catálogo',
          drawerLabel: 'Catálogo',
          headerShown: false,
        }}
      />
      {/* Adiciona explicitamente as rotas de Favoritos e Perfil para garantir navegação */}
      {user ? (
        <>
          <Drawer.Screen
            name="favorites"
            options={{
              drawerLabel: 'Favoritos',
              title: 'Favoritos',
              headerTitle: 'Favoritos',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: 'Perfil',
              title: 'Perfil',
              headerTitle: 'Perfil',
              headerShown: false,
            }}
          />
        </>
      ) : null}
      <Drawer.Screen
        name="explore"
        options={{
          title: 'Explore',
          drawerLabel: 'Explorar',
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="detalhes"
        options={{
          title: 'Detalhes do Produto',
          headerTransparent: true,
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
          headerStyle: { backgroundColor: 'transparent' },
          headerShadowVisible: false,
          drawerItemStyle: { display: 'none' }, // Oculta do drawer
          headerLeft: () => null, // Remove o botão padrão do drawer
          headerShown: false,
        }}
      />
      {/* Só mostra Favoritos e Perfil se autenticado */}
      {/* As rotas de Favoritos e Perfil são automáticas pelo Expo Router, não declare manualmente aqui! */}
    </Drawer>
  );
}
