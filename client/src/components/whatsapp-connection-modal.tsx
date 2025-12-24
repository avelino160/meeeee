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
import { MessageSquare, QrCode } from "lucide-react";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppConnectionModal({ open, onOpenChange }: WhatsAppConnectionModalProps) {
  const [showQR, setShowQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    enabled: open,
  });

  // 🚀 GERAR QR CODE 
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/qr");
      if (!response.ok) {
        const data = await response.json();
        const error: any = new Error(data.message || "Falha ao gerar QR Code");
        error.status = response.status;
        error.details = data.details;
        error.error = data.error;
        console.log('❌ QR Generation Failed:', { status: response.status, message: data.message, error: data.error });
        throw error;
      }
      return response.json();
    },
    onSuccess: (data) => {
      const qrCode = data.qrCode || '';
      const qrImage = data.qrImage || ''; 
      
      setQrCodeData(qrCode);
      setQrImageUrl(qrImage);
      setShowQR(true);
      
      toast({
        title: "🔥 QR Code Gerado!",
        description: "📱 Escaneie com seu WhatsApp para conectar!",
        duration: 2000,
      });
    },
    onError: (error: any) => {
      console.log('🔍 Error object:', { status: error?.status, message: error?.message, error: error?.error });
      
      toast({
        title: "❌ Erro ao Gerar QR Code",
        description: error?.message || "Falha ao gerar QR Code. Tente novamente.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // ⏸️ POLLING DESATIVADO - Só funciona quando clicar em "Conectar"
  // useEffect(() => {
  //   if (!open) return;
  //   
  //   // 🎉 FECHAR MODAL AUTOMATICAMENTE QUANDO CONECTAR
  //   if (whatsappStatus?.connected) {
  //     toast({
  //       title: "🎉 WhatsApp Conectado com Sucesso!",
  //       description: "🚀 RanZap está ativo! Seu funil de vendas automatizado já está funcionando!",
  //     });
  //     setTimeout(() => {
  //       onOpenChange(false);
  //       setShowQR(false);
  //     }, 2000); // Fechar após 2 segundos para mostrar a mensagem
  //     return;
  //   }
  //   
  //   const interval = setInterval(() => {
  //     queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
  //   }, 3000);
  //
  //   return () => clearInterval(interval);
  // }, [open, whatsappStatus?.connected, queryClient, onOpenChange, toast]);

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
        duration: 2000,
      });
      setShowQR(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao desconectar WhatsApp.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md" data-testid="modal-whatsapp-connection">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2 text-primary" />
            Conectar WhatsApp com QR Code
          </DialogTitle>
          <DialogDescription>
            Escaneie o código QR com seu WhatsApp para conectar
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
              {/* QR Code Generation */}
              <div className="text-center space-y-4">
                {showQR && qrImageUrl ? (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mx-auto inline-block">
                      <img 
                        src={qrImageUrl} 
                        alt="QR Code" 
                        className="w-64 h-64"
                        data-testid="img-qr-code"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-blue-700">📱 Escaneie o QR Code</h3>
                      <p className="text-sm text-gray-600">Abra o WhatsApp no seu celular e escaneie este código</p>
                      
                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                        <p className="font-medium mb-2">Como conectar:</p>
                        <ol className="text-left space-y-1 text-xs">
                          <li><strong>1.</strong> Abra WhatsApp no seu celular</li>
                          <li><strong>2.</strong> Toque em <strong>⋮ (Menu) → Aparelhos conectados</strong></li>
                          <li><strong>3.</strong> Toque em <strong>Conectar um aparelho</strong></li>
                          <li><strong>4.</strong> Escaneie este QR Code com a câmera</li>
                        </ol>
                      </div>
                      
                      <Button
                        onClick={() => generateQRMutation.mutate()}
                        variant="outline"
                        className="w-full"
                        data-testid="button-regenerate-qr"
                      >
                        🔄 Gerar Novo QR Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300">
                    <div>
                      <h3 className="text-lg font-bold text-purple-700">Pronto para conectar?</h3>
                      <p className="text-sm text-gray-600">Clique abaixo para gerar o QR Code</p>
                    </div>
                    
                    {generateQRMutation.isPending ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="font-medium text-blue-700">Gerando QR Code...</p>
                        <p className="text-sm text-gray-600">Aguarde alguns segundos...</p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => generateQRMutation.mutate()}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
                        data-testid="button-generate-qr"
                      >
                        <QrCode className="h-5 w-5 mr-2" />
                        Gerar QR Code
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                  data-testid="button-close-modal"
                >
                  Fechar
                </Button>
              </div>
            </>
          ) : (
            /* ✅ WhatsApp Conectado */
            (<div className="space-y-4 text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-green-700">✅ WhatsApp Conectado!</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-green-800">🎉 Pilot Zap está funcionando!</p>
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
            </div>)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
