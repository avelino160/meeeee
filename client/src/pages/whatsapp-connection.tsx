import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { WhatsAppStatus } from "@shared/api-types";
import { QrCode, Crown, Phone, Pencil, Check, X, Smartphone } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserData {
  planType: string;
}

interface WhatsAppConnection {
  id: string;
  userId: string;
  phoneNumber: string;
  name: string | null;
  isConnected: boolean | null;
  lastConnectedAt: string | null;
  createdAt: string | null;
}

export default function WhatsAppConnection() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: userData } = useQuery<UserData>({
    queryKey: ["/api/user/me"],
  });

  const currentPlan = userData?.planType || "basic";

  const planLimits: Record<string, number> = {
    basic: 1,
    pro: 3,
    enterprise: 5,
  };

  const maxAccounts = planLimits[currentPlan] || 1;

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000,
  });

  const { data: allConnections = [] } = useQuery<WhatsAppConnection[]>({
    queryKey: ["/api/whatsapp/connections"],
    refetchInterval: 5000,
  });

  // Filtrar apenas conexões ativas
  const connections = allConnections.filter(c => c.isConnected === true);

  const { data: connectedAccountsData } = useQuery<{ count: number }>({
    queryKey: ["/api/whatsapp/connected-count"],
    refetchInterval: 5000,
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/whatsapp/connections/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connections"] });
      setEditingId(null);
      setEditName("");
    },
  });

  const connectedAccounts = connectedAccountsData?.count ?? 0;
  const canAddMore = connectedAccounts < maxAccounts;

  const startEditing = (connection: WhatsAppConnection) => {
    setEditingId(connection.id);
    setEditName(connection.name || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEditing = (id: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      cancelEditing();
      return;
    }
    updateNameMutation.mutate({ id, name: trimmedName });
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 13 && phone.startsWith("55")) {
      const ddd = phone.slice(2, 4);
      const part1 = phone.slice(4, 9);
      const part2 = phone.slice(9);
      return `+55 (${ddd}) ${part1}-${part2}`;
    }
    return `+${phone}`;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border pl-14 pr-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold" data-testid="text-page-title">
                  Conexão WhatsApp
                </h1>
                <p className="text-sm text-muted-foreground">Gerencie a conexão da sua conta WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <span className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-primary" />
                    Contas WhatsApp
                  </span>
                  <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 whitespace-nowrap">
                    {connectedAccounts} de {maxAccounts} conectadas
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentPlan === "basic" && "Plano Básico permite 1 conta"}
                  {currentPlan === "pro" && "Plano Plus permite 3 contas"}
                  {currentPlan === "enterprise" && "Plano Business permite até 5 contas"}
                </CardDescription>
              </CardHeader>
              {!canAddMore && currentPlan !== "enterprise" && (
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

            {/* Connected Accounts List */}
            {connections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Contas Conectadas
                  </CardTitle>
                  <CardDescription>
                    Suas contas WhatsApp conectadas. Clique no lápis para nomear cada conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connections.map((connection) => (
                      <div 
                        key={connection.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                        data-testid={`connection-item-${connection.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${connection.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            {editingId === connection.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nome da conta"
                                  className="h-8 w-48"
                                  autoFocus
                                  data-testid={`input-connection-name-${connection.id}`}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveEditing(connection.id)}
                                  disabled={updateNameMutation.isPending}
                                  data-testid={`button-save-name-${connection.id}`}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEditing}
                                  data-testid={`button-cancel-edit-${connection.id}`}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {connection.name || formatPhoneNumber(connection.phoneNumber)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => startEditing(connection)}
                                    data-testid={`button-edit-name-${connection.id}`}
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                                {connection.name && (
                                  <span className="text-sm text-muted-foreground">
                                    {formatPhoneNumber(connection.phoneNumber)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant={connection.isConnected ? "default" : "secondary"}>
                          {connection.isConnected ? "Conectado" : "Desconectado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connection Methods */}
            {canAddMore && (
              <Card>
                <CardHeader>
                  <CardTitle>Conectar WhatsApp</CardTitle>
                  <CardDescription>
                    Escaneie o QR Code para conectar sua conta WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setShowConnectionModal(true)}
                    className="w-full"
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {connections.length > 0 ? "Conectar Outra Conta" : "Gerar QR Code"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Limit Reached - Upgrade Required */}
            {!canAddMore && currentPlan !== "enterprise" && (
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

      <WhatsAppConnectionModal 
        open={showConnectionModal} 
        onOpenChange={setShowConnectionModal} 
      />
    </div>
  );
}
