import { Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RecordFiltersProps {
  startDate?: Date;
  endDate?: Date;
  tipoFilter?: 'entrada' | 'saida';
  categoriaFilter?: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onTipoChange: (tipo: 'entrada' | 'saida' | undefined) => void;
  onCategoriaChange: (categoria: string | undefined) => void;
  categories: { entrada: string[]; saida: string[] };
}

export function RecordFilters({
  startDate,
  endDate,
  tipoFilter,
  categoriaFilter,
  onStartDateChange,
  onEndDateChange,
  onTipoChange,
  onCategoriaChange,
  categories,
}: RecordFiltersProps) {
  const hasFilters = startDate || endDate || tipoFilter || categoriaFilter;

  const allCategories = [...new Set([...categories.entrada, ...categories.saida])].sort();

  const handleClearFilters = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
    onTipoChange(undefined);
    onCategoriaChange(undefined);
  };

  return (
    <div className="card-float p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Filtros</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-[140px] h-9"
              placeholder="Data início"
            />
            <span className="text-muted-foreground text-sm">até</span>
            <Input
              type="date"
              value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-[140px] h-9"
              placeholder="Data fim"
            />
          </div>

          <Select
            value={tipoFilter || 'all'}
            onValueChange={(value) => onTipoChange(value === 'all' ? undefined : value as 'entrada' | 'saida')}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoriaFilter || 'all'}
            onValueChange={(value) => onCategoriaChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
