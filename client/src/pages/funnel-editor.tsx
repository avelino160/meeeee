import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import type { Funnel } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import FunnelCanvas from "@/components/funnel-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle,
  ArrowLeft
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

export default function FunnelEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/funnel-editor/:id");
  const funnelId = params?.id;
  
  const [selectedNode, setSelectedNode] = useState<FunnelNode | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData>({ nodes: [], edges: [] });
  const [funnelName, setFunnelName] = useState("Novo Funil");
  const [funnelStatus, setFunnelStatus] = useState("draft");

  const { data: funnel, isLoading } = useQuery<Funnel>({
    queryKey: [`/api/funnels/${funnelId}`],
    enabled: !!funnelId,
  });

  useEffect(() => {
    if (funnel) {
      setFunnelName(funnel.name);
      setFunnelStatus(funnel.status || 'draft');
      if (funnel.flowData && typeof funnel.flowData === 'object') {
        setFunnelData(funnel.flowData as FunnelData);
      }
    }
  }, [funnel]);

  const saveFunnelMutation = useMutation({
    mutationFn: async () => {
      if (!funnelId) {
        throw new Error("ID do funil não encontrado");
      }
      
      const response = await apiRequest("PUT", `/api/funnels/${funnelId}`, {
        name: funnelName,
        status: funnelStatus,
        flowData: funnelData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Funil Salvo",
        description: "Seu funil foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels", funnelId] });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
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
      title: "👁️ Visualizando Funil",
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando funil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#252525] border-b border-[#333] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/funnel-builder")}
                className="text-gray-400 hover:text-white"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-white" data-testid="text-page-title">
                  Editor de Funil
                </h2>
                <p className="text-sm text-gray-400">
                  Construa seu fluxo de mensagens automatizadas
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={handlePreviewFunnel}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-preview-funnel"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button 
                onClick={handleSaveFunnel}
                disabled={saveFunnelMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
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
          <div className="w-64 bg-[#252525] border-r border-[#333] p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Message Types */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Mensagens
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-gray-700" data-testid="tool-text">
                    <MessageSquare className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Texto</p>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-gray-700" data-testid="tool-image">
                    <Image className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Imagem</p>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-gray-700" data-testid="tool-video">
                    <Video className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Vídeo</p>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-gray-700" data-testid="tool-audio">
                    <Mic className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Áudio</p>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-gray-700" data-testid="tool-document">
                    <FileText className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Documento</p>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-gray-700" data-testid="tool-location">
                    <MapPin className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Local</p>
                  </div>
                </div>
              </div>
              
              {/* Logic Elements */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Lógica
                </h3>
                <div className="space-y-2">
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors flex items-center border border-gray-700" data-testid="tool-condition">
                    <GitBranch className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Condição</span>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors flex items-center border border-gray-700" data-testid="tool-delay">
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Esperar</span>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors flex items-center border border-gray-700" data-testid="tool-question">
                    <HelpCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Pergunta</span>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors flex items-center border border-gray-700" data-testid="tool-tag">
                    <Tag className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Tag</span>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333] transition-colors flex items-center border border-gray-700" data-testid="tool-verify">
                    <CheckCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Verificar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Canvas Area */}
          <div className="flex-1 relative bg-[#1a1a1a]">
            <FunnelCanvas
              data={funnelData}
              onDataChange={handleFunnelDataChange}
              onNodeSelect={handleNodeSelect}
            />
          </div>
          
          {/* Right Properties Panel */}
          <div className="w-80 bg-[#252525] border-l border-[#333] p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Node Properties */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Propriedades do Nó
                </h3>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-400 mb-1">Tipo</Label>
                      <div className="px-3 py-2 bg-[#2a2a2a] rounded-md text-sm text-gray-300" data-testid="text-node-type">
                        {selectedNode.type === 'message' ? 'Mensagem' : 
                         selectedNode.type === 'delay' ? 'Esperar' :
                         selectedNode.type === 'condition' ? 'Condição' :
                         selectedNode.type}
                      </div>
                    </div>
                    {selectedNode.type === 'message' && (
                      <>
                        <div>
                          <Label className="text-xs font-medium text-gray-400 mb-1">Conteúdo</Label>
                          <Textarea 
                            placeholder="Digite sua mensagem aqui..."
                            value={selectedNode.data.content || ''}
                            onChange={(e) => updateNodeContent(e.target.value)}
                            className="h-24 resize-none bg-[#2a2a2a] border-gray-600 text-gray-300"
                            data-testid="textarea-node-content"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-400 mb-1">Delay (minutos)</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={selectedNode.data.delayMinutes || 0}
                            onChange={(e) => updateNodeDelay(parseInt(e.target.value) || 0)}
                            className="bg-[#2a2a2a] border-gray-600 text-gray-300"
                            data-testid="input-node-delay"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500" data-testid="text-no-node-selected">
                    Selecione um nó para editar suas propriedades
                  </p>
                )}
              </div>
              
              <Separator className="bg-gray-700" />
              
              {/* Funnel Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Configurações do Funil
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-400 mb-1">Nome do Funil</Label>
                    <Input 
                      type="text"
                      value={funnelName}
                      onChange={(e) => setFunnelName(e.target.value)}
                      className="bg-[#2a2a2a] border-gray-600 text-gray-300"
                      data-testid="input-funnel-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-400 mb-1">Status</Label>
                    <Select value={funnelStatus} onValueChange={setFunnelStatus}>
                      <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-gray-300" data-testid="select-funnel-status">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
