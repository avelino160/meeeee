import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
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
  Play,
  Edit3,
  MoreVertical
} from 'lucide-react';

interface FunnelNodeData {
  label: string;
  nodeType: string;
  content: string;
  icon?: string;
  delayMinutes?: number;
}

const iconMap = {
  play: Play,
  message: MessageSquare,
  image: Image,
  video: Video,
  mic: Mic,
  file: FileText,
  'map-pin': MapPin,
  'git-branch': GitBranch,
  clock: Clock,
  'help-circle': HelpCircle,
  tag: Tag,
  'check-circle': CheckCircle,
};

export default function FunnelNode({ data, selected }: NodeProps<FunnelNodeData>) {
  const IconComponent = iconMap[data.icon as keyof typeof iconMap] || MessageSquare;
  
  const getBorderColor = () => {
    if (selected) return 'border-primary';
    if (data.nodeType === 'trigger') return 'border-primary';
    return 'border-border';
  };

  const getBackgroundColor = () => {
    if (data.nodeType === 'trigger') return 'bg-primary/10';
    return 'bg-card';
  };

  return (
    <div 
      className={`
        funnel-node relative bg-card border-2 rounded-lg p-4 shadow-lg min-w-[200px] max-w-[250px]
        ${getBorderColor()} ${getBackgroundColor()}
      `}
      data-testid={`funnel-node-${data.nodeType}`}
    >
      {/* Input Handle */}
      {data.nodeType !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-border"
          data-testid="handle-input"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <IconComponent className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm font-semibold text-foreground">{data.label}</span>
        </div>
        <button 
          className="text-muted-foreground hover:text-foreground p-1 rounded"
          data-testid="button-edit-node"
        >
          <Edit3 className="h-3 w-3" />
        </button>
      </div>

      {/* Node Content */}
      <div className="mb-3">
        {data.nodeType === 'trigger' && (
          <p className="text-xs text-muted-foreground mb-2">
            {data.content}
          </p>
        )}
        
        {data.nodeType === 'message' && (
          <div className="bg-muted rounded p-2 mb-2">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {data.content || 'Clique para editar mensagem...'}
            </p>
          </div>
        )}

        {data.nodeType === 'delay' && (
          <div className="bg-muted rounded p-2 mb-2">
            <p className="text-xs text-muted-foreground">
              Aguardar {data.delayMinutes || 5} minutos
            </p>
          </div>
        )}

        {data.nodeType === 'condition' && (
          <div className="bg-muted rounded p-2 mb-2">
            <p className="text-xs text-muted-foreground">
              {data.content}
            </p>
          </div>
        )}

        {['image', 'video', 'audio', 'document', 'location'].includes(data.nodeType) && (
          <div className="bg-muted rounded p-2 mb-2">
            <div className="w-full h-8 bg-border rounded mb-2 flex items-center justify-center">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {data.content || 'Clique para configurar mídia...'}
            </p>
          </div>
        )}

        {['question', 'tag', 'verify'].includes(data.nodeType) && (
          <div className="bg-muted rounded p-2 mb-2">
            <p className="text-xs text-muted-foreground">
              {data.content}
            </p>
          </div>
        )}
      </div>

      {/* Node Footer */}
      <div className="flex justify-between items-center">
        {data.nodeType === 'condition' ? (
          <div className="flex space-x-4">
            <div className="text-center">
              <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                className="w-3 h-3 !bg-green-500 relative"
                style={{ left: '25%' }}
                data-testid="handle-output-yes"
              />
              <span className="text-xs text-muted-foreground">Sim</span>
            </div>
            <div className="text-center">
              <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className="w-3 h-3 !bg-red-500 relative"
                style={{ left: '75%' }}
                data-testid="handle-output-no"
              />
              <span className="text-xs text-muted-foreground">Não</span>
            </div>
          </div>
        ) : (
          <>
            {(data.delayMinutes ?? 0) > 0 && (
              <div className="text-xs text-muted-foreground">
                Delay: {data.delayMinutes}min
              </div>
            )}
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-primary"
              data-testid="handle-output"
            />
          </>
        )}
      </div>
    </div>
  );
}
