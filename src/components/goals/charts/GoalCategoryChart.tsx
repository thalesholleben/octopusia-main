import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target } from 'lucide-react';

interface GoalCategoryChartProps {
  data: Array<{
    name: string;
    total: number;
    completed: number;
  }>;
}

const COLORS = [
  '#d97757',
  '#22c55e',
  '#eab308',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

export function GoalCategoryChart({ data }: GoalCategoryChartProps) {
  const hasData = data.length > 0;

  const chartData = data
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = chartData.find(d => d.name === label);
      const successRate = item && item.total > 0
        ? Math.round((item.completed / item.total) * 100)
        : 0;

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Total: <span className="font-medium text-foreground">{item?.total || 0}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Concluídas: <span className="font-medium text-success">{item?.completed || 0}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Taxa: <span className="font-medium text-primary">{successRate}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[360px] opacity-0 animate-fade-up" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
        Metas por Categoria
      </h3>

      {!hasData ? (
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Target className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhuma meta criada ainda</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
