export interface FinanceFilters {
  startDate?: string;
  endDate?: string;
  tipo?: 'entrada' | 'saida';
  categoria?: string;
}

export interface FinanceKPIs {
  saldo: number;
  entradas: number;
  saidas: number;
  lucroLiquido: number;
  margemLiquida: number;
  ticketMedio: number;
  ticketMedioEntrada: number;
  mediaMensal: number;
  variacaoMensal: number;
  variacaoMensalReais: number;
  variacaoMargem: number;
  variacaoSaidas: number;
  totalTransacoes: number;
}

export interface FinanceRecordDTO {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
  de: string;
  para: string;
  dataComprovante: string;
  descricao?: string;
  classificacao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAlertDTO {
  id: string;
  tipo: string;
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta';
  createdAt: string;
}
