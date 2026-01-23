import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { AIAlert } from '@/lib/api';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: AIAlert;
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

export function AlertCard({ alert }: AlertCardProps) {
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
          <p className="text-xs text-foreground leading-relaxed line-clamp-2">
            {alert.aviso}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 ml-6">
          {formatDate(alert.createdAt)}
        </p>
      </div>
    </div>
  );
}
