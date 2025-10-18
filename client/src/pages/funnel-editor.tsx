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
  ArrowLeft,
  Plus,
  X
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
  const [triggerPhrases, setTriggerPhrases] = useState<string[]>([]);

  const { data: funnel, isLoading } = useQuery<Funnel>({
    queryKey: [`/api/funnels/${funnelId}`],
    enabled: !!funnelId,
  });

  useEffect(() => {
    if (funnel) {
      setFunnelName(funnel.name);
      setFunnelStatus(funnel.status || 'draft');
      setTriggerPhrases(funnel.triggerPhrases || []);
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
        triggerPhrases: triggerPhrases,
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

  const updateNodeMediaUrl = (mediaUrl: string) => {
    if (!selectedNode) return;
    
    const updatedNodes = funnelData.nodes.map(node => 
      node.id === selectedNode.id 
        ? { ...node, data: { ...node.data, mediaUrl } }
        : node
    );
    
    setFunnelData({ ...funnelData, nodes: updatedNodes });
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, mediaUrl } });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedNode) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      updateNodeMediaUrl(dataUrl);
      
      toast({
        title: "✅ Arquivo Carregado",
        description: `${file.name} foi adicionado ao nó`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao carregar o arquivo",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
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
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-text"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'message')}
                  >
                    <MessageSquare className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Texto</p>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-image"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'image')}
                  >
                    <Image className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Imagem</p>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-video"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'video')}
                  >
                    <Video className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Vídeo</p>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-audio"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'audio')}
                  >
                    <Mic className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Áudio</p>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-document"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'document')}
                  >
                    <FileText className="h-5 w-5 text-yellow-500 mb-1" />
                    <p className="text-xs font-medium text-gray-300">Documento</p>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-location"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'location')}
                  >
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
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-condition"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'condition')}
                  >
                    <GitBranch className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Condição</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-delay"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'delay')}
                  >
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Esperar</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-question"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'question')}
                  >
                    <HelpCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Pergunta</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-tag"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'tag')}
                  >
                    <Tag className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Tag</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-verify"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'verify')}
                  >
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
              data={{ ...funnelData, triggerPhrases: triggerPhrases }}
              onDataChange={handleFunnelDataChange}
              onNodeSelect={handleNodeSelect}
            />
          </div>

          {/* Right Sidebar - Node Editor */}
          {selectedNode && (
            <div className="w-80 bg-[#252525] border-l border-[#333] p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Editar Nó
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedNode.data.label || 'Configurações'}
                  </p>
                </div>
                
                <Separator className="bg-gray-700" />

                {/* Text Message Node */}
                {selectedNode.type === 'message' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="message-content" className="text-gray-300">
                        Mensagem
                      </Label>
                      <Textarea
                        id="message-content"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="Digite a mensagem..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        rows={5}
                        data-testid="input-message-content"
                      />
                    </div>
                  </div>
                )}

                {/* Media Nodes (Image, Video, Audio, Document) */}
                {['image', 'video', 'audio', 'document'].includes(selectedNode.type) && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="media-url" className="text-gray-300">
                        URL do arquivo
                      </Label>
                      <Input
                        id="media-url"
                        type="text"
                        value={selectedNode.data.mediaUrl || ''}
                        onChange={(e) => updateNodeMediaUrl(e.target.value)}
                        placeholder={`URL do ${selectedNode.type}...`}
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        data-testid="input-media-url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="media-file" className="text-gray-300">
                        Ou faça upload
                      </Label>
                      <Input
                        id="media-file"
                        type="file"
                        accept={
                          selectedNode.type === 'image' ? 'image/*' :
                          selectedNode.type === 'video' ? 'video/*' :
                          selectedNode.type === 'audio' ? 'audio/*' :
                          '*/*'
                        }
                        onChange={handleFileUpload}
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white file:bg-yellow-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded file:mr-4"
                        data-testid="input-media-file"
                      />
                    </div>
                    {selectedNode.data.mediaUrl && selectedNode.type === 'image' && (
                      <div>
                        <Label className="text-gray-300">Preview</Label>
                        <div className="mt-2 border border-gray-700 rounded overflow-hidden bg-[#1a1a1a]">
                          <img 
                            src={selectedNode.data.mediaUrl} 
                            alt="Preview" 
                            className="w-full h-auto max-h-48 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="media-caption" className="text-gray-300">
                        Legenda (opcional)
                      </Label>
                      <Textarea
                        id="media-caption"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="Adicione uma legenda..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        rows={3}
                        data-testid="input-media-caption"
                      />
                    </div>
                  </div>
                )}

                {/* Location Node */}
                {selectedNode.type === 'location' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="location-content" className="text-gray-300">
                        Informações de localização
                      </Label>
                      <Textarea
                        id="location-content"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="Digite as coordenadas ou endereço..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        rows={3}
                        data-testid="input-location-content"
                      />
                    </div>
                  </div>
                )}

                {/* Delay Node */}
                {selectedNode.type === 'delay' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="delay-minutes" className="text-gray-300">
                        Tempo de espera (minutos)
                      </Label>
                      <Input
                        id="delay-minutes"
                        type="number"
                        min="1"
                        value={selectedNode.data.delayMinutes || 5}
                        onChange={(e) => updateNodeDelay(parseInt(e.target.value) || 5)}
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        data-testid="input-delay-minutes"
                      />
                    </div>
                  </div>
                )}

                {/* Condition Node */}
                {selectedNode.type === 'condition' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="condition-content" className="text-gray-300">
                        Condição
                      </Label>
                      <Textarea
                        id="condition-content"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="Descreva a condição..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        rows={3}
                        data-testid="input-condition-content"
                      />
                    </div>
                  </div>
                )}

                {/* Question Node */}
                {selectedNode.type === 'question' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="question-content" className="text-gray-300">
                        Pergunta
                      </Label>
                      <Textarea
                        id="question-content"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="Digite a pergunta..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        rows={3}
                        data-testid="input-question-content"
                      />
                    </div>
                  </div>
                )}

                {/* Tag Node */}
                {selectedNode.type === 'tag' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="tag-content" className="text-gray-300">
                        Tag
                      </Label>
                      <Input
                        id="tag-content"
                        type="text"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="Nome da tag..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        data-testid="input-tag-content"
                      />
                    </div>
                  </div>
                )}

                {/* Trigger Node - Multiple Phrases */}
                {selectedNode.type === 'trigger' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-300">
                        Frases Gatilho (até 10)
                      </Label>
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Palavras ou frases que iniciam o funil
                      </p>
                      <div className="space-y-2">
                        {triggerPhrases.map((phrase, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={phrase}
                              onChange={(e) => {
                                const newPhrases = [...triggerPhrases];
                                newPhrases[index] = e.target.value;
                                setTriggerPhrases(newPhrases);
                              }}
                              placeholder={`Frase ${index + 1}`}
                              className="bg-[#1a1a1a] border-gray-700 text-white flex-1"
                              data-testid={`input-trigger-phrase-${index}`}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newPhrases = triggerPhrases.filter((_, i) => i !== index);
                                setTriggerPhrases(newPhrases);
                              }}
                              className="border-gray-600 text-gray-300 hover:bg-red-900"
                              data-testid={`button-remove-phrase-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {triggerPhrases.length < 10 && (
                          <Button
                            variant="outline"
                            onClick={() => setTriggerPhrases([...triggerPhrases, ''])}
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                            data-testid="button-add-trigger-phrase"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Frase
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Verify Node */}
                {selectedNode.type === 'verify' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="verify-content" className="text-gray-300">
                        Verificação
                      </Label>
                      <Textarea
                        id="verify-content"
                        value={selectedNode.data.content || ''}
                        onChange={(e) => updateNodeContent(e.target.value)}
                        placeholder="O que verificar..."
                        className="mt-2 bg-[#1a1a1a] border-gray-700 text-white"
                        rows={3}
                        data-testid="input-verify-content"
                      />
                    </div>
                  </div>
                )}

                <Separator className="bg-gray-700" />

                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => setSelectedNode(null)}
                  data-testid="button-close-editor"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
