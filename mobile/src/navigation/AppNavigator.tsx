import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Client screens
import HomeScreen from '../screens/client/HomeScreen';
import MySharesScreen from '../screens/client/MySharesScreen';
import CalendarScreen from '../screens/client/CalendarScreen';
import NewReservationScreen from '../screens/client/NewReservationScreen';
import FinanceScreen from '../screens/client/FinanceScreen';
import QueueScreen from '../screens/client/QueueScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';
import AiAssistantScreen from '../screens/client/AiAssistantScreen';

// Operator screens
import OperatorDashboardScreen from '../screens/operator/OperatorDashboardScreen';
import ChecklistScreen from '../screens/operator/ChecklistScreen';
import FuelLogScreen from '../screens/operator/FuelLogScreen';
import QueueManagementScreen from '../screens/operator/QueueManagementScreen';

// Auth
import LoginScreen from '../screens/shared/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 65, paddingBottom: 8, borderTopWidth: 0, elevation: 10, shadowOpacity: 0.1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Shares" component={MySharesScreen} options={{ tabBarLabel: 'Cotas' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: 'Agenda' }} />
      <Tab.Screen name="Finance" component={FinanceScreen} options={{ tabBarLabel: 'Financeiro' }} />
      <Tab.Screen name="AI" component={AiAssistantScreen} options={{ tabBarLabel: 'IA' }} />
    </Tab.Navigator>
  );
}

function OperatorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 65, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard" component={OperatorDashboardScreen} options={{ tabBarLabel: 'Painel' }} />
      <Tab.Screen name="Queue" component={QueueManagementScreen} options={{ tabBarLabel: 'Fila' }} />
      <Tab.Screen name="Checklist" component={ChecklistScreen} options={{ tabBarLabel: 'Check-list' }} />
      <Tab.Screen name="Fuel" component={FuelLogScreen} options={{ tabBarLabel: 'Combustível' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const userRole = 'CLIENT'; // This would come from auth store

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ClientApp" component={ClientTabs} />
        <Stack.Screen name="OperatorApp" component={OperatorTabs} />
        <Stack.Screen name="NewReservation" component={NewReservationScreen} />
        <Stack.Screen name="QueueView" component={QueueScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
