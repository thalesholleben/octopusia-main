import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FinanceRecord } from '@/types/financial';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ExpensePieChartProps {
  data: FinanceRecord[];
}

const COLORS = [
  '#d97757', // primary
  '#22c55e', // success
  '#eab308', // warning
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#a855f7', // purple
];

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  const expenses = data.filter(r => r.tipo === 'saida');
  
  const categoryTotals = expenses.reduce((acc, record) => {
    acc[record.categoria] = (acc[record.categoria] || 0) + record.valor;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-lg font-bold text-primary">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">{percentage}% do total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ name, percent }: any) => {
    if (percent < 0.08) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[400px] opacity-0 animate-fade-up" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Distribuição de Gastos</h3>
      
      {chartData.length === 0 ? (
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-muted-foreground gap-3">
          <PieChartIcon className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhum gasto no período</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row h-[calc(100%-40px)]">
          <div className="w-full sm:w-1/2 h-[180px] sm:h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/2 h-auto sm:h-full overflow-y-auto pt-2 sm:pt-0 sm:pl-2">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
