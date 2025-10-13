import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CampaignsResponse } from "@shared/api-types";
import Sidebar from "@/components/sidebar";
import FunnelCanvas from "@/components/funnel-canvas";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft } from "lucide-react";

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
  const queryClient = useQueryClient();
  
  const [selectedNode, setSelectedNode] = useState<FunnelNode | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData>({ nodes: [], edges: [] });
  const [funnelName, setFunnelName] = useState("Novo Funil");
  const [funnelStatus, setFunnelStatus] = useState("draft");
  const [triggerPhrase, setTriggerPhrase] = useState("Estou interessado");
  const [initialDelay, setInitialDelay] = useState(1);
  const [isActiveForNewContacts, setIsActiveForNewContacts] = useState(true);

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
    onError: () => {
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Simplified */}
        <header className="bg-card border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleSaveFunnel}
              disabled={saveFunnelMutation.isPending}
              data-testid="button-save-funnel"
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content - Full Canvas */}
        <div className="flex-1 relative">
          <FunnelCanvas
            data={funnelData}
            onDataChange={handleFunnelDataChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>
      </div>
    </div>
  );
}
