import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importe suas telas
import AboutScreen from './screens/AboutScreen';
import TermsScreen from './screens/TermsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="About"
        // Oculta o cabeçalho padrão, pois já criamos o nosso
        screenOptions={{ headerShown: false }} 
      >
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}