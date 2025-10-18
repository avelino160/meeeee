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

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });

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
              <TabsList className="grid w-full grid-cols-3" data-testid="tabs-settings">
                <TabsTrigger value="general" data-testid="tab-general">
                  <Globe className="h-4 w-4 mr-2" />
                  Geral
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
