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
  userId: string;
  aviso: string;
  justificativa?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  status: 'concluido' | 'ignorado' | null;
  createdAt: string;
  updatedAt: string;
}

// Advanced Health Metrics - Health Score 2.0
export interface PillarResult {
  name: string;      // Nome em PT-BR
  value: number;     // Valor calculado (ratio ou %)
  score: number;     // Score band-based 0-100
  weight: number;    // Peso (0.10 a 0.20)
}

export interface TrendData {
  direction: 'improving' | 'stable' | 'declining';
  label: string;
  color: string;
}

export interface AdvancedHealthMetricsResponse {
  score: number;
  scoreLabel: 'sustentável' | 'em atenção' | 'risco progressivo';
  scoreColor: 'green' | 'yellow' | 'red';
  horizon: '30d';

  pillars: {
    cashFlowStability: PillarResult;    // 20%
    predictability: PillarResult;        // 20%
    operationalMargin: PillarResult;     // 20%
    futurePressure: PillarResult;        // 15%
    flowQuality: PillarResult;           // 15%
    resilience: PillarResult;            // 10%
  };

  trend?: TrendData;
}
