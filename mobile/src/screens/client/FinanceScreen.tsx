import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme';
import { Card, StatusBadge, Button } from '../../components/ui';
import { financeApi, aiApi } from '../../services/api';

export default function FinanceScreen() {
  const [charges, setCharges] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [explaining, setExplaining] = useState<string | null>(null);

  const loadCharges = async () => {
    try {
      const { data } = await financeApi.myCharges(filter);
      setCharges(data);
    } catch (err) {
      console.error(err);
    }
  };

  const explainCharge = async (chargeId: string) => {
    setExplaining(chargeId);
    try {
      const { data } = await aiApi.explainCharge(chargeId);
      Alert.alert('IA explica', data.explanation);
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar explicação');
    } finally {
      setExplaining(null);
    }
  };

  useEffect(() => { loadCharges(); }, [filter]);

  const totalPending = charges.filter(c => c.status === 'PENDING' || c.status === 'OVERDUE')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financeiro</Text>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total pendente</Text>
          <Text style={styles.totalValue}>R$ {totalPending.toFixed(2)}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {[
          { label: 'Todos', value: undefined },
          { label: 'Pendente', value: 'PENDING' },
          { label: 'Atrasado', value: 'OVERDUE' },
          { label: 'Pago', value: 'PAID' },
        ].map((f) => (
          <Button
            key={f.label}
            title={f.label}
            variant={filter === f.value ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>

      {/* Charges */}
      {charges.map((charge) => (
        <Card key={charge.id} style={styles.chargeCard}>
          <View style={styles.chargeHeader}>
            <Text style={styles.chargeDescription}>{charge.description}</Text>
            <StatusBadge status={charge.status} />
          </View>
          <View style={styles.chargeDetails}>
            <Text style={styles.chargeAmount}>R$ {charge.amount.toFixed(2)}</Text>
            <Text style={styles.chargeDue}>
              Vencimento: {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.chargeActions}>
            <Button
              title="🤖 IA Explica"
              variant="ghost"
              size="sm"
              onPress={() => explainCharge(charge.id)}
              loading={explaining === charge.id}
            />
            {charge.status !== 'PAID' && (
              <Button title="Pagar" variant="primary" size="sm" onPress={() => Alert.alert('Em breve', 'Pagamento via PIX em breve!')} />
            )}
          </View>
        </Card>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { padding: theme.spacing.lg, paddingTop: 60 },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    marginBottom: 16,
  },
  chargeCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: 10,
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chargeDescription: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  chargeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chargeAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  chargeDue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  chargeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 8,
  },
});
