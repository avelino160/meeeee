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
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium truncate">{data.label}</span>
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
