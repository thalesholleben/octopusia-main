import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState<'none' | 'basic' | 'pro'>('none');
  const [reportPreference, setReportPreference] = useState<'none' | 'simple' | 'advanced'>('none');
  const [lastReport, setLastReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await userAPI.getSettings();
        setSubscription(data.subscription as 'none' | 'basic' | 'pro');
        setReportPreference(data.report as 'none' | 'simple' | 'advanced');
        setLastReport(data.lastReport);
      } catch (error) {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateReportPreference(reportPreference);
      toast.success('Preferências atualizadas com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao salvar preferências';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getSubscriptionBadge = () => {
    switch (subscription) {
      case 'pro':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Pro</Badge>;
      case 'basic':
        return <Badge className="bg-blue-500">Basic</Badge>;
      default:
        return <Badge variant="secondary">Gratuito</Badge>;
    }
  };

  const getSubscriptionDescription = () => {
    switch (subscription) {
      case 'pro':
        return 'Acesso completo a todos os recursos, incluindo relatórios avançados';
      case 'basic':
        return 'Acesso aos recursos básicos e relatórios simples';
      default:
        return 'Plano gratuito com recursos limitados';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSignOut={signOut} />
        <main className="container px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSignOut={signOut} />

      <main className="container px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold gradient-text">Configurações</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas preferências e assinatura</p>
        </div>

        <div className="grid gap-6 max-w-3xl">
          {/* Subscription Card */}
          <Card className="card-float opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Assinatura</CardTitle>
              </div>
              <CardDescription>Seu plano atual e benefícios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
                  <div className="flex items-center gap-2">
                    {getSubscriptionBadge()}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{getSubscriptionDescription()}</p>
            </CardContent>
          </Card>

          {/* Report Preferences Card */}
          <Card className="card-float opacity-0 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Relatórios</CardTitle>
              </div>
              <CardDescription>Configure o tipo de relatório que deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report">Tipo de Relatório</Label>
                <Select
                  value={reportPreference}
                  onValueChange={(value: 'none' | 'simple' | 'advanced') => setReportPreference(value)}
                >
                  <SelectTrigger id="report" className="bg-secondary/50">
                    <SelectValue placeholder="Selecione o tipo de relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Desativado</SelectItem>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem
                      value="advanced"
                      disabled={subscription !== 'pro'}
                    >
                      Avançado {subscription !== 'pro' && '(Apenas Pro)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {subscription !== 'pro' && (
                  <p className="text-xs text-muted-foreground">
                    Relatório avançado disponível apenas para assinatura Pro
                  </p>
                )}
              </div>

              {lastReport && (
                <div className="p-3 bg-secondary/20 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Último relatório enviado</p>
                  <p className="text-sm font-medium">
                    {format(new Date(lastReport), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
