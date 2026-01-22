export interface FinanceRecord {
  id: string;
  userId: string;
  valor: number;
  de?: string;
  para?: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  dataComprovante: string;
  createdAt: string;
}

export interface AIAlert {
  id: string;
  userId: string;
  aviso: string;
  prioridade: 'baixa' | 'media' | 'alta';
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
