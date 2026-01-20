import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Key, MessageCircle, Unlink, Bell, Lock } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Chat info states
  const [chatInfo, setChatInfo] = useState<{
    chatId: string | null;
    chatUsername: string | null;
    isLinked: boolean;
  }>({ chatId: null, chatUsername: null, isLinked: false });
  const [unlinkingChat, setUnlinkingChat] = useState(false);

  // Notification preferences states
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifyDashboard, setNotifyDashboard] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

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
        setNotifyEmail(data.notifyEmail);
        setNotifyChat(data.notifyChat);
        setNotifyDashboard(data.notifyDashboard);

        // Carregar info do chat
        const chatData = await userAPI.getChatInfo();
        setChatInfo(chatData.data);
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

  const handleChangePassword = async () => {
    // Validação frontend
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setChangingPassword(true);
    try {
      await userAPI.changePassword(currentPassword, newPassword);
      toast.success('Senha alterada com sucesso!');
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao alterar senha';
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUnlinkChat = async () => {
    if (!confirm('Tem certeza que deseja desvincular seu chat? Você precisará vinculá-lo novamente para usar o bot.')) {
      return;
    }

    setUnlinkingChat(true);
    try {
      await userAPI.unlinkChat();
      toast.success('Chat desvinculado com sucesso!');
      // Atualizar estado
      setChatInfo({ chatId: null, chatUsername: null, isLinked: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao desvincular chat';
      toast.error(message);
    } finally {
      setUnlinkingChat(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await userAPI.updateNotificationPreferences({
        notifyEmail,
        // Para planos não-PRO, sempre enviar false para notifyChat
        notifyChat: subscription === 'pro' ? notifyChat : false,
        notifyDashboard,
      });
      toast.success('Preferências de notificação atualizadas!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao salvar preferências';
      toast.error(message);
    } finally {
      setSavingNotifications(false);
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
                    {(() => {
                      try {
                        return format(new Date(lastReport), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
                      } catch (e) {
                        return 'Data inválida';
                      }
                    })()}
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

          {/* Security Card - Change Password */}
          <Card className="card-float opacity-0 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <CardTitle>Segurança</CardTitle>
              </div>
              <CardDescription>Altere sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-secondary/50"
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary/50"
                  placeholder="Digite a nova senha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary/50"
                  placeholder="Digite a nova senha novamente"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A senha deve ter no mínimo 6 caracteres
              </p>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full sm:w-auto"
              >
                {changingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>

          {/* Chat Management Card */}
          <Card className="card-float opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <CardTitle>Chat Vinculado</CardTitle>
              </div>
              <CardDescription>Gerencie a vinculação do seu chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {chatInfo.isLinked ? (
                <>
                  <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Chat ID</p>
                      <p className="text-sm font-mono">{chatInfo.chatId}</p>
                    </div>
                    {chatInfo.chatUsername && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Username</p>
                        <p className="text-sm">@{chatInfo.chatUsername}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Conectado
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={handleUnlinkChat}
                    disabled={unlinkingChat}
                    variant="destructive"
                    className="w-full sm:w-auto gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    {unlinkingChat ? 'Desvinculando...' : 'Desvincular Chat'}
                  </Button>
                </>
              ) : (
                <div className="p-4 bg-secondary/20 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum chat vinculado. Use o bot para vincular sua conta.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences Card */}
          <Card className="card-float opacity-0 animate-fade-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>Notificações</CardTitle>
              </div>
              <CardDescription>Configure como deseja receber alertas da IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifyEmail">Notificações por Email</Label>
                    <p className="text-xs text-muted-foreground">
                      Receber alertas da IA por email
                    </p>
                  </div>
                  <Switch
                    id="notifyEmail"
                    checked={notifyEmail}
                    onCheckedChange={setNotifyEmail}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="notifyChat">Notificações pelo Chat</Label>
                      {subscription !== 'pro' && (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <Lock className="w-3 h-3" />
                          <span>Somente PRO</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Receber alertas da IA pelo Telegram/WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="notifyChat"
                    checked={subscription === 'pro' ? notifyChat : false}
                    onCheckedChange={setNotifyChat}
                    disabled={subscription !== 'pro' || !chatInfo.isLinked}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifyDashboard">Notificações no Dashboard</Label>
                    <p className="text-xs text-muted-foreground">
                      Exibir alertas da IA no painel principal
                    </p>
                  </div>
                  <Switch
                    id="notifyDashboard"
                    checked={notifyDashboard}
                    onCheckedChange={setNotifyDashboard}
                  />
                </div>
              </div>

              {!chatInfo.isLinked && (
                <p className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded border border-border">
                  ℹ️ Vincule seu chat para receber notificações pelo Telegram/WhatsApp
                </p>
              )}

              <Button
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="w-full sm:w-auto"
              >
                {savingNotifications ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
