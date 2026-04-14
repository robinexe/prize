'use client';

import { useEffect, useState } from 'react';
import { Wind, Thermometer, Droplets, Cloud, RefreshCw, Calendar, CloudRain, Sun, CloudSun, CloudLightning, Umbrella } from 'lucide-react';
import { getWeatherCurrent, getWeatherForecast, triggerWeatherCollection } from '@/services/api';

interface WeatherData {
  id: string;
  collectedAt: string;
  windSpeed: number | null;
  windDirection: number | null;
  airTemperature: number | null;
  cloudCover: number | null;
  humidity: number | null;
  precipitation: number | null;
  navigationLevel: 'BOM' | 'ATENCAO' | 'RUIM' | 'PERIGOSO';
  navigationScore: number;
  operatorSummary: string | null;
  clientSummary: string | null;
}

interface ForecastDay {
  date: string;
  dayOfWeek: string;
  navigationLevel: 'BOM' | 'ATENCAO' | 'RUIM' | 'PERIGOSO';
  navigationScore: number;
  windSpeedMin: number;
  windSpeedMax: number;
  airTempMin: number;
  airTempMax: number;
  clientSummary: string;
  humidity?: number;
  cloudiness?: number;
  rain?: number;
  rainProbability?: number;
  description?: string;
  condition?: string;
}

type NavLevel = 'BOM' | 'ATENCAO' | 'RUIM' | 'PERIGOSO';

