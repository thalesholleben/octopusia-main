import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FinanceRecord } from '@/lib/api';

interface EditRecordDialogProps {
  record: FinanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { id: string; data: {
    valor?: number;
    de?: string | null;
    para?: string | null;
    tipo?: 'entrada' | 'saida';
    categoria?: string;
    classificacao?: 'fixo' | 'variavel' | 'recorrente' | null;
    dataComprovante?: string;
  }}) => void;
  isLoading?: boolean;
  categories: { entrada: string[]; saida: string[] };
}

export function EditRecordDialog({
  record,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  categories,
}: EditRecordDialogProps) {
  const [valor, setValor] = useState('');
  const [de, setDe] = useState('');
  const [para, setPara] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [categoria, setCategoria] = useState('');
  const [classificacao, setClassificacao] = useState<'fixo' | 'variavel' | 'recorrente' | ''>('');
  const [dataComprovante, setDataComprovante] = useState('');

  // Populate form when record changes
  useEffect(() => {
    if (record) {
      setValor(record.valor.toString().replace('.', ','));
      setDe(record.de || '');
      setPara(record.para || '');
      setTipo(record.tipo);
      setCategoria(record.categoria);
      setClassificacao(record.classificacao || '');
      try {
        const date = parseISO(record.dataComprovante);
        setDataComprovante(format(date, 'yyyy-MM-dd'));
      } catch {
        setDataComprovante('');
      }
    }
  }, [record]);

  const currentCategories = tipo === 'entrada' ? categories.entrada : categories.saida;

  const handleTipoChange = (newTipo: 'entrada' | 'saida') => {
    setTipo(newTipo);
    // Only reset if current category is not in the new type's categories
    const newCategories = newTipo === 'entrada' ? categories.entrada : categories.saida;
    if (!newCategories.includes(categoria)) {
      setCategoria('');
    }
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!record) return;

    const numericValue = parseCurrency(valor);

    if (numericValue <= 0 || !categoria || !dataComprovante) {
      return;
    }

    onSubmit({
      id: record.id,
      data: {
        valor: numericValue,
        de: de.trim() || null,
        para: para.trim() || null,
        tipo,
        categoria,
        classificacao: classificacao || null,
        dataComprovante,
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
          <DialogDescription>
            Modifique os dados do registro financeiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => handleTipoChange(v as 'entrada' | 'saida')}>
                <SelectTrigger id="edit-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor (R$) *</Label>
              <Input
                id="edit-valor"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoria *</Label>
              <Select value={categoria || undefined} onValueChange={setCategoria}>
                <SelectTrigger id="edit-categoria">
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
              <Label htmlFor="edit-classificacao">Classificação</Label>
              <Select value={classificacao || undefined} onValueChange={(v) => setClassificacao(v as any)}>
                <SelectTrigger id="edit-classificacao">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="variavel">Variável</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-dataComprovante">Data *</Label>
            <Input
              id="edit-dataComprovante"
              type="date"
              value={dataComprovante}
              onChange={(e) => setDataComprovante(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-de">De (opcional)</Label>
              <Input
                id="edit-de"
                placeholder="Origem/Cliente"
                value={de}
                onChange={(e) => setDe(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-para">Para (opcional)</Label>
              <Input
                id="edit-para"
                placeholder="Destino/Fornecedor"
                value={para}
                onChange={(e) => setPara(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !valor || !categoria}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
