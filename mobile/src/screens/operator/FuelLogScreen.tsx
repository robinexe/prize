import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { boatsApi, fuelApi } from '../../services/api';

export default function FuelLogScreen() {
  const [boats, setBoats] = useState<any[]>([]);
  const [selectedBoat, setSelectedBoat] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [hourMeter, setHourMeter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await boatsApi.list();
        setBoats(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedBoat || !liters) {
      Alert.alert('Atenção', 'Selecione a embarcação e informe os litros.');
      return;
    }

    setSubmitting(true);
    try {
      await fuelApi.log({
        boatId: selectedBoat,
        liters: parseFloat(liters),
        pricePerLiter: cost ? parseFloat(cost) / parseFloat(liters) : undefined,
        hourMeter: hourMeter ? parseFloat(hourMeter) : undefined,
      });
      Alert.alert('Sucesso', `${liters}L registrados com sucesso!`);
      setLiters('');
      setCost('');
      setHourMeter('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao registrar');
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
      <View style={{ paddingTop: 60 }}>
        <Text style={styles.title}>Lançar Combustível</Text>
        <Text style={styles.subtitle}>Registre o abastecimento</Text>
      </View>

      <Text style={styles.label}>Embarcação</Text>
      {boats.map((b: any) => (
        <TouchableOpacity
          key={b.id}
          onPress={() => setSelectedBoat(b.id)}
          style={[styles.boatOption, selectedBoat === b.id && styles.boatSelected]}
        >
          <Text style={styles.boatText}>{b.name} {b.model ? `• ${b.model}` : ''}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Litros</Text>
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 45" value={liters} onChangeText={setLiters} placeholderTextColor="#94a3b8" />

      <Text style={styles.label}>Custo Total (R$)</Text>
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 315.00" value={cost} onChangeText={setCost} placeholderTextColor="#94a3b8" />

      <Text style={styles.label}>Horímetro (opcional)</Text>
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 1250" value={hourMeter} onChangeText={setHourMeter} placeholderTextColor="#94a3b8" />

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitBtnText}>{submitting ? 'Registrando...' : 'Registrar Abastecimento'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  boatOption: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 2, borderColor: 'transparent' },
  boatSelected: { borderColor: theme.colors.primary, backgroundColor: '#fff7ed' },
  boatText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
