'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Mail, Ban, Clock, DollarSign, UserX, Send } from 'lucide-react';
import { getCharges, processDelinquency } from '@/services/api';

interface Delinquent {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalDebt: number;
  overdueCharges: number;
  oldestDue: string;
  daysOverdue: number;
  status: string;
  lastContact: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  NEW: { label: 'Novo', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', icon: Clock },
  NOTIFIED: { label: 'Notificado', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400', icon: Send },
  BLOCKED: { label: 'Bloqueado', color: 'bg-red-500/15 text-red-600 dark:text-red-400', icon: Ban },
  NEGOTIATING: { label: 'Em Negociação', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400', icon: Phone },
};

export default function DelinquencyPage() {
  const [filter, setFilter] = useState('all');
  const [delinquents, setDelinquents] = useState<Delinquent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getCharges({ status: 'OVERDUE' });
        const charges = Array.isArray(data) ? data : data.data || [];
        // Group overdue charges by user
        const byUser: Record<string, Delinquent> = {};
        for (const c of charges) {
          const userName = c.userName || c.user?.name || 'Desconhecido';
          const userId = c.userId || c.user?.id || c.id;
          if (!byUser[userId]) {
            byUser[userId] = {
              id: userId,
              name: userName,
              email: c.user?.email || c.email || '',
              phone: c.user?.phone || c.phone || '',
              totalDebt: 0,
              overdueCharges: 0,
              oldestDue: c.dueDate,
              daysOverdue: Math.floor((Date.now() - new Date(c.dueDate).getTime()) / 86400000),
              status: 'NEW',
              lastContact: null,
            };
          }
          byUser[userId].totalDebt += c.amount || 0;
          byUser[userId].overdueCharges += 1;
          if (c.dueDate < byUser[userId].oldestDue) {
            byUser[userId].oldestDue = c.dueDate;
            byUser[userId].daysOverdue = Math.floor((Date.now() - new Date(c.dueDate).getTime()) / 86400000);
          }
        }
        setDelinquents(Object.values(byUser));
      } catch {
        setDelinquents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalDebt = delinquents.reduce((sum, d) => sum + d.totalDebt, 0);
  const filtered = delinquents.filter((d) => filter === 'all' || d.status === filter);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-th flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            Inadimplência
          </h1>
          <p className="text-th-muted text-sm mt-1">{delinquents.length} clientes inadimplentes</p>
        </div>
        <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-600 transition text-sm">
          <Send size={16} />
          Notificar Todos
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <DollarSign size={20} className="text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totalDebt)}</p>
          <p className="text-xs text-red-500 mt-1">Total em débito</p>
        </div>
        <div className="bg-th-card border border-th rounded-2xl p-5 shadow-black/10">
          <UserX size={20} className="text-th-muted mb-2" />
          <p className="text-2xl font-bold text-th">{delinquents.filter((d) => d.status === 'BLOCKED').length}</p>
          <p className="text-xs text-th-muted mt-1">Bloqueados</p>
        </div>
        <div className="bg-th-card border border-th rounded-2xl p-5 shadow-black/10">
          <Clock size={20} className="text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-th">{delinquents.length ? Math.max(...delinquents.map((d) => d.daysOverdue)) : 0} dias</p>
          <p className="text-xs text-th-muted mt-1">Maior atraso</p>
        </div>
        <div className="bg-th-card border border-th rounded-2xl p-5 shadow-black/10">
          <Phone size={20} className="text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-th">{delinquents.filter((d) => d.status === 'NEGOTIATING').length}</p>
          <p className="text-xs text-th-muted mt-1">Em negociação</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'NEW', 'NOTIFIED', 'BLOCKED', 'NEGOTIATING'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === s ? 'bg-red-500 text-white' : 'bg-th-surface text-th-secondary hover:bg-primary-500/10'
            }`}
          >
            {s === 'all' ? 'Todos' : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Delinquent Cards */}
      <div className="space-y-4">
        {filtered
          .sort((a, b) => b.daysOverdue - a.daysOverdue)
          .map((d) => {
            const sc = statusConfig[d.status] || { label: d.status, color: 'bg-th-surface text-th-secondary', icon: AlertTriangle };
            const Icon = sc.icon;
            return (
              <div key={d.id} className="bg-th-card rounded-2xl shadow-black/10 border border-th p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${d.daysOverdue > 60 ? 'bg-red-100' : d.daysOverdue > 30 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                      <AlertTriangle className={`${d.daysOverdue > 60 ? 'text-red-500' : d.daysOverdue > 30 ? 'text-yellow-500' : 'text-blue-500'}`} size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-th">{d.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-th-muted flex items-center gap-1">
                          <Mail size={12} /> {d.email}
                        </span>
                        <span className="text-xs text-th-muted flex items-center gap-1">
                          <Phone size={12} /> {d.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(d.totalDebt)}</p>
                      <p className="text-xs text-th-muted">{d.overdueCharges} cobranças</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-th">{d.daysOverdue}d</p>
                      <p className="text-xs text-th-muted">em atraso</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${sc.color}`}>
                      <Icon size={14} />
                      {sc.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-blue-500/10 rounded-lg transition" title="Enviar notificação">
                        <Send size={16} className="text-blue-500" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition" title="Bloquear">
                        <Ban size={16} className="text-red-400" />
                      </button>
                      <button className="p-2 hover:bg-green-500/10 rounded-lg transition" title="Ligar">
                        <Phone size={16} className="text-green-500" />
                      </button>
                    </div>
                  </div>
                </div>
                {d.lastContact && (
                  <p className="text-xs text-th-muted mt-3">
                    Último contato: {new Date(d.lastContact + 'T12:00:00').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </p>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
