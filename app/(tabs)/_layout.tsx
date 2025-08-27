// As rotas de Favoritos e Perfil são declaradas dentro do componente, não fora!


import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/Colors';
import { useAuthUser } from '../../hooks/useAuthUser';
// Componente para exibir o logo do app no drawer
function LogoHeader() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
      <Image
        source={require('../../assets/images/logo.jpeg')}
        style={{ width: 95, height: 95, borderRadius: 26, marginBottom: 8 }}
        resizeMode="contain"
      />
    </View>
  );
}
// import DrawerUserHeader from '../components/DrawerUserHeader';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthUser();
  // Só renderiza após checar o estado do usuário (undefined = carregando)
  const [checked, setChecked] = React.useState(false);

  // Atualiza badge ao receber foco ou evento customizado
  React.useEffect(() => {
    setChecked(true);
  }, [user]);
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
        
        // Define os itens do menu baseado no user_role
        let screens = [];
        
        if (!user) {
          // Usuário não logado - apenas produtos
          screens = [
            { key: 'index', label: 'Productos', icon: 'home' },
          ];
        } else if (user.user_role === 'driver') {
          // Entregador - apenas Entregador e Perfil
          screens = [
            { key: 'entregador', label: 'Entregador', icon: 'truck' },
            { key: 'profile', label: 'Perfil', icon: 'user' },
          ];
        } else {
          // Cliente regular - menu sem Entregador
          screens = [
            { key: 'index', label: 'Productos', icon: 'home' },
            { key: 'orders', label: 'Compras', icon: 'clipboard' },
            { key: 'profile', label: 'Perfil', icon: 'user' },
          ];
        }
        return (
          <DrawerContentScrollView {...props}>
            {/* Exibe apenas o logo do app no topo do menu */}
            <LogoHeader />
            {/* Botão de login, sem avatar ou texto 'guest' */}
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
      {/* Adiciona explicitamente as rotas baseadas no user_role */}
      {user ? (
        <>
          {user.user_role === 'driver' ? (
            // Menu para entregadores - apenas Entregador e Perfil
            <>
              <Drawer.Screen
                name="entregador"
                options={{
                  drawerLabel: 'Entregador',
                  title: 'Painel do Entregador',
                  headerTitle: 'Painel do Entregador',
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
          ) : (
            // Menu para clientes regulares - sem Entregador
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
          )}
        </>
      ) : null}
      {/* <Drawer.Screen
        name="explore"
        options={{
          title: 'Explore',
          drawerLabel: 'Explorar',
          headerShown: false,
        }}
      /> */}
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
