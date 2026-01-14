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

// Adicionar token JWT em todas as requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error || 'Erro ao conectar com o servidor';

    // Log detalhado para debug
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message,
    });

    // Mostrar toast de erro para o usuário
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

export interface Statistics {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  totalTransacoes: number;
}

// Funções de API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, displayName?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, displayName }),

  me: () => api.get<{ user: User }>('/auth/me'),
};

export const financeAPI = {
  getRecords: (params?: {
    startDate?: string;
    endDate?: string;
    tipo?: 'entrada' | 'saida';
    categoria?: string;
  }) => api.get<{ records: FinanceRecord[] }>('/finance/records', { params }),

  getAlerts: () => api.get<{ alerts: AIAlert[] }>('/finance/alerts'),

  getStatistics: (params?: { startDate?: string; endDate?: string }) =>
    api.get<Statistics>('/finance/statistics', { params }),

  getClients: () => api.get<{ clients: string[] }>('/finance/clients'),
};
