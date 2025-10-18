import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { WhatsAppStatus } from "@shared/api-types";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  QrCode,
  CheckCircle,
  XCircle,
  LogOut,
  Zap,
  Crown,
} from "lucide-react";
import { Link } from "wouter";

export default function WhatsAppConnection() {
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [currentPlan] = useState("free"); // Simula o plano atual
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Limites baseados no plano
  const planLimits = {
    free: 1,
    pro: 3,
    business: 5,
  };

  const maxAccounts = planLimits[currentPlan as keyof typeof planLimits];

  const { data: whatsappStatus, isLoading } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000,
  });

  const { data: connectedAccountsData } = useQuery<{ count: number }>({
    queryKey: ["/api/whatsapp/connected-count"],
    refetchInterval: 5000,
  });

  const connectedAccounts = connectedAccountsData?.count ?? 0;
  const canAddMore = connectedAccounts < maxAccounts;

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/generate-qr", {});
      
      if (response.status === 405) {
        const data = await response.json();
        throw new Error(data.message || "Bloqueio de datacenter");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.qrImage) {
        setQrImageUrl(data.qrImage);
        toast({
          title: "QR Code Gerado",
          description: "Escaneie o código com o WhatsApp no seu celular.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connected-count"] });
    },
    onError: (error: any) => {
      const isDatacenterBlock = error.message?.includes('bloqueou') || error.message?.includes('datacenter');
      
      toast({
        title: isDatacenterBlock ? "⚠️ Ambiente Não Suportado" : "❌ Erro",
        description: isDatacenterBlock 
          ? "WhatsApp bloqueia conexões de servidores cloud. Execute localmente para testar." 
          : "Falha ao gerar QR Code. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/whatsapp/disconnect", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connected-count"] });
      setQrImageUrl("");
      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao desconectar WhatsApp.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center" data-testid="text-page-title">
                <MessageSquare className="h-6 w-6 mr-2 text-primary" />
                Conexão WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground">Gerencie a conexão da sua conta WhatsApp</p>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  whatsappStatus?.connected ? 'status-connected' : 'status-disconnected'
                }`}
                data-testid="indicator-whatsapp-status"
              />
              <Badge variant={whatsappStatus?.connected ? "default" : "secondary"}>
                {whatsappStatus?.connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Plan Limits Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-primary" />
                    Contas WhatsApp
                  </span>
                  <Badge variant="outline">
                    {connectedAccounts} de {maxAccounts} conectadas
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentPlan === "free" && "Plano Pro permite 1 conta"}
                  {currentPlan === "pro" && "Plano Plus permite 3 contas"}
                  {currentPlan === "business" && "Plano Business permite até 5 contas"}
                </CardDescription>
              </CardHeader>
              {!canAddMore && currentPlan !== "business" && (
                <CardContent>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm mb-3">
                      <strong>Quer conectar mais contas?</strong> Faça upgrade para o plano Business e conecte até 5 contas WhatsApp.
                    </p>
                    <Link href="/plans">
                      <Button variant="default" size="sm">
                        <Crown className="h-4 w-4 mr-2" />
                        Ver Planos
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-primary" />
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {whatsappStatus?.connected ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {whatsappStatus?.connected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
                      </p>
                      {whatsappStatus?.phoneNumber && (
                        <p className="text-sm text-muted-foreground">
                          Número: {whatsappStatus.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  {whatsappStatus?.connected && (
                    <Button
                      variant="destructive"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      data-testid="button-disconnect"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {disconnectMutation.isPending ? "Desconectando..." : "Desconectar"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Connection Methods */}
            {!whatsappStatus?.connected && canAddMore && (
              <Card>
                <CardHeader>
                  <CardTitle>Conectar WhatsApp</CardTitle>
                  <CardDescription>
                    Escaneie o QR Code para conectar sua conta WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => generateQRMutation.mutate()}
                    disabled={generateQRMutation.isPending}
                    className="w-full"
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {generateQRMutation.isPending ? "Gerando QR Code..." : "Gerar QR Code"}
                  </Button>

                  {qrImageUrl && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <img
                            src={qrImageUrl}
                            alt="QR Code do WhatsApp"
                            className="mx-auto max-w-xs rounded-lg border"
                            data-testid="img-qr-code"
                          />
                          <Separator className="my-4" />
                          <div className="text-left space-y-2 text-sm">
                            <p className="font-medium">Como usar:</p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                              <li>Abra o WhatsApp no seu celular</li>
                              <li>Vá em Configurações → Aparelhos conectados</li>
                              <li>Toque em "Conectar um aparelho"</li>
                              <li>Escaneie o QR Code acima com a câmera</li>
                            </ol>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Limit Reached - Upgrade Required */}
            {!whatsappStatus?.connected && !canAddMore && (
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Crown className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Limite de Contas Atingido
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Seu plano atual permite apenas {maxAccounts} conta{maxAccounts > 1 ? 's' : ''}. 
                        Faça upgrade para o plano Business e conecte até 5 contas WhatsApp.
                      </p>
                    </div>
                    <Link href="/plans">
                      <Button>
                        <Crown className="h-4 w-4 mr-2" />
                        Fazer Upgrade
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precisa de ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left">
                      QR Code não aparece?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Verifique se você está executando o projeto localmente, pois WhatsApp bloqueia conexões de servidores cloud.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left">
                      Ainda com dúvidas?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Entre em contato com o suporte através da página de configurações.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
