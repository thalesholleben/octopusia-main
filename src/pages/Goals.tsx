import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Target, Trophy, Flame, Plus, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { GoalStatsCards } from '@/components/goals/GoalStatsCards';
import { GoalFilters } from '@/components/goals/GoalFilters';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalCompletionChart } from '@/components/goals/charts/GoalCompletionChart';
import { GoalCategoryChart } from '@/components/goals/charts/GoalCategoryChart';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { ExperienceBar } from '@/components/gamification/ExperienceBar';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { MotivationalMessage } from '@/components/gamification/MotivationalMessage';
import { AIAlertsCard } from '@/components/dashboard/AIAlertsCard';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FinancialGoal } from '@/lib/api';

const Goals = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [periodFilter, setPeriodFilter] = useState<string | undefined>();
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const {
    goals,
    activeGoals,
    atRiskGoals,
    stats,
    gamification,
    alerts,
    categoryChartData,
    completionChartData,
    isLoading,
    error,
    mutations,
  } = useGoalsData({
    status: statusFilter as any,
    period: periodFilter as any,
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    signOut();
    navigate('/auth');
  };

  const handleCreateGoal = (data: Parameters<typeof mutations.createGoal>[0]) => {
    mutations.createGoal(data);
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      mutations.deleteGoal(id);
    }
  };

  const handleSyncProgress = (id: string) => {
    mutations.syncProgress(id);
  };

  const handleStatusChange = (id: string, status: string) => {
    mutations.updateGoal({ id, data: { status } });
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
          <p className="text-center mb-4">Erro ao carregar metas</p>
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

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <Header onSignOut={handleSignOut} />

      <main className="container px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2 mb-4 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Button>

        {/* Title Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Metas Financeiras
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Defina objetivos e acompanhe seu progresso
              </p>
            </div>
            <CreateGoalDialog
              onSubmit={handleCreateGoal}
              isLoading={mutations.isCreating}
            />
          </div>
        </div>

        {/* Gamification Section */}
        {gamification && (
          <div className="card-float p-4 sm:p-6 mb-6 sm:mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4">
                  <LevelBadge
                    level={gamification.level}
                    levelName={gamification.levelName}
                    size="lg"
                  />
                </div>
                <div className="flex-1">
                  <ExperienceBar
                    currentXP={gamification.experience}
                    xpProgress={gamification.xpProgress}
                    xpForNextLevel={gamification.xpForNextLevel}
                  />
                  <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span>{gamification.totalGoalsCompleted} metas concluídas</span>
                    </div>
                    {gamification.currentStreak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{gamification.currentStreak} dias de streak</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            {gamification.badges.length > 0 && (
              <div className="mt-0 pt-4 border-t border-border">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">Conquistas</p>
                <BadgeGrid badges={gamification.badges} showLocked={false} />
              </div>
            )}
          </div>
        )}

        {/* KPI Stats Cards */}
        <div className="mb-6 sm:mb-8">
          <GoalStatsCards stats={stats} isLoading={isLoading} />
        </div>

        {/* Motivational Message */}
        {(gamification || goals.length > 0 || atRiskGoals.length > 0) && (
          <div className="mb-6 sm:mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
            <MotivationalMessage
              gamification={gamification}
              goals={goals}
              atRiskGoals={atRiskGoals}
            />
          </div>
        )}

        {/* AI Alerts for Goals */}
        {alerts.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <AIAlertsCard alerts={alerts} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 sm:mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <GoalFilters
            statusFilter={statusFilter}
            periodFilter={periodFilter}
            onStatusChange={setStatusFilter}
            onPeriodChange={setPeriodFilter}
          />
        </div>

        {/* Goals Grid */}
        <div className="mb-6 sm:mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          {goals.length === 0 ? (
            <div className="card-float p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma meta encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter || periodFilter
                  ? 'Tente ajustar os filtros ou crie uma nova meta.'
                  : 'Crie sua primeira meta para começar a acompanhar seu progresso.'}
              </p>
              <CreateGoalDialog
                onSubmit={handleCreateGoal}
                isLoading={mutations.isCreating}
                trigger={
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeira Meta
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                  onSync={handleSyncProgress}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <GoalCompletionChart data={completionChartData} />
          <GoalCategoryChart data={categoryChartData} />
        </div>
      </main>

      {/* FAB for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <CreateGoalDialog
          onSubmit={handleCreateGoal}
          isLoading={mutations.isCreating}
          trigger={
            <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default Goals;
