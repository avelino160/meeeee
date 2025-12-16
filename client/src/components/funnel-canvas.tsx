import React, { useCallback, useRef, useMemo, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
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

const MemoizedFunnelNode = memo(FunnelNode);

const nodeTypes: NodeTypes = {
  funnelNode: MemoizedFunnelNode,
};

function FunnelCanvasInner({ data, onDataChange, onNodeSelect }: FunnelCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToParent = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onDataChange({
        nodes: newNodes,
        edges: newEdges,
      });
    }, 500);
  }, [onDataChange]);

  React.useEffect(() => {
    if (initializedRef.current) return;
    
    if (data.nodes.length === 0) {
      const phrasesText = data.triggerPhrases && data.triggerPhrases.length > 0
        ? data.triggerPhrases.filter(p => p.trim()).map(p => `"${p}"`).join(', ')
        : null;
      
      const initialNodes: Node[] = [
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
            delayMinutes: 0,
            icon: 'message'
          },
        },
      ];

      const initialEdges: Edge[] = [
        {
          id: 'start-message1',
          source: 'start',
          target: 'message1',
          animated: true,
        },
      ];

      setNodes(initialNodes);
      setEdges(initialEdges);
      onDataChange({ nodes: initialNodes, edges: initialEdges });
      initializedRef.current = true;
    } else if (data.nodes.length > 0) {
      const formattedNodes = data.nodes.map(dataNode => ({
        ...dataNode,
        type: 'funnelNode',
        data: {
          ...dataNode.data,
          nodeType: dataNode.data.nodeType || dataNode.type,
        }
      }));
      setNodes(formattedNodes);
      setEdges(data.edges.map(e => ({ ...e, animated: true })));
      initializedRef.current = true;
    }
  }, [data.nodes.length]);

  React.useEffect(() => {
    if (!initializedRef.current || data.nodes.length === 0) return;
    
    // Get the list of node IDs that should exist
    const nodeIds = new Set(data.nodes.map(n => n.id));
    
    setNodes(currentNodes => {
      // Filter out deleted nodes, then update remaining ones
      return currentNodes
        .filter(node => nodeIds.has(node.id))
        .map(node => {
          const dataNode = data.nodes.find(n => n.id === node.id);
          if (dataNode) {
            return {
              ...node,
              data: {
                ...dataNode.data,
                nodeType: dataNode.data.nodeType || dataNode.type,
              }
            };
          }
          return node;
        });
    });
    
    // Also sync edges - remove edges connected to deleted nodes
    setEdges(currentEdges => {
      return currentEdges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    });
  }, [data.nodes]);

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

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    setNodes(currentNodes => {
      setEdges(currentEdges => {
        saveToParent(currentNodes, currentEdges);
        return currentEdges;
      });
      return currentNodes;
    });
  }, [onNodesChange, saveToParent]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    setNodes(currentNodes => {
      setEdges(currentEdges => {
        saveToParent(currentNodes, currentEdges);
        return currentEdges;
      });
      return currentNodes;
    });
  }, [onEdgesChange, saveToParent]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, animated: true };
      setEdges(currentEdges => {
        const newEdges = addEdge(newEdge, currentEdges);
        setNodes(currentNodes => {
          saveToParent(currentNodes, newEdges);
          return currentNodes;
        });
        return newEdges;
      });
    },
    [saveToParent]
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

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setEdges(currentEdges => {
        const newEdges = currentEdges.filter(e => e.id !== edge.id);
        setNodes(currentNodes => {
          saveToParent(currentNodes, newEdges);
          return currentNodes;
        });
        return newEdges;
      });
    },
    [saveToParent]
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

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `${nodeType}_${Date.now()}`;
      const newNode: Node = {
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

      setNodes(currentNodes => {
        const newNodes = [...currentNodes, newNode];
        setEdges(currentEdges => {
          saveToParent(newNodes, currentEdges);
          return currentEdges;
        });
        return newNodes;
      });
    },
    [reactFlowInstance, saveToParent]
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

  const defaultEdgeOptions = useMemo(() => ({
    animated: true,
  }), []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" data-testid="funnel-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-background"
        connectionMode={ConnectionMode.Loose}
        connectionRadius={30}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={true}
        snapGrid={[15, 15]}
        panOnScroll={false}
        selectionOnDrag={false}
        panOnDrag={[0, 1, 2]}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls className="bg-card border-border" />
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
