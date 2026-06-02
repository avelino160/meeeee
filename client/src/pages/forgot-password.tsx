import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Plane, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});
type FormInput = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", newPassword: "", confirmPassword: "" },
  });

  const resetMutation = useMutation({
    mutationFn: ({ confirmPassword: _, ...data }: FormInput) =>
      apiRequest("POST", "/api/auth/forgot-password", data),
    onSuccess: () => setDone(true),
    onError: async (error: any) => {
      let message = "Erro ao redefinir senha";
      try {
        const body = await error.json?.();
        if (body?.message) message = body.message;
      } catch {}
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

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg space-y-6">
          {done ? (
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
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold">Redefinir senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Digite seu e-mail e escolha uma nova senha
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => resetMutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={form.control}
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

                  <FormField
                    control={form.control}
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
                    control={form.control}
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

              <button
                onClick={() => setLocation("/login")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
                data-testid="link-back-login"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
