import { useState } from 'react';
import { Plus, Target, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/financial';
import { format, addMonths, addDays, startOfMonth, endOfMonth } from 'date-fns';

interface CreateGoalDialogProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    type: string;
    targetValue: number;
    category?: string;
    period?: string;
    startDate: string;
    endDate: string;
    autoComplete?: boolean;
  }) => void;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

const GOAL_TYPES = [
  { value: 'economia', label: 'Economia', icon: PiggyBank, description: 'Economizar um valor específico' },
  { value: 'limite_gasto', label: 'Limite de Gasto', icon: TrendingDown, description: 'Não ultrapassar um valor' },
  { value: 'meta_receita', label: 'Meta de Receita', icon: TrendingUp, description: 'Atingir um valor em receitas' },
  { value: 'investimento', label: 'Investimento', icon: Wallet, description: 'Investir um valor específico' },
];

const PERIODS = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
];

export function CreateGoalDialog({ onSubmit, isLoading, trigger }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('economia');
  const [targetValue, setTargetValue] = useState('');
  const [category, setCategory] = useState<string>('');
  const [period, setPeriod] = useState<string>('mensal');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [autoComplete, setAutoComplete] = useState(true);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const start = new Date();

    switch (value) {
      case 'mensal':
        setStartDate(format(startOfMonth(start), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(start), 'yyyy-MM-dd'));
        break;
      case 'trimestral':
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(addMonths(start, 3), 'yyyy-MM-dd'));
        break;
      case 'anual':
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(addMonths(start, 12), 'yyyy-MM-dd'));
        break;
      // personalizado - keep current dates
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(targetValue.replace(/[^\d,.-]/g, '').replace(',', '.'));

    if (!title.trim() || isNaN(value) || value <= 0) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      targetValue: value,
      category: category || undefined,
      period: period || undefined,
      startDate,
      endDate,
      autoComplete,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('economia');
    setTargetValue('');
    setCategory('');
    setPeriod('mensal');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    setAutoComplete(true);
    setOpen(false);
  };

  const categories = type === 'meta_receita'
    ? INCOME_CATEGORIES
    : EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Meta</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Criar Nova Meta
          </DialogTitle>
          <DialogDescription>
            Defina uma meta financeira para acompanhar seu progresso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Meta *</Label>
            <Input
              id="title"
              placeholder="Ex: Economizar para viagem"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva sua meta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Meta *</Label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_TYPES.map(({ value, label, icon: Icon, description: desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border transition-all text-left',
                    type === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn(
                      'w-4 h-4',
                      type === value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Valor Alvo (R$) *</Label>
              <Input
                id="targetValue"
                placeholder="0,00"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Select value={category || undefined} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={period === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Término *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium">Conclusão Automática</p>
              <p className="text-xs text-muted-foreground">
                Marcar como concluída quando atingir o valor
              </p>
            </div>
            <Switch
              checked={autoComplete}
              onCheckedChange={setAutoComplete}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim() || !targetValue}>
              {isLoading ? 'Criando...' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
