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
import { GranularityType } from '@/types/chartGranularity';
import { BarChart3, Settings2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  safeParseDateStr,
  getDateRangeFromRecords,
  determineGranularity,
  getGroupKey,
  formatAxisLabel,
  shouldShowDots,
  getXAxisInterval,
  getGranularityShortLabel,
} from '@/lib/chartGranularity';

interface CategoryEvolutionChartProps {
  data: FinanceRecord[];
}

const COLORS = [
  '#d97757', '#22c55e', '#eab308', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#a855f7', '#ef4444', '#10b981', '#f59e0b'
];

export function CategoryEvolutionChart({ data }: CategoryEvolutionChartProps) {
  const [granularityOverride, setGranularityOverride] = useState<GranularityType | 'auto'>('auto');
  const [showGranularityOptions, setShowGranularityOptions] = useState(false);

  // Calcula o range de datas e determina a granularidade
  const { activeGranularity, daysDiff } = useMemo(() => {
    const { daysDiff } = getDateRangeFromRecords(data);
    const autoGranularity = determineGranularity(daysDiff);

    return {
      activeGranularity: granularityOverride === 'auto'
        ? autoGranularity
        : granularityOverride,
      daysDiff,
    };
  }, [data, granularityOverride]);

  // Top 8 categorias por valor total (calcula primeiro para usar no chartData)
  const topCategories = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    // Filtra apenas saídas e calcula totais
    data.filter(record => record.tipo === 'saida').forEach(record => {
      const valor = Number(record.valor);
      categoryTotals[record.categoria] = (categoryTotals[record.categoria] || 0) + valor;
    });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([cat]) => cat);
  }, [data]);

  // Agrupa dados por granularidade dinâmica (apenas saídas)
  const chartData = useMemo(() => {
    // Filtra apenas saídas
    const saidasData = data.filter(record => record.tipo === 'saida');

    // Agrupa por período
    const groupedData: Record<string, Record<string, number>> = {};

    saidasData.forEach(record => {
      const date = safeParseDateStr(record.dataComprovante);
      if (!date) return;

      const groupKey = getGroupKey(date, activeGranularity);

      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {};
      }

      if (!groupedData[groupKey][record.categoria]) {
        groupedData[groupKey][record.categoria] = 0;
      }

      groupedData[groupKey][record.categoria] += Number(record.valor);
    });

    // Obtém todos os períodos ordenados
    const allPeriods = Object.keys(groupedData).sort();

    // Converte para array no formato do Recharts
    return allPeriods.map((groupKey) => {
      const result: Record<string, unknown> = {
        groupKey,
        groupFormatted: formatAxisLabel(groupKey, activeGranularity),
      };

      // Para cada top categoria, adiciona o valor (ou 0 se não existir neste período)
      topCategories.forEach((categoria) => {
        result[categoria] = groupedData[groupKey][categoria] || 0;
      });

      return result;
    });
  }, [data, activeGranularity, topCategories]);

  // Configurações visuais baseadas na densidade de dados
  const dataPointCount = chartData.length;
  const showDots = shouldShowDots(dataPointCount);
  const xAxisInterval = getXAxisInterval(dataPointCount);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-h-64 overflow-y-auto custom-scrollbar">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload
              .sort((a, b) => b.value - a.value)
              .map((entry, index: number) => (
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
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Evolução por Categoria</h3>
          {/* Badge de granularidade */}
          <button
            onClick={() => setShowGranularityOptions(!showGranularityOptions)}
            className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1"
            title={`Granularidade: ${granularityOverride === 'auto' ? 'Auto' : getGranularityShortLabel(granularityOverride)}`}
          >
            <Settings2 className="w-3 h-3" />
            {getGranularityShortLabel(activeGranularity)}
          </button>
        </div>

        {/* Seletor de granularidade (expansível) */}
        {showGranularityOptions && (
          <RadioGroup
            value={granularityOverride}
            onValueChange={(v) => setGranularityOverride(v as GranularityType | 'auto')}
            className="flex gap-3"
          >
            {(['auto', 'daily', 'weekly', 'monthly'] as const).map((option) => (
              <div key={option} className="flex items-center space-x-1.5">
                <RadioGroupItem value={option} id={`gran-${option}`} />
                <Label htmlFor={`gran-${option}`} className="text-xs text-muted-foreground cursor-pointer font-normal">
                  {option === 'auto' ? 'Auto' : option === 'daily' ? 'Dia' : option === 'weekly' ? 'Sem' : 'Mês'}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
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
                dataKey="groupFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                interval={xAxisInterval}
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
                  type="linear"
                  dataKey={cat}
                  name={cat}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  fill={`url(#color${index})`}
                  dot={showDots ? { r: 2, fill: COLORS[index % COLORS.length] } : false}
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
