import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { CampaignsResponse } from "@shared/api-types";
import Sidebar from "@/components/sidebar";
import FunnelCanvas from "@/components/funnel-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Save, 
  Eye, 
  MessageSquare, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  MapPin,
  GitBranch,
  Clock,
  HelpCircle,
  Tag,
  CheckCircle
} from "lucide-react";

interface FunnelNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    content?: string;
    mediaUrl?: string;
    delayMinutes?: number;
  };
}

interface FunnelData {
  nodes: FunnelNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export default function FunnelBuilder() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedNode, setSelectedNode] = useState<FunnelNode | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData>({ nodes: [], edges: [] });
  const [funnelName, setFunnelName] = useState("Novo Funil");
  const [funnelStatus, setFunnelStatus] = useState("draft");
  const [triggerPhrase, setTriggerPhrase] = useState("Estou interessado");
  const [initialDelay, setInitialDelay] = useState(1);
  const [isActiveForNewContacts, setIsActiveForNewContacts] = useState(true);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: campaigns } = useQuery<CampaignsResponse>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const saveFunnelMutation = useMutation({
    mutationFn: async () => {
      if (!campaigns || campaigns.length === 0) {
        throw new Error("Nenhuma campanha encontrada");
      }
      
      const campaignId = campaigns[0].id; // Use first campaign for now
      
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/funnels`, {
        name: funnelName,
        status: funnelStatus,
        flowData: funnelData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Funil Salvo",
        description: "Seu funil foi salvo com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao salvar funil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleNodeSelect = (node: FunnelNode | null) => {
    setSelectedNode(node);
  };

  const handleFunnelDataChange = (newData: FunnelData) => {
    setFunnelData(newData);
  };

  const handlePreviewFunnel = () => {
    toast({
      title: "Visualizando Funil",
      description: "Funcionalidade de preview em desenvolvimento",
    });
  };

  const handleSaveFunnel = () => {
    if (!funnelName.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Digite um nome para o funil",
        variant: "destructive",
      });
      return;
    }
    saveFunnelMutation.mutate();
  };

  const updateNodeContent = (content: string) => {
    if (!selectedNode) return;
    
    const updatedNodes = funnelData.nodes.map(node => 
      node.id === selectedNode.id 
        ? { ...node, data: { ...node.data, content } }
        : node
    );
    
    setFunnelData({ ...funnelData, nodes: updatedNodes });
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, content } });
  };

  const updateNodeDelay = (delayMinutes: number) => {
    if (!selectedNode) return;
    
    const updatedNodes = funnelData.nodes.map(node => 
      node.id === selectedNode.id 
        ? { ...node, data: { ...node.data, delayMinutes } }
        : node
    );
    
    setFunnelData({ ...funnelData, nodes: updatedNodes });
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, delayMinutes } });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-page-title">Construtor de Funil</h2>
              <p className="text-sm text-muted-foreground">Crie e gerencie suas sequências de mensagens automatizadas</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={handlePreviewFunnel}
                data-testid="button-preview-funnel"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button 
                onClick={handleSaveFunnel}
                disabled={saveFunnelMutation.isPending}
                data-testid="button-save-funnel"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveFunnelMutation.isPending ? "Salvando..." : "Salvar Funil"}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Toolbox */}
          <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Message Types */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Mensagens
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors" data-testid="tool-text">
                    <MessageSquare className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">Texto</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors" data-testid="tool-image">
                    <Image className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">Imagem</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors" data-testid="tool-video">
                    <Video className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">Vídeo</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors" data-testid="tool-audio">
                    <Mic className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">Áudio</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors" data-testid="tool-document">
                    <FileText className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">Documento</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors" data-testid="tool-location">
                    <MapPin className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-medium">Localização</p>
                  </div>
                </div>
              </div>
              
              {/* Logic Elements */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Lógica
                </h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors flex items-center" data-testid="tool-condition">
                    <GitBranch className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm font-medium">Condição</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors flex items-center" data-testid="tool-delay">
                    <Clock className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm font-medium">Esperar</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors flex items-center" data-testid="tool-question">
                    <HelpCircle className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm font-medium">Pergunta</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors flex items-center" data-testid="tool-tag">
                    <Tag className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm font-medium">Tag</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors flex items-center" data-testid="tool-verify">
                    <CheckCircle className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm font-medium">Verificar</span>
                  </div>
                </div>
              </div>
              
              {/* Trigger Configuration */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Gatilho Inicial
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1">Frase Gatilho</Label>
                    <Input 
                      type="text" 
                      placeholder="Ex: Estou interessado"
                      value={triggerPhrase}
                      onChange={(e) => setTriggerPhrase(e.target.value)}
                      data-testid="input-trigger-phrase"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1">Delay Inicial (minutos)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={initialDelay}
                      onChange={(e) => setInitialDelay(parseInt(e.target.value) || 0)}
                      data-testid="input-initial-delay"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Canvas Area */}
          <div className="flex-1 relative">
            <FunnelCanvas
              data={funnelData}
              onDataChange={handleFunnelDataChange}
              onNodeSelect={handleNodeSelect}
            />
          </div>
          
          {/* Right Properties Panel */}
          <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Node Properties */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Propriedades do Nó
                </h3>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1">Tipo</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm" data-testid="text-node-type">
                        {selectedNode.type === 'message' ? 'Mensagem' : 
                         selectedNode.type === 'delay' ? 'Esperar' :
                         selectedNode.type === 'condition' ? 'Condição' :
                         selectedNode.type}
                      </div>
                    </div>
                    {selectedNode.type === 'message' && (
                      <>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1">Conteúdo</Label>
                          <Textarea 
                            placeholder="Digite sua mensagem aqui..."
                            value={selectedNode.data.content || ''}
                            onChange={(e) => updateNodeContent(e.target.value)}
                            className="h-24 resize-none"
                            data-testid="textarea-node-content"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1">Delay (minutos)</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={selectedNode.data.delayMinutes || 0}
                            onChange={(e) => updateNodeDelay(parseInt(e.target.value) || 0)}
                            data-testid="input-node-delay"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-node-selected">
                    Selecione um nó para editar suas propriedades
                  </p>
                )}
              </div>
              
              <Separator />
              
              {/* Funnel Settings */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Configurações do Funil
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1">Nome do Funil</Label>
                    <Input 
                      type="text"
                      value={funnelName}
                      onChange={(e) => setFunnelName(e.target.value)}
                      data-testid="input-funnel-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1">Status</Label>
                    <Select value={funnelStatus} onValueChange={setFunnelStatus}>
                      <SelectTrigger data-testid="select-funnel-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="activeForNewContacts"
                      checked={isActiveForNewContacts}
                      onCheckedChange={(checked) => setIsActiveForNewContacts(checked === true)}
                      data-testid="checkbox-active-for-new-contacts"
                    />
                    <Label htmlFor="activeForNewContacts" className="text-xs text-muted-foreground">
                      Ativar para novos contatos
                    </Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Analytics Preview */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Estatísticas
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Disparos hoje</span>
                    <span className="text-sm font-medium text-primary" data-testid="text-today-triggers">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Taxa de resposta</span>
                    <span className="text-sm font-medium text-green-500" data-testid="text-response-rate">0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Ativos no funil</span>
                    <span className="text-sm font-medium" data-testid="text-active-in-funnel">0</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
