import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Smartphone,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Zap,
} from "lucide-react";

export default function WhatsAppConnection() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [activeMethod, setActiveMethod] = useState<"pairing" | "qr">("pairing");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isReplitEnvironment = window.location.hostname.includes('.replit.') || 
                               window.location.hostname.includes('replit.dev') ||
                               window.location.hostname.includes('repl.co');

  const { data: whatsappStatus, isLoading } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000,
  });

  const generatePairingMutation = useMutation({
    mutationFn: async () => {
      if (!phoneNumber.trim()) {
        throw new Error("Número de telefone é obrigatório");
      }
      const response = await apiRequest("POST", "/api/whatsapp/pairing-code", {
        phoneNumber: phoneNumber.trim(),
      });
      
      if (response.status === 405) {
        const data = await response.json();
        throw new Error(data.message || "Bloqueio de datacenter");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const code = data.pairingCode || '';
      setPairingCode(code);
      
      toast({
        title: "✅ Código Gerado!",
        description: `Seu código: ${code}. Digite no WhatsApp para conectar!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: (error: any) => {
      const isDatacenterBlock = error.message?.includes('bloqueou') || error.message?.includes('datacenter');
      
      toast({
        title: isDatacenterBlock ? "⚠️ Ambiente Não Suportado" : "❌ Erro",
        description: isDatacenterBlock 
          ? "WhatsApp bloqueia conexões de servidores cloud. Execute localmente no seu computador para testar." 
          : "Falha ao gerar código. Verifique o número e tente novamente.",
        variant: "destructive",
      });
    },
  });

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
      setQrImageUrl("");
      setPairingCode("");
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
            {!whatsappStatus?.connected && (
              <Card>
                <CardHeader>
                  <CardTitle>Conectar WhatsApp</CardTitle>
                  <CardDescription>
                    Escolha um método para conectar sua conta WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isReplitEnvironment && (
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Atenção:</strong> WhatsApp bloqueia conexões de servidores cloud (como Replit). 
                        Para testar, execute o projeto localmente no seu computador.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as "pairing" | "qr")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="pairing" data-testid="tab-pairing">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Código de Pareamento
                      </TabsTrigger>
                      <TabsTrigger value="qr" data-testid="tab-qr">
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pairing" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Número de Telefone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+258 84 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          data-testid="input-phone-number"
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite o número com código do país (ex: +258 para Moçambique)
                        </p>
                      </div>

                      <Button
                        onClick={() => generatePairingMutation.mutate()}
                        disabled={generatePairingMutation.isPending || !phoneNumber.trim()}
                        className="w-full"
                        data-testid="button-generate-pairing"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        {generatePairingMutation.isPending ? "Gerando Código..." : "Gerar Código"}
                      </Button>

                      {pairingCode && (
                        <Card className="bg-primary/5 border-primary">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-2">Seu código de pareamento:</p>
                              <p className="text-3xl font-bold text-primary tracking-widest" data-testid="text-pairing-code">
                                {pairingCode}
                              </p>
                              <Separator className="my-4" />
                              <div className="text-left space-y-2 text-sm">
                                <p className="font-medium">Como usar:</p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                  <li>Abra o WhatsApp no seu celular</li>
                                  <li>Vá em Configurações → Aparelhos conectados</li>
                                  <li>Toque em "Conectar um aparelho"</li>
                                  <li>Digite o código acima quando solicitado</li>
                                </ol>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="qr" className="space-y-4">
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
                    </TabsContent>
                  </Tabs>
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
                      Problemas de conexão?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Certifique-se de que seu número de telefone está correto e inclui o código do país.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left">
                      QR Code não aparece?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Verifique se você está executando o projeto localmente, pois WhatsApp bloqueia conexões de servidores cloud.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
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
