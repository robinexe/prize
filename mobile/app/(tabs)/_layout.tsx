import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth.store';

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const isOperator = user?.role === 'OPERATOR';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: theme.colors.border,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isOperator ? 'Painel' : 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isOperator ? 'grid' : 'home'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="boats"
        options={{
          title: isOperator ? 'Fila' : 'Cotas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isOperator ? 'list' : 'boat'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: isOperator ? 'Check-list' : 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isOperator ? 'checkbox' : 'calendar'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: isOperator ? 'Combustível' : 'Financeiro',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isOperator ? 'speedometer' : 'wallet'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'IA',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
