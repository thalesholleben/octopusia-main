import { CheckCircle, AlertTriangle, AlertCircle, Check, X } from 'lucide-react';
import { AIAlert } from '@/lib/api';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AlertCardProps {
  alert: AIAlert;
  onComplete: (id: string) => void;
  onIgnore: (id: string) => void;
  isUpdating?: boolean;
}

const priorityConfig = {
  baixa: {
    icon: CheckCircle,
    barColor: 'bg-success',
    bgColor: 'bg-success/5',
    iconColor: 'text-success',
  },
  media: {
    icon: AlertTriangle,
    barColor: 'bg-warning',
    bgColor: 'bg-warning/5',
    iconColor: 'text-warning',
  },
  alta: {
    icon: AlertCircle,
    barColor: 'bg-destructive',
    bgColor: 'bg-destructive/5',
    iconColor: 'text-destructive',
  },
};

export function AlertCard({ alert, onComplete, onIgnore, isUpdating }: AlertCardProps) {
  const config = priorityConfig[alert.prioridade];
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '--';
      return format(date, 'dd MMM yyyy', { locale: ptBR });
    } catch {
      return '--';
    }
  };

  return (
    <div
      className={cn(
        'flex p-3 rounded-lg border border-border hover:border-primary/30 transition-colors',
        config.bgColor
      )}
    >
      <div className={cn('w-1 rounded-full mr-3 shrink-0', config.barColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed line-clamp-2">
              {alert.aviso}
            </p>
            {alert.justificativa && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {alert.justificativa}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 ml-6">
          <p className="text-[10px] text-muted-foreground">
            {formatDate(alert.createdAt)}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-success/20 hover:text-success"
              onClick={() => onComplete(alert.id)}
              disabled={isUpdating}
              title="Marcar como concluído"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive"
              onClick={() => onIgnore(alert.id)}
              disabled={isUpdating}
              title="Ignorar"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
