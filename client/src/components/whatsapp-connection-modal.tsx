import { useState, useEffect } from "react";
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
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    enabled: open,
  });

  // 🚀 GERAR QR CODE AUTOMATICAMENTE quando modal abrir
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/qr");
      return response.json();
    },
    onSuccess: (data) => {
      const qrCode = data.qrCode || '';
      const qrImage = data.qrImage || ''; // 🔒 IMAGEM SEGURA DO SERVIDOR
      
      setQrCodeData(qrCode);
      setQrImageUrl(qrImage); // Usar imagem segura gerada no backend
      setShowQR(true);
      
      toast({
        title: "🔥 QR Code RanZap Gerado!",
        description: "📱 Escaneie com seu WhatsApp para conectar e começar a vender!",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: "Falha ao gerar QR Code. Tentando novamente...",
        variant: "destructive",
      });
      // Tentar novamente em 3 segundos
      setTimeout(() => generateQRMutation.mutate(), 3000);
    },
  });

  // Gerar QR automaticamente quando modal abrir (se não conectado)
  useEffect(() => {
    if (open && whatsappStatus && !whatsappStatus.connected && !showQR) {
      generateQRMutation.mutate();
    }
  }, [open, whatsappStatus]);

  // Verificar status de conexão a cada 3 segundos E FECHAR MODAL SE CONECTADO
  useEffect(() => {
    if (!open) return;
    
    // 🎉 FECHAR MODAL AUTOMATICAMENTE QUANDO CONECTAR
    if (whatsappStatus?.connected) {
      toast({
        title: "🎉 WhatsApp Conectado com Sucesso!",
        description: "🚀 RanZap está ativo! Seu funil de vendas automatizado já está funcionando!",
      });
      setTimeout(() => {
        onOpenChange(false);
        setShowQR(false);
      }, 2000); // Fechar após 2 segundos para mostrar a mensagem
      return;
    }
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    }, 3000);

    return () => clearInterval(interval);
  }, [open, whatsappStatus?.connected, queryClient, onOpenChange, toast]);

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
      <DialogContent className="w-[95vw] max-w-md" data-testid="modal-whatsapp-connection">
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

              {/* 🚀 QR CODE REAL ZAPRÁPIDO */}
              {showQR && qrImageUrl ? (
                <div className="text-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-green-700">🔥 RanZap - Conexão Real!</h3>
                    <p className="text-sm text-gray-600">QR Code do seu WhatsApp Web</p>
                  </div>
                  
                  <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-lg mx-auto flex items-center justify-center shadow-lg border-4 border-green-300">
                    <img 
                      src={qrImageUrl} 
                      alt="QR Code WhatsApp"
                      className="w-44 h-44 sm:w-56 sm:h-56 rounded"
                      data-testid="img-qr-code"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-green-700 text-sm sm:text-base">📱 Como Conectar:</p>
                    <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                      <p><strong>1.</strong> Abra o WhatsApp</p>
                      <p><strong>2.</strong> Menu → <strong>Aparelhos conectados</strong></p>
                      <p><strong>3.</strong> <strong>"Conectar um aparelho"</strong></p>
                      <p><strong>4.</strong> Escaneie o QR Code</p>
                    </div>
                    <p className="text-xs text-orange-600 font-medium mt-3">⚡ Aguardando conexão...</p>
                  </div>
                  
                  {generateQRMutation.isPending && (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      <span className="text-sm text-green-600">Gerando QR Code...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-blue-700">⚡ RanZap - Conectar WhatsApp</h3>
                    <p className="text-sm text-gray-600">Conecte sua conta para começar a vender automaticamente!</p>
                  </div>
                  
                  {generateQRMutation.isPending ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="font-medium text-blue-700">🚀 Gerando QR Code do WhatsApp...</p>
                      <p className="text-sm text-gray-600">Aguarde alguns segundos...</p>
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => generateQRMutation.mutate()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                        data-testid="button-generate-qr"
                      >
                        <QrCode className="h-5 w-5 mr-2" />
                        🔥 Gerar QR Code RanZap
                      </Button>
                      <p className="text-xs text-gray-500">
                        💡 O QR Code será gerado automaticamente para conectar seu WhatsApp
                      </p>
                    </>
                  )}
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
            /* ✅ WhatsApp Conectado */
            <div className="space-y-4 text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-green-700">✅ WhatsApp Conectado!</h3>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-green-800">🎉 RanZap está funcionando!</p>
                <p className="text-sm text-green-700">
                  Seu funil de vendas automático está ativo e pronto para receber clientes.
                </p>
                <div className="text-xs text-green-600 bg-green-100 p-2 rounded mt-3">
                  💡 <strong>Dica:</strong> Agora envie "Oi" para seu WhatsApp e teste o funil automático!
                </div>
              </div>
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
                  {disconnectMutation.isPending ? "Desconectando..." : "🔴 Desconectar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
