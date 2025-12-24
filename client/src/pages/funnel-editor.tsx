import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import type { Funnel } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import FunnelCanvas from "@/components/funnel-canvas";
import WhatsAppPreview from "@/components/whatsapp-preview";
import LocationPicker from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
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
  X
} from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface FunnelNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    content?: string;
    mediaUrl?: string;
    delayMinutes?: number;
    nodeType?: string;
    icon?: string;
    location?: LocationData;
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
  const [showPreview, setShowPreview] = useState(false);

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
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funnels", funnelId] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    },
    onError: () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao salvar funil. Tente novamente.",
        variant: "destructive",
        duration: 2000,
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
    if (funnelData.nodes.length === 0) {
      toast({
        title: "Funil Vazio",
        description: "Adicione alguns elementos ao funil antes de visualizar",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    setShowPreview(true);
  };

  const handleSaveFunnel = () => {
    if (!funnelName.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Digite um nome para o funil",
        variant: "destructive",
        duration: 2000,
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

  const updateNodeLocation = (location: LocationData) => {
    if (!selectedNode) return;
    
    const updatedNodes = funnelData.nodes.map(node => 
      node.id === selectedNode.id 
        ? { ...node, data: { ...node.data, location, nodeType: node.data.nodeType || 'location' } }
        : node
    );
    
    setFunnelData({ ...funnelData, nodes: updatedNodes });
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, location, nodeType: selectedNode.data.nodeType || 'location' } });
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    
    // Prevent deletion of start and trigger nodes
    if (selectedNode.id === 'start' || selectedNode.data.nodeType === 'trigger') {
      toast({
        title: "Ação não permitida",
        description: "Este elemento não pode ser excluído",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const updatedNodes = funnelData.nodes.filter(node => node.id !== selectedNode.id);
    const updatedEdges = funnelData.edges.filter(
      edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id
    );
    
    setFunnelData({ ...funnelData, nodes: updatedNodes, edges: updatedEdges });
    setSelectedNode(null);
    
    toast({
      title: "Elemento Removido",
      description: "O elemento foi excluído do funil",
      duration: 5000,
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedNode) return;

    const nodeType = selectedNode.data.nodeType;
    const maxSizeMB = nodeType === 'image' ? 5 : nodeType === 'audio' ? 10 : nodeType === 'video' ? 50 : 20;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      toast({
        title: "Arquivo muito grande",
        description: `O tamanho máximo para ${nodeType} é ${maxSizeMB}MB`,
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // For video files, just store the file name to avoid freezing
    if (nodeType === 'video') {
      updateNodeMediaUrl(`video:${file.name}`);
      toast({
        title: "✅ Vídeo Adicionado",
        description: `${file.name} foi anexado ao nó`,
        duration: 2000,
      });
      return;
    }

    // For document files, store with filename prefix
    if (nodeType === 'document') {
      // Show filename immediately
      const tempUrl = `doc:${file.name}|loading`;
      updateNodeMediaUrl(tempUrl);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const fullUrl = `doc:${file.name}|${dataUrl}`;
        
        // Update with full data
        const updatedNodes = funnelData.nodes.map(node => 
          node.id === selectedNode.id 
            ? { ...node, data: { ...node.data, mediaUrl: fullUrl } }
            : node
        );
        setFunnelData({ ...funnelData, nodes: updatedNodes });
        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, mediaUrl: fullUrl } } : null);
        
        toast({
          title: "✅ Documento Adicionado",
          description: `${file.name} foi anexado ao nó`,
          duration: 2000,
        });
      };
      reader.onerror = () => {
        toast({
          title: "❌ Erro",
          description: "Falha ao carregar o documento",
          variant: "destructive",
          duration: 2000,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      updateNodeMediaUrl(dataUrl);
      
      toast({
        title: "✅ Arquivo Carregado",
        description: `${file.name} foi adicionado ao nó`,
        duration: 2000,
      });
    };
    reader.onerror = () => {
      toast({
        title: "❌ Erro",
        description: "Falha ao carregar o arquivo",
        variant: "destructive",
        duration: 2000,
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
        <header className="bg-[#252525] border-b border-[#333] px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
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
                <h2 className="text-base sm:text-xl font-semibold text-white" data-testid="text-page-title">
                  Editor de Funil
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Construa seu fluxo de mensagens automatizadas
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="outline"
                size="sm"
                onClick={handlePreviewFunnel}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-preview-funnel"
              >
                <Eye className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Visualizar</span>
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveFunnel}
                disabled={saveFunnelMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                data-testid="button-save-funnel"
              >
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saveFunnelMutation.isPending ? "Salvando..." : "Salvar Funil"}</span>
                <span className="sm:hidden">{saveFunnelMutation.isPending ? "..." : "Salvar"}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbox - visible on all screen sizes */}
          <div className="flex flex-col w-20 sm:w-32 md:w-48 lg:w-64 bg-[#252525] border-r border-[#333] p-2 sm:p-3 lg:p-4 overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
              {/* Message Types */}
              <div>
                <h3 className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Mensagens
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div 
                    className="p-2 lg:p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing overflow-hidden flex flex-col items-center" 
                    data-testid="tool-text"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'message')}
                  >
                    <MessageSquare className="h-5 w-5 text-purple-500 mb-1 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-300 text-center truncate w-full">Texto</p>
                  </div>
                  <div 
                    className="p-2 lg:p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing overflow-hidden flex flex-col items-center" 
                    data-testid="tool-image"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'image')}
                  >
                    <Image className="h-5 w-5 text-purple-500 mb-1 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-300 text-center truncate w-full">Imagem</p>
                  </div>
                  <div 
                    className="p-2 lg:p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing overflow-hidden flex flex-col items-center" 
                    data-testid="tool-video"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'video')}
                  >
                    <Video className="h-5 w-5 text-purple-500 mb-1 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-300 text-center truncate w-full">Vídeo</p>
                  </div>
                  <div 
                    className="p-2 lg:p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing overflow-hidden flex flex-col items-center" 
                    data-testid="tool-audio"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'audio')}
                  >
                    <Mic className="h-5 w-5 text-purple-500 mb-1 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-300 text-center truncate w-full">Áudio</p>
                  </div>
                  <div 
                    className="p-2 lg:p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing overflow-hidden flex flex-col items-center" 
                    data-testid="tool-document"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'document')}
                  >
                    <FileText className="h-5 w-5 text-purple-500 mb-1 flex-shrink-0" />
                    <p className="text-[10px] font-medium text-gray-300 text-center truncate w-full">Documento</p>
                  </div>
                  <div 
                    className="p-2 lg:p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors border border-gray-700 active:cursor-grabbing overflow-hidden flex flex-col items-center" 
                    data-testid="tool-location"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'location')}
                  >
                    <MapPin className="h-5 w-5 text-purple-500 mb-1 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-300 text-center truncate w-full">Local</p>
                  </div>
                </div>
              </div>
              
              {/* Logic Elements */}
              <div>
                <h3 className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Lógica
                </h3>
                <div className="space-y-2">
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-condition"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'condition')}
                  >
                    <GitBranch className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Condição</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-delay"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'delay')}
                  >
                    <Clock className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Esperar</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-question"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'question')}
                  >
                    <HelpCircle className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Pergunta</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-tag"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'tag')}
                  >
                    <Tag className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Tag</span>
                  </div>
                  <div 
                    className="p-3 bg-[#2a2a2a] rounded-lg cursor-grab hover:bg-[#333] transition-colors flex items-center border border-gray-700 active:cursor-grabbing" 
                    data-testid="tool-verify"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'verify')}
                  >
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
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
        </div>
      </div>

      <WhatsAppPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        nodes={funnelData.nodes}
        edges={funnelData.edges}
        triggerPhrase={triggerPhrases[0] || "Oi"}
      />
    </div>
  );
}
