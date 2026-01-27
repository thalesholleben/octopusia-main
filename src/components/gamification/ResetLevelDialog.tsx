import { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ResetLevelDialogProps {
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ResetLevelDialog({ onConfirm, isLoading }: ResetLevelDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-xs">Resetar Nível</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <AlertDialogTitle>Resetar Nível e Experiência?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              Esta ação irá resetar seu nível para <strong>Nível 1</strong> e sua experiência para <strong>0 XP</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              ✓ Suas metas continuarão intactas<br />
              ✓ Seu histórico de metas concluídas será preservado<br />
              ✓ Suas sequências (streaks) não serão afetadas<br />
              ✓ Suas conquistas (badges) serão mantidas
            </p>
            <p className="font-medium text-foreground pt-2">
              Tem certeza que deseja continuar?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Resetando...' : 'Sim, Resetar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
