import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { FinanceRecord } from '@/lib/api';

interface DeleteRecordDialogProps {
  record: FinanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, scope?: 'single' | 'future') => void;
}

export function DeleteRecordDialog({
  record,
  open,
  onOpenChange,
  onConfirm,
}: DeleteRecordDialogProps) {
  // Se o registro não tem recorrência, mostrar dialog simples
  if (record && !record.recurrenceGroupId) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm(record.id);
                onOpenChange(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Se o registro tem recorrência, mostrar dialog com opções
  if (record && record.recurrenceGroupId) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Este registro faz parte de uma série de registros recorrentes. Como deseja excluir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <AlertDialogAction
                onClick={() => {
                  onConfirm(record.id, 'single');
                  onOpenChange(false);
                }}
                className="bg-primary hover:bg-primary/90 flex-1"
              >
                Apenas este registro
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  onConfirm(record.id, 'future');
                  onOpenChange(false);
                }}
                className="bg-destructive hover:bg-destructive/90 flex-1"
              >
                Este e todos os futuros
              </AlertDialogAction>
            </div>
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
