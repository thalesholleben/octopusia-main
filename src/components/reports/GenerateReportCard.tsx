import { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { reportsAPI, type ReportStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function GenerateReportCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch report status
  const { data: status, isLoading } = useQuery<ReportStatus>({
    queryKey: ['reportStatus'],
    queryFn: async () => {
      const response = await reportsAPI.getStatus();
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute to update cooldown
    enabled: user?.subscription === 'pro',
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: () => reportsAPI.generate(),
    onSuccess: (response) => {
      const result = response.data;
      if (result.success) {
        toast.success(result.message);
      } else if (result.insufficientData) {
        toast.warning(result.message, {
          duration: 8000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['reportStatus'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erro ao gerar relatório';

      if (error.response?.data?.cooldownEndsAt) {
        toast.error(errorMessage, {
          description: 'Aguarde o período de cooldown',
          duration: 5000,
        });
      } else if (error.response?.data?.limitReached) {
        toast.error(errorMessage, {
          description: 'Tente novamente no próximo mês',
          duration: 5000,
        });
      } else if (error.response?.data?.upgrade) {
        toast.error(errorMessage, {
          description: 'Faça upgrade para PRO',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Calculate time remaining for cooldown
  useEffect(() => {
    if (!status?.cooldownEndsAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const cooldownEnd = new Date(status.cooldownEndsAt!);
      const diff = cooldownEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('');
        queryClient.invalidateQueries({ queryKey: ['reportStatus'] });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}min`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [status?.cooldownEndsAt, queryClient]);

  // Check if user is PRO
  const isPro = user?.subscription === 'pro';
  const hasConfiguredReport = user?.report && user.report !== 'none';

  // Calculate progress percentage
  const progressPercentage = status
    ? ((status.totalReportsThisMonth / 3) * 100)
    : 0;

  // Determine button state
  const isInCooldown = !status?.canGenerate && Boolean(status?.cooldownEndsAt);
  const limitReached = status?.remainingReports === 0;
  const isGenerating = generateMutation.isPending;
  const canGenerate = status?.canGenerate && !isGenerating;

  const handleGenerate = () => {
    if (!hasConfiguredReport) {
      toast.error('Configure o tipo de relatório antes de gerar');
      return;
    }
    generateMutation.mutate();
  };

  if (!isPro) {
    return (
      <div
        className="card-float p-4 sm:p-6 opacity-0 animate-fade-up"
        style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Gerar Relatório</h2>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Relatórios financeiros disponíveis apenas para usuários PRO
          </p>
          <p className="text-xs text-muted-foreground">
            Faça upgrade para desbloquear relatórios com IA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-float p-4 sm:p-6 opacity-0 animate-fade-up"
      style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Gerar Relatório</h2>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Solicite um relatório financeiro detalhado por email
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Monthly Usage Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Uso mensal</span>
              <span className="text-sm text-muted-foreground">
                {status?.totalReportsThisMonth || 0}/3 relatórios
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  limitReached
                    ? 'bg-red-500'
                    : progressPercentage >= 66
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {status?.remainingReports || 0} {status?.remainingReports === 1 ? 'relatório restante' : 'relatórios restantes'} este mês
            </p>
          </div>

          {/* Cooldown Warning */}
          {isInCooldown && timeRemaining && (
            <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
                    Cooldown ativo
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">
                    Próximo relatório disponível em: {timeRemaining}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Limit Reached Warning */}
          {limitReached && !isInCooldown && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-500">
                    Limite mensal atingido
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5">
                    Você atingiu o limite de 3 relatórios por mês. Tente novamente no próximo mês.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || !hasConfiguredReport}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200',
              'flex items-center justify-center gap-2',
              canGenerate && hasConfiguredReport
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : isInCooldown ? (
              <>
                <Clock className="w-4 h-4" />
                Aguarde {timeRemaining}
              </>
            ) : limitReached ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Limite mensal atingido
              </>
            ) : !hasConfiguredReport ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Configure o tipo de relatório
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Gerar Relatório
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Como funciona</h3>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Limite: 3 relatórios por mês</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Cooldown: 24h entre solicitações</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Entrega: Por email em até 20 minutos</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
