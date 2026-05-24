import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalStep = "idle" | "starting" | "waiting_qr" | "connected" | "error";

export default function WhatsAppConnectionModal({ open, onOpenChange }: WhatsAppConnectionModalProps) {
  const [step, setStep] = useState<ModalStep>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const reset = () => {
    stopPolling();
    if (sessionId) {
      apiRequest("DELETE", `/api/whatsapp/session/${sessionId}`).catch(() => {});
    }
    setStep("idle");
    setSessionId(null);
    setQrCode(null);
    setPhoneNumber(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/whatsapp/start-session");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Falha ao iniciar sessão");
      }
      return res.json() as Promise<{ sessionId: string }>;
    },
    onSuccess: ({ sessionId: sid }) => {
      setSessionId(sid);
      setStep("starting");
      startPolling(sid);
    },
    onError: (err: any) => {
      setStep("error");
      setErrorMsg(err?.message || "Erro ao iniciar sessão");
      toast({
        title: "❌ Erro",
        description: err?.message || "Não foi possível iniciar a sessão.",
        variant: "destructive",
      });
    },
  });

  const startPolling = (sid: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/session-status/${sid}`);
        if (!res.ok) {
          stopPolling();
          setStep("error");
          setErrorMsg("Sessão não encontrada");
          return;
        }
        const data = await res.json();

        if (data.status === "waiting_qr" && data.qrCode) {
          setQrCode(data.qrCode);
          setStep("waiting_qr");
        }

        if (data.status === "connected") {
          stopPolling();
          setPhoneNumber(data.phoneNumber);
          setStep("connected");
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connections"] });
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connected-count"] });
          toast({
            title: "✅ WhatsApp Conectado!",
            description: `Número ${data.phoneNumber} conectado com sucesso.`,
          });
        }

        if (data.status === "error") {
          stopPolling();
          setStep("error");
          setErrorMsg(data.error || "Erro na conexão");
        }
      } catch (_) {}
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-[95vw] max-w-md" data-testid="modal-whatsapp-connection">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-2">
          {/* IDLE */}
          {step === "idle" && (
            <div className="w-full space-y-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl border-2 border-purple-300 dark:border-purple-700">
              <div>
                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300">Pronto para conectar?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Clique abaixo para gerar o QR Code via Baileys
                </p>
              </div>
              <Button
                onClick={() => startSessionMutation.mutate()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
                data-testid="button-generate-qr"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Gerar QR Code
              </Button>
            </div>
          )}

          {/* STARTING */}
          {step === "starting" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              <p className="font-semibold text-purple-700 dark:text-purple-300">Iniciando sessão...</p>
              <p className="text-sm text-muted-foreground">Aguarde alguns segundos</p>
            </div>
          )}

          {/* QR CODE */}
          {step === "waiting_qr" && qrCode && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="bg-white p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 sm:w-64 sm:h-64"
                  data-testid="img-qr-code"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="font-bold text-purple-700 dark:text-purple-300 text-lg">📱 Escaneie o QR Code</p>
                <p className="text-sm text-muted-foreground">Abra o WhatsApp no celular e escaneie este código</p>
              </div>

              <div className="bg-muted rounded-lg p-4 text-sm w-full">
                <p className="font-medium mb-2">Como conectar:</p>
                <ol className="space-y-1 text-xs text-muted-foreground">
                  <li><strong>1.</strong> Abra o WhatsApp no celular</li>
                  <li><strong>2.</strong> Toque em <strong>⋮ → Aparelhos conectados</strong></li>
                  <li><strong>3.</strong> Toque em <strong>Conectar um aparelho</strong></li>
                  <li><strong>4.</strong> Aponte a câmera para este QR Code</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando você escanear...
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => { reset(); }}
                className="w-full"
                data-testid="button-regenerate-qr"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Novo QR Code
              </Button>
            </div>
          )}

          {/* CONNECTED */}
          {step === "connected" && (
            <div className="flex flex-col items-center gap-4 py-6 w-full">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Conectado!</h3>
                {phoneNumber && (
                  <p className="text-muted-foreground mt-1">Número: +{phoneNumber}</p>
                )}
              </div>
              <Button
                onClick={() => { reset(); onOpenChange(false); }}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 w-full">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Erro na conexão</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg || "Tente novamente"}</p>
              </div>
              <Button
                onClick={() => { reset(); }}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
