import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WhatsAppStatus } from "@shared/api-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Smartphone, QrCode } from "lucide-react";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppConnectionModal({ open, onOpenChange }: WhatsAppConnectionModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    enabled: open,
  });

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/qr");
      return response.json();
    },
    onSuccess: () => {
      setShowQR(true);
      toast({
        title: "QR Code Gerado",
        description: "Escaneie o código com seu WhatsApp para conectar",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao gerar QR Code. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/connect", {
        phoneNumber,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      toast({
        title: "Conectado",
        description: "WhatsApp conectado com sucesso!",
      });
      onOpenChange(false);
      setShowQR(false);
    },
    onError: (error) => {
      toast({
        title: "Erro de Conexão",
        description: "Falha ao conectar WhatsApp. Verifique o número.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado com sucesso!",
      });
      setShowQR(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao desconectar WhatsApp.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Número Obrigatório",
        description: "Digite seu número de WhatsApp",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-whatsapp-connection">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Conexão WhatsApp
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta do WhatsApp para enviar mensagens automatizadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className={`w-3 h-3 rounded-full ${
                  whatsappStatus?.connected ? 'bg-green-500' : 'bg-red-500'
                }`}
                data-testid="indicator-connection-status"
              />
              <div>
                <p className="font-medium" data-testid="text-connection-status">
                  {whatsappStatus?.connected ? 'Conectado' : 'Desconectado'}
                </p>
                {whatsappStatus?.phoneNumber && (
                  <p className="text-sm text-muted-foreground" data-testid="text-phone-number">
                    {whatsappStatus.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!whatsappStatus?.connected ? (
            <>
              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone">Número do WhatsApp</Label>
                <div className="flex space-x-2">
                  <div className="flex items-center px-3 py-2 bg-muted rounded-md">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="phone"
                    placeholder="+258 84 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    data-testid="input-phone-number"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite seu número com código do país (ex: +258 para Moçambique)
                </p>
              </div>

              <Separator />

              {/* QR Code Section */}
              {showQR ? (
                <div className="text-center space-y-4">
                  <div className="w-48 h-48 bg-muted rounded-lg mx-auto flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Escaneie o QR Code</p>
                    <p className="text-sm text-muted-foreground">
                      Abra o WhatsApp → Menu → Aparelhos conectados → Conectar um aparelho
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Button
                    onClick={() => generateQRMutation.mutate()}
                    disabled={generateQRMutation.isPending}
                    variant="outline"
                    className="w-full"
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {generateQRMutation.isPending ? "Gerando..." : "Gerar QR Code"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Ou digite seu número e clique em conectar
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={connectMutation.isPending || !phoneNumber.trim()}
                  className="flex-1"
                  data-testid="button-connect"
                >
                  {connectMutation.isPending ? "Conectando..." : "Conectar"}
                </Button>
              </div>
            </>
          ) : (
            /* Disconnect Option */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Seu WhatsApp está conectado e funcionando normalmente.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  data-testid="button-close"
                >
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="flex-1"
                  data-testid="button-disconnect"
                >
                  {disconnectMutation.isPending ? "Desconectando..." : "Desconectar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
