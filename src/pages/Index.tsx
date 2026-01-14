import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Tag,
  BarChart3,
  Landmark,
  AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KPICard } from '@/components/dashboard/KPICard';
import { AIAlertsCard } from '@/components/dashboard/AIAlertsCard';
import { ExpensePieChart } from '@/components/dashboard/charts/ExpensePieChart';
import { EvolutionLineChart } from '@/components/dashboard/charts/EvolutionLineChart';
import { MonthlyComparisonChart } from '@/components/dashboard/charts/MonthlyComparisonChart';
import { CategoryRankingChart } from '@/components/dashboard/charts/CategoryRankingChart';
import { CategoryEvolutionChart } from '@/components/dashboard/charts/CategoryEvolutionChart';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { DateFilterType } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@/lib/api';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState<{
    type: DateFilterType;
    startDate?: Date;
    endDate?: Date;
  }>({ type: 'last30days' });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Buscar lista de clientes
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => financeAPI.getClients(),
    enabled: !!user,
  });

  const clients = clientsData?.data.clients || [];

  // Buscar dados financeiros
  const { records, alerts, kpis, chartData, isLoading, error } = useFinancialData({
    filterType: dateFilter.type,
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
    selectedClient,
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSignOut = async () => {
    signOut();
    navigate('/auth');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <p className="text-center mb-4">Erro ao carregar dados financeiros</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSignOut={handleSignOut} />
        <main className="container px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  // Calcular top category
  const topCategory = chartData.categoryData.length > 0
    ? chartData.categoryData.reduce((max, cat) => cat.value > max.value ? cat : max)
    : null;

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <Header onSignOut={handleSignOut} />

      <main className="container px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Filters Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Acompanhe suas finanças em tempo real
              </p>
            </div>
            <FilterBar
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              selectedClient={selectedClient}
              onClientChange={setSelectedClient}
              clients={clients}
            />
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {/* First row - 3 main cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <KPICard
              title="Saldo Total"
              value={formatCurrency(kpis.saldo)}
              icon={<Wallet className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant={kpis.saldo >= 0 ? 'positive' : 'negative'}
              delay={100}
            />
            <KPICard
              title="Total de Entradas"
              value={formatCurrency(kpis.entradas)}
              icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="positive"
              delay={150}
            />
            <KPICard
              title="Total de Saídas"
              value={formatCurrency(kpis.saidas)}
              icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="negative"
              delay={200}
            />
          </div>

          {/* Second row - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <KPICard
              title="Média Mensal"
              value={formatCurrency(kpis.mediaMensal)}
              subtitle="Últimos 6 meses"
              icon={<PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />}
              delay={250}
            />
            <KPICard
              title="Maior Categoria"
              value={topCategory?.name || '-'}
              subtitle={topCategory ? formatCurrency(topCategory.value) : undefined}
              icon={<Tag className="w-4 h-4 sm:w-5 sm:h-5" />}
              delay={300}
            />
            <KPICard
              title="Variação Mensal"
              value={`${kpis.variacaoMensal > 0 ? '+' : ''}${kpis.variacaoMensal.toFixed(1)}%`}
              trend={{
                value: kpis.variacaoMensal,
                label: 'vs mês anterior'
              }}
              icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant={kpis.variacaoMensal <= 0 ? 'positive' : 'negative'}
              delay={350}
            />
          </div>
        </div>

        {/* AI Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <AIAlertsCard alerts={alerts} />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <ExpensePieChart data={chartData.categoryData} />
          <EvolutionLineChart data={chartData.timelineData} />
          <MonthlyComparisonChart data={records} />
          <CategoryRankingChart data={chartData.categoryData} />
        </div>

        {/* Category Evolution Chart - Full Width */}
        <div className="mb-4 sm:mb-6">
          <CategoryEvolutionChart data={records} />
        </div>
      </main>
    </div>
  );
};

export default Index;