const levelConfig = {
  BOM: { label: 'Bom', color: 'from-emerald-500 to-green-400', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500', icon: '☀️' },
  ATENCAO: { label: 'Atenção', color: 'from-amber-500 to-yellow-400', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', dot: 'bg-amber-500', icon: '⚠️' },
  RUIM: { label: 'Ruim', color: 'from-orange-500 to-red-400', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', dot: 'bg-orange-500', icon: '🌊' },
  PERIGOSO: { label: 'Perigoso', color: 'from-red-600 to-red-500', bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500', icon: '🚫' },
};

function conditionIcon(condition?: string): React.ReactNode {
  switch (condition) {
    case 'clear_day': return <Sun size={18} className="text-amber-400" />;
    case 'clear_night': return <Sun size={18} className="text-indigo-400" />;
    case 'cloud': return <Cloud size={18} className="text-slate-400" />;
    case 'cloudly_day':
    case 'cloudly_night': return <CloudSun size={18} className="text-slate-400" />;
    case 'rain': return <CloudRain size={18} className="text-blue-400" />;
    case 'storm': return <CloudLightning size={18} className="text-purple-400" />;
    default: return <Cloud size={18} className="text-slate-400" />;
  }
}

function windDirLabel(deg: number | null): string {
  if (deg == null) return '-';
  const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export default function AdminWeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const load = async () => {
    try {
      const [currentRes, forecastRes] = await Promise.all([
        getWeatherCurrent(),
        getWeatherForecast(),
      ]);
      if (currentRes.data.ok && currentRes.data.data) setWeather(currentRes.data.data);
      if (forecastRes.data.ok && forecastRes.data.data) setForecast(forecastRes.data.data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerWeatherCollection();
      await load();
    } catch { /* silent */ }
    setTriggering(false);
  };

  if (loading) {
    return (
      <div className="bg-th-card rounded-2xl border border-th p-6 animate-pulse">
        <div className="h-5 bg-th-muted/20 rounded w-1/3 mb-3" />
        <div className="h-4 bg-th-muted/20 rounded w-2/3" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-th-card rounded-2xl border border-th p-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-th">Clima — Cabo Frio</h3>
          <button onClick={handleTrigger} disabled={triggering}
            className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline">
            <RefreshCw size={12} className={triggering ? 'animate-spin' : ''} />
            Coletar agora
          </button>
        </div>
        <p className="text-th-muted text-sm mt-2">Nenhum dado disponível. Clique em &quot;Coletar agora&quot;.</p>
      </div>
    );
  }

  const cfg = levelConfig[weather.navigationLevel];
  const windKmh = weather.windSpeed != null ? (weather.windSpeed * 3.6).toFixed(1) : '-';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const futureForecast = forecast.filter((d) => d.date > today);

  return (
    <div className={`bg-th-card rounded-2xl border ${cfg.border} overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.color} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <p className="text-white font-bold text-sm">Cabo Frio — Praia do Forte</p>
            <p className="text-white/70 text-xs">Atualizado às {formatTime(weather.collectedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white font-bold text-xs">{cfg.label.toUpperCase()}</span>
          </div>
          <button onClick={handleTrigger} disabled={triggering}
            className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 hover:bg-white/30 transition-colors">
            <RefreshCw size={14} className={`text-white ${triggering ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Current conditions */}
      <div className="p-5">
        {/* Summary */}
        {weather.clientSummary && (
          <p className="text-sm text-th-secondary mb-4">{weather.clientSummary}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Thermometer size={14} />} label="Temperatura" value={`${weather.airTemperature?.toFixed(0) ?? '-'}°C`} cfg={cfg} />
          <Stat icon={<Wind size={14} />} label="Vento" value={`${windKmh} km/h`} sub={windDirLabel(weather.windDirection)} cfg={cfg} />
          <Stat icon={<Droplets size={14} />} label="Umidade" value={`${weather.humidity?.toFixed(0) ?? '-'}%`} cfg={cfg} />
          <Stat icon={<CloudRain size={14} />} label="Chuva" value={`${weather.precipitation?.toFixed(1) ?? '0'}mm`} cfg={cfg} />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-th-muted">
          <Cloud size={12} /> Nebulosidade: {weather.cloudCover?.toFixed(0) ?? '-'}%
          <span className="mx-1">•</span>
          Score: {weather.navigationScore}/100
        </div>

        {/* Forecast */}
        {futureForecast.length > 0 && (
          <div className="mt-4 pt-4 border-t border-th">
            <div className="flex items-center gap-1.5 mb-3">
              <Calendar size={14} className="text-th-muted" />
              <h4 className="text-sm font-bold text-th">Previsão Próximos Dias</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {futureForecast.map((day) => {
                const dcfg = levelConfig[day.navigationLevel];
                return (
                  <div key={day.date} className={`${dcfg.bg} rounded-xl p-3 border ${dcfg.border}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${dcfg.dot}`} />
                        <span className="text-sm font-bold text-th">{day.dayOfWeek}</span>
                        <span className="text-xs text-th-muted">
                          {new Date(day.date + 'T12:00:00-03:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${dcfg.text}`}>{dcfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      {conditionIcon(day.condition)}
                      <p className="text-[11px] text-th-muted">{day.description || day.clientSummary}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      <div>
                        <p className="text-[9px] text-th-muted">Temp</p>
                        <p className="text-xs font-semibold text-th">{day.airTempMin}–{day.airTempMax}°C</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-th-muted">Vento</p>
                        <p className="text-xs font-semibold text-th">{day.windSpeedMin}km/h</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-th-muted">Chuva</p>
                        <p className="text-xs font-semibold text-th">{day.rainProbability ?? 0}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-th-muted">Umidade</p>
                        <p className="text-xs font-semibold text-th">{day.humidity ?? '-'}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, cfg }: { icon: React.ReactNode; label: string; value: string; sub?: string; cfg: { bg: string; text: string } }) {
  return (
    <div className={`${cfg.bg} rounded-xl p-3`}>
      <div className={`${cfg.text} mb-1`}>{icon}</div>
      <p className="text-[10px] text-th-muted">{label}</p>
      <p className={`text-sm font-bold ${cfg.text}`}>{value}</p>
      {sub && <p className="text-[10px] text-th-muted">{sub}</p>}
    </div>
  );
}
