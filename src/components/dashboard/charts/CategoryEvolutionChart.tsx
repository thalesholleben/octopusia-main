import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { FinanceRecord } from '@/types/financial';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Helper para fazer parse seguro de data
const safeParseDateStr = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

interface CategoryEvolutionChartProps {
  data: FinanceRecord[];
}

const COLORS = [
  '#d97757', '#22c55e', '#eab308', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#a855f7', '#ef4444', '#10b981', '#f59e0b'
];

export function CategoryEvolutionChart({ data }: CategoryEvolutionChartProps) {
  const [showType, setShowType] = useState<'saidas' | 'ambos'>('saidas');

  const chartData = useMemo(() => {
    // Group data by month and category
    const monthlyData: Record<string, Record<string, { saidas: number; entradas: number }>> = {};

    data.forEach(record => {
      const date = safeParseDateStr(record.dataComprovante);
      if (!date) return;

      const monthKey = format(date, 'yyyy-MM');

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }

      if (!monthlyData[monthKey][record.categoria]) {
        monthlyData[monthKey][record.categoria] = { saidas: 0, entradas: 0 };
      }

      if (record.tipo === 'saida') {
        monthlyData[monthKey][record.categoria].saidas += Number(record.valor);
      } else {
        monthlyData[monthKey][record.categoria].entradas += Number(record.valor);
      }
    });

    // Convert to array format for Recharts
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, categories]) => {
        const monthDate = safeParseDateStr(`${monthKey}-01`);
        const result: any = {
          month: monthKey,
          monthFormatted: monthDate ? format(monthDate, 'MMM/yy', { locale: ptBR }) : monthKey,
        };

        // Add data for each category
        Object.entries(categories).forEach(([categoria, values]) => {
          if (showType === 'saidas') {
            result[categoria] = values.saidas;
          } else {
            // Para "ambos", soma entradas + saidas
            result[categoria] = values.entradas + values.saidas;
          }
        });

        return result;
      });
  }, [data, showType]);

  // Get top 8 categories by total value
  const topCategories = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    chartData.forEach(month => {
      Object.entries(month).forEach(([key, value]) => {
        if (key !== 'month' && key !== 'monthFormatted' && typeof value === 'number') {
          categoryTotals[key] = (categoryTotals[key] || 0) + value;
        }
      });
    });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([cat]) => cat);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-h-64 overflow-y-auto">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">{entry.name}:</span>
                  <span className="text-xs font-medium text-foreground">
                    R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.length > 0 && topCategories.length > 0;

  return (
    <div className="card-float p-4 sm:p-6 h-[350px] sm:h-[400px] flex flex-col opacity-0 animate-fade-up" style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 shrink-0">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Evolução por Categoria</h3>

        <RadioGroup value={showType} onValueChange={(v) => setShowType(v as 'saidas' | 'ambos')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="saidas" id="saidas" />
            <Label htmlFor="saidas" className="text-xs text-muted-foreground cursor-pointer font-normal">
              Apenas Saídas
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ambos" id="ambos" />
            <Label htmlFor="ambos" className="text-xs text-muted-foreground cursor-pointer font-normal">
              Entradas + Saídas
            </Label>
          </div>
        </RadioGroup>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <BarChart3 className="w-12 h-12 opacity-30" />
          <p className="text-sm text-center">Nenhum dado disponível para o período</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {topCategories.map((cat, index) => (
                  <linearGradient key={cat} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="monthFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : `${value}`}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                iconType="circle"
                iconSize={8}
              />

              {topCategories.map((cat, index) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={cat}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  fill={`url(#color${index})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
