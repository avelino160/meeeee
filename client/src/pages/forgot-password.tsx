import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Plane, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Step 1 — enter email
const emailSchema = z.object({ email: z.string().email("E-mail inválido") });
type EmailInput = z.infer<typeof emailSchema>;

// Step 2 — enter code + new password
const resetSchema = z.object({
  code: z.string().length(6, "O código tem 6 dígitos"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});
type ResetInput = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 form
  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Step 2 form
  const resetForm = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const sendCodeMutation = useMutation({
    mutationFn: (data: EmailInput) =>
      apiRequest("POST", "/api/auth/forgot-password", data),
    onSuccess: async (res: any) => {
      const body = await res.json().catch(() => ({}));
      setEmail(emailForm.getValues("email"));
      if (body?.devCode) setDevCode(body.devCode);
      setStep("code");
    },
    onError: async (error: any) => {
      let message = "Erro ao enviar código";
      try { const b = await error.json?.(); if (b?.message) message = b.message; } catch {}
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ confirmPassword: _, ...data }: ResetInput) =>
      apiRequest("POST", "/api/auth/reset-password", { email, ...data }),
    onSuccess: () => setStep("done"),
    onError: async (error: any) => {
      let message = "Código inválido ou expirado";
      try { const b = await error.json?.(); if (b?.message) message = b.message; } catch {}
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plane className="h-10 w-10 text-purple-500" />
            <h1 className="text-3xl font-bold text-primary">Pilot Zap</h1>
          </div>
          <p className="text-muted-foreground">Automação para WhatsApp</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* DONE */}
          {step === "done" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Senha redefinida!</h2>
              <p className="text-sm text-muted-foreground">
                Sua senha foi alterada com sucesso. Faça login com a nova senha.
              </p>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full bg-purple-600 hover:bg-purple-700"
                data-testid="button-go-login"
              >
                Ir para o login
              </Button>
            </div>
          )}

          {/* STEP 1 — email */}
          {step === "email" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">Esqueci minha senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Vamos enviar um código de 6 dígitos para o seu e-mail.
                </p>
              </div>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit((d) => sendCodeMutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail cadastrado</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-10"
                              autoComplete="email"
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={sendCodeMutation.isPending}
                    data-testid="button-send-code"
                  >
                    {sendCodeMutation.isPending ? "Enviando..." : "Enviar código"}
                  </Button>
                </form>
              </Form>
              <button
                onClick={() => setLocation("/login")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
                data-testid="link-back-login"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao login
              </button>
            </div>
          )}

          {/* STEP 2 — code + new password */}
          {step === "code" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">Verifique seu e-mail</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enviamos um código de 6 dígitos para <strong className="text-foreground">{email}</strong>.
                  Ele expira em 15 minutos.
                </p>
              </div>

              {devCode && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
                  <p className="text-yellow-400 font-medium">Modo desenvolvimento</p>
                  <p className="text-yellow-300/80">SMTP não configurado. Código: <strong>{devCode}</strong></p>
                </div>
              )}

              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit((d) => resetMutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de verificação</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="123456"
                              className="pl-10 text-center text-xl tracking-widest font-mono"
                              maxLength={6}
                              autoComplete="one-time-code"
                              data-testid="input-code"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Mínimo 6 caracteres"
                              className="pl-10 pr-10"
                              autoComplete="new-password"
                              data-testid="input-new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nova senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Repita a nova senha"
                              className="pl-10"
                              autoComplete="new-password"
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={resetMutation.isPending}
                    data-testid="button-submit-reset"
                  >
                    {resetMutation.isPending ? "Redefinindo..." : "Redefinir senha"}
                  </Button>
                </form>
              </Form>

              <div className="flex justify-between text-sm">
                <button
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  data-testid="link-change-email"
                >
                  <ArrowLeft className="h-3 w-3" /> Trocar e-mail
                </button>
                <button
                  onClick={() => sendCodeMutation.mutate({ email })}
                  disabled={sendCodeMutation.isPending}
                  className="text-purple-400 hover:text-purple-300 disabled:opacity-50"
                  data-testid="button-resend-code"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
