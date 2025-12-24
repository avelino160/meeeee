import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardAnalytics } from "@shared/api-types";

type WhatsAppStatus = {
  connected: boolean;
  phoneNumber?: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};
import Sidebar from "@/components/sidebar";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, MessageSquare, Users, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    retry: false,
  });

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    retry: false,
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user/me"],
    retry: false,
  });

  const metricsData = analytics?.weeklyData || [
    { name: 'Seg', mensagens: 0, contatos: 0, conversoes: 0 },
    { name: 'Ter', mensagens: 0, contatos: 0, conversoes: 0 },
    { name: 'Qua', mensagens: 0, contatos: 0, conversoes: 0 },
    { name: 'Qui', mensagens: 0, contatos: 0, conversoes: 0 },
    { name: 'Sex', mensagens: 0, contatos: 0, conversoes: 0 },
    { name: 'Sáb', mensagens: 0, contatos: 0, conversoes: 0 },
    { name: 'Dom', mensagens: 0, contatos: 0, conversoes: 0 },
  ];

  // Calculate comparison metrics
  const getMessageDiff = () => {
    if (!analytics) return { value: 0, text: "0%" };
    const today = analytics.todayMessages || 0;
    const yesterday = analytics.yesterdayMessages || 0;
    if (yesterday === 0) {
      return today > 0 ? { value: 100, text: `+${today} novas` } : { value: 0, text: "0%" };
    }
    const diff = ((today - yesterday) / yesterday) * 100;
    const sign = diff >= 0 ? "+" : "";
    return { value: diff, text: `${sign}${diff.toFixed(0)}% desde ontem` };
  };

  const getFunnelInfo = () => {
    if (!analytics) return "Total: 0 funis";
    const total = analytics.totalFunnels || 0;
    const active = analytics.activeFunnels || 0;
    if (total === 0) return "Nenhum funil criado";
    return `${active}/${total} ativos`;
  };

  const getDeliveryInfo = () => {
    if (!analytics) return "0 mensagens enviadas";
    const sent = analytics.sentMessages || 0;
    const delivered = analytics.deliveredMessages || 0;
    if (sent === 0) return "Nenhuma mensagem enviada";
    return `${delivered}/${sent} entregues (${analytics.deliveryRate?.toFixed(0) || 0}%)`;
  };

  const messageDiff = getMessageDiff();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border pl-14 pr-4 lg:pl-6 lg:pr-6 py-3 sm:py-4 lg:py-5 pt-[16px] pb-[16px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold" data-testid="text-dashboard-title">
                Olá, {user?.firstName || 'Usuário'}!
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
                Sua central de vendas automáticas no WhatsApp
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full sm:text-sm font-medium bg-red-100 text-red-700 border border-red-300 text-justify text-[12px] pl-[8px] pr-[8px] pt-[4px] pb-[4px]">
                {whatsappStatus?.connected ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span>WhatsApp Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Desconectado</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 h-7 text-xs px-3"
                      onClick={() => setShowWhatsAppModal(true)}
                      data-testid="button-connect-whatsapp"
                    >
                      Conectar
                    </Button>
                  </>
                )}
              </div>
              
              {whatsappStatus?.connected && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 text-sm"
                  onClick={() => setShowWhatsAppModal(true)}
                  data-testid="button-whatsapp-settings"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#252525]">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium">Funil Ativo</CardTitle>
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold" data-testid="text-active-funnels">
                  {analyticsLoading ? "..." : analytics?.activeFunnels || 0}
                </div>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                  {analyticsLoading ? "..." : getFunnelInfo()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium">Mensagens Hoje</CardTitle>
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold" data-testid="text-today-messages">
                  {analyticsLoading ? "..." : analytics?.todayMessages || 0}
                </div>
                <p className={`text-[9px] sm:text-[10px] lg:text-xs ${messageDiff.value > 0 ? 'text-green-600' : messageDiff.value < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {analyticsLoading ? "..." : messageDiff.text}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium">Contatos Ativos</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold" data-testid="text-active-contacts">
                  {analyticsLoading ? "..." : analytics?.activeContacts || 0}
                </div>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                  Total: {analyticsLoading ? "..." : analytics?.totalContacts || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium">Taxa de Entrega</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold" data-testid="text-delivery-rate">
                  {analyticsLoading ? "..." : `${(analytics?.deliveryRate || 0).toFixed(1)}%`}
                </div>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                  {analyticsLoading ? "..." : getDeliveryInfo()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Chart */}
          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg">Análise de Métricas</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs lg:text-sm">
                Acompanhe o desempenho das suas conversas e conversões nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="h-[200px] sm:h-[250px] w-full" data-testid="chart-metrics">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="mensagens" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Mensagens"
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="contatos" 
                      stroke="#a78bfa" 
                      strokeWidth={2}
                      name="Contatos"
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversoes" 
                      stroke="#c084fc" 
                      strokeWidth={2}
                      name="Conversões"
                      dot={{ r: 3 }}
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
