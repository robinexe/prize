import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { theme } from '../../theme';
import { queueApi } from '../../services/api';
import { StatusBadge } from '../../components/ui';

const statusActions: Record<string, { next: string; label: string; color: string }> = {
  WAITING: { next: 'PREPARING', label: 'Preparar', color: '#2563eb' },
  PREPARING: { next: 'LAUNCHING', label: 'Iniciar Descida', color: '#7c3aed' },
  LAUNCHING: { next: 'IN_WATER', label: 'Na Água', color: '#16a34a' },
  IN_WATER: { next: 'RETURNING', label: 'Recolher', color: '#f97316' },
  RETURNING: { next: 'COMPLETED', label: 'Finalizar', color: '#64748b' },
};

export default function OperatorQueueScreen() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const { data } = await queueApi.today();
      setQueue(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await queueApi.updateStatus(id, status);
      await loadQueue();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao atualizar');
    }
  };

  useEffect(() => { loadQueue(); }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadQueue} tintColor={theme.colors.primary} />}
    >
      <View style={{ paddingTop: 60 }}>
        <Text style={styles.title}>Fila de Descida</Text>
        <Text style={styles.subtitle}>Gerencie a fila de embarcações</Text>
      </View>

      {queue.map((item: any) => {
        const action = statusActions[item.status];
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{item.position}º</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.boatName}>{item.boat?.name || 'Embarcação'}</Text>
                <Text style={styles.ownerName}>{item.user?.name || item.client?.name || ''}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            {action && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: action.color }]}
                onPress={() => updateStatus(item.id, action.next)}
              >
                <Text style={styles.actionBtnText}>{action.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {queue.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🚤</Text>
          <Text style={styles.emptyText}>Nenhuma embarcação na fila</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  positionBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  positionText: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  boatName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  ownerName: { fontSize: 13, color: '#64748b', marginTop: 2 },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
