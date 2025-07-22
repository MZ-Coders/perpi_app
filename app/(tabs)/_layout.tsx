// As rotas de Favoritos e Perfil são declaradas dentro do componente, não fora!


import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
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
  React.useEffect(() => {
    setChecked(true);
  }, [user]);
  React.useEffect(() => { setHeaderRefresh(r => r + 1); }, [user]);
  if (!checked) return null;
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        // You can customize the drawer style and header here
      }}
      drawerContent={props => {
        // Renderiza manualmente os itens do Drawer para garantir apenas labels em português
        const { navigation, state } = props;
        const screens = [
          { key: 'index', label: 'Catálogo', icon: 'home' },
          ...(user ? [
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
          headerStyle: { backgroundColor: '#008A44', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
          headerRight: ({ tintColor }) =>
            user ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                      window.dispatchEvent(new CustomEvent('abrirCarrinho'));
                    }
                  }}
                  style={{ marginRight: 8, padding: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)' }}
                  accessibilityLabel="Abrir carrinho"
                >
                  <Icon name="shopping-cart" size={24} color={'#fff'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile')}
                  style={{ marginRight: 16, padding: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)' }}
                  accessibilityLabel="Ir para o perfil"
                >
                  <Icon name="user" size={24} color={'#fff'} />
                </TouchableOpacity>
              </>
            ) : null,
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
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: 'Perfil',
              title: 'Perfil',
              headerTitle: 'Perfil',
            }}
          />
        </>
      ) : null}
      <Drawer.Screen
        name="explore"
        options={{
          title: 'Explore',
          drawerLabel: 'Explorar',
        }}
      />
      {/* Só mostra Favoritos e Perfil se autenticado */}
      {/* As rotas de Favoritos e Perfil são automáticas pelo Expo Router, não declare manualmente aqui! */}
    </Drawer>
  );
}
