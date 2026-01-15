import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import octopusLogo from '@/assets/octopus-logo.svg';

type AuthMode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'register') {
        if (password.length < 6) {
          toast({
            variant: 'destructive',
            title: 'Senha muito curta',
            description: 'A senha deve ter pelo menos 6 caracteres',
          });
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, registrationKey);
      } else if (mode === 'forgot') {
        const { data } = await authAPI.forgotPassword(email);
        sonnerToast.success(data.message);
        setEmail('');
        setMode('login');
      }
    } catch (err) {
      if (mode === 'forgot') {
        sonnerToast.error('Erro ao enviar solicitação. Tente novamente.');
      }
      // Other errors are handled by AuthContext with toast
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Entrar';
      case 'register': return 'Criar Conta';
      case 'forgot': return 'Recuperar Senha';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Acesse seu dashboard financeiro';
      case 'register': return 'Crie sua conta para começar';
      case 'forgot': return 'Digite seu email para receber instruções';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Carregando...';
    switch (mode) {
      case 'login': return 'Entrar';
      case 'register': return 'Criar Conta';
      case 'forgot': return 'Enviar';
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-float">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={octopusLogo} alt="Octopusia" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationKey">Chave de Registro</Label>
                  <Input
                    id="registrationKey"
                    type="text"
                    placeholder="Chave fornecida pelo administrador"
                    value={registrationKey}
                    onChange={(e) => setRegistrationKey(e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Solicite a chave de acesso ao administrador do sistema
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-muted/50"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {getButtonText()}
            </Button>

            <div className="flex items-center justify-center gap-3 text-sm">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Não tem conta?
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </>
              )}

              {(mode === 'register' || mode === 'forgot') && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Voltar ao login
                </button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
