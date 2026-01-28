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
        <AlertDialogContent className="max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Este registro faz parte de uma série de registros recorrentes. Como deseja excluir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <AlertDialogAction
                onClick={() => {
                  onConfirm(record.id, 'single');
                  onOpenChange(false);
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Apenas este
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  onConfirm(record.id, 'future');
                  onOpenChange(false);
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Todos os futuros
              </AlertDialogAction>
            </div>
            <AlertDialogCancel className="w-full">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
