import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { theme } from '../../theme';
import { Card, MetricCard, StatusBadge, Button } from '../../components/ui';
import { queueApi, fuelApi } from '../../services/api';

export default function OperatorDashboardScreen() {
  const [queue, setQueue] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = async () => {
    try {
      const { data } = await queueApi.today();
      setQueue(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQueueStatus = async (id: string, status: string) => {
    try {
      await queueApi.updateStatus(id, status);
      await loadQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  useEffect(() => { loadQueue(); }, []);

  const waiting = queue.filter(q => q.status === 'WAITING').length;
  const inProgress = queue.filter(q => ['PREPARING', 'LAUNCHING', 'IN_WATER'].includes(q.status)).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Painel Operacional</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard title="Na Fila" value={waiting} color={theme.colors.warning} />
        <MetricCard title="Em Operação" value={inProgress} color={theme.colors.success} />
        <MetricCard title="Total Hoje" value={queue.length} color={theme.colors.secondary} />
      </View>

      <Text style={styles.sectionTitle}>Fila de Descida</Text>

      {queue.map((item) => (
        <Card key={item.id} style={styles.queueCard}>
          <View style={styles.queueHeader}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>#{item.position}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.boatName}>{item.boat?.name}</Text>
              <Text style={styles.clientName}>{item.client?.name}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>

          <View style={styles.queueActions}>
            {item.status === 'WAITING' && (
              <Button title="Preparar" variant="outline" size="sm" onPress={() => updateQueueStatus(item.id, 'PREPARING')} />
            )}
            {item.status === 'PREPARING' && (
              <Button title="Descer" variant="primary" size="sm" onPress={() => updateQueueStatus(item.id, 'LAUNCHING')} />
            )}
            {item.status === 'LAUNCHING' && (
              <Button title="Na Água" variant="primary" size="sm" onPress={() => updateQueueStatus(item.id, 'IN_WATER')} />
            )}
            {item.status === 'IN_WATER' && (
              <Button title="Retornando" variant="secondary" size="sm" onPress={() => updateQueueStatus(item.id, 'RETURNING')} />
            )}
            {item.status === 'RETURNING' && (
              <Button title="Concluir" variant="primary" size="sm" onPress={() => updateQueueStatus(item.id, 'COMPLETED')} />
            )}
          </View>
        </Card>
      ))}

      {queue.length === 0 && (
        <Card style={{ marginHorizontal: theme.spacing.md }}>
          <Text style={styles.emptyText}>Nenhuma operação na fila hoje</Text>
        </Card>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    backgroundColor: theme.colors.secondary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: theme.spacing.md,
    marginTop: -16,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    paddingHorizontal: theme.spacing.md,
    marginTop: 8,
    marginBottom: 12,
    color: theme.colors.text,
  },
  queueCard: { marginHorizontal: theme.spacing.md, marginBottom: 10 },
  queueHeader: { flexDirection: 'row', alignItems: 'center' },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  boatName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  clientName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  queueActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    padding: 20,
  },
});
