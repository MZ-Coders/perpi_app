import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './auth/login';
import RegisterScreen from './auth/register';
import UserProfileScreen from './user/UserProfile';
// Importe outras telas conforme necessário

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil do Usuário' }} />
        {/* Adicione outras telas aqui */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
