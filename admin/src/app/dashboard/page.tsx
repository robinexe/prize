'use client';

import { useEffect, useState } from 'react';
import {
  Users, Ship, Wallet, AlertTriangle,
  TrendingUp, Sparkles,
} from 'lucide-react';
import { getFinanceDashboard, getUsers, getBoats, getAiInsights } from '@/services/api';
import AdminWeatherCard from '@/components/AdminWeatherCard';

interface DashboardData {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingCharges: number;
  overdueCharges: number;
  activeDelinquents: number;
  totalUsers: number;
  totalBoats: number;
  todayReservations: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [finRes, usersRes, boatsRes] = await Promise.all([
          getFinanceDashboard().catch(() => ({ data: {} })),
          getUsers({ limit: 1 }).catch(() => ({ data: { total: 0 } })),
          getBoats({ limit: 1 }).catch(() => ({ data: { total: 0 } })),
        ]);
        const fin = finRes.data;
        setData({
          totalRevenue: fin.totalRevenue || 0,
          monthlyRevenue: fin.monthlyRevenue || 0,
          pendingCharges: fin.pendingCharges || 0,
          overdueCharges: fin.overdueCharges || 0,
          activeDelinquents: fin.activeDelinquents || 0,
          totalUsers: usersRes.data?.total ?? usersRes.data?.length ?? 0,
          totalBoats: boatsRes.data?.total ?? boatsRes.data?.length ?? 0,
          todayReservations: fin.todayReservations || 0,
        });
      } catch {
        setData({ totalRevenue: 0, monthlyRevenue: 0, pendingCharges: 0, overdueCharges: 0, activeDelinquents: 0, totalUsers: 0, totalBoats: 0, todayReservations: 0 });
      }
    }
    load();
  }, []);

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data } = await getAiInsights();
      setAiInsights(typeof data === 'string' ? data : data.insights || data.content || JSON.stringify(data));
    } catch {
      setAiInsights('Não foi possível gerar insights no momento.');
    } finally {
      setLoadingInsights(false);
    }
  };

  if (!data) return <div className="animate-pulse">Carregando...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-th">Dashboard</h1>
          <p className="text-th-muted text-sm mt-1">
            Visão geral da marina — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}
          </p>
        </div>
        <button
          onClick={handleGenerateInsights}
          disabled={loadingInsights}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-orange-400 text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm"
        >
          <Sparkles size={18} />
          {loadingInsights ? 'Gerando...' : 'IA Insights'}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard
          icon={<Wallet className="text-primary-500" />}
          title="Receita Mensal"
          value={`R$ ${data.monthlyRevenue.toLocaleString('pt-BR')}`}
          change="+12%"
          positive
        />
        <MetricCard
          icon={<AlertTriangle className="text-red-400" />}
          title="Inadimplentes"
          value={data.activeDelinquents.toString()}
          change={`${data.overdueCharges} cobranças atrasadas`}
          positive={false}
        />
        <MetricCard
          icon={<Users className="text-blue-400" />}
          title="Clientes Ativos"
          value={data.totalUsers?.toString() || '0'}
          change=""
          positive
        />
        <MetricCard
          icon={<Ship className="text-green-400" />}
          title="Embarcações"
          value={data.totalBoats?.toString() || '0'}
          change={`${data.todayReservations} reservas hoje`}
          positive
        />
      </div>

      {/* Weather Card */}
      <div className="mb-8">
        <AdminWeatherCard />
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-th-card rounded-2xl border border-th p-6">
          <h3 className="font-bold text-th mb-4">Receita Mensal</h3>
          <div className="h-64 flex items-center justify-center text-th-muted">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-2" />
              <p>Gráfico de receita (Recharts)</p>
              <p className="text-sm">Conectar ao endpoint /finance/dashboard</p>
            </div>
          </div>
        </div>

        <div className="bg-th-card rounded-2xl border border-th p-6">
          <h3 className="font-bold text-th mb-4">Status Rápido</h3>
          <div className="space-y-4">
            <StatusItem label="Cobranças Pendentes" value={data.pendingCharges} color="yellow" />
            <StatusItem label="Cobranças Atrasadas" value={data.overdueCharges} color="red" />
            <StatusItem label="Reservas Hoje" value={data.todayReservations || 0} color="blue" />
            <StatusItem label="Inadimplentes" value={data.activeDelinquents} color="red" />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="bg-th-card rounded-2xl border border-th p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-primary-400" />
            <h3 className="font-bold text-th">Insights da IA</h3>
          </div>
          <div className="whitespace-pre-wrap text-th-secondary text-sm leading-relaxed">{aiInsights}</div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, title, value, change, positive }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-th-card rounded-2xl border border-th p-6 hover:border-th transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-th-card/5 rounded-2xl">{icon}</div>
        <span className="text-sm text-th-muted font-medium">{title}</span>
      </div>
      <p className="text-2xl font-black text-th">{value}</p>
      <p className={`text-sm mt-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>{change}</p>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-th-secondary">{label}</span>
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
}
