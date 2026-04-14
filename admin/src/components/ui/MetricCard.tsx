'use client';

import { clsx } from 'clsx';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export function MetricCard({ icon, title, value, change, positive }: MetricCardProps) {
  return (
    <div className="bg-th-card rounded-2xl border border-th p-6 hover:border-th transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-th-surface flex items-center justify-center">{icon}</div>
        {change && (
          <span className={clsx('text-xs font-semibold px-2 py-1 rounded-lg', positive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10')}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-th">{value}</p>
      <p className="text-sm text-th-muted mt-1">{title}</p>
    </div>
  );
}
