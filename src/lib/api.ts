import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configurar interceptor para adicionar token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar token JWT em todas as requests + cache-busting
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Adicionar timestamp para evitar cache do navegador (GET requests)
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now()
    };
  }

  return config;
});

// Interceptor de resposta para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error || 'Erro ao conectar com o servidor';
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register') || error.config?.url?.includes('/auth/forgot-password');

    // Log detalhado para debug
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message,
    });

    // Para endpoints de autenticação, deixa o AuthContext lidar com o erro
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Mostrar toast de erro para o usuário (exceto endpoints de auth)
    if (error.response?.status === 401) {
      toast.error('Sessão expirada. Faça login novamente.');
      localStorage.removeItem('token');
      window.location.href = '/auth';
    } else if (error.response?.status === 500) {
      toast.error('Erro no servidor. Tente novamente mais tarde.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;

// Tipos de resposta
export interface User {
  id: string;
  email: string;
  displayName?: string;
  subscription?: 'none' | 'basic' | 'pro';
  report?: 'none' | 'simple' | 'advanced';
  lastReport?: string;
  notifyEmail?: boolean;
  notifyChat?: boolean;
  notifyDashboard?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

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
  recurrenceInterval?: 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
  isInfinite?: boolean;
}

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

export interface AlertsPageStats {
  totalAlerts: number;
  priorityCounts: { alta: number; media: number; baixa: number };
}

export interface AlertsPageResponse {
  alerts: AIAlert[];
  stats: AlertsPageStats;
}

export interface Statistics {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  totalTransacoes: number;
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

export interface FinanceSummaryResponse {
  kpis: FinanceKPIs;
  records: FinanceRecord[];
  alerts: AIAlert[];
}

export interface ExpenseDistributionItem {
  categoria: string;
  valor: number;
  percentual: number;
}

export interface ExpenseDistributionResponse {
  distribution: ExpenseDistributionItem[];
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedRecordsResponse {
  records: FinanceRecord[];
  pagination: PaginationMeta;
}

export interface BalanceAdjustmentResponse {
  message: string;
  record: FinanceRecord;
  adjustment: {
    previousBalance: number;
    targetBalance: number;
    difference: number;
    tipo: 'entrada' | 'saida';
  };
}

// Funções de API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, displayName?: string, registrationKey?: string) =>
    api.post<AuthResponse>('/auth/register',
      { email, password, displayName },
      { headers: registrationKey ? { 'X-Registration-Key': registrationKey } : {} }
    ),

  me: () => api.get<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
};

// Tipos de categorias
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

export const financeAPI = {
  getRecords: (params?: {
    startDate?: string;
    endDate?: string;
    tipo?: 'entrada' | 'saida';
    categoria?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedRecordsResponse>('/finance/records', { params }),

  createRecord: (data: {
    valor: number;
    de?: string;
    para?: string;
    tipo: 'entrada' | 'saida';
    categoria: string;
    classificacao?: 'variavel' | 'recorrente'; // REMOVIDO 'fixo'
    dataComprovante: string;
    recurrenceInterval?: 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
    recurrenceDuration?: '3_meses' | '6_meses' | '12_meses' | 'indefinido';
  }) => api.post<{ message: string; record?: FinanceRecord; records?: FinanceRecord[]; recurrenceGroupId?: string; totalCreated?: number }>('/finance/records', data),

  updateRecord: (id: string, data: {
    valor?: number;
    de?: string | null;
    para?: string | null;
    tipo?: 'entrada' | 'saida';
    categoria?: string;
    classificacao?: 'variavel' | 'recorrente' | null; // REMOVIDO 'fixo'
    dataComprovante?: string;
    recurrenceInterval?: 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'; // Para converter variável → recorrente
    recurrenceDuration?: '3_meses' | '6_meses' | '12_meses' | 'indefinido'; // Para converter variável → recorrente
  }, scope?: 'single' | 'future') =>
    api.put<{ message: string; record?: FinanceRecord; updatedCount?: number; totalCreated?: number; recurrenceGroupId?: string }>(`/finance/records/${id}${scope ? `?scope=${scope}` : ''}`, data),

  deleteRecord: (id: string, scope?: 'single' | 'future') =>
    api.delete<{ message: string; deletedCount?: number }>(`/finance/records/${id}${scope ? `?scope=${scope}` : ''}`),

  getAlerts: () => api.get<{ alerts: AIAlert[] }>('/finance/alerts'),

  getAlertsPage: () => api.get<AlertsPageResponse>('/finance/alerts/page'),

  updateAlertStatus: (id: string, status: 'concluido' | 'ignorado') =>
    api.patch<{ message: string; alert: AIAlert }>(`/finance/alerts/${id}/status`, { status }),

  getSummary: (params?: {
    startDate?: string;
    endDate?: string;
    tipo?: 'entrada' | 'saida';
    categoria?: string;
  }) => api.get<FinanceSummaryResponse>('/finance/summary', { params }),

  getExpenseDistribution: (params?: {
    startDate?: string;
    endDate?: string;
    categoria?: string;
  }) => api.get<ExpenseDistributionResponse>('/finance/expense-distribution', { params }),

  getStatistics: (params?: { startDate?: string; endDate?: string }) =>
    api.get<Statistics>('/finance/statistics', { params }),

  getClients: () => api.get<{ clients: string[] }>('/finance/clients'),

  // Categories
  getCategories: () => api.get<CategoriesResponse>('/finance/categories'),

  createCustomCategory: (data: { name: string; tipo: 'entrada' | 'saida' }) =>
    api.post<{ message: string; category: CustomCategory }>('/finance/categories', data),

  updateCustomCategory: (id: string, data: { name: string; tipo: 'entrada' | 'saida' }) =>
    api.put<{ message: string; category: CustomCategory }>(`/finance/categories/${id}`, data),

  deleteCustomCategory: (id: string) =>
    api.delete<{ message: string }>(`/finance/categories/${id}`),

  // Balance Adjustment
  createBalanceAdjustment: (targetBalance: number) =>
    api.post<BalanceAdjustmentResponse>('/finance/balance-adjustment', { targetBalance }),

  // Health Metrics
  getHealthMetrics: () => api.get<HealthMetricsResponse>('/finance/health-metrics'),

  // Seasonality
  getSeasonality: (tipo: 'entrada' | 'saida') =>
    api.get<SeasonalityResponse>('/finance/seasonality', { params: { tipo } }),
};

export const userAPI = {
  getSettings: () => api.get<{
    subscription: string;
    report: string;
    lastReport: string | null;
    notifyEmail: boolean;
    notifyChat: boolean;
    notifyDashboard: boolean;
  }>('/user/settings'),

  updateReportPreference: (report: 'none' | 'simple' | 'advanced') =>
    api.put<{
      subscription: string;
      report: string;
      lastReport: string | null;
    }>('/user/report-preference', { report }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>('/user/password', { currentPassword, newPassword }),

  getChatInfo: () => api.get<{
    chatId: string | null;
    chatUsername: string | null;
    isLinked: boolean;
  }>('/user/chat'),

  unlinkChat: () => api.delete<{ message: string }>('/user/chat'),

  updateNotificationPreferences: (preferences: {
    notifyEmail: boolean;
    notifyChat: boolean;
    notifyDashboard: boolean;
  }) => api.put<{
    notifyEmail: boolean;
    notifyChat: boolean;
    notifyDashboard: boolean;
  }>('/user/notification-preferences', preferences),
};

// Health Metrics API Types
export interface HealthMetricsResponse {
  score: number;
  scoreLabel: 'saudável' | 'atenção' | 'risco';
  scoreColor: 'green' | 'yellow' | 'red';
  trend?: {
    direction: 'improving' | 'stable' | 'declining';
    label: string;
    color: string;
  };
  burnRate: {
    current: number;
    sixMonths: number;
    hasLimitedData: boolean;
  };
  fixedCommitment: {
    value: number;
    status: 'saudável' | 'atenção' | 'risco';
    hasLimitedData: boolean;
  };
  survivalTime: {
    value: number;
    unit: 'horas' | 'dias' | 'meses' | 'anos';
    status: 'saudável' | 'atenção' | 'risco';
    isStable: boolean;
  };
  saldoGlobal: number;
}

export interface SeasonalityResponse {
  tipo: 'entrada' | 'saida';
  maxValue: number;
  minValue: number;
  avgValue: number;
  hasData: boolean;
}

// Goals API Types
export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'economia' | 'limite_gasto' | 'meta_receita' | 'investimento';
  targetValue: number;
  currentValue: number;
  category?: string;
  period?: 'mensal' | 'trimestral' | 'anual' | 'personalizado';
  startDate: string;
  endDate: string;
  status: 'ativo' | 'pausado' | 'concluido' | 'falhou';
  autoComplete: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  progress: number;
  atRisk: boolean;
}

export interface GoalStats {
  active: number;
  completed: number;
  failed: number;
  atRisk: number;
  total: number;
  successRate: number;
}

export interface GamificationData {
  level: number;
  levelName: string;
  experience: number;
  xpForNextLevel: number;
  xpProgress: number;
  totalGoalsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedAt: string;
  }>;
}

export const goalsAPI = {
  getGoals: (params?: { status?: string; period?: string }) =>
    api.get<{ goals: FinancialGoal[] }>('/goals', { params }),

  getStats: () => api.get<GoalStats>('/goals/stats'),

  getGoal: (id: string) => api.get<FinancialGoal>(`/goals/${id}`),

  createGoal: (data: {
    title: string;
    description?: string;
    type: string;
    targetValue: number;
    category?: string;
    period?: string;
    startDate: string;
    endDate: string;
    autoComplete?: boolean;
  }) => api.post<{ message: string; goal: FinancialGoal }>('/goals', data),

  updateGoal: (id: string, data: Partial<{
    title: string;
    description: string | null;
    targetValue: number;
    category: string | null;
    period: string | null;
    startDate: string;
    endDate: string;
    status: string;
    autoComplete: boolean;
  }>) => api.put<{ message: string; goal: FinancialGoal }>(`/goals/${id}`, data),

  deleteGoal: (id: string) => api.delete<{ message: string }>(`/goals/${id}`),

  syncProgress: (id: string) =>
    api.post<{ message: string; goal: FinancialGoal }>(`/goals/${id}/sync`),

  getAlerts: () => api.get<{ alerts: AIAlert[] }>('/goals/alerts'),

  getGamification: () => api.get<GamificationData>('/goals/user/gamification'),

  resetLevel: () => api.post<{ message: string; user: any }>('/goals/user/reset-level'),
};
