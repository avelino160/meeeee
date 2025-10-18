import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { DashboardAnalytics } from "@shared/api-types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { BarChart3, MessageSquare, Users, TrendingUp, Wifi, WifiOff, Upload } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const metricsData = [
    { name: 'Seg', mensagens: 12, contatos: 8, conversoes: 3 },
    { name: 'Ter', mensagens: 19, contatos: 12, conversoes: 5 },
    { name: 'Qua', mensagens: 25, contatos: 18, conversoes: 8 },
    { name: 'Qui', mensagens: 22, contatos: 15, conversoes: 6 },
    { name: 'Sex', mensagens: 30, contatos: 22, conversoes: 10 },
    { name: 'Sáb', mensagens: 18, contatos: 10, conversoes: 4 },
    { name: 'Dom', mensagens: 15, contatos: 8, conversoes: 3 },
  ];

  const importMutation = useMutation({
    mutationFn: async (funnels: any[]) => {
      const res = await apiRequest('POST', '/api/funnels/import', { funnels });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Funis importados com sucesso!",
        description: `${data.imported} funis foram adicionados à sua conta.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao importar funis",
        description: error.message || "Não foi possível importar os funis. Verifique o formato do arquivo.",
        variant: "destructive",
      });
    },
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        const funnels = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        importMutation.mutate(funnels);
      } catch (error) {
        toast({
          title: "❌ Arquivo inválido",
          description: "O arquivo não está em formato JSON válido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="text-center sm:text-left">
              <h1 className="text-base sm:text-lg lg:text-2xl font-semibold" data-testid="text-dashboard-title">
                Olá, {user?.firstName || 'Usuário'}! 👋
              </h1>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Sua central de vendas automáticas no WhatsApp</p>
            </div>
            
            <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                data-testid="input-import-file"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-5 sm:h-6 text-[10px] sm:text-xs px-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
                data-testid="button-import-funnels"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">{importMutation.isPending ? 'Importando...' : 'Importar Funis'}</span>
                <span className="sm:hidden">Import</span>
              </Button>
              
              <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium ${
                whatsappStatus?.connected 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {whatsappStatus?.connected ? (
                  <>
                    <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">WhatsApp Conectado</span>
                    <span className="sm:hidden">Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Desconectado</span>
                    <span className="sm:hidden">Off</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-1 sm:ml-2 h-5 sm:h-6 text-[10px] sm:text-xs px-2"
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
                  className="hidden sm:flex h-6 text-xs"
                  onClick={() => setShowWhatsAppModal(true)}
                  data-testid="button-whatsapp-settings"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 lg:p-6 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium">Funis Ativos</CardTitle>
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold" data-testid="text-active-funnels">
                  {analyticsLoading ? "..." : analytics?.activeFunnels || 0}
                </div>
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                  +{analyticsLoading ? "..." : ((analytics?.activeFunnels || 0) * 0.2).toFixed(0)} desde ontem
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
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                  +{analyticsLoading ? "..." : ((analytics?.todayMessages || 0) * 0.15).toFixed(0)}% desde ontem
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
                  {analyticsLoading ? "..." : analytics?.sentMessages || 0} mensagens enviadas
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
