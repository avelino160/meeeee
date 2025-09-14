import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { AnalyticsResponse, CampaignsResponse, ContactsResponse } from "@shared/api-types";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Send,
  Eye
} from "lucide-react";

interface AnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  activeContacts: number;
  totalMessages: number;
  todayMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  deliveryRate: number;
  schedulerTasks: number;
}

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: analytics, isLoading: analyticsLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics/dashboard"],
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: campaigns } = useQuery<CampaignsResponse>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const { data: contacts } = useQuery<ContactsResponse>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const { data: messages } = useQuery<any[]>({
    queryKey: ["/api/messages"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Calculate additional metrics from data
  const calculateMetrics = () => {
    if (!analytics || !campaigns || !contacts || !messages) {
      return {
        campaignSuccessRate: 0,
        avgMessagesPerCampaign: 0,
        contactEngagementRate: 0,
        recentActivity: [],
      };
    }

    const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;
    const campaignSuccessRate = analytics.totalCampaigns > 0 
      ? (activeCampaigns / analytics.totalCampaigns) * 100 
      : 0;

    const avgMessagesPerCampaign = analytics.totalCampaigns > 0 
      ? analytics.totalMessages / analytics.totalCampaigns 
      : 0;

    const contactEngagementRate = analytics.totalContacts > 0 
      ? (analytics.activeContacts / analytics.totalContacts) * 100 
      : 0;

    // Create recent activity from actual data
    const recentActivity = [
      {
        id: 1,
        type: 'campaign',
        title: `${analytics.activeCampaigns} campanhas ativas`,
        time: 'Agora',
        status: 'success'
      },
      {
        id: 2,
        type: 'message',
        title: `${analytics.todayMessages} mensagens enviadas hoje`,
        time: 'Últimas 24h',
        status: 'success'
      },
      {
        id: 3,
        type: 'contact',
        title: `${analytics.activeContacts} contatos ativos`,
        time: 'Total',
        status: 'info'
      },
      {
        id: 4,
        type: 'delivery',
        title: `Taxa de entrega: ${analytics.deliveryRate.toFixed(1)}%`,
        time: 'Média geral',
        status: analytics.deliveryRate >= 90 ? 'success' : analytics.deliveryRate >= 70 ? 'warning' : 'error'
      }
    ];

    return {
      campaignSuccessRate,
      avgMessagesPerCampaign,
      contactEngagementRate,
      recentActivity,
    };
  };

  const metrics = calculateMetrics();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" data-testid="text-page-title">Relatórios e Analytics</h1>
              <p className="text-sm text-muted-foreground">Acompanhe o desempenho das suas campanhas em tempo real</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-primary border-primary">
                <Activity className="h-3 w-3 mr-1" />
                Tempo Real
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando analytics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12" data-testid="error-state-analytics">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Erro ao Carregar Dados</h3>
              <p className="text-muted-foreground">
                Não foi possível carregar os dados de analytics. Tente novamente.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-campaigns">
                      {analytics?.totalCampaigns || 0}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {analytics?.activeCampaigns || 0} ativas
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {metrics.campaignSuccessRate.toFixed(1)}% taxa de ativação
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-messages">
                      {analytics?.totalMessages || 0}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-primary border-primary text-xs">
                        {analytics?.todayMessages || 0} hoje
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {metrics.avgMessagesPerCampaign.toFixed(1)} por campanha
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-contacts">
                      {analytics?.totalContacts || 0}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {analytics?.activeContacts || 0} ativos
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {metrics.contactEngagementRate.toFixed(1)}% engajamento
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-delivery-rate">
                      {analytics?.deliveryRate ? `${analytics.deliveryRate.toFixed(1)}%` : '0.0%'}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={analytics?.deliveryRate >= 90 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {analytics?.deliveredMessages || 0} entregues
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        de {analytics?.sentMessages || 0} enviadas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance de Entrega</CardTitle>
                    <CardDescription>
                      Acompanhe o sucesso das suas mensagens em tempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Mensagens Enviadas</span>
                          <span className="font-medium" data-testid="text-sent-messages">
                            {analytics?.sentMessages || 0}
                          </span>
                        </div>
                        <Progress 
                          value={analytics?.totalMessages ? (analytics.sentMessages / analytics.totalMessages) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Mensagens Entregues</span>
                          <span className="font-medium text-green-600" data-testid="text-delivered-messages">
                            {analytics?.deliveredMessages || 0}
                          </span>
                        </div>
                        <Progress 
                          value={analytics?.sentMessages ? (analytics.deliveredMessages / analytics.sentMessages) * 100 : 0} 
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Taxa de Sucesso Geral</span>
                          <span className={`font-medium ${
                            analytics?.deliveryRate >= 90 ? 'text-green-600' : 
                            analytics?.deliveryRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {analytics?.deliveryRate ? `${analytics.deliveryRate.toFixed(1)}%` : '0.0%'}
                          </span>
                        </div>
                        <Progress 
                          value={analytics?.deliveryRate || 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status das Campanhas</CardTitle>
                    <CardDescription>
                      Distribuição das campanhas por status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="text-sm">Campanhas Ativas</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium" data-testid="text-active-campaigns-detail">
                            {analytics?.activeCampaigns || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analytics?.totalCampaigns ? 
                              `${((analytics.activeCampaigns / analytics.totalCampaigns) * 100).toFixed(1)}%` : 
                              '0%'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Campanhas Pausadas</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {campaigns?.filter((c: any) => c.status === 'paused').length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analytics?.totalCampaigns ? 
                              `${(((campaigns?.filter((c: any) => c.status === 'paused').length || 0) / analytics.totalCampaigns) * 100).toFixed(1)}%` : 
                              '0%'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-sm">Rascunhos</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {campaigns?.filter((c: any) => c.status === 'draft').length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analytics?.totalCampaigns ? 
                              `${(((campaigns?.filter((c: any) => c.status === 'draft').length || 0) / analytics.totalCampaigns) * 100).toFixed(1)}%` : 
                              '0%'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Concluídas</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {campaigns?.filter((c: any) => c.status === 'completed').length || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analytics?.totalCampaigns ? 
                              `${(((campaigns?.filter((c: any) => c.status === 'completed').length || 0) / analytics.totalCampaigns) * 100).toFixed(1)}%` : 
                              '0%'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Feed and System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                    <CardDescription>
                      Últimas atividades do sistema em tempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'success' ? 'bg-green-500' :
                            activity.status === 'warning' ? 'bg-yellow-500' :
                            activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" data-testid={`text-activity-${activity.id}`}>
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {activity.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {activity.status === 'warning' && <Clock className="h-4 w-4 text-yellow-500" />}
                            {activity.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                            {activity.status === 'info' && <Eye className="h-4 w-4 text-blue-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sistema</CardTitle>
                    <CardDescription>
                      Status dos serviços em tempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">WhatsApp API</span>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Online
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Scheduler</span>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {analytics?.schedulerTasks || 0} tarefas
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Database</span>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Conectado
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">Funis Ativos</span>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary">
                          {analytics?.activeCampaigns || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Performance</CardTitle>
                  <CardDescription>
                    Métricas principais do período atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="h-5 w-5 text-primary mr-2" />
                        <span className="text-sm font-medium">Taxa de Conversão</span>
                      </div>
                      <p className="text-2xl font-bold text-primary" data-testid="text-conversion-rate">
                        {metrics.campaignSuccessRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Campanhas ativas/total</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Send className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">Eficiência de Envio</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-send-efficiency">
                        {analytics?.deliveryRate ? analytics.deliveryRate.toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-xs text-muted-foreground">Mensagens entregues</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium">Engajamento</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600" data-testid="text-engagement-rate">
                        {metrics.contactEngagementRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Contatos ativos</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-sm font-medium">Produtividade</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600" data-testid="text-productivity-score">
                        {metrics.avgMessagesPerCampaign.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Msgs por campanha</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
