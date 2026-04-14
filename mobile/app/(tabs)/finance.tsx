import React from 'react';
import { useAuthStore } from '../../src/store/auth.store';
import FinanceScreen from '../../src/screens/client/FinanceScreen';
import FuelLogScreen from '../../src/screens/operator/FuelLogScreen';

export default function FinanceTab() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'OPERATOR') return <FuelLogScreen />;
  return <FinanceScreen />;
}
