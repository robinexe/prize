import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme';

// ============================================
// BUTTON
// ============================================

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, icon }: ButtonProps) {
  const buttonStyles: ViewStyle[] = [styles.button, styles[`button_${variant}`], styles[`button_${size}`]];
  const textStyles: TextStyle[] = [styles.buttonText, styles[`text_${variant}`], styles[`text_${size}`]];

  if (disabled) buttonStyles.push(styles.buttonDisabled);

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <Text style={textStyles}>{loading ? 'Carregando...' : title}</Text>
    </TouchableOpacity>
  );
}

// ============================================
// CARD
// ============================================

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
      {children}
    </Wrapper>
  );
}

// ============================================
// BADGE
// ============================================

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>{label}</Text>
    </View>
  );
}

// ============================================
// STATUS INDICATOR
// ============================================

interface StatusProps {
  status: string;
}

const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmada', variant: 'success' },
  IN_USE: { label: 'Em uso', variant: 'info' },
  COMPLETED: { label: 'Concluída', variant: 'default' },
  CANCELLED: { label: 'Cancelada', variant: 'error' },
  PAID: { label: 'Pago', variant: 'success' },
  OVERDUE: { label: 'Atrasado', variant: 'error' },
  WAITING: { label: 'Na fila', variant: 'warning' },
  PREPARING: { label: 'Preparando', variant: 'info' },
  LAUNCHING: { label: 'Descendo', variant: 'info' },
  IN_WATER: { label: 'Na água', variant: 'success' },
  AVAILABLE: { label: 'Disponível', variant: 'success' },
  MAINTENANCE: { label: 'Manutenção', variant: 'warning' },
  BLOCKED: { label: 'Bloqueado', variant: 'error' },
};

export function StatusBadge({ status }: StatusProps) {
  const config = statusMap[status] || { label: status, variant: 'default' as const };
  return <Badge label={config.label} variant={config.variant} />;
}

// ============================================
// METRIC CARD
// ============================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricHeader}>
        {icon}
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </Card>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: theme.colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  button_md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  button_lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: theme.fontWeight.semibold,
  },
  text_primary: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.md,
  },
  text_secondary: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.md,
  },
  text_outline: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
  },
  text_ghost: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
  },
  text_sm: { fontSize: theme.fontSize.sm },
  text_md: { fontSize: theme.fontSize.md },
  text_lg: { fontSize: theme.fontSize.lg },

  // Card
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.md,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badge_default: { backgroundColor: theme.colors.surface },
  badge_success: { backgroundColor: '#D1FAE5' },
  badge_warning: { backgroundColor: '#FEF3C7' },
  badge_error: { backgroundColor: '#FEE2E2' },
  badge_info: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
  badgeText_default: { color: theme.colors.textSecondary },
  badgeText_success: { color: '#059669' },
  badgeText_warning: { color: '#D97706' },
  badgeText_error: { color: '#DC2626' },
  badgeText_info: { color: '#2563EB' },

  // Metric Card
  metricCard: {
    flex: 1,
    minWidth: 150,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  metricValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  metricSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
