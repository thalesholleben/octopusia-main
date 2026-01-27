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
  de: string | null;
  para: string | null;
  dataComprovante: string;
  classificacao?: string | null;
  createdAt: string;
}

export interface AIAlertDTO {
  id: string;
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta';
  createdAt: string;
}
