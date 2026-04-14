import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { boatsApi, reservationsApi } from '../../services/api';

export default function NewReservationScreen() {
  const router = useRouter();
  const [boats, setBoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await boatsApi.myBoats();
        setBoats(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedBoat || !startDate || !endDate) {
      Alert.alert('Atenção', 'Selecione a embarcação e as datas.');
      return;
    }

    setSubmitting(true);
    try {
      await reservationsApi.create({
        boatId: selectedBoat,
        startDate,
        endDate,
        notes: notes || undefined,
      });
      Alert.alert('Sucesso!', 'Sua reserva foi registrada.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao criar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nova Reserva</Text>
      <Text style={styles.subtitle}>Selecione a embarcação e as datas</Text>

      <Text style={styles.sectionTitle}>Embarcação</Text>
      {boats.map((boat: any) => {
        const available = boat.status === 'AVAILABLE';
        return (
          <TouchableOpacity
            key={boat.id}
            disabled={!available}
            onPress={() => setSelectedBoat(boat.id)}
            style={[
              styles.optionCard,
              selectedBoat === boat.id && styles.optionSelected,
              !available && styles.optionDisabled,
            ]}
          >
            <Text style={[styles.optionText, !available && { color: '#94a3b8' }]}>
              {boat.name} {boat.model ? `• ${boat.model}` : ''}
            </Text>
            {!available && <Text style={styles.unavailable}>{boat.status === 'MAINTENANCE' ? 'Manutenção' : 'Indisponível'}</Text>}
          </TouchableOpacity>
        );
      })}

      <Text style={styles.sectionTitle}>Data Início (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="2025-04-20"
        placeholderTextColor="#94a3b8"
        value={startDate}
        onChangeText={setStartDate}
      />

      <Text style={styles.sectionTitle}>Data Fim (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="2025-04-21"
        placeholderTextColor="#94a3b8"
        value={endDate}
        onChangeText={setEndDate}
      />

      <Text style={styles.sectionTitle}>Observações (opcional)</Text>
      <TextInput
        style={[styles.textInput, { minHeight: 80 }]}
        placeholder="Alguma observação especial?"
        placeholderTextColor="#94a3b8"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitBtnText}>{submitting ? 'Criando...' : 'Confirmar Reserva'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12, marginTop: 20 },
  optionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: '#fff7ed' },
  optionDisabled: { opacity: 0.5 },
  optionText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  unavailable: { fontSize: 12, color: '#ef4444', fontWeight: '500' },
  textInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', textAlignVertical: 'top' },
  submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
