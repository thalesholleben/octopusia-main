import { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { FinanceRecord, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/financial';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';

interface CategoryEvolutionChartProps {
  data: FinanceRecord[];
}

export function CategoryEvolutionChart({ data }: CategoryEvolutionChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showIncome, setShowIncome] = useState(false);

  const chartData = useMemo(() => {
    // Group data by month
    const monthlyData: Record<string, { saidas: number; entradas: number }> = {};

    data.forEach(record => {
      const date = parseISO(record.data_comprovante);
      const monthKey = format(date, 'yyyy-MM');
      
      // Filter by category if selected (not 'all')
      if (selectedCategory !== 'all') {
        if (record.categoria !== selectedCategory) {
          return;
        }
      }

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { saidas: 0, entradas: 0 };
      }

      if (record.tipo === 'saida') {
        monthlyData[monthKey].saidas += record.valor;
      } else {
        monthlyData[monthKey].entradas += record.valor;
      }
    });

    // Sort and format
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, values]) => ({
        month: monthKey,
        monthFormatted: format(parseISO(`${monthKey}-01`), 'MMM/yy', { locale: ptBR }),
        saidas: values.saidas,
        entradas: values.entradas,
      }));
  }, [data, selectedCategory]);

  // Determine if selected category is expense type
  const isExpenseCategory = selectedCategory === 'all' || 
    (EXPENSE_CATEGORIES as readonly string[]).includes(selectedCategory);
  
  const isIncomeCategory = (INCOME_CATEGORIES as readonly string[]).includes(selectedCategory);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.length > 0 && chartData.some(d => d.saidas > 0 || d.entradas > 0);

  return (
    <div className="card-float p-4 sm:p-6 h-[350px] sm:h-[400px] flex flex-col opacity-0 animate-fade-up" style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 shrink-0">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Evolução por Categoria</h3>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="showIncome" 
              checked={showIncome}
              onCheckedChange={setShowIncome}
            />
            <Label htmlFor="showIncome" className="text-xs text-muted-foreground cursor-pointer">
              Entradas
            </Label>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-8 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Todas Categorias
              </SelectItem>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                Saídas
              </div>
              {EXPENSE_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                Entradas
              </div>
              {INCOME_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <BarChart3 className="w-12 h-12 opacity-30" />
          <p className="text-sm text-center">
            {selectedCategory === 'all' 
              ? 'Nenhum dado disponível para o período' 
              : `Sem dados para "${selectedCategory}"`}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSaidasEvol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEntradasEvol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
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
              
              {(isExpenseCategory || selectedCategory === 'all') && !isIncomeCategory && (
                <Area
                  type="monotone"
                  dataKey="saidas"
                  name="Saídas"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fill="url(#colorSaidasEvol)"
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
              
              {(showIncome || isIncomeCategory) && (
                <Area
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#colorEntradasEvol)"
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
