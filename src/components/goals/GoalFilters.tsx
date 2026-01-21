import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GoalFiltersProps {
  statusFilter: string | undefined;
  periodFilter: string | undefined;
  onStatusChange: (value: string | undefined) => void;
  onPeriodChange: (value: string | undefined) => void;
}

export function GoalFilters({
  statusFilter,
  periodFilter,
  onStatusChange,
  onPeriodChange,
}: GoalFiltersProps) {
  const hasFilters = statusFilter || periodFilter;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-xs sm:text-sm font-medium">Filtros:</span>
      </div>

      <Select
        value={statusFilter || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value)}
      >
        <SelectTrigger className="w-[130px] sm:w-[140px] h-8 text-xs sm:text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="ativo">Ativos</SelectItem>
          <SelectItem value="pausado">Pausados</SelectItem>
          <SelectItem value="concluido">Concluídos</SelectItem>
          <SelectItem value="falhou">Não Atingidos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={periodFilter || 'all'}
        onValueChange={(value) => onPeriodChange(value === 'all' ? undefined : value)}
      >
        <SelectTrigger className="w-[130px] sm:w-[150px] h-8 text-xs sm:text-sm">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="mensal">Mensal</SelectItem>
          <SelectItem value="trimestral">Trimestral</SelectItem>
          <SelectItem value="anual">Anual</SelectItem>
          <SelectItem value="personalizado">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStatusChange(undefined);
            onPeriodChange(undefined);
          }}
          className="h-8 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
        >
          Limpar
        </Button>
      )}
    </div>
  );
}
