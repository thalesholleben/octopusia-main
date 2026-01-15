import { Bot, AlertCircle, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AIAlert } from '@/types/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';

interface AIAlertsCardProps {
  alerts: AIAlert[];
}

const priorityConfig = {
  baixa: {
    icon: CheckCircle,
    class: 'priority-low',
    bgClass: 'bg-success/5',
    label: 'Baixa',
    labelClass: 'text-success bg-success/10'
  },
  media: {
    icon: AlertTriangle,
    class: 'priority-medium',
    bgClass: 'bg-warning/5',
    label: 'Média',
    labelClass: 'text-warning bg-warning/10'
  },
  alta: {
    icon: AlertCircle,
    class: 'priority-high',
    bgClass: 'bg-destructive/5',
    label: 'Alta',
    labelClass: 'text-destructive bg-destructive/10'
  }
};

export function AIAlertsCard({ alerts }: AIAlertsCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [alerts]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="card-float p-3 sm:p-4 opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <h2 className="text-xs sm:text-sm font-semibold text-foreground">Avisos da IA</h2>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'p-1 sm:p-1.5 rounded-lg transition-all',
              canScrollLeft 
                ? 'hover:bg-secondary text-foreground' 
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'p-1 sm:p-1.5 rounded-lg transition-all',
              canScrollRight 
                ? 'hover:bg-secondary text-foreground' 
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {alerts.length === 0 ? (
          <div className="flex-1 text-center py-4 text-muted-foreground">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum aviso no momento</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = priorityConfig[alert.prioridade];
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex-shrink-0 w-[240px] sm:w-[280px] md:w-[calc(33.333%-8px)] min-w-[240px] p-2.5 sm:p-3 rounded-lg border border-border transition-all hover:border-primary/30',
                  config.class,
                  config.bgClass
                )}
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="flex items-start gap-2">
                  <Icon className={cn(
                    'w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0',
                    alert.prioridade === 'baixa' && 'text-success',
                    alert.prioridade === 'media' && 'text-warning',
                    alert.prioridade === 'alta' && 'text-destructive'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs text-foreground leading-relaxed line-clamp-2">
                      {alert.aviso}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                      <span className={cn(
                        'text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                        config.labelClass
                      )}>
                        {config.label}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {format(new Date(alert.createdAt), "dd MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
