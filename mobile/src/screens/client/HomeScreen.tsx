import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Card, MetricCard, StatusBadge, Button } from '../../components/ui';
import { useAuthStore } from '../../store/auth.store';
import { reservationsApi, financeApi, queueApi, boatsApi } from '../../services/api';

export default function ClientHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    boats: [],
    nextReservation: null,
    pendingCharges: 0,
    queuePosition: null,
  });

  const loadData = async () => {
    try {
      const [boatsRes, reservationsRes, chargesRes, queueRes] = await Promise.all([
        boatsApi.myBoats(),
        reservationsApi.myReservations(true),
        financeApi.myCharges('PENDING'),
        queueApi.myPosition(),
      ]);

      setData({
        boats: boatsRes.data,
        nextReservation: reservationsRes.data?.[0] || null,
        pendingCharges: chargesRes.data?.length || 0,
        queuePosition: queueRes.data?.[0] || null,
      });
    } catch (err) {
      console.error('Error loading home data', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}! 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Metrics */}
      <View style={styles.metricsRow}>
        <MetricCard
          title="Minhas Cotas"
          value={data.boats.length}
          color={theme.colors.primary}
        />
        <MetricCard
          title="Pendências"
          value={data.pendingCharges}
          color={data.pendingCharges > 0 ? theme.colors.error : theme.colors.success}
        />
      </View>

      {/* Next Reservation */}
      {data.nextReservation && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Próxima Reserva</Text>
          <View style={styles.reservationInfo}>
            <Text style={styles.boatName}>{data.nextReservation.boat?.name}</Text>
            <StatusBadge status={data.nextReservation.status} />
          </View>
          <Text style={styles.reservationDate}>
            📅 {new Date(data.nextReservation.startDate).toLocaleDateString('pt-BR')} —{' '}
            {new Date(data.nextReservation.endDate).toLocaleDateString('pt-BR')}
          </Text>
        </Card>
      )}

      {/* Queue Position */}
      {data.queuePosition && (
        <Card style={[styles.section, { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }] as any} onPress={() => router.push('/queue')}>
          <Text style={styles.sectionTitle}>Fila de Descida</Text>
          <Text style={styles.queuePosition}>Posição #{data.queuePosition.position}</Text>
          <StatusBadge status={data.queuePosition.status} />
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/new-reservation')}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          <Text style={styles.quickActionText}>Nova Reserva</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/queue')}>
          <Ionicons name="list" size={28} color={theme.colors.secondary} />
          <Text style={styles.quickActionText}>Fila</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications" size={28} color={theme.colors.warning} />
          <Text style={styles.quickActionText}>Avisos</Text>
        </TouchableOpacity>
      </View>

      {/* My Boats */}
      <Text style={styles.sectionHeader}>Minhas Embarcações</Text>
      {data.boats.map((boat: any) => (
        <Card key={boat.id} style={styles.boatCard}>
          <View style={styles.boatRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.boatName}>{boat.name}</Text>
              <Text style={styles.boatModel}>{boat.model} • {boat.year}</Text>
            </View>
            <StatusBadge status={boat.status} />
          </View>
        </Card>
      ))}

      {data.boats.length === 0 && (
        <Card>
          <Text style={styles.emptyText}>Nenhuma embarcação vinculada</Text>
        </Card>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  date: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.spacing.md,
    marginTop: -20,
  },
  section: { marginHorizontal: theme.spacing.md, marginBottom: 12 },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginTop: 16,
    marginBottom: 12,
  },
  reservationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  boatName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  boatModel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  reservationDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  queuePosition: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  boatCard: { marginHorizontal: theme.spacing.md, marginBottom: 10 },
  boatRow: { flexDirection: 'row', alignItems: 'center' },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    marginTop: 16,
    marginBottom: 8,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    width: 100,
    ...theme.shadow.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    marginTop: 6,
    textAlign: 'center',
  },
});
