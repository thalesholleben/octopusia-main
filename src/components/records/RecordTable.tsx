import { FileText, Pencil, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { FinanceRecord } from '@/lib/api';

interface RecordTableProps {
  records: FinanceRecord[];
  onEdit: (record: FinanceRecord) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
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

export function RecordTable({ records, onEdit, onDelete, isLoading }: RecordTableProps) {
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>De</TableHead>
              <TableHead>Para</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium text-sm">
                  {formatDate(record.dataComprovante)}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-medium',
                  record.tipo === 'entrada' ? 'text-green-500' : 'text-orange-500'
                )}>
                  {record.tipo === 'saida' ? '-' : '+'}{formatCurrency(record.valor)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {record.de || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {record.para || '-'}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    record.tipo === 'entrada'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-orange-500/10 text-orange-500'
                  )}>
                    {record.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {record.categoria}
                  </span>
                </TableCell>
                <TableCell className="text-right">
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
                      onClick={() => onDelete(record.id)}
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
  );
}
