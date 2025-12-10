import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { WhatsAppStatus } from "@shared/api-types";
import { QrCode, Crown } from "lucide-react";
import { Link } from "wouter";

export default function WhatsAppConnection() {
  const [currentPlan] = useState("free"); // Simula o plano atual
  const [showConnectionModal, setShowConnectionModal] = useState(false);

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
                    onClick={() => setShowConnectionModal(true)}
                    className="w-full"
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </Button>
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

      <WhatsAppConnectionModal 
        open={showConnectionModal} 
        onOpenChange={setShowConnectionModal} 
      />
    </div>
  );
}
