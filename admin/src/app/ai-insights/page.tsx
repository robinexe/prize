'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { getAiInsights } from '@/services/api';

export default function AiInsightsPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data } = await getAiInsights();
      setInsights(typeof data === 'string' ? data : data.insights || data.content || JSON.stringify(data, null, 2));
      setGeneratedAt(new Date());
    } catch {
      setInsights('Não foi possível gerar insights no momento. Verifique se a chave de API do Gemini está configurada.');
      setGeneratedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-th flex items-center gap-2">
            <Sparkles className="text-primary-500" />
            IA Insights
          </h1>
          <p className="text-th-muted text-sm mt-1">
            Análise inteligente da operação da marina powered by Gemini
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-orange-400 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Analisando dados...' : 'Gerar Insights'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: TrendingUp, label: 'Receita Trend', value: '+12%', color: 'text-green-500' },
          { icon: AlertTriangle, label: 'Alertas', value: '5', color: 'text-red-500' },
          { icon: Target, label: 'Meta Atingida', value: '78%', color: 'text-blue-500' },
          { icon: Lightbulb, label: 'Sugestões', value: '4', color: 'text-yellow-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-th-card rounded-2xl p-5 border border-th shadow-black/10">
            <stat.icon className={`${stat.color} mb-2`} size={22} />
            <p className="text-2xl font-bold text-th">{stat.value}</p>
            <p className="text-xs text-th-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Insights Content */}
      {insights ? (
        <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-th">Análise Completa</h3>
            {generatedAt && (
              <span className="text-xs text-th-muted">
                Gerado em {generatedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            {insights.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return <h3 key={i} className="text-lg font-bold text-th mt-6 mb-2">{line.replace('## ', '')}</h3>;
              }
              if (line.startsWith('- **')) {
                const parts = line.replace('- **', '').split('**');
                return (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className="text-primary-500 mt-1">•</span>
                    <p className="text-sm text-th-secondary"><strong>{parts[0]}</strong>{parts[1]}</p>
                  </div>
                );
              }
              if (line.match(/^\d+\./)) {
                return <p key={i} className="text-sm text-th-secondary py-1 ml-4">{line}</p>;
              }
              if (line.trim()) {
                return <p key={i} className="text-sm text-th-secondary leading-relaxed">{line}</p>;
              }
              return <br key={i} />;
            })}
          </div>
        </div>
      ) : (
        <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-16 text-center">
          <Sparkles size={48} className="text-th-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-th-muted">Nenhum insight gerado ainda</h3>
          <p className="text-th-muted text-sm mt-2">
            Clique em &quot;Gerar Insights&quot; para que a IA analise os dados da marina
          </p>
        </div>
      )}
    </div>
  );
}
