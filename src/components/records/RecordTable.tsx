import { FileText, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import type { FinanceRecord, PaginationMeta } from '@/lib/api';

interface RecordTableProps {
  records: FinanceRecord[];
  pagination?: PaginationMeta;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onEdit: (record: FinanceRecord) => void;
  onDelete: (record: FinanceRecord) => void; // Mudado de (id: string) para (record: FinanceRecord)
  isLoading?: boolean;
  isFetching?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '-';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
};

// Helper para gerar números de página com ellipsis
function generatePageNumbers(pagination: PaginationMeta): (number | string)[] {
  const { currentPage, totalPages } = pagination;
  const delta = 2; // Páginas para mostrar ao redor da página atual

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | string)[] = [];

  // Sempre mostrar primeira página
  range.push(1);

  // Ellipsis esquerda
  if (currentPage > delta + 2) {
    range.push('...');
  }

  // Páginas ao redor da atual
  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  // Ellipsis direita
  if (currentPage < totalPages - delta - 1) {
    range.push('...');
  }

  // Sempre mostrar última página
  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}

export function RecordTable({
  records,
  pagination,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  isLoading,
  isFetching
}: RecordTableProps) {
  if (isLoading) {
    return (
      <div className="card-float p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="card-float p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum registro encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Crie um novo registro ou ajuste os filtros para ver seus dados.
        </p>
      </div>
    );
  }

  return (
    <div className="card-float overflow-hidden">
      {/* Loading indicator */}
      <div className="relative">
        {isFetching && (
          <div className="absolute top-4 right-4 z-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="text-right w-[140px] whitespace-nowrap">Valor</TableHead>
              <TableHead className="w-[150px]">De</TableHead>
              <TableHead className="w-[150px]">Para</TableHead>
              <TableHead className="w-[110px]">Tipo</TableHead>
              <TableHead className="w-[160px]">Categoria</TableHead>
              <TableHead className="w-[140px]">Classificação</TableHead>
              <TableHead className="text-right w-[110px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium text-sm whitespace-nowrap">
                  {formatDate(record.dataComprovante)}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-medium whitespace-nowrap',
                  record.tipo === 'entrada' ? 'text-green-500' : 'text-orange-500'
                )}>
                  {record.tipo === 'saida' ? '-' : '+'}{formatCurrency(record.valor)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                  {record.de || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                  {record.para || '-'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                    record.tipo === 'entrada'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-orange-500/10 text-orange-500'
                  )}>
                    {record.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground whitespace-nowrap max-w-full truncate">
                    {record.categoria}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {record.classificacao ? (
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                      record.classificacao === 'variavel' && 'bg-purple-500/10 text-purple-500',
                      record.classificacao === 'recorrente' && 'bg-cyan-500/10 text-cyan-500',
                    )}>
                      {record.classificacao === 'variavel' && 'Variável'}
                      {record.classificacao === 'recorrente' && 'Recorrente'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination UI */}
      {pagination && (
        <div className="border-t p-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            {/* Info e seletor */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {pagination.totalRecords} registro{pagination.totalRecords !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(val) => onPageSizeChange?.(Number(val))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">por pág</span>
              </div>
            </div>

            {/* Navegação em linha - only show if multiple pages */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => onPageChange?.(currentPage - 1)}
                  className="h-9 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <span className="text-sm font-medium">
                  Página {currentPage} de {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange?.(currentPage + 1)}
                  className="h-9 gap-1"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Left: Info + Page Size Selector */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground whitespace-nowrap">
              <span>
                {pagination.totalRecords} registro{pagination.totalRecords !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(val) => onPageSizeChange?.(Number(val))}
                >
                  <SelectTrigger className="w-[70px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>registros por página</span>
              </div>
            </div>

            {/* Right: Pagination Controls - only show if multiple pages */}
            {pagination.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => pagination.hasPrevPage && onPageChange?.(currentPage - 1)}
                      className={cn(
                        !pagination.hasPrevPage && 'pointer-events-none opacity-50',
                        'cursor-pointer'
                      )}
                    />
                  </PaginationItem>

                  {/* Page Numbers (smart ellipsis logic) */}
                  {generatePageNumbers(pagination).map((pageNum, idx) =>
                    pageNum === '...' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => onPageChange?.(Number(pageNum))}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => pagination.hasNextPage && onPageChange?.(currentPage + 1)}
                      className={cn(
                        !pagination.hasNextPage && 'pointer-events-none opacity-50',
                        'cursor-pointer'
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
