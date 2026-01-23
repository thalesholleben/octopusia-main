import { Bell, AlertCircle, Percent } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertsPageStats } from '@/lib/api';

interface AlertsOverviewProps {
  stats: AlertsPageStats;
  criticalPercentage: number;
  pieChartData: Array<{ name: string; value: number; fill: string }>;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
        <p className="text-xs font-medium text-foreground">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function AlertsOverview({ stats, criticalPercentage, pieChartData }: AlertsOverviewProps) {
  const hasData = pieChartData.length > 0;

  return (
    <div className="card-float p-4 sm:p-6 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pie Chart */}
        <div className="lg:w-1/3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Distribuição por Prioridade
          </h3>
          {hasData ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Sem dados</p>
            </div>
          )}
          {/* Legenda */}
          {hasData && (
            <div className="flex justify-center gap-4 mt-2">
              {pieChartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-[10px] text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KPIs - Mobile: 3 colunas compactas / Desktop: KPICards normais */}
        <div className="flex-1">
          {/* Mobile: Mini KPIs em linha */}
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div className="card-float p-2.5 border-border">
              <div className="flex flex-col items-center text-center">
                <Bell className="w-4 h-4 text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.totalAlerts}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Recentes</p>
              </div>
            </div>
            <div className="card-float p-2.5 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="w-4 h-4 text-destructive mb-1" />
                <p className="text-lg font-bold text-destructive">{stats.priorityCounts.alta}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Alta</p>
              </div>
            </div>
            <div className={`card-float p-2.5 ${criticalPercentage > 30 ? 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent' : 'border-border'}`}>
              <div className="flex flex-col items-center text-center">
                <Percent className={`w-4 h-4 mb-1 ${criticalPercentage > 30 ? 'text-warning' : 'text-primary'}`} />
                <p className="text-lg font-bold text-foreground">{criticalPercentage}%</p>
                <p className="text-[8px] text-muted-foreground uppercase">Criticos</p>
              </div>
            </div>
          </div>

          {/* Desktop: KPICards normais */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-3">
            <KPICard
              title="Avisos recentes"
              value={stats.totalAlerts.toString()}
              icon={<Bell className="w-4 h-4" />}
              variant="default"
              delay={0}
            />
            <KPICard
              title="Alta prioridade"
              value={stats.priorityCounts.alta.toString()}
              icon={<AlertCircle className="w-4 h-4" />}
              variant="negative"
              delay={50}
            />
            <KPICard
              title="% Criticos"
              value={`${criticalPercentage}%`}
              icon={<Percent className="w-4 h-4" />}
              variant={criticalPercentage > 30 ? 'warning' : 'default'}
              delay={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
