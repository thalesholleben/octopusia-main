export interface ReportDTO {
  id: string;
  userId: string;
  status: 'pending' | 'generating' | 'sent' | 'failed' | 'insufficient_data';
  type: 'simple' | 'advanced';
  content: string | null;
  requestedAt: string;
  generatedAt: string | null;
  sentAt: string | null;
  countsForLimit: boolean;
  errorMessage: string | null;
  filterStartDate: string | null;
  filterEndDate: string | null;
}

export interface ReportStatusDTO {
  canGenerate: boolean;
  reason?: string;
  cooldownEndsAt?: string;
  remainingReports: number;
  totalReportsThisMonth: number;
  lastReport?: ReportDTO;
  hasInsufficientData?: boolean;
}

export interface GenerateReportRequest {
  filterStartDate?: string;
  filterEndDate?: string;
}

export interface GenerateReportResponse {
  success: boolean;
  message: string;
  report?: ReportDTO;
  insufficientData?: boolean;
}

export interface WebhookCallbackPayload {
  reportId: string;
  status: 'sent' | 'failed';
  content?: string;
  errorMessage?: string;
}

export interface ReportWebhookPayload {
  reportId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  reportType: 'simple' | 'advanced';
  timestamp: string;
  filters: {
    startDate?: string;
    endDate?: string;
  };
  summary: {
    kpis: {
      saldo: number;
      entradas: number;
      saidas: number;
      lucroLiquido: number;
      margemLiquida: number;
      ticketMedio: number;
      mediaMensal: number;
      totalTransacoes: number;
    };
    healthMetrics?: {
      score: number;
      burnRate: number;
      fixedCommitment: number;
      survivalTime: number;
    };
  };
}
