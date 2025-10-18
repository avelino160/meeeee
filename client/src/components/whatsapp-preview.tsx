import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Image, Video, Mic, FileText, User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface WhatsAppPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: FunnelNode[];
  edges: Array<{ id: string; source: string; target: string }>;
  triggerPhrase: string;
}

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  timestamp: Date;
}

export default function WhatsAppPreview({ 
  open, 
  onOpenChange, 
  nodes, 
  edges,
  triggerPhrase 
}: WhatsAppPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (open && !isSimulating) {
      simulateFunnel();
    }
  }, [open]);

  const simulateFunnel = async () => {
    setIsSimulating(true);
    setMessages([]);

    const userMessage: Message = {
      id: "user-trigger",
      type: "user",
      content: triggerPhrase || "Oi",
      timestamp: new Date(),
    };

    setMessages([userMessage]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const sortedNodes = getExecutionOrder(nodes, edges);
    
    for (const node of sortedNodes) {
      const delay = node.data?.delayMinutes;
      if (delay && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(delay * 200, 3000)));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      const botMessage: Message = {
        id: node.id,
        type: "bot",
        content: node.data.content || "",
        mediaType: node.type,
        mediaUrl: node.data.mediaUrl,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    }

    setIsSimulating(false);
  };

  const getExecutionOrder = (nodes: FunnelNode[], edges: Array<{ id: string; source: string; target: string }>): FunnelNode[] => {
    const startNode = nodes.find(n => n.type === 'trigger');
    if (!startNode) return nodes.filter(n => n.type !== 'trigger');

    const ordered: FunnelNode[] = [];
    const visited = new Set<string>();
    
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node || node.type === 'trigger') return;
      
      ordered.push(node);
      
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      outgoingEdges.forEach(edge => traverse(edge.target));
    };

    const firstEdges = edges.filter(e => e.source === startNode.id);
    firstEdges.forEach(edge => traverse(edge.target));

    return ordered;
  };

  const renderMessageContent = (message: Message) => {
    if (message.mediaType === 'image' && message.mediaUrl) {
      return (
        <div className="space-y-2">
          {message.mediaUrl.startsWith('data:') || message.mediaUrl.startsWith('http') ? (
            <img 
              src={message.mediaUrl} 
              alt="Imagem" 
              className="max-w-[200px] rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Image className="h-4 w-4" />
              <span>📷 Imagem</span>
            </div>
          )}
          {message.content && <p className="text-sm">{message.content}</p>}
        </div>
      );
    }

    if (message.mediaType === 'video' && message.mediaUrl) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Video className="h-4 w-4" />
            <span>🎥 Vídeo</span>
          </div>
          {message.content && <p className="text-sm">{message.content}</p>}
        </div>
      );
    }

    if (message.mediaType === 'audio' && message.mediaUrl) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mic className="h-4 w-4" />
            <span>🎤 Áudio</span>
          </div>
          {message.content && <p className="text-sm">{message.content}</p>}
        </div>
      );
    }

    if (message.mediaType === 'document' && message.mediaUrl) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span>📄 Documento</span>
          </div>
          {message.content && <p className="text-sm">{message.content}</p>}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[700px] p-0 bg-[#0b141a] border-none overflow-hidden">
        <DialogHeader className="bg-[#202c33] px-4 py-3 border-b border-[#2a3942] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-purple-600 text-white">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-white text-base font-medium">
                Automação RanZap
              </DialogTitle>
              <p className="text-xs text-[#8696a0]">online</p>
            </div>
          </div>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0b141a'
          }}
          data-testid="whatsapp-preview-messages"
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                {message.type === 'bot' && (
                  <Avatar className="h-8 w-8 mb-1 flex-shrink-0">
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-lg px-4 py-2 shadow-md ${
                    message.type === 'user'
                      ? 'bg-[#005c4b] text-white rounded-br-none'
                      : 'bg-[#202c33] text-[#e9edef] rounded-bl-none'
                  }`}
                >
                  {renderMessageContent(message)}
                  <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
                    message.type === 'user' ? 'text-[#a5c8bb]' : 'text-[#8696a0]'
                  }`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {message.type === 'user' && (
                      <svg viewBox="0 0 16 15" width="16" height="15" className="fill-current">
                        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                      </svg>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <Avatar className="h-8 w-8 mb-1 flex-shrink-0">
                    <AvatarFallback className="bg-[#667781] text-white text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {isSimulating && messages.length > 0 && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 mb-1 flex-shrink-0">
                  <AvatarFallback className="bg-purple-600 text-white text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-[#202c33] rounded-lg rounded-bl-none px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#202c33] px-4 py-3 border-t border-[#2a3942]">
          <div className="flex items-center gap-2 bg-[#2a3942] rounded-lg px-4 py-2">
            <MessageSquare className="h-5 w-5 text-[#8696a0]" />
            <span className="text-sm text-[#8696a0]">Digite uma mensagem...</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
