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
    const currentMonth = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonth = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    // Filtrar registros do mês atual
    const currentMonthRecords = data.filter(r => {
      if (!r.dataComprovante || r.tipo !== 'saida') return false;
      try {
        const date = parseISO(r.dataComprovante);
        if (!isValid(date)) return false;
        return isWithinInterval(date, { start: currentMonth, end: currentMonthEnd });
      } catch {
        return false;
      }
    });

    // Filtrar registros do mês anterior
    const previousMonthRecords = data.filter(r => {
      if (!r.dataComprovante || r.tipo !== 'saida') return false;
      try {
        const date = parseISO(r.dataComprovante);
        if (!isValid(date)) return false;
        return isWithinInterval(date, { start: previousMonth, end: previousMonthEnd });
      } catch {
        return false;
      }
    });

    // Agrupar por categoria - Mês Atual
    const currentCategoryTotals: Record<string, number> = {};
    currentMonthRecords.forEach(r => {
      currentCategoryTotals[r.categoria] = (currentCategoryTotals[r.categoria] || 0) + r.valor;
    });

    // Agrupar por categoria - Mês Anterior
    const previousCategoryTotals: Record<string, number> = {};
    previousMonthRecords.forEach(r => {
      previousCategoryTotals[r.categoria] = (previousCategoryTotals[r.categoria] || 0) + r.valor;
    });

    // Obter todas as categorias únicas
    const allCategories = new Set([
      ...Object.keys(currentCategoryTotals),
      ...Object.keys(previousCategoryTotals)
    ]);

    // Criar dados para o gráfico
    const result = Array.from(allCategories).map(categoria => ({
      categoria,
      mesAtual: currentCategoryTotals[categoria] || 0,
      mesAnterior: previousCategoryTotals[categoria] || 0,
    }));

    // Ordenar por total (mês atual + mês anterior) decrescente
    return result
      .sort((a, b) => (b.mesAtual + b.mesAnterior) - (a.mesAtual + a.mesAnterior))
      .slice(0, 8); // Top 8 categorias
  }, [data]);

  const currentMonthName = format(new Date(), 'MMM/yy', { locale: ptBR });
  const previousMonthName = format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const mesAtual = payload.find((p: any) => p.dataKey === 'mesAtual')?.value || 0;
      const mesAnterior = payload.find((p: any) => p.dataKey === 'mesAnterior')?.value || 0;
      const variacao = mesAnterior > 0 ? ((mesAtual - mesAnterior) / mesAnterior) * 100 : 0;

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span className="text-xs text-muted-foreground">{currentMonthName}:</span>
              <span className="text-sm font-medium text-foreground">
                R$ {mesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-xs text-muted-foreground">{previousMonthName}:</span>
              <span className="text-sm font-medium text-foreground">
                R$ {mesAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {mesAnterior > 0 && (
              <div className="pt-1 mt-1 border-t border-border">
                <span className={`text-xs font-medium ${variacao > 0 ? 'text-destructive' : variacao < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  {variacao > 0 ? '▲' : variacao < 0 ? '▼' : '='} {Math.abs(variacao).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.length > 0 && chartData.some(d => d.mesAtual > 0 || d.mesAnterior > 0);

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
                dataKey="categoria"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                stroke="hsl(var(--border))"
                angle={-45}
                textAnchor="end"
                height={60}
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
                  if (value === 'mesAtual') return currentMonthName;
                  if (value === 'mesAnterior') return previousMonthName;
                  return value;
                }}
                iconType="circle"
              />
              <Bar
                dataKey="mesAtual"
                name="mesAtual"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="mesAnterior"
                name="mesAnterior"
                fill="hsl(var(--muted))"
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
