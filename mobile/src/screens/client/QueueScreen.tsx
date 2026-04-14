import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { queueApi } from '../../services/api';
import { StatusBadge } from '../../components/ui';

export default function QueueScreen() {
  const [queue, setQueue] = useState<any[]>([]);
  const [myPosition, setMyPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [queueRes, posRes] = await Promise.all([
        queueApi.today(),
        queueApi.myPosition(),
      ]);
      setQueue(Array.isArray(queueRes.data) ? queueRes.data : queueRes.data?.data || []);
      const pos = Array.isArray(posRes.data) ? posRes.data[0] : posRes.data;
      setMyPosition(pos || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadData} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.title}>Fila de Descida</Text>
      <Text style={styles.subtitle}>Acompanhe sua posição na fila</Text>

      {myPosition && (
        <View style={styles.myPositionCard}>
          <Text style={styles.myPositionLabel}>Sua posição</Text>
          <Text style={styles.myPositionNumber}>{myPosition.position}º</Text>
          <StatusBadge status={myPosition.status} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Fila atual</Text>
      {queue.map((item: any) => (
        <View key={item.id} style={styles.queueCard}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{item.position}º</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.queueBoat}>{item.boat?.name || 'Embarcação'}</Text>
            <Text style={styles.queueClient}>{item.user?.name || ''}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      ))}

      {queue.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma embarcação na fila agora</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 4 },
  myPositionCard: { backgroundColor: theme.colors.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  myPositionLabel: { color: '#fff', fontSize: 14, opacity: 0.8 },
  myPositionNumber: { color: '#fff', fontSize: 48, fontWeight: '800', marginVertical: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  queueCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  positionBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  positionText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  queueBoat: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  queueClient: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 30, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
