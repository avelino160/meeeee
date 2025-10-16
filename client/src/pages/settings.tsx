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
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
