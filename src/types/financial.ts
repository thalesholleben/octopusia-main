export interface FinanceRecord {
  id: string;
  userId: string;
  valor: number;
  de?: string;
  para?: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  classificacao?: 'variavel' | 'recorrente'; // REMOVIDO 'fixo'
  dataComprovante: string;
  createdAt: string;
  // Novos campos de recorrência
  isFuture?: boolean;
  recurrenceGroupId?: string;
  recurrenceInterval?: RecurrenceInterval;
  isInfinite?: boolean;
}

// Tipos de recorrência
export type RecurrenceInterval = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type RecurrenceDuration = '3_meses' | '6_meses' | '12_meses' | 'indefinido';

export const RECURRENCE_INTERVALS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
] as const;

export const RECURRENCE_DURATIONS = [
  { value: '3_meses', label: '3 meses' },
  { value: '6_meses', label: '6 meses' },
  { value: '12_meses', label: '12 meses' },
  { value: 'indefinido', label: 'Indeterminado' },
] as const;

export interface AIAlert {
  id: string;
  userId: string;
  aviso: string;
  justificativa?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  status?: 'concluido' | 'ignorado' | null;
  createdAt: string;
  updatedAt: string;
}

export type DateFilterType = 'today' | 'last7days' | 'last30days' | 'last60days' | 'thisMonth' | 'custom';

export interface DateFilter {
  type: DateFilterType;
  startDate?: Date;
  endDate?: Date;
}

// Categorias de saída
// ⚠️ IMPORTANTE: 'Contas Fixas' removido - agora usar classificacao='recorrente'
export const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Alimentação',
  'FastFood',
  'Transporte',
  'Saúde',
  'Filhos',
  'Trabalho',
  'Ferramentas',
  'Lazer e Vida Social',
  'Dívidas',
  'Reserva',
  'Objetivos',
  'Educação',
  'Imprevistos',
  'Outros'
] as const;

// Categorias de entrada
export const INCOME_CATEGORIES = [
  'Serviço',
  'Produto',
  'Outros'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];

// Tipos para categorias customizadas
export interface CustomCategory {
  id: string;
  name: string;
  tipo: 'entrada' | 'saida';
  isCustom: boolean;
}

export interface CategoriesResponse {
  defaultCategories: {
    entrada: string[];
    saida: string[];
  };
  customCategories: CustomCategory[];
}

// Classificações
// ⚠️ IMPORTANTE: 'fixo' removido - agora usar 'recorrente' para despesas fixas
export const CLASSIFICACOES = ['variavel', 'recorrente'] as const;
export type Classificacao = typeof CLASSIFICACOES[number];
