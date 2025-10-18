import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Funnel } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Plus,
  Trash2,
  Edit,
  MessageSquare,
  Upload,
  Download,
  ChefHat,
  FileText,
  Sparkles
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Question {
  id: string;
  question: string;
  answer: string;
}

interface FunnelData {
  id: string;
  name: string;
  description: string;
  instructions: string;
  questions: Question[];
  temperature: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FunnelBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFunnelData, setImportedFunnelData] = useState<FunnelData | null>(null);

  const { data: funnels, isLoading } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
    retry: false,
  });

  useEffect(() => {
    const loadFunnelData = async () => {
      try {
        const response = await fetch('/api/funnel-json');
        const data = await response.json();
        setImportedFunnelData(data);
      } catch (error) {
        console.error('Erro ao carregar o funil JSON:', error);
      }
    };

    loadFunnelData();
  }, []);

  const createFunnelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/funnels", {
        name: newFunnelName,
        status: "draft",
        flowData: { nodes: [], edges: [] },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Funil Criado",
        description: "Seu funil foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      setIsCreateDialogOpen(false);
      setNewFunnelName("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar funil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteFunnelMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      const response = await apiRequest("DELETE", `/api/funnels/${funnelId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Funil Removido",
        description: "Funil removido com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover funil.",
        variant: "destructive",
      });
    },
  });

  const toggleFunnelStatusMutation = useMutation({
    mutationFn: async ({ funnelId, newStatus }: { funnelId: string; newStatus: string }) => {
      const response = await apiRequest("PUT", `/api/funnels/${funnelId}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do funil.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (funnels: any[]) => {
      const res = await apiRequest('POST', '/api/funnels/import', { funnels });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Funis importados!",
        description: `${data.imported} funis foram adicionados com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao importar",
        description: error.message || "Não foi possível importar os funis. Verifique o formato do arquivo.",
        variant: "destructive",
      });
    },
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        const funnels = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        importMutation.mutate(funnels);
      } catch (error) {
        toast({
          title: "Arquivo inválido",
          description: "O arquivo não está em formato JSON válido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportFunnels = () => {
    if (!funnels || funnels.length === 0) {
      toast({
        title: "Nenhum funil",
        description: "Não há funis para exportar.",
        variant: "destructive",
      });
      return;
    }

    const exportData = funnels.map(funnel => ({
      name: funnel.name,
      triggerPhrases: funnel.triggerPhrases,
      status: funnel.status,
      flowData: funnel.flowData,
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `funis-ranzap-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Funis exportados!",
      description: `${funnels.length} funis foram exportados com sucesso.`,
    });
  };

  const handleCreateFunnel = () => {
    if (!newFunnelName.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Digite um nome para o funil",
        variant: "destructive",
      });
      return;
    }
    createFunnelMutation.mutate();
  };

  const getActiveFunnelsCount = (funnel: Funnel) => {
    return 0;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Funis de venda</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {importedFunnelData ? importedFunnelData.name : 'Crie fluxos de mensagens desenhados automaticamente para captar clientes online em um catálogo core web'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                data-testid="input-import-file"
              />
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
                data-testid="button-import-funnels"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? 'Importando...' : 'Importar'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleExportFunnels}
                disabled={!funnels || funnels.length === 0}
                data-testid="button-export-funnels"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                data-testid="button-create-funnel"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Funil
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {importedFunnelData && (
            <Card className="mb-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white" data-testid="text-imported-funnel-name">
                      {importedFunnelData.name}
                    </CardTitle>
                    <CardDescription className="text-gray-300" data-testid="text-imported-funnel-description">
                      {importedFunnelData.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {importedFunnelData.published ? 'Publicado' : 'Rascunho'}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {importedFunnelData.questions.length} Perguntas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="questions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                    <TabsTrigger value="questions" data-testid="tab-questions">Perguntas Frequentes</TabsTrigger>
                    <TabsTrigger value="instructions" data-testid="tab-instructions">Instruções</TabsTrigger>
                  </TabsList>
                  <TabsContent value="questions" className="mt-4">
                    <Accordion type="single" collapsible className="space-y-3">
                      {importedFunnelData.questions.map((q, index) => (
                        <AccordionItem 
                          key={q.id} 
                          value={q.id}
                          className="bg-gray-950/50 border border-gray-800 rounded-lg px-4 data-[state=open]:border-purple-500/50"
                          data-testid={`accordion-question-${index}`}
                        >
                          <AccordionTrigger 
                            className="text-left hover:no-underline text-white hover:text-purple-400 transition-colors"
                            data-testid={`trigger-question-${index}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-purple-400 font-bold mt-1">Q{index + 1}:</span>
                              <span>{q.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent 
                            className="text-gray-300 pt-2 pb-4"
                            data-testid={`content-answer-${index}`}
                          >
                            <div className="flex gap-3 pl-8">
                              <span className="text-pink-400 font-bold">R:</span>
                              <p className="flex-1">{q.answer}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                  <TabsContent value="instructions" className="mt-4">
                    <div 
                      className="text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-950/50 p-4 rounded-lg border border-gray-800 text-sm"
                      data-testid="text-instructions"
                    >
                      {importedFunnelData.instructions}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          <Separator className="my-6" />

          <h3 className="text-xl font-bold text-foreground mb-4">Seus Funis Criados</h3>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse bg-card border border-border">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="flex justify-between mt-4">
                    <div className="h-10 w-20 bg-muted rounded"></div>
                    <div className="h-10 w-20 bg-muted rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {funnels && funnels.length > 0 ? (
                funnels.map((funnel) => (
                  <Card 
                    key={funnel.id} 
                    className="p-6 bg-card border border-border hover:border-primary/50 transition-all"
                    data-testid={`card-funnel-${funnel.id}`}
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground uppercase" data-testid={`text-funnel-name-${funnel.id}`}>
                          {funnel.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getActiveFunnelsCount(funnel)} gatilho(s)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Ola, quem sere...
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${funnel.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-muted-foreground" data-testid={`text-funnel-status-${funnel.id}`}>
                              {funnel.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <Switch
                            checked={funnel.status === 'active'}
                            onCheckedChange={(checked) => {
                              toggleFunnelStatusMutation.mutate({
                                funnelId: funnel.id,
                                newStatus: checked ? 'active' : 'inactive'
                              });
                            }}
                            data-testid={`switch-funnel-status-${funnel.id}`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-full w-10 h-10 bg-red-600 hover:bg-red-700"
                          onClick={() => deleteFunnelMutation.mutate(funnel.id)}
                          disabled={deleteFunnelMutation.isPending}
                          data-testid={`button-delete-funnel-${funnel.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="rounded-full w-10 h-10 bg-purple-600 hover:bg-purple-700"
                          onClick={() => setLocation(`/funnel-editor/${funnel.id}`)}
                          data-testid={`button-edit-funnel-${funnel.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum funil criado</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Comece criando seu primeiro funil de vendas automatizado
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-create-first-funnel"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Funil
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-create-funnel">
          <DialogHeader>
            <DialogTitle>Criar Novo Funil</DialogTitle>
            <DialogDescription>
              Configure seu novo funil de vendas automatizado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="funnel-name">Nome do Funil</Label>
              <Input
                id="funnel-name"
                placeholder="Ex: Funil Grátis Henrique"
                value={newFunnelName}
                onChange={(e) => setNewFunnelName(e.target.value)}
                data-testid="input-new-funnel-name"
              />
              <p className="text-xs text-muted-foreground">
                Configure a frase gatilho dentro do editor do funil
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFunnel}
              disabled={createFunnelMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-confirm-create"
            >
              {createFunnelMutation.isPending ? "Criando..." : "Criar Funil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
