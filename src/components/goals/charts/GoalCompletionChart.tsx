import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface GoalCompletionChartProps {
  data: Array<{
    month: string;
    completed: number;
    failed: number;
  }>;
}

export function GoalCompletionChart({ data }: GoalCompletionChartProps) {
  const hasData = data.some(d => d.completed > 0 || d.failed > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}:</span>
              <span className="text-xs font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[360px] opacity-0 animate-fade-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
        Histórico de Conclusões
      </h3>

      {!hasData ? (
        <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-muted-foreground gap-3">
          <BarChart3 className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhuma meta concluída ainda</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconSize={10}
            />
            <Bar
              dataKey="completed"
              name="Concluídas"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="failed"
              name="Não Atingidas"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
