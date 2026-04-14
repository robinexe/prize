import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { boatsApi } from '../../services/api';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  critical: boolean;
}

const defaultItems: ChecklistItem[] = [
  { id: '1', label: 'Nível de óleo verificado', checked: false, critical: true },
  { id: '2', label: 'Combustível abastecido', checked: false, critical: true },
  { id: '3', label: 'Casco sem avarias', checked: false, critical: true },
  { id: '4', label: 'Extintor presente e válido', checked: false, critical: true },
  { id: '5', label: 'Colete salva-vidas disponível', checked: false, critical: true },
  { id: '6', label: 'Bateria carregada', checked: false, critical: false },
  { id: '7', label: 'Luzes sinalizadoras funcionando', checked: false, critical: false },
  { id: '8', label: 'Limpeza interna/externa OK', checked: false, critical: false },
];

export default function ChecklistScreen() {
  const [items, setItems] = useState(defaultItems);
  const [boats, setBoats] = useState<any[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await boatsApi.list();
        const boatList = Array.isArray(data) ? data : data.data || [];
        setBoats(boatList);
        if (boatList.length > 0) setSelectedBoat(boatList[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const allCriticalChecked = items.filter((i) => i.critical).every((i) => i.checked);
  const progress = items.filter((i) => i.checked).length / items.length;

  const handleFinish = () => {
    Alert.alert('Check-list Concluído!', 'Embarcação liberada para descida.', [
      { text: 'OK', onPress: () => setItems(defaultItems) },
    ]);
  };

  const currentBoat = boats.find((b: any) => b.id === selectedBoat);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingTop: 60 }}>
        <Text style={styles.title}>Check-list</Text>
        <Text style={styles.subtitle}>{currentBoat?.name || 'Embarcação'} — Pré-descida</Text>
      </View>

      {boats.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {boats.map((b: any) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => { setSelectedBoat(b.id); setItems(defaultItems); }}
              style={[styles.boatPill, selectedBoat === b.id && styles.boatPillActive]}
            >
              <Text style={[styles.boatPillText, selectedBoat === b.id && { color: '#fff' }]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}% concluído</Text>
      </View>

      {/* Items */}
      {items.map((item) => (
        <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => toggle(item.id)}>
          <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
            {item.checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, item.checked && styles.itemChecked]}>{item.label}</Text>
            {item.critical && <Text style={styles.criticalTag}>Obrigatório</Text>}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, !allCriticalChecked && styles.submitBtnDisabled]}
        disabled={!allCriticalChecked}
        onPress={handleFinish}
      >
        <Text style={styles.submitBtnText}>
          {allCriticalChecked ? 'Finalizar Check-list' : 'Complete os itens obrigatórios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20, marginTop: 4 },
  progressCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: '#64748b', marginTop: 8, textAlign: 'center' },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  itemLabel: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  itemChecked: { textDecorationLine: 'line-through', color: '#94a3b8' },
  criticalTag: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  boatPill: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  boatPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  boatPillText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
});
