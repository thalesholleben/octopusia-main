import { useState } from 'react';
import { Settings2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onSubmit: (targetBalance: number) => void;
  isLoading?: boolean;
}

export function BalanceAdjustmentDialog({
  open,
  onOpenChange,
  currentBalance,
  onSubmit,
  isLoading,
}: BalanceAdjustmentDialogProps) {
  const [inputValue, setInputValue] = useState('');

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBalance = parseCurrency(inputValue);

    if (isNaN(targetBalance)) {
      return;
    }

    onSubmit(targetBalance);
  };

  const handleClose = () => {
    setInputValue('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Ajustar Saldo da Conta
          </DialogTitle>
          <DialogDescription>
            Corrija manualmente o saldo quando o app não corresponder ao valor real da conta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Use este ajuste apenas se o saldo do app não bater com o saldo real da conta.
              O ajuste cria um registro financeiro real. Muitos ajustes frequentes podem reduzir a precisão das análises.
            </AlertDescription>
          </Alert>

          {/* Current Balance Display */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <Label className="text-xs text-muted-foreground">Saldo atual no sistema</Label>
            <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
          </div>

          {/* Target Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="targetBalance">Saldo correto da conta *</Label>
            <Input
              id="targetBalance"
              placeholder="R$ 0,00"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Digite o saldo real que deveria estar sendo exibido
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !inputValue}>
              {isLoading ? 'Ajustando...' : 'Ajustar Saldo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
