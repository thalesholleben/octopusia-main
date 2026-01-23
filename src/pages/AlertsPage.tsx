import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { AlertsOverview } from '@/components/alerts/AlertsOverview';
import { AlertsList } from '@/components/alerts/AlertsList';
import { useAlertsData } from '@/hooks/useAlertsData';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AlertsPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    alerts,
    stats,
    criticalPercentage,
    pieChartData,
    isLoading,
    error,
  } = useAlertsData();

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
          <p className="text-center mb-4">Erro ao carregar avisos</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Avisos da IA
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Insights automaticos baseados no seu historico financeiro
          </p>
        </div>

        {/* Overview Section (Pie Chart + KPIs) */}
        <div className="mb-6 sm:mb-8">
          <AlertsOverview
            stats={stats}
            criticalPercentage={criticalPercentage}
            pieChartData={pieChartData}
          />
        </div>

        {/* Alerts List */}
        <AlertsList alerts={alerts} />
      </main>
    </div>
  );
};

export default AlertsPage;
