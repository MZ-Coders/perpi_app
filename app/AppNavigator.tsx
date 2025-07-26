import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import OrdersScreen from './(tabs)/orders';
import LoginScreen from './auth/login';
import RegisterScreen from './auth/register';
import UserProfileScreen from './user/UserProfile';
// Importe outras telas conforme necessário

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Orders">
        <Drawer.Screen name="Orders" component={OrdersScreen} options={{ title: 'Meus Pedidos' }} />
        <Drawer.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil do Usuário' }} />
        <Drawer.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Drawer.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        {/* Adicione outras telas aqui */}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
