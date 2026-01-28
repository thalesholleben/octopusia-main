import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Tag,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Percent,
  Settings2
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
import { FinancialHealthCard } from '@/components/dashboard/FinancialHealthCard';
import { WhatsAppPromoCard } from '@/components/dashboard/WhatsAppPromoCard';
import { BalanceAdjustmentDialog } from '@/components/dashboard/BalanceAdjustmentDialog';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { DateFilterType } from '@/types/financial';
import { financeAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dateFilter, setDateFilter] = useState<{
    type: DateFilterType;
    startDate?: Date;
    endDate?: Date;
  }>({ type: 'last30days' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sazonalidadeShowEntradas, setSazonalidadeShowEntradas] = useState(true);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Buscar dados financeiros
  const { records, alerts, kpis, chartData, isLoading, error } = useFinancialData({
    filterType: dateFilter.type,
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Buscar sazonalidade do backend
  const { data: sazonalidadeData } = useQuery({
    queryKey: ['finance', 'seasonality', sazonalidadeShowEntradas ? 'entrada' : 'saida'],
    queryFn: async () => {
      const response = await financeAPI.getSeasonality(
        sazonalidadeShowEntradas ? 'entrada' : 'saida'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

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

  const handleBalanceAdjustment = async (targetBalance: number) => {
    setIsAdjusting(true);
    try {
      await financeAPI.createBalanceAdjustment(targetBalance);
      toast.success('Saldo ajustado com sucesso!');
      setBalanceDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao ajustar saldo';
      toast.error(message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // ✅ refetch (não invalidate) - usuário clicou, quer ação AGORA
      await queryClient.refetchQueries({ queryKey: ['finance'] });
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
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
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          {/* Title row with WhatsApp promo on right */}
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Acompanhe suas finanças em tempo real
              </p>
            </div>
            <div className="shrink-0">
              <WhatsAppPromoCard delay={50} />
            </div>
          </div>

          {/* Filters */}
          <FilterBar
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* KPI Cards Grid - 2 rows × 3 cards (desktop) | 4 rows (mobile) */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {/* First row - Saldo Atual + Entradas + Saídas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Saldo Atual (100% mobile, 33% desktop) */}
            <div className="col-span-2 sm:col-span-1">
              <KPICard
                title="Saldo Atual"
                value={formatCurrency(kpis.lucroLiquido)}
                subtitle={
                  <span>
                    <span className="text-muted-foreground">Margem: </span>
                    <span className={kpis.margemLiquida >= 0 ? 'text-success' : 'text-destructive'}>
                      {kpis.margemLiquida.toFixed(1)}%
                    </span>
                  </span>
                }
                icon={<Wallet className="w-4 h-4 sm:w-5 sm:h-5" />}
                variant={kpis.lucroLiquido >= 0 ? 'positive' : 'negative'}
                delay={100}
                actionIcon={<Settings2 className="w-3 h-3" />}
                onActionClick={() => setBalanceDialogOpen(true)}
              />
            </div>

            {/* 2. Total Entradas (50% mobile, 33% desktop) */}
            <div className="col-span-1">
              <KPICard
                title="Total Entradas"
                value={formatCurrency(kpis.entradas)}
                trend={{
                  value: kpis.variacaoMensal,
                  label: 'vs mês anterior'
                }}
                icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                variant="positive"
                delay={150}
              />
            </div>

            {/* 3. Total Saídas (50% mobile, 33% desktop) */}
            <div className="col-span-1">
              <KPICard
                title="Total Saídas"
                value={formatCurrency(Math.abs(kpis.saidas))}
                trend={{
                  value: -kpis.variacaoSaidas,
                  label: 'vs mês anterior'
                }}
                icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                variant="negative"
                delay={200}
              />
            </div>
          </div>

          {/* Second row - Categoria + Variação + Sazonalidade */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 4. Maior Categoria (50% mobile, 33% desktop) */}
            <div className="col-span-1">
              <KPICard
                title="Maior Categoria"
                value={topCategory?.name || '-'}
                subtitle={topCategory ? formatCurrency(topCategory.value) : undefined}
                icon={<Tag className="w-4 h-4 sm:w-5 sm:h-5" />}
                delay={250}
              />
            </div>

            {/* 5. Variação Gastos (50% mobile, 33% desktop) */}
            <div className="col-span-1">
              <KPICard
                title="Variação Gastos"
                value={kpis.variacaoMensalReais >= 0
                  ? `+${formatCurrency(kpis.variacaoMensalReais)}`
                  : formatCurrency(kpis.variacaoMensalReais)
                }
                trend={{
                  value: kpis.variacaoSaidas,
                  label: 'vs mês anterior'
                }}
                icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
                variant={kpis.variacaoMensalReais <= 0 ? 'positive' : 'negative'}
                invertTrendColors={true}
                delay={300}
              />
            </div>

            {/* 6. Sazonalidades (100% mobile, 33% desktop) */}
            <div className="col-span-2 sm:col-span-1">
              <KPICard
                title={sazonalidadeShowEntradas ? "Sazonalidades (Entradas)" : "Sazonalidades (Saídas)"}
                value={sazonalidadeData ? formatCurrency(sazonalidadeData.maxValue) : '-'}
                subtitle={
                  sazonalidadeData
                    ? `Menor: ${formatCurrency(sazonalidadeData.minValue)} | Média: ${formatCurrency(sazonalidadeData.avgValue)}`
                    : undefined
                }
                icon={
                  <Switch
                    checked={sazonalidadeShowEntradas}
                    onCheckedChange={setSazonalidadeShowEntradas}
                  />
                }
                noIconBg
                delay={350}
              />
            </div>
          </div>
        </div>

        {/* AI Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <AIAlertsCard alerts={alerts} />
          </div>
        )}

        {/* Financial Health Card */}
        <FinancialHealthCard />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <ExpensePieChart filters={dateFilter} />
          <EvolutionLineChart data={records} />
          <MonthlyComparisonChart data={records} />
          <CategoryRankingChart data={records} />
        </div>

        {/* Category Evolution Chart - Full Width */}
        <div className="mb-4 sm:mb-6">
          <CategoryEvolutionChart data={records} />
        </div>
      </main>

      {/* Balance Adjustment Dialog */}
      <BalanceAdjustmentDialog
        open={balanceDialogOpen}
        onOpenChange={setBalanceDialogOpen}
        currentBalance={kpis.lucroLiquido}
        onSubmit={handleBalanceAdjustment}
        isLoading={isAdjusting}
      />
    </div>
  );
};

export default Index;
