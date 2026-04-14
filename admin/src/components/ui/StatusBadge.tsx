'use client';

interface StatusBadgeProps {
  status: string;
  map?: Record<string, { label: string; color: string }>;
}

const defaultMap: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativo', color: 'bg-green-500/15 text-green-400' },
  INACTIVE: { label: 'Inativo', color: 'bg-th-surface text-th-muted' },
  BLOCKED: { label: 'Bloqueado', color: 'bg-red-500/15 text-red-400' },
  PENDING: { label: 'Pendente', color: 'bg-yellow-500/15 text-yellow-400' },
  PAID: { label: 'Pago', color: 'bg-green-500/15 text-green-400' },
  OVERDUE: { label: 'Vencido', color: 'bg-red-500/15 text-red-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-th-surface text-th-muted' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-blue-500/15 text-blue-400' },
  IN_PROGRESS: { label: 'Em andamento', color: 'bg-orange-500/15 text-orange-400' },
  COMPLETED: { label: 'Concluído', color: 'bg-green-500/15 text-green-400' },
  MAINTENANCE: { label: 'Em manutenção', color: 'bg-yellow-500/15 text-yellow-400' },
  WAITING: { label: 'Aguardando', color: 'bg-blue-500/15 text-blue-400' },
  LAUNCHED: { label: 'Lançada', color: 'bg-green-500/15 text-green-400' },
  RETRIEVED: { label: 'Recolhida', color: 'bg-th-surface text-th-muted' },
};

export function StatusBadge({ status, map }: StatusBadgeProps) {
  const config = (map || defaultMap)[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
