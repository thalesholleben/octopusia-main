import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import octopusLogo from '@/assets/octopus-logo.svg';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
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
      if (isLogin) {
        await signIn(email, password);
      } else {
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
      }
    } catch (err) {
      // Errors are already handled by AuthContext with toast
    } finally {
      setLoading(false);
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
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Acesse seu dashboard financeiro' 
              : 'Crie sua conta para começar'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
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
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
            
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin 
                ? 'Não tem conta? Criar uma' 
                : 'Já tem conta? Entrar'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
