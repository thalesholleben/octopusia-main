import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FinanceRecord } from '@/types/financial';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isValid, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';

interface MonthlyComparisonChartProps {
  data: FinanceRecord[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Gerar últimos 6 meses (retroativos)
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Filtrar registros deste mês específico
      const monthRecords = data.filter(r => {
        if (!r.dataComprovante) return false;
        try {
          const date = parseISO(r.dataComprovante);
          if (!isValid(date)) return false;
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        } catch {
          return false;
        }
      });

      // Somar TODAS as entradas e TODAS as saídas (sem filtro de categoria)
      const entradas = monthRecords
        .filter(r => r.tipo === 'entrada')
        .reduce((sum, r) => sum + Number(r.valor), 0);

      const saidas = monthRecords
        .filter(r => r.tipo === 'saida')
        .reduce((sum, r) => sum + Number(r.valor), 0);

      months.push({
        month: format(monthDate, 'MMM', { locale: ptBR }), // "Jan", "Fev", etc.
        entradas,
        saidas,
      });
    }

    return months;
  }, [data]); // Sem dependência de filtros ou categorias

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entradas = payload.find((p: any) => p.dataKey === 'entradas')?.value || 0;
      const saidas = payload.find((p: any) => p.dataKey === 'saidas')?.value || 0;

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-xs text-muted-foreground">Entradas:</span>
              <span className="text-sm font-medium text-foreground">
                R$ {entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d97757' }} />
              <span className="text-xs text-muted-foreground">Saídas:</span>
              <span className="text-sm font-medium text-foreground">
                R$ {saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.length > 0 && chartData.some(d => d.entradas > 0 || d.saidas > 0);

  return (
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[400px] opacity-0 animate-fade-up" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
        Comparativo Mensal
      </h3>

      {!hasData ? (
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-muted-foreground gap-3">
          <BarChart3 className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      ) : (
        <div className="h-[calc(100%-40px)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4} barCategoryGap="20%" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                stroke="hsl(var(--border))"
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => {
                  if (value === 'entradas') return 'Entradas';
                  if (value === 'saidas') return 'Saídas';
                  return value;
                }}
                iconType="circle"
              />
              <Bar
                dataKey="entradas"
                name="entradas"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="saidas"
                name="saidas"
                fill="#d97757"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
