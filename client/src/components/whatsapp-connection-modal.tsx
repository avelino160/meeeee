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
import { Key, Plus } from "lucide-react";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppConnectionModal({ open, onOpenChange }: WhatsAppConnectionModalProps) {
  const [idInstance, setIdInstance] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [connectionName, setConnectionName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    enabled: open,
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
            <Key className="h-5 w-5 mr-2 text-primary" />
            Adicionar Conta Green API
          </DialogTitle>
          <DialogDescription>
            Insira suas credenciais da Green API para conectar sua conta WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Como obter suas credenciais?</strong><br />
              Acesse <a href="https://app.green-api.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-700 dark:text-blue-300">app.green-api.com</a> para gerar seu ID Instance e Token.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="connection-name" className="text-sm font-medium">
                Nome da Conexão (opcional)
              </Label>
              <Input
                id="connection-name"
                placeholder="Ex: WhatsApp Principal"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                data-testid="input-connection-name"
              />
            </div>

            <div>
              <Label htmlFor="phone-number" className="text-sm font-medium">
                Número de Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone-number"
                placeholder="Ex: 5511999999999 ou +55 11 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número com código do país (55 para Brasil)
              </p>
            </div>

            <div>
              <Label htmlFor="id-instance" className="text-sm font-medium">
                ID Instance <span className="text-red-500">*</span>
              </Label>
              <Input
                id="id-instance"
                placeholder="Ex: 1234567890123456"
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
                type="password"
                data-testid="input-id-instance"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Encontrado no painel Green API
              </p>
            </div>

            <div>
              <Label htmlFor="api-token" className="text-sm font-medium">
                API Token <span className="text-red-500">*</span>
              </Label>
              <Input
                id="api-token"
                placeholder="Ex: abcdef1234567890"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                type="password"
                data-testid="input-api-token"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Token da sua instância Green API
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => addConnectionMutation.mutate()}
              disabled={addConnectionMutation.isPending}
              className="flex-1"
              data-testid="button-add-connection"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addConnectionMutation.isPending ? "Adicionando..." : "Adicionar Conexão"}
            </Button>
          </div>

          {/* Help Text */}
          <div className="border-t pt-4">
            <details className="cursor-pointer">
              <summary className="font-medium text-sm hover:text-primary">
                📖 Como criar uma instância na Green API?
              </summary>
              <div className="mt-3 text-xs space-y-2 text-muted-foreground">
                <p>1. Acesse <a href="https://app.green-api.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">app.green-api.com</a></p>
                <p>2. Crie uma conta ou faça login</p>
                <p>3. Acesse "Minhas Instâncias" e clique em "Nova Instância"</p>
                <p>4. Siga as instruções de escanear o QR Code</p>
                <p>5. Copie o ID Instance e API Token</p>
                <p>6. Cole aqui e clique em "Adicionar Conexão"</p>
              </div>
            </details>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
