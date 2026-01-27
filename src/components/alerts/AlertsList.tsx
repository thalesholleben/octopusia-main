import { Bot } from 'lucide-react';
import { AIAlert } from '@/lib/api';
import { AlertCard } from './AlertCard';

interface AlertsListProps {
  alerts: AIAlert[];
  onComplete: (id: string) => void;
  onIgnore: (id: string) => void;
  isUpdating?: boolean;
}

export function AlertsList({ alerts, onComplete, onIgnore, isUpdating }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="card-float p-6 opacity-0 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Todos os Avisos</h2>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Bot className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Nenhum aviso encontrado</p>
        </div>
      </div>
    );
  }

  // Dividir alertas em duas colunas (0-14 e 15-29)
  const midpoint = Math.ceil(alerts.length / 2);
  const column1 = alerts.slice(0, midpoint);
  const column2 = alerts.slice(midpoint);

  return (
    <div className="card-float p-4 sm:p-6 opacity-0 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
      <h2 className="text-sm font-semibold text-foreground mb-4">Todos os Avisos</h2>

      {/* Mobile: 1 coluna */}
      <div className="flex flex-col gap-2 md:hidden">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onComplete={onComplete}
            onIgnore={onIgnore}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      {/* Desktop: 2 colunas */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {column1.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onComplete={onComplete}
              onIgnore={onIgnore}
              isUpdating={isUpdating}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {column2.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onComplete={onComplete}
              onIgnore={onIgnore}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
