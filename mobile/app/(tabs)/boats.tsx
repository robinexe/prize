import React from 'react';
import { useAuthStore } from '../../src/store/auth.store';
import MySharesScreen from '../../src/screens/client/MySharesScreen';
import QueueManagementScreen from '../../src/screens/operator/QueueManagementScreen';

export default function BoatsTab() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'OPERATOR') return <QueueManagementScreen />;
  return <MySharesScreen />;
}
