'use client';

export function RevenueChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const values = [32, 38, 41, 35, 42, 48, 52, 47, 44, 50, 54, 58];
  const max = Math.max(...values);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Receita Mensal (R$ mil)</h3>
      <div className="flex items-end gap-2 h-48">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{v}k</span>
            <div
              className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t"
              style={{ height: `${(v / max) * 100}%` }}
            />
            <span className="text-[10px] text-gray-500">{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsageChart() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const reservations = [3, 2, 4, 3, 6, 8, 7];
  const max = Math.max(...reservations);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Reservas por dia da semana</h3>
      <div className="flex items-end gap-3 h-40">
        {reservations.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">{v}</span>
            <div
              className="w-full bg-gradient-to-t from-secondary-500 to-blue-300 rounded-t"
              style={{ height: `${(v / max) * 100}%` }}
            />
            <span className="text-xs text-gray-500">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FuelChart() {
  const boats = ['Jet 01', 'Jet 02', 'Jet 03', 'Jet 04', 'Jet 05'];
  const liters = [320, 280, 410, 195, 350];
  const max = Math.max(...liters);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Consumo de Combustível (litros/mês)</h3>
      <div className="space-y-3">
        {boats.map((boat, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-16">{boat}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-primary-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${(liters[i] / max) * 100}%` }}
              >
                <span className="text-[10px] text-white font-bold">{liters[i]}L</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
