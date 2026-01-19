import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FinanceRecord } from '@/types/financial';
import { format, parseISO, subMonths, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';

interface MonthlyComparisonChartProps {
  data: FinanceRecord[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();

    // Generate structure for last 6 months
    const months: { month: string; monthLabel: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'yyyy-MM');
      months.push({
        month: monthKey,
        monthLabel: format(date, 'MMM/yy', { locale: ptBR }),
        entradas: 0,
        saidas: 0,
      });
    }

    // Aggregate data into months
    data.forEach((record) => {
      try {
        if (!record.dataComprovante) return;

        const recordDate = parseISO(record.dataComprovante);

        // Validar se a data é válida
        if (!isValid(recordDate)) return;

        const monthKey = format(recordDate, 'yyyy-MM');
        const monthEntry = months.find((m) => m.month === monthKey);

        if (monthEntry) {
          if (record.tipo === 'entrada') {
            monthEntry.entradas += record.valor;
          } else {
            monthEntry.saidas += record.valor;
          }
        }
      } catch {
        // Skip invalid dates
      }
    });

    // Filter to only show months that have data or are recent (last 3 months always shown)
    const hasAnyData = months.some((m) => m.entradas > 0 || m.saidas > 0);
    if (!hasAnyData) {
      return months.slice(-3); // Show last 3 months if no data
    }

    // Find first month with data and show from there
    const firstMonthWithData = months.findIndex((m) => m.entradas > 0 || m.saidas > 0);
    return months.slice(Math.max(0, firstMonthWithData));
  }, [data]);

  const chartWidth = Math.max(100, chartData.length * 100);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2 capitalize">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
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
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[400px] opacity-0 animate-fade-up" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Comparativo Mensal</h3>
      
      {chartData.length === 0 ? (
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-muted-foreground gap-3">
          <BarChart3 className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide" style={{ height: 'calc(100% - 40px)' }}>
          <div style={{ width: `${chartWidth}px`, minWidth: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2} barCategoryGap="15%" margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
                <Bar 
                  dataKey="entradas" 
                  name="Entradas" 
                  fill="hsl(var(--success))" 
                  radius={[3, 3, 0, 0]}
                  maxBarSize={30}
                />
                <Bar 
                  dataKey="saidas" 
                  name="Saídas" 
                  fill="hsl(var(--destructive))" 
                  radius={[3, 3, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
