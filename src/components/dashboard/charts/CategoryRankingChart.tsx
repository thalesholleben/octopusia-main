import { FinanceRecord } from '@/types/financial';
import { TrendingDown, BarChart } from 'lucide-react';

interface CategoryRankingChartProps {
  data: FinanceRecord[];
}

const COLORS = [
  '#d97757',
  '#f97316', 
  '#eab308',
  '#22c55e',
  '#3b82f6',
];

export function CategoryRankingChart({ data }: CategoryRankingChartProps) {
  const expenses = data.filter(r => r.tipo === 'saida');
  
  const categoryTotals = expenses.reduce((acc, record) => {
    acc[record.categoria] = (acc[record.categoria] || 0) + Number(record.valor);
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxValue = sortedCategories[0]?.[1] || 0;
  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  return (
    <div className="card-float p-4 sm:p-6 h-[320px] sm:h-[400px] flex flex-col opacity-0 animate-fade-up" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
      <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Ranking de Gastos</h3>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
          <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Top 5</span>
        </div>
      </div>
      
      {sortedCategories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <BarChart className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhum gasto no período</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 pr-1 sm:pr-2">
          {sortedCategories.map(([category, value], index) => {
            const percentage = ((value / totalExpenses) * 100).toFixed(1);
            const barWidth = (value / maxValue) * 100;
            
            return (
              <div key={category} className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span 
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold"
                      style={{ backgroundColor: `${COLORS[index]}20`, color: COLORS[index] }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[100px] sm:max-w-none">{category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                </div>
                <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${barWidth}%`,
                      backgroundColor: COLORS[index],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
