export interface FinanceRecord {
  id: number;
  client_id: number;
  valor: number;
  de: string;
  para: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  data_comprovante: string;
  created_at: string;
}

export interface AIAlert {
  id: number;
  aviso: string;
  client_id: number;
  prioridade: 'baixa' | 'media' | 'alta';
  created_at: string;
  updated_at: string;
}

export type DateFilterType = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export interface DateFilter {
  type: DateFilterType;
  startDate?: Date;
  endDate?: Date;
}

// Categorias de saída
export const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Contas Fixas',
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
  'Site',
  'Automação',
  'Design',
  'Outros'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
