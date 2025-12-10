import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, Video, Mic, FileText } from "lucide-react";
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
    if (open) {
      setMessages([]);
      setIsSimulating(false);
      setTimeout(() => simulateFunnel(), 100);
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
    
    // Placeholder texts that should not be shown
    const placeholderTexts = [
      'Clique para editar esta mensagem...',
      'Configurar este nó...',
      'Digite sua mensagem aqui...',
      'Aguardar 5 minutos',
      'Se condição for verdadeira...',
      'Qual é sua pergunta?',
      'Adicionar tag ao contato',
      'Verificar condição',
    ];
    
    for (const node of sortedNodes) {
      const nodeType = (node.data as any)?.nodeType || node.type;
      const delay = node.data?.delayMinutes;
      
      // Delay nodes just wait, don't show message
      if (nodeType === 'delay') {
        if (delay && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(delay * 200, 3000)));
        }
        continue;
      }
      
      // Skip nodes without real content (just placeholders)
      const content = node.data.content || "";
      const isPlaceholder = placeholderTexts.some(p => content.includes(p)) || content.trim() === '';
      
      // Skip condition, tag, verify nodes - they are logic, not messages
      if (['condition', 'tag', 'verify', 'question'].includes(nodeType) && isPlaceholder) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      // Skip message nodes without content
      if (isPlaceholder && !node.data.mediaUrl) {
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 1200));

      const botMessage: Message = {
        id: node.id,
        type: "bot",
        content: isPlaceholder ? "" : content,
        mediaType: nodeType,
        mediaUrl: node.data.mediaUrl,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    }

    setIsSimulating(false);
  };

  const getExecutionOrder = (nodes: FunnelNode[], edges: Array<{ id: string; source: string; target: string }>): FunnelNode[] => {
    // Check both node.type and node.data.nodeType for trigger nodes
    const isTriggerNode = (n: FunnelNode) => n.type === 'trigger' || (n.data as any)?.nodeType === 'trigger';
    
    const startNode = nodes.find(n => isTriggerNode(n));
    if (!startNode) return nodes.filter(n => !isTriggerNode(n));

    const ordered: FunnelNode[] = [];
    const visited = new Set<string>();
    
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node || isTriggerNode(node)) return;
      
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

    if (message.mediaType === 'video') {
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

    if (message.mediaType === 'audio') {
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

    if (message.mediaType === 'document') {
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

    return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[280px] h-[500px] max-h-[85vh] p-0 bg-black border-none overflow-hidden rounded-[30px] flex flex-col"
        style={{ 
          boxShadow: '0 0 0 6px #1a1a1a, 0 15px 30px -8px rgba(0, 0, 0, 0.5)' 
        }}
      >
        {/* Top bezel - iPhone frame */}
        <div className="h-6 bg-black flex-shrink-0 relative">
          {/* Dynamic Island / Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 w-20 h-4 bg-black rounded-full border border-gray-800"></div>
        </div>

        {/* Screen content wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden mx-1 rounded-t-lg">
          {/* Status bar */}
          <div className="h-6 bg-[#111b21] flex items-center justify-between px-3 flex-shrink-0">
            <span className="text-white text-[10px] font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <svg width="14" height="9" viewBox="0 0 17 11" fill="white">
                <rect x="0" y="2" width="4" height="7" rx="0.8"/>
                <rect x="5.5" y="0.5" width="4" height="10" rx="0.8"/>
                <rect x="11" y="0" width="4" height="11" rx="0.8"/>
              </svg>
              <svg width="12" height="9" viewBox="0 0 15 11">
                <path d="M7.5 0C3.4 0 0 2.5 0 5.5s3.4 5.5 7.5 5.5 7.5-2.5 7.5-5.5S11.6 0 7.5 0zm0 9.5c-3.1 0-5.5-1.7-5.5-3.7s2.4-3.7 5.5-3.7 5.5 1.7 5.5 3.7-2.4 3.7-5.5 3.7z" fill="white"/>
              </svg>
              <span className="text-white text-[10px] font-semibold">100%</span>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between border-b border-[#2a3942] flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <button 
              onClick={() => onOpenChange(false)}
              className="text-[#8696a0] hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-purple-600 text-white text-sm font-bold">
                R
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white text-sm font-medium truncate">
                RanZap
              </DialogTitle>
              <p className="text-[10px] text-[#8696a0]">online</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2.2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="5" r="1.5"/>
              <circle cx="12" cy="19" r="1.5"/>
            </svg>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-2.5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0b141a'
          }}
          data-testid="whatsapp-preview-messages"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-lg px-3 py-2 shadow-lg relative ${
                    message.type === 'user'
                      ? 'bg-[#005c4b] text-white rounded-br-sm'
                      : 'bg-[#202c33] text-[#e9edef] rounded-bl-sm'
                  }`}
                >
                  <div className={`absolute bottom-0 ${
                    message.type === 'user' 
                      ? 'right-[-7px] border-l-[7px] border-l-[#005c4b]' 
                      : 'left-[-7px] border-r-[7px] border-r-[#202c33]'
                  } border-b-[7px] border-b-transparent w-0 h-0`}></div>
                  
                  {renderMessageContent(message)}
                  
                  <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
                    message.type === 'user' ? 'text-[#a5c8bb]' : 'text-[#8696a0]'
                  }`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {message.type === 'user' && (
                      <svg viewBox="0 0 16 15" width="13" height="13" className="fill-current ml-0.5">
                        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isSimulating && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="bg-[#202c33] rounded-lg rounded-bl-sm px-4 py-3 shadow-lg relative">
                  <div className="absolute bottom-0 left-[-7px] border-r-[7px] border-r-[#202c33] border-b-[7px] border-b-transparent w-0 h-0"></div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Input Area */}
          <div className="bg-[#202c33] px-2 py-1.5 border-t border-[#2a3942] flex-shrink-0 rounded-b-lg">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-2xl px-3 py-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <span className="text-xs text-[#8696a0] flex-1">Mensagem</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bezel - iPhone frame */}
        <div className="h-8 bg-black flex-shrink-0 flex items-center justify-center">
          {/* Home Indicator */}
          <div className="w-28 h-1 bg-gray-600 rounded-full"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
