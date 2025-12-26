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
import { QrCode } from "lucide-react";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppConnectionModal({ open, onOpenChange }: WhatsAppConnectionModalProps) {
  const [idInstance, setIdInstance] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [connectionName, setConnectionName] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    enabled: open,
  });

  // 🎯 GERAR QR CODE DIRETO DA GREEN API
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      // Usando credenciais do environment
      const id = import.meta.env.VITE_GREEN_API_ID_INSTANCE || "7105442726";
      const token = import.meta.env.VITE_GREEN_API_TOKEN_INSTANCE || "60800edd5b5841c991ee97cba8e4e8e7f55983bee177449681";
      
      try {
        const response = await fetch(`https://api.green-api.com/waInstance${id}/qr/${token}`);
        if (!response.ok) {
          throw new Error("Falha ao gerar QR Code");
        }
        const data = await response.json();
        
        if (data.qrCode) {
          setQrCodeImage(data.qrCode);
          setShowQR(true);
          setIdInstance(id);
          setApiToken(token);
          
          toast({
            title: "✅ QR Code Gerado!",
            description: "Escaneie com seu WhatsApp para conectar",
            duration: 2000,
          });
        }
      } catch (error) {
        throw new Error("Não foi possível gerar o QR Code. Verifique suas credenciais.");
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao Gerar QR Code",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // 🚀 ADICIONAR CONEXÃO GREEN API
  const addConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!idInstance.trim() || !apiToken.trim() || !phoneNumber.trim()) {
        throw new Error("Preencha todos os campos obrigatórios");
      }
      
      const response = await apiRequest("POST", "/api/whatsapp/connections", {
        name: connectionName.trim() || `Green API ${phoneNumber}`,
        idInstance: idInstance.trim(),
        apiTokenInstance: apiToken.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao adicionar conexão");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Conexão Adicionada!",
        description: "Sua conta Green API foi conectada com sucesso!",
        duration: 2000,
      });
      
      // Limpar formulário
      setIdInstance("");
      setApiToken("");
      setPhoneNumber("");
      setConnectionName("");
      setQrCodeImage("");
      setShowQR(false);
      
      // Fechar modal e atualizar lista
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao Adicionar Conexão",
        description: error?.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
        duration: 3000,
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
        duration: 2000,
      });
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
      <DialogContent className="w-[95vw] max-w-lg" data-testid="modal-whatsapp-connection">
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
          {!showQR ? (
            <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300 dark:from-purple-950 dark:to-purple-900 dark:border-purple-700">
              <div>
                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300">Pronto para conectar?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Clique abaixo para gerar o QR Code</p>
              </div>
              
              {generateQRMutation.isPending ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="font-medium text-blue-700 dark:text-blue-400">Gerando QR Code...</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Aguarde alguns segundos...</p>
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
          ) : qrCodeImage ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mx-auto inline-block dark:bg-gray-800">
                <img 
                  src={qrCodeImage} 
                  alt="QR Code" 
                  className="w-64 h-64"
                  data-testid="img-qr-code"
                />
              </div>
              
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">📱 Escaneie o QR Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Abra o WhatsApp no seu celular e escaneie este código</p>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium mb-2">Como conectar:</p>
                  <ol className="text-left space-y-1 text-xs">
                    <li><strong>1.</strong> Abra WhatsApp no seu celular</li>
                    <li><strong>2.</strong> Toque em <strong>⋮ (Menu) → Aparelhos conectados</strong></li>
                    <li><strong>3.</strong> Toque em <strong>Conectar um aparelho</strong></li>
                    <li><strong>4.</strong> Escaneie este QR Code com a câmera</li>
                  </ol>
                </div>
                
                <Button
                  onClick={() => {
                    setShowQR(false);
                    setQrCodeImage("");
                  }}
                  variant="outline"
                  className="w-full"
                  data-testid="button-regenerate-qr"
                >
                  🔄 Gerar Novo QR Code
                </Button>
              </div>

              {idInstance && apiToken && (
                <div>
                  <Label htmlFor="phone-number" className="text-sm font-medium">
                    Número de Telefone (após escanear) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone-number"
                    placeholder="Ex: 5511999999999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    data-testid="input-phone-number"
                  />
                  <Button
                    onClick={() => addConnectionMutation.mutate()}
                    disabled={addConnectionMutation.isPending || !phoneNumber}
                    className="w-full mt-2"
                    data-testid="button-confirm-connection"
                  >
                    {addConnectionMutation.isPending ? "Conectando..." : "✅ Confirmar Conexão"}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
