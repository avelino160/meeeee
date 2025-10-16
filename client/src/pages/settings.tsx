import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Zap,
  MessageSquare,
  Clock,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  CreditCard,
  HelpCircle,
  Mail,
  Check,
  Star,
  ChevronDown,
  Phone,
  Send,
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "RanZap",
    companyEmail: "contato@ranzap.com",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  });

  // WhatsApp Settings State
  const [whatsappSettings, setWhatsappSettings] = useState({
    autoReconnect: true,
    messageDelay: 3,
    maxRetries: 3,
    enableWebhook: false,
    webhookUrl: "",
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignComplete: true,
    connectionLost: true,
    dailyReport: false,
    errorAlerts: true,
  });

  // Automation Settings State
  const [automationSettings, setAutomationSettings] = useState({
    autoStartCampaigns: false,
    pauseOnError: true,
    maxMessagesPerHour: 100,
    enableScheduling: true,
  });

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });

  // Current Plan State
  const [currentPlan, setCurrentPlan] = useState("free");

  // FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Como conectar minha conta WhatsApp?",
      answer: "Vá até o menu lateral e clique em 'Gerenciar Conexão'. Escaneie o QR Code com seu WhatsApp e aguarde a confirmação de conexão."
    },
    {
      question: "Qual o limite de mensagens por hora?",
      answer: "O limite depende do seu plano. Plano Gratuito: 50 mensagens/hora, Plano Pro: 200 mensagens/hora, Plano Business: 1000 mensagens/hora."
    },
    {
      question: "Como criar um funil de vendas?",
      answer: "Acesse 'Funis de venda' no menu, clique em 'Criar Novo Funil' e siga o assistente para configurar seus gatilhos, mensagens e ações."
    },
    {
      question: "Posso agendar campanhas?",
      answer: "Sim! Na criação ou edição da campanha, você pode definir data e hora específicas para início automático."
    },
    {
      question: "Como importar meus contatos?",
      answer: "Na página de Contatos, clique em 'Importar' e faça upload de um arquivo CSV com os dados (nome, telefone, email)."
    },
    {
      question: "O que fazer se minha conta for bloqueada?",
      answer: "Bloqueios geralmente ocorrem por envio excessivo. Aguarde 24h, reduza o limite de mensagens e respeite as diretrizes do WhatsApp Business."
    },
    {
      question: "Posso usar múltiplas contas WhatsApp?",
      answer: "No plano Business você pode conectar até 5 contas diferentes. Nos outros planos apenas 1 conta."
    },
    {
      question: "Como funciona o suporte técnico?",
      answer: "Plano Free: suporte via email em 48h. Plano Pro: suporte prioritário em 24h. Plano Business: suporte via chat em tempo real."
    }
  ];

  const handleSendSupport = async () => {
    if (!supportForm.subject || !supportForm.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha assunto e mensagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Mensagem enviada",
        description: "Nossa equipe responderá em breve.",
      });
      
      setSupportForm({ subject: "", message: "", priority: "medium" });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-card border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center" data-testid="text-page-title">
                    <SettingsIcon className="h-8 w-8 mr-3 text-primary" />
                    Configurações
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Gerencie as configurações do sistema e preferências
                  </p>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-save-settings"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs defaultValue="general" className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-2">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4" data-testid="tabs-settings">
                  <TabsTrigger value="general" data-testid="tab-general">
                    <Globe className="h-4 w-4 mr-2" />
                    Geral
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="notifications" data-testid="tab-notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
                  </TabsTrigger>
                  <TabsTrigger value="automation" data-testid="tab-automation">
                    <Zap className="h-4 w-4 mr-2" />
                    Automação
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-3 lg:w-auto" data-testid="tabs-settings-extra">
                  <TabsTrigger value="plans" data-testid="tab-plans">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Planos
                  </TabsTrigger>
                  <TabsTrigger value="support" data-testid="tab-support">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Suporte
                  </TabsTrigger>
                  <TabsTrigger value="faq" data-testid="tab-faq">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    FAQ
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Empresa</CardTitle>
                    <CardDescription>
                      Configure as informações básicas da sua empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        value={generalSettings.companyName}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                        placeholder="Nome da sua empresa"
                        data-testid="input-company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Email de Contato</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={generalSettings.companyEmail}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })}
                        placeholder="email@empresa.com"
                        data-testid="input-company-email"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferências Regionais</CardTitle>
                    <CardDescription>
                      Configure idioma e fuso horário
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Select
                        value={generalSettings.timezone}
                        onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                      >
                        <SelectTrigger id="timezone" data-testid="select-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                          <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                          <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select
                        value={generalSettings.language}
                        onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                      >
                        <SelectTrigger id="language" data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* WhatsApp Settings */}
              <TabsContent value="whatsapp" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conexão WhatsApp</CardTitle>
                    <CardDescription>
                      Configure o comportamento da conexão com o WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-reconnect">Reconexão Automática</Label>
                        <p className="text-sm text-muted-foreground">
                          Reconectar automaticamente em caso de desconexão
                        </p>
                      </div>
                      <Switch
                        id="auto-reconnect"
                        checked={whatsappSettings.autoReconnect}
                        onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, autoReconnect: checked })}
                        data-testid="switch-auto-reconnect"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="message-delay">Delay entre Mensagens (segundos)</Label>
                      <Input
                        id="message-delay"
                        type="number"
                        min="1"
                        max="60"
                        value={whatsappSettings.messageDelay}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, messageDelay: parseInt(e.target.value) })}
                        data-testid="input-message-delay"
                      />
                      <p className="text-sm text-muted-foreground">
                        Tempo de espera entre o envio de mensagens para evitar bloqueios
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-retries">Tentativas Máximas de Envio</Label>
                      <Input
                        id="max-retries"
                        type="number"
                        min="1"
                        max="10"
                        value={whatsappSettings.maxRetries}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, maxRetries: parseInt(e.target.value) })}
                        data-testid="input-max-retries"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Webhook</CardTitle>
                    <CardDescription>
                      Configure webhooks para receber eventos do WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-webhook">Habilitar Webhook</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar eventos para URL externa
                        </p>
                      </div>
                      <Switch
                        id="enable-webhook"
                        checked={whatsappSettings.enableWebhook}
                        onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, enableWebhook: checked })}
                        data-testid="switch-enable-webhook"
                      />
                    </div>
                    {whatsappSettings.enableWebhook && (
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url">URL do Webhook</Label>
                        <Input
                          id="webhook-url"
                          type="url"
                          value={whatsappSettings.webhookUrl}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, webhookUrl: e.target.value })}
                          placeholder="https://seu-servidor.com/webhook"
                          data-testid="input-webhook-url"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notificações por Email</CardTitle>
                    <CardDescription>
                      Configure quando você deseja receber notificações
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Notificações por Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações por email
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                        data-testid="switch-email-notifications"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="campaign-complete">Campanha Concluída</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificar quando uma campanha for concluída
                        </p>
                      </div>
                      <Switch
                        id="campaign-complete"
                        checked={notificationSettings.campaignComplete}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, campaignComplete: checked })}
                        disabled={!notificationSettings.emailNotifications}
                        data-testid="switch-campaign-complete"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="connection-lost">Conexão Perdida</Label>
                        <p className="text-sm text-muted-foreground">
                          Alertar sobre desconexão do WhatsApp
                        </p>
                      </div>
                      <Switch
                        id="connection-lost"
                        checked={notificationSettings.connectionLost}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, connectionLost: checked })}
                        disabled={!notificationSettings.emailNotifications}
                        data-testid="switch-connection-lost"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="daily-report">Relatório Diário</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber resumo diário das atividades
                        </p>
                      </div>
                      <Switch
                        id="daily-report"
                        checked={notificationSettings.dailyReport}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, dailyReport: checked })}
                        disabled={!notificationSettings.emailNotifications}
                        data-testid="switch-daily-report"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="error-alerts">Alertas de Erro</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificar sobre erros críticos do sistema
                        </p>
                      </div>
                      <Switch
                        id="error-alerts"
                        checked={notificationSettings.errorAlerts}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, errorAlerts: checked })}
                        disabled={!notificationSettings.emailNotifications}
                        data-testid="switch-error-alerts"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Automation Settings */}
              <TabsContent value="automation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Automação</CardTitle>
                    <CardDescription>
                      Configure o comportamento das campanhas automáticas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-start">Iniciar Campanhas Automaticamente</Label>
                        <p className="text-sm text-muted-foreground">
                          Campanhas agendadas iniciam sem confirmação manual
                        </p>
                      </div>
                      <Switch
                        id="auto-start"
                        checked={automationSettings.autoStartCampaigns}
                        onCheckedChange={(checked) => setAutomationSettings({ ...automationSettings, autoStartCampaigns: checked })}
                        data-testid="switch-auto-start"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pause-error">Pausar em Caso de Erro</Label>
                        <p className="text-sm text-muted-foreground">
                          Pausar campanha automaticamente quando detectar erros
                        </p>
                      </div>
                      <Switch
                        id="pause-error"
                        checked={automationSettings.pauseOnError}
                        onCheckedChange={(checked) => setAutomationSettings({ ...automationSettings, pauseOnError: checked })}
                        data-testid="switch-pause-error"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="max-messages">Limite de Mensagens por Hora</Label>
                      <Input
                        id="max-messages"
                        type="number"
                        min="10"
                        max="1000"
                        value={automationSettings.maxMessagesPerHour}
                        onChange={(e) => setAutomationSettings({ ...automationSettings, maxMessagesPerHour: parseInt(e.target.value) })}
                        data-testid="input-max-messages"
                      />
                      <p className="text-sm text-muted-foreground">
                        Limite de segurança para evitar bloqueios
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-scheduling">Habilitar Agendamento</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir agendar campanhas para datas futuras
                        </p>
                      </div>
                      <Switch
                        id="enable-scheduling"
                        checked={automationSettings.enableScheduling}
                        onCheckedChange={(checked) => setAutomationSettings({ ...automationSettings, enableScheduling: checked })}
                        data-testid="switch-enable-scheduling"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/50 bg-yellow-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-500">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Aviso Importante
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Configurações de automação mal ajustadas podem resultar em bloqueio da sua conta WhatsApp. 
                      Sempre mantenha limites seguros e respeite as diretrizes do WhatsApp Business.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plans & Pricing */}
              <TabsContent value="plans" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <Card className={`relative ${currentPlan === 'free' ? 'border-primary border-2' : ''}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Gratuito
                        {currentPlan === 'free' && (
                          <Badge className="bg-primary">Plano Atual</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Para começar</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">R$0</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">1 conta WhatsApp</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">50 mensagens/hora</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">3 funis de venda</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">500 contatos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Suporte via email (48h)</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled={currentPlan === 'free'}
                        data-testid="button-plan-free"
                      >
                        {currentPlan === 'free' ? 'Plano Atual' : 'Downgrade'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Pro Plan */}
                  <Card className={`relative ${currentPlan === 'pro' ? 'border-primary border-2' : ''}`}>
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      <Star className="h-3 w-3 inline mr-1" />
                      Popular
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Pro
                        {currentPlan === 'pro' && (
                          <Badge className="bg-primary">Plano Atual</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Para profissionais</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">R$49</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">1 conta WhatsApp</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">200 mensagens/hora</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Funis ilimitados</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">5.000 contatos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Suporte prioritário (24h)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Webhooks personalizados</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90" 
                        disabled={currentPlan === 'pro'}
                        data-testid="button-plan-pro"
                      >
                        {currentPlan === 'pro' ? 'Plano Atual' : 'Assinar Pro'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Business Plan */}
                  <Card className={`relative ${currentPlan === 'business' ? 'border-primary border-2' : ''}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Business
                        {currentPlan === 'business' && (
                          <Badge className="bg-primary">Plano Atual</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Para empresas</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">R$149</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">5 contas WhatsApp</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">1.000 mensagens/hora</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Funis ilimitados</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Contatos ilimitados</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Chat em tempo real</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">API dedicada</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Gerente de conta</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90" 
                        disabled={currentPlan === 'business'}
                        data-testid="button-plan-business"
                      >
                        {currentPlan === 'business' ? 'Plano Atual' : 'Assinar Business'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Perguntas sobre planos?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Entre em contato conosco para planos personalizados ou tire suas dúvidas sobre qual plano é melhor para você.
                    </p>
                    <Button variant="outline" data-testid="button-contact-sales">
                      <Mail className="h-4 w-4 mr-2" />
                      Falar com Vendas
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Support */}
              <TabsContent value="support" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Enviar Solicitação de Suporte</CardTitle>
                      <CardDescription>
                        Nossa equipe responderá em breve
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="support-subject">Assunto</Label>
                        <Input
                          id="support-subject"
                          value={supportForm.subject}
                          onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                          placeholder="Descreva brevemente o problema"
                          data-testid="input-support-subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-priority">Prioridade</Label>
                        <Select
                          value={supportForm.priority}
                          onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}
                        >
                          <SelectTrigger id="support-priority" data-testid="select-support-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="support-message">Mensagem</Label>
                        <Textarea
                          id="support-message"
                          value={supportForm.message}
                          onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                          placeholder="Descreva detalhadamente o problema ou dúvida"
                          rows={6}
                          data-testid="textarea-support-message"
                        />
                      </div>
                      <Button 
                        onClick={handleSendSupport} 
                        className="w-full"
                        data-testid="button-send-support"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Canais de Suporte</CardTitle>
                        <CardDescription>
                          Escolha a melhor forma de contato
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Mail className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">suporte@ranzap.com</p>
                            <p className="text-xs text-muted-foreground mt-1">Resposta em até 48h (Free) ou 24h (Pro+)</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Telefone</p>
                            <p className="text-sm text-muted-foreground">+55 11 98765-4321</p>
                            <p className="text-xs text-muted-foreground mt-1">Seg-Sex, 9h às 18h (Apenas Business)</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Chat ao Vivo</p>
                            <p className="text-sm text-muted-foreground">Disponível no canto inferior direito</p>
                            <p className="text-xs text-muted-foreground mt-1">24/7 (Apenas Business)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-500/50 bg-blue-500/10">
                      <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-500">Dica</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Para um atendimento mais rápido, inclua prints de tela, mensagens de erro e 
                          informações sobre quando o problema começou.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* FAQ */}
              <TabsContent value="faq" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Perguntas Frequentes</CardTitle>
                    <CardDescription>
                      Respostas rápidas para dúvidas comuns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {faqItems.map((faq, index) => (
                      <div key={index} className="border rounded-lg">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                          data-testid={`button-faq-${index}`}
                        >
                          <span className="font-medium">{faq.question}</span>
                          <ChevronDown 
                            className={`h-5 w-5 transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {openFaqIndex === index && (
                          <div className="px-4 pb-4 pt-2 text-sm text-muted-foreground" data-testid={`text-faq-answer-${index}`}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Não encontrou sua resposta?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Entre em contato com nosso suporte ou consulte nossa documentação completa.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" data-testid="button-go-support">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Falar com Suporte
                      </Button>
                      <Button variant="outline" data-testid="button-documentation">
                        Ver Documentação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
