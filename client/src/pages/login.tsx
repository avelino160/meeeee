import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plane, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});
type LoginInput = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) =>
      apiRequest("POST", "/api/auth/login", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setLocation("/");
    },
    onError: async (error: any) => {
      let message = "Erro ao fazer login";
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
          <div>
            <h2 className="text-xl font-semibold">Entrar na sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">Digite seus dados para acessar</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          autoComplete="current-password"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loginMutation.isPending}
                data-testid="button-submit-login"
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>

          <div className="space-y-3 text-center">
            <button
              onClick={() => setLocation("/forgot-password")}
              className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
              data-testid="link-forgot-password"
            >
              Esqueci minha senha
            </button>
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-purple-400 hover:text-purple-300 font-medium"
                data-testid="link-register"
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
