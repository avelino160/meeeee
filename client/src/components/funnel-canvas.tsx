import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FunnelNode from './funnel-node';

interface FunnelCanvasProps {
  data: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
    triggerPhrase?: string;
  };
  onDataChange: (data: any) => void;
  onNodeSelect: (node: any) => void;
}

const nodeTypes: NodeTypes = {
  funnelNode: FunnelNode,
};

export default function FunnelCanvas({ data, onDataChange, onNodeSelect }: FunnelCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize with sample nodes if empty
  React.useEffect(() => {
    if (data.nodes.length === 0) {
      const initialNodes = [
        {
          id: 'start',
          type: 'funnelNode',
          position: { x: 100, y: 50 },
          data: { 
            label: 'Início',
            nodeType: 'trigger',
            content: `Gatilho: "${data.triggerPhrase || 'Estou interessado'}"`,
            icon: 'play'
          },
        },
        {
          id: 'message1',
          type: 'funnelNode',
          position: { x: 100, y: 200 },
          data: { 
            label: 'Mensagem Texto',
            nodeType: 'message',
            content: 'Clique para editar esta mensagem...',
            delayMinutes: 1,
            icon: 'message'
          },
        },
      ];

      const initialEdges = [
        {
          id: 'start-message1',
          source: 'start',
          target: 'message1',
          animated: true,
        },
      ];

      setNodes(initialNodes);
      setEdges(initialEdges);
      
      onDataChange({
        nodes: initialNodes,
        edges: initialEdges,
      });
    } else {
      // Convert data format for ReactFlow
      const flowNodes = data.nodes.map(node => ({
        ...node,
        type: 'funnelNode',
        data: {
          ...node.data,
          nodeType: node.type,
        }
      }));
      
      setNodes(flowNodes);
      setEdges(data.edges);
    }
  }, [data.nodes.length]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      
      onDataChange({
        nodes,
        edges: newEdges,
      });
    },
    [edges, nodes, onDataChange]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: node.data,
      });
    },
    [onNodeSelect]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow');

      if (typeof nodeType === 'undefined' || !nodeType) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNodeId = `${nodeType}_${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: 'funnelNode',
        position,
        data: { 
          label: getNodeLabel(nodeType),
          nodeType,
          content: getDefaultContent(nodeType),
          icon: getNodeIcon(nodeType),
          delayMinutes: nodeType === 'delay' ? 5 : 0,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      
      onDataChange({
        nodes: newNodes,
        edges,
      });
    },
    [nodes, edges, onDataChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const getNodeLabel = (nodeType: string): string => {
    const labels: Record<string, string> = {
      message: 'Mensagem Texto',
      image: 'Imagem',
      video: 'Vídeo',
      audio: 'Áudio',
      document: 'Documento',
      location: 'Localização',
      condition: 'Condição',
      delay: 'Esperar',
      question: 'Pergunta',
      tag: 'Tag',
      verify: 'Verificar',
    };
    return labels[nodeType] || nodeType;
  };

  const getDefaultContent = (nodeType: string): string => {
    const defaults: Record<string, string> = {
      message: 'Digite sua mensagem aqui...',
      delay: 'Aguardar 5 minutos',
      condition: 'Se condição for verdadeira...',
      question: 'Qual é sua pergunta?',
      tag: 'Adicionar tag ao contato',
      verify: 'Verificar condição',
    };
    return defaults[nodeType] || 'Configurar este nó...';
  };

  const getNodeIcon = (nodeType: string): string => {
    const icons: Record<string, string> = {
      message: 'message',
      image: 'image',
      video: 'video',
      audio: 'mic',
      document: 'file',
      location: 'map-pin',
      condition: 'git-branch',
      delay: 'clock',
      question: 'help-circle',
      tag: 'tag',
      verify: 'check-circle',
    };
    return icons[nodeType] || 'circle';
  };

  return (
    <div className="w-full h-full" data-testid="funnel-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Controls className="bg-card border-border" />
        <MiniMap 
          className="bg-card border-border"
          nodeColor="#FF8C00"
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="hsl(240, 6%, 25%)"
        />
      </ReactFlow>
    </div>
  );
}
