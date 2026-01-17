import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FinanceRecord } from '@/types/financial';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

// Helper para formatar data de forma segura
const safeFormatDate = (dateStr: string, formatStr: string, options?: any): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, formatStr, options);
  } catch {
    return dateStr;
  }
};

interface EvolutionLineChartProps {
  data: FinanceRecord[];
}

export function EvolutionLineChart({ data }: EvolutionLineChartProps) {
  // Group data by date
  const dateGroups = data.reduce((acc, record) => {
    const date = record.dataComprovante;
    if (!date) return acc;
    if (!acc[date]) {
      acc[date] = { entradas: 0, saidas: 0 };
    }
    if (record.tipo === 'entrada') {
      acc[date].entradas += record.valor;
    } else {
      acc[date].saidas += record.valor;
    }
    return acc;
  }, {} as Record<string, { entradas: number; saidas: number }>);

  const chartData = Object.entries(dateGroups)
    .map(([date, values]) => ({
      date,
      entradas: values.entradas,
      saidas: values.saidas,
      saldo: values.entradas - values.saidas,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            {safeFormatDate(label, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}:</span>
              <span className="text-sm font-medium text-foreground">
                R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[400px] opacity-0 animate-fade-up" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Evolução Financeira</h3>
      
      {chartData.length === 0 ? (
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-muted-foreground gap-3">
          <TrendingUp className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhum dado no período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(value) => safeFormatDate(value, 'dd/MM')}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              stroke="hsl(var(--border))"
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-[10px] sm:text-xs text-muted-foreground capitalize">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="entradas"
              name="Entradas"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: '#22c55e', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              name="Saídas"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
