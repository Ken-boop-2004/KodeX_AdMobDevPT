import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainStackParamList, TabParamList } from './src/navigation/types';
import { PokedexScreen } from './src/screens/PokedexScreen';
import { PokemonDetailScreen } from './src/screens/PokemonDetailScreen';
import { HuntScreen } from './src/screens/HuntScreen';
import { ARCameraScreen } from './src/screens/ARCameraScreen';
import { capitalize } from './src/utils/pokemon';
import { configureNotifications } from './src/services/notifications';

const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: '#ef5350' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

const PokedexTab = () => (
  <MainStack.Navigator screenOptions={screenOptions}>
    <MainStack.Screen name="Pokedex" component={PokedexScreen} options={{ title: 'Pokédex', headerShown: false }} />
    <MainStack.Screen
      name="PokemonDetail"
      component={PokemonDetailScreen}
      options={({ route }) => ({
        title: capitalize(route.params.name),
      })}
    />
  </MainStack.Navigator>
);

const HuntTab = () => (
  <MainStack.Navigator screenOptions={screenOptions}>
    <MainStack.Screen name="Hunt" component={HuntScreen} options={{ title: 'Hunt Pokémon' }} />
    <MainStack.Screen
      name="PokemonDetail"
      component={PokemonDetailScreen}
      options={({ route }) => ({
        title: capitalize(route.params.name),
      })}
    />
  </MainStack.Navigator>
);

const ARCameraTab = () => (
  <MainStack.Navigator screenOptions={screenOptions}>
    <MainStack.Screen name="ARCamera" component={ARCameraScreen} options={{ title: 'AR Camera', headerShown: false }} />
  </MainStack.Navigator>
);

function App() {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#ef5350" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: '#ef5350',
              tabBarInactiveTintColor: '#7b7b85',
              tabBarStyle: {
                backgroundColor: '#fff',
                borderTopColor: '#ececf2',
                borderTopWidth: 1,
                paddingBottom: 5,
                paddingTop: 5,
                height: 60,
              },
              headerShown: false,
            }}
          >
            <Tab.Screen
              name="PokedexTab"
              component={PokedexTab}
              options={{
                title: 'Pokédex',
                tabBarIcon: () => <TabIcon emoji="📖" />,
              }}
            />
            <Tab.Screen
              name="HuntTab"
              component={HuntTab}
              options={{
                title: 'Hunt',
                tabBarIcon: () => <TabIcon emoji="🗺️" />,
              }}
            />
            <Tab.Screen
              name="ARCameraTab"
              component={ARCameraTab}
              options={{
                title: 'AR',
                tabBarIcon: () => <TabIcon emoji="📷" />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={{ fontSize: 24 }}>{emoji}</Text>
);

export default App;
