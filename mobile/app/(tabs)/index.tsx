import React from 'react';
import { useAuthStore } from '../../src/store/auth.store';
import ClientHomeScreen from '../../src/screens/client/HomeScreen';
import OperatorDashboardScreen from '../../src/screens/operator/OperatorDashboardScreen';

export default function IndexTab() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'OPERATOR') return <OperatorDashboardScreen />;
  return <ClientHomeScreen />;
}
