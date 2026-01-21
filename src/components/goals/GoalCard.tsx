import { Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle, Pause, MoreVertical, RefreshCw, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalProgressBar } from './GoalProgressBar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinancialGoal } from '@/lib/api';

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit?: (goal: FinancialGoal) => void;
  onDelete?: (id: string) => void;
  onSync?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  economia: 'Economia',
  limite_gasto: 'Limite de Gasto',
  meta_receita: 'Meta de Receita',
  investimento: 'Investimento',
};

const STATUS_CONFIG = {
  ativo: { icon: Target, label: 'Ativo', class: 'text-primary bg-primary/10' },
  pausado: { icon: Pause, label: 'Pausado', class: 'text-muted-foreground bg-muted' },
  concluido: { icon: CheckCircle, label: 'Concluído', class: 'text-success bg-success/10' },
  falhou: { icon: XCircle, label: 'Não Atingido', class: 'text-destructive bg-destructive/10' },
};

export function GoalCard({ goal, onEdit, onDelete, onSync, onStatusChange }: GoalCardProps) {
  const statusConfig = STATUS_CONFIG[goal.status];
  const StatusIcon = statusConfig.icon;

  const safeParseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  const startDate = safeParseDate(goal.startDate);
  const endDate = safeParseDate(goal.endDate);
  const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div
      className={cn(
        'card-float p-3 sm:p-4 transition-all hover:border-primary/30',
        goal.atRisk && 'border-destructive/30 bg-destructive/5',
        goal.status === 'concluido' && 'border-success/30 bg-success/5',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide',
              statusConfig.class
            )}>
              {statusConfig.label}
            </span>
            {goal.atRisk && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-destructive">
                <AlertTriangle className="w-3 h-3" />
                Em risco
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {goal.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {goal.status === 'ativo' && onSync && (
              <DropdownMenuItem onClick={() => onSync(goal.id)}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Sincronizar
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Edit className="w-3.5 h-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {goal.status === 'ativo' && onStatusChange && (
              <>
                <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'pausado')}>
                  <Pause className="w-3.5 h-3.5 mr-2" />
                  Pausar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'concluido')}>
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  Concluir
                </DropdownMenuItem>
              </>
            )}
            {goal.status === 'pausado' && onStatusChange && (
              <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'ativo')}>
                <Target className="w-3.5 h-3.5 mr-2" />
                Reativar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(goal.id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <GoalProgressBar
          progress={goal.progress}
          type={goal.type}
          atRisk={goal.atRisk}
          size="md"
        />

        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>
              {formatCurrency(goal.currentValue)} / {formatCurrency(goal.targetValue)}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            {TYPE_LABELS[goal.type]}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {startDate ? format(startDate, 'dd/MM', { locale: ptBR }) : '--'} - {endDate ? format(endDate, 'dd/MM/yy', { locale: ptBR }) : '--'}
            </span>
          </div>
          {goal.status === 'ativo' && (
            <span className={cn(
              'text-[9px] sm:text-[10px] font-medium',
              daysRemaining <= 7 && 'text-destructive',
              daysRemaining > 7 && daysRemaining <= 30 && 'text-warning',
              daysRemaining > 30 && 'text-muted-foreground',
            )}>
              {daysRemaining > 0
                ? `${daysRemaining} dias restantes`
                : daysRemaining === 0
                  ? 'Termina hoje'
                  : 'Prazo expirado'
              }
            </span>
          )}
        </div>

        {goal.category && (
          <div className="text-[9px] sm:text-[10px] text-muted-foreground">
            Categoria: <span className="text-foreground">{goal.category}</span>
          </div>
        )}
      </div>
    </div>
  );
}
