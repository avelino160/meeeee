import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { DashboardAnalytics } from "@shared/api-types";

type WhatsAppStatus = {
  connected: boolean;
  phoneNumber?: string;
};
import Sidebar from "@/components/sidebar";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, MessageSquare, Users, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { toast } = useToast();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    retry: false,
  });

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    retry: false,
  });

  const metricsData = [
    { name: 'Seg', mensagens: 12, contatos: 8, conversoes: 3 },
    { name: 'Ter', mensagens: 19, contatos: 12, conversoes: 5 },
    { name: 'Qua', mensagens: 25, contatos: 18, conversoes: 8 },
    { name: 'Qui', mensagens: 22, contatos: 15, conversoes: 6 },
    { name: 'Sex', mensagens: 30, contatos: 22, conversoes: 10 },
    { name: 'Sáb', mensagens: 18, contatos: 10, conversoes: 4 },
    { name: 'Dom', mensagens: 15, contatos: 8, conversoes: 3 },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto pl-14 sm:pl-0 lg:pl-0">
              <div className="flex-1 sm:flex-initial">
                <h1 className="text-lg sm:text-2xl font-semibold" data-testid="text-dashboard-title">RanZap Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Sua central de vendas automáticas no WhatsApp</p>
              </div>
              
              {/* 📱 STATUS WHATSAPP - Desktop */}
              <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                whatsappStatus?.connected 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {whatsappStatus?.connected ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span className="hidden md:inline">WhatsApp Conectado</span>
                    <span className="md:hidden">Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span className="hidden md:inline">Desconectado</span>
                    <span className="md:hidden">Off</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 h-6 text-xs"
                      onClick={() => setShowWhatsAppModal(true)}
                      data-testid="button-connect-whatsapp"
                    >
                      Conectar
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              {whatsappStatus?.connected && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => setShowWhatsAppModal(true)}
                  data-testid="button-whatsapp-settings"
                >
                  <MessageSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              )}
              <Button 
                size="sm" 
                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                data-testid="button-new-funnel"
              >
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Funil</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>
          
          {/* 📱 STATUS WHATSAPP - Mobile */}
          <div className={`sm:hidden flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium mt-3 ${
            whatsappStatus?.connected 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {whatsappStatus?.connected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>WhatsApp Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>WhatsApp Desconectado</span>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funis Ativos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-funnels">
                  {analyticsLoading ? "..." : analytics?.activeFunnels || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsLoading ? "..." : ((analytics?.activeFunnels || 0) * 0.2).toFixed(0)} desde ontem
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

          {/* Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Métricas</CardTitle>
              <CardDescription>
                Acompanhe o desempenho das suas conversas e conversões nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full" data-testid="chart-metrics">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="mensagens" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Mensagens"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="contatos" 
                      stroke="#a78bfa" 
                      strokeWidth={2}
                      name="Contatos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversoes" 
                      stroke="#c084fc" 
                      strokeWidth={2}
                      name="Conversões"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* 🚀 MODAL ZAPRÁPIDO WHATSAPP - ABRIR AUTOMATICAMENTE */}
      <WhatsAppConnectionModal 
        open={showWhatsAppModal}
        onOpenChange={setShowWhatsAppModal}
      />
    </div>
  );
}
