import { useState } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RECURRENCE_INTERVALS, RECURRENCE_DURATIONS, RecurrenceInterval, RecurrenceDuration } from '@/types/financial';

interface CreateRecordDialogProps {
  onSubmit: (data: {
    valor: number;
    de?: string;
    para?: string;
    tipo: 'entrada' | 'saida';
    categoria: string;
    classificacao?: 'variavel' | 'recorrente'; // REMOVIDO 'fixo'
    dataComprovante: string;
    recurrenceInterval?: RecurrenceInterval;
    recurrenceDuration?: RecurrenceDuration;
  }) => void;
  isLoading?: boolean;
  categories: { entrada: string[]; saida: string[] };
  trigger?: React.ReactNode;
}

export function CreateRecordDialog({ onSubmit, isLoading, categories, trigger }: CreateRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState('');
  const [de, setDe] = useState('');
  const [para, setPara] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [categoria, setCategoria] = useState('');
  const [classificacao, setClassificacao] = useState<'variavel' | 'recorrente' | ''>(''); // REMOVIDO 'fixo'
  const [dataComprovante, setDataComprovante] = useState(format(new Date(), 'yyyy-MM-dd'));
  // Novos estados para recorrência
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval | ''>('');
  const [recurrenceDuration, setRecurrenceDuration] = useState<RecurrenceDuration | ''>('');

  const currentCategories = tipo === 'entrada' ? categories.entrada : categories.saida;

  const handleTipoChange = (newTipo: 'entrada' | 'saida') => {
    setTipo(newTipo);
    setCategoria(''); // Reset categoria when tipo changes
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericValue = parseCurrency(valor);

    if (numericValue <= 0 || !categoria || !dataComprovante) {
      return;
    }

    // Validar campos de recorrência se classificacao === 'recorrente'
    if (classificacao === 'recorrente' && (!recurrenceInterval || !recurrenceDuration)) {
      return;
    }

    onSubmit({
      valor: numericValue,
      de: de.trim() || undefined,
      para: para.trim() || undefined,
      tipo,
      categoria,
      classificacao: classificacao || undefined,
      dataComprovante,
      recurrenceInterval: recurrenceInterval || undefined,
      recurrenceDuration: recurrenceDuration || undefined,
    });

    // Reset form
    setValor('');
    setDe('');
    setPara('');
    setTipo('saida');
    setCategoria('');
    setClassificacao('');
    setRecurrenceInterval('');
    setRecurrenceDuration('');
    setDataComprovante(format(new Date(), 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Registro</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Registro Financeiro</DialogTitle>
          <DialogDescription>
            Adicione um novo registro de entrada ou saída.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => handleTipoChange(v as 'entrada' | 'saida')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria || undefined} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classificacao">Classificação</Label>
              <Select value={classificacao || undefined} onValueChange={(v) => setClassificacao(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variavel">Variável</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos de recorrência - mostrar apenas quando classificacao === 'recorrente' */}
          {classificacao === 'recorrente' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurrenceInterval">Intervalo *</Label>
                <Select value={recurrenceInterval || undefined} onValueChange={(v) => setRecurrenceInterval(v as RecurrenceInterval)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_INTERVALS.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurrenceDuration">Duração *</Label>
                <Select value={recurrenceDuration || undefined} onValueChange={(v) => setRecurrenceDuration(v as RecurrenceDuration)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dataComprovante">Data *</Label>
            <Input
              id="dataComprovante"
              type="date"
              value={dataComprovante}
              onChange={(e) => setDataComprovante(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="de">De (opcional)</Label>
              <Input
                id="de"
                placeholder="Origem/Cliente"
                value={de}
                onChange={(e) => setDe(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="para">Para (opcional)</Label>
              <Input
                id="para"
                placeholder="Destino/Fornecedor"
                value={para}
                onChange={(e) => setPara(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !valor || !categoria}>
              {isLoading ? 'Criando...' : 'Criar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
