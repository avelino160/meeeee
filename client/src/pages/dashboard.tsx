import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { DashboardAnalytics } from "@shared/api-types";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, MessageSquare, Users, Zap, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
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

  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    retry: false,
  });

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
              <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Visão geral das suas campanhas e automações</p>
            </div>
            <Button data-testid="button-new-campaign">
              <Zap className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-campaigns">
                  {analyticsLoading ? "..." : analytics?.activeCampaigns || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsLoading ? "..." : ((analytics?.activeCampaigns || 0) * 0.2).toFixed(0)} desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-today-messages">
                  {analyticsLoading ? "..." : analytics?.todayMessages || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsLoading ? "..." : ((analytics?.todayMessages || 0) * 0.15).toFixed(0)}% desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-contacts">
                  {analyticsLoading ? "..." : analytics?.activeContacts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {analyticsLoading ? "..." : analytics?.totalContacts || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-delivery-rate">
                  {analyticsLoading ? "..." : `${(analytics?.deliveryRate || 0).toFixed(1)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsLoading ? "..." : analytics?.sentMessages || 0} mensagens enviadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas ações realizadas na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Campanha "Interesse Produto" iniciada</p>
                      <p className="text-xs text-muted-foreground">2 minutos atrás</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">15 mensagens enviadas com sucesso</p>
                      <p className="text-xs text-muted-foreground">5 minutos atrás</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 novos contatos adicionados</p>
                      <p className="text-xs text-muted-foreground">10 minutos atrás</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Funil "Follow-up" atualizado</p>
                      <p className="text-xs text-muted-foreground">1 hora atrás</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance das Campanhas</CardTitle>
                <CardDescription>
                  Taxa de sucesso das suas campanhas ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Campanha Interesse</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Follow-up Vendas</span>
                      <span>72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Suporte Técnico</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Newsletter</span>
                      <span>64%</span>
                    </div>
                    <Progress value={64} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as funcionalidades mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex flex-col" data-testid="button-create-funnel">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Criar Funil</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col" data-testid="button-add-contacts">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Add Contatos</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col" data-testid="button-send-message">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span>Enviar Mensagem</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col" data-testid="button-schedule">
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Agendar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
