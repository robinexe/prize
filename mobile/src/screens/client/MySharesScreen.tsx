import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { boatsApi } from '../../services/api';

export default function MySharesScreen() {
  const router = useRouter();
  const [boats, setBoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBoats = async () => {
    try {
      const { data } = await boatsApi.myBoats();
      setBoats(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error loading boats:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBoats();
    setRefreshing(false);
  };

  useEffect(() => { loadBoats(); }, []);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <View style={{ paddingTop: 60 }}>
        <Text style={styles.title}>Minhas Cotas</Text>
        <Text style={styles.subtitle}>Suas participações em embarcações</Text>
      </View>

      {boats.map((boat: any) => (
        <View key={boat.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.boatName}>{boat.name}</Text>
            <View style={[styles.badge, boat.status === 'AVAILABLE' ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, boat.status !== 'AVAILABLE' && { color: '#64748b' }]}>
                {boat.status === 'AVAILABLE' ? 'Disponível' : boat.status === 'MAINTENANCE' ? 'Manutenção' : boat.status}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Modelo</Text>
              <Text style={styles.infoValue}>{boat.model || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ano</Text>
              <Text style={styles.infoValue}>{boat.year || '—'}</Text>
            </View>
          </View>

          {boat.capacity && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Capacidade</Text>
                <Text style={styles.infoValue}>{boat.capacity} pessoas</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Registro</Text>
                <Text style={styles.infoValue}>{boat.registration || '—'}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.reserveButton}
            onPress={() => router.push('/new-reservation')}
          >
            <Text style={styles.reserveButtonText}>Fazer Reserva</Text>
          </TouchableOpacity>
        </View>
      ))}

      {boats.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🚤</Text>
          <Text style={styles.emptyTitle}>Nenhuma embarcação</Text>
          <Text style={styles.emptySubtitle}>Você ainda não possui cotas em embarcações</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  boatName: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeInactive: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  reserveButton: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  reserveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
});
