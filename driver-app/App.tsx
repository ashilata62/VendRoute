import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home, Map, MapPin, History, User } from 'lucide-react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RouteScreen from './src/screens/RouteScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StopDetailsScreen from './src/screens/StopDetailsScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RouteStack = createNativeStackNavigator();

function RouteStackNavigator() {
  return (
    <RouteStack.Navigator screenOptions={{ headerShown: false }}>
      <RouteStack.Screen name="DashboardList" component={RouteScreen} />
      <RouteStack.Screen name="StopDetails" component={StopDetailsScreen} />
      <RouteStack.Screen name="QRScanner" component={QRScannerScreen} />
    </RouteStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') return <Home size={size} color={color} />;
            if (route.name === 'My Route') return <Map size={size} color={color} />;
            if (route.name === 'History') return <History size={size} color={color} />;
            if (route.name === 'Profile') return <User size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ef4444',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#0B1536',
            borderTopWidth: 1,
            borderTopColor: '#1e293b',
            paddingTop: 5,
            minHeight: 65,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 5,
          }
        })}
      >
        <Tab.Screen name="Home" component={DashboardScreen} />
        <Tab.Screen name="My Route" component={RouteStackNavigator} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
  );
}

const queryClient = new QueryClient();

export default function App() {
  const isAuthenticated = useAuthStore((state) => !!state.token);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#0B1536" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Main" component={TabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
