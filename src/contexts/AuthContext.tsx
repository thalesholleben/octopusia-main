import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, type User } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string, registrationKey?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se há token ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authAPI.me();
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await authAPI.login(email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      // Always show generic message for security - don't reveal if email or password is wrong
      toast.error('Email ou senha inválidos. Tente novamente.');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string, registrationKey?: string) => {
    try {
      const { data } = await authAPI.register(email, password, displayName, registrationKey);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar conta';
      toast.error(message);
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Você saiu da sua conta');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
