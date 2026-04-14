import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { notificationsApi } from '../../services/api';

const typeConfig: Record<string, { emoji: string; bg: string }> = {
  RESERVATION: { emoji: '📅', bg: '#dbeafe' },
  FINANCE: { emoji: '💰', bg: '#dcfce7' },
  QUEUE: { emoji: '🚤', bg: '#fff7ed' },
  MAINTENANCE: { emoji: '🔧', bg: '#fef3c7' },
  SYSTEM: { emoji: 'ℹ️', bg: '#f1f5f9' },
  info: { emoji: 'ℹ️', bg: '#dbeafe' },
  warning: { emoji: '⚠️', bg: '#fef3c7' },
  success: { emoji: '✅', bg: '#dcfce7' },
  alert: { emoji: '🚨', bg: '#fee2e2' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationsApi.list();
      setNotifications(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadNotifications} tintColor={theme.colors.primary} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.title}>Notificações</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>Marcar todas lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.map((n: any) => {
        const config = typeConfig[n.type] || typeConfig.info;
        return (
          <TouchableOpacity key={n.id} style={[styles.card, !n.read && styles.unread]} onPress={() => !n.read && markAsRead(n.id)}>
            <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
              <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifMessage}>{n.message || n.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {!n.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        );
      })}

      {notifications.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🔔</Text>
          <Text style={styles.emptyText}>Nenhuma notificação</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  unread: { borderLeftWidth: 3, borderLeftColor: '#f97316' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  notifMessage: { fontSize: 13, color: '#64748b', marginTop: 2 },
  notifTime: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
