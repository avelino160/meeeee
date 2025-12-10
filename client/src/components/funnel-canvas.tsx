import React, { useCallback, useState, useRef } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
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
    triggerPhrases?: string[];
  };
  onDataChange: (data: any) => void;
  onNodeSelect: (node: any) => void;
}

const nodeTypes: NodeTypes = {
  funnelNode: FunnelNode,
};

function FunnelCanvasInner({ data, onDataChange, onNodeSelect }: FunnelCanvasProps) {
  const [nodes, setNodes, _onNodesChange] = useNodesState([]);
  const [edges, setEdges, _onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Wrap onNodesChange
  const onNodesChange = useCallback(
    (changes: any) => {
      _onNodesChange(changes);
    },
    [_onNodesChange]
  );

  // Wrap onEdgesChange
  const onEdgesChange = useCallback(
    (changes: any) => {
      _onEdgesChange(changes);
    },
    [_onEdgesChange]
  );

  // Sync nodes/edges changes back to parent
  React.useEffect(() => {
    // Debounce the onDataChange call to avoid excessive updates
    const timeoutId = setTimeout(() => {
      onDataChange({
        nodes,
        edges,
      });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, onDataChange]);

  // Initialize with sample nodes if empty, or sync from parent data
  React.useEffect(() => {
    if (data.nodes.length === 0 && nodes.length === 0) {
      const phrasesText = data.triggerPhrases && data.triggerPhrases.length > 0
        ? data.triggerPhrases.filter(p => p.trim()).map(p => `"${p}"`).join(', ')
        : null;
      
      const initialNodes = [
        {
          id: 'start',
          type: 'funnelNode',
          position: { x: 100, y: 50 },
          data: { 
            label: 'Início',
            nodeType: 'trigger',
            content: phrasesText ? `Gatilho: ${phrasesText}` : 'Clique para configurar frases de gatilho',
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
    } else if (data.nodes.length > 0) {
      // Update nodes from parent data while preserving positions
      setNodes(currentNodes => {
        return data.nodes.map(dataNode => {
          const existingNode = currentNodes.find(n => n.id === dataNode.id);
          return {
            ...dataNode,
            type: 'funnelNode',
            position: existingNode?.position || dataNode.position,
            data: {
              ...dataNode.data,
              nodeType: dataNode.data.nodeType || dataNode.type,
            }
          };
        });
      });
      setEdges(data.edges);
    }
  }, [data, nodes.length]);

  // Update trigger node when triggerPhrases changes
  React.useEffect(() => {
    const phrasesText = data.triggerPhrases && data.triggerPhrases.length > 0
      ? data.triggerPhrases.filter(p => p.trim()).map(p => `"${p}"`).join(', ')
      : null;
    
    setNodes(currentNodes => {
      return currentNodes.map(node => {
        if (node.id === 'start' || node.data.nodeType === 'trigger') {
          return {
            ...node,
            data: {
              ...node.data,
              content: phrasesText ? `Gatilho: ${phrasesText}` : 'Clique para configurar frases de gatilho',
            }
          };
        }
        return node;
      });
    });
  }, [data.triggerPhrases]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Remove existing outgoing connection from source node (only 1 allowed)
      const filteredEdges = edges.filter(e => e.source !== params.source);
      
      const newEdges = addEdge(params, filteredEdges);
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

      const nodeType = event.dataTransfer.getData('application/reactflow');

      if (typeof nodeType === 'undefined' || !nodeType) {
        return;
      }

      if (!reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

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
    [nodes, edges, onDataChange, reactFlowInstance]
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
    <div ref={reactFlowWrapper} className="w-full h-full" data-testid="funnel-canvas">
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
        connectionMode={ConnectionMode.Loose}
      >
        <Controls className="bg-card border-border" />
        <MiniMap 
          className="bg-card border-border"
          nodeColor="#a855f7"
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

export default function FunnelCanvas(props: FunnelCanvasProps) {
  return (
    <ReactFlowProvider>
      <FunnelCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
