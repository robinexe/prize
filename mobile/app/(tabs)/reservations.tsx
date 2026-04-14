import React from 'react';
import { useAuthStore } from '../../src/store/auth.store';
import CalendarScreen from '../../src/screens/client/CalendarScreen';
import ChecklistScreen from '../../src/screens/operator/ChecklistScreen';

export default function ReservationsTab() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'OPERATOR') return <ChecklistScreen />;
  return <CalendarScreen />;
}
