import { useState, useEffect } from 'react';
import { ChevronDown, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateFilter, DateFilterType } from '@/types/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const dateFilterLabels: Record<DateFilterType, string> = {
  today: 'Hoje',
  last7days: '7 dias',
  last30days: '30 dias',
  thisMonth: 'Mês atual',
  custom: 'Personalizado',
};

const dateFilterLabelsFull: Record<DateFilterType, string> = {
  today: 'Hoje',
  last7days: 'Últimos 7 dias',
  last30days: 'Últimos 30 dias',
  thisMonth: 'Mês atual',
  custom: 'Personalizado',
};

export function FilterBar({
  dateFilter,
  onDateFilterChange,
  onRefresh,
  isRefreshing = false,
}: FilterBarProps) {
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(dateFilter.startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(dateFilter.endDate);

  // Sync temp dates when dialog opens
  useEffect(() => {
    if (customDateOpen) {
      setTempStartDate(dateFilter.startDate);
      setTempEndDate(dateFilter.endDate);
    }
  }, [customDateOpen, dateFilter.startDate, dateFilter.endDate]);

  const handleDateFilterSelect = (type: DateFilterType) => {
    if (type === 'custom') {
      setCustomDateOpen(true);
    } else {
      onDateFilterChange({ type });
    }
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      onDateFilterChange({
        type: 'custom',
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
      setCustomDateOpen(false);
    }
  };

  const getDateFilterDisplay = () => {
    if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
      return `${format(dateFilter.startDate, 'dd/MM')} - ${format(dateFilter.endDate, 'dd/MM')}`;
    }
    return dateFilterLabels[dateFilter.type];
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Date Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 sm:h-10 px-2 sm:px-4 bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50 transition-all text-xs sm:text-sm"
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary" />
            <span>{getDateFilterDisplay()}</span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {(Object.keys(dateFilterLabelsFull) as DateFilterType[]).map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => handleDateFilterSelect(type)}
              className={cn(
                'cursor-pointer',
                dateFilter.type === type && 'bg-primary/10 text-primary'
              )}
            >
              {dateFilterLabelsFull[type]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Dialog */}
      <Dialog open={customDateOpen} onOpenChange={setCustomDateOpen}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Selecionar Período</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Data inicial</label>
                <CalendarComponent
                  mode="single"
                  selected={tempStartDate}
                  onSelect={setTempStartDate}
                  locale={ptBR}
                  disabled={(date) => date > new Date()}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Data final</label>
                <CalendarComponent
                  mode="single"
                  selected={tempEndDate}
                  onSelect={setTempEndDate}
                  locale={ptBR}
                  disabled={(date) =>
                    date > new Date() || (tempStartDate ? date < tempStartDate : false)
                  }
                  className="rounded-md border"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCustomDateOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCustomDateApply}
                className="flex-1"
                disabled={!tempStartDate || !tempEndDate}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      )}
    </div>
  );
}
