import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import { useState, useEffect } from "react";
import type { WhatsAppStatus } from "@shared/api-types";
import {
  MessageSquare,
  BarChart3,
  Users,
  TrendingUp,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setIsMinimized(location === "/funnel-builder");
  }, [location]);

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const menuItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/funnel-builder", icon: BarChart3, label: "Funis de Disparo" },
    { href: "/contacts", icon: Users, label: "Contatos" },
    { href: "/analytics", icon: TrendingUp, label: "Relatórios" },
    { href: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <>
      <div className={`bg-card border-r border-border flex flex-col transition-all duration-300 ${isMinimized ? 'w-16' : 'w-64'}`}>
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {!isMinimized && (
            <div>
              <h1 className="text-2xl font-bold text-primary" data-testid="text-brand">RanZap</h1>
              <p className="text-sm text-muted-foreground">Automação WhatsApp</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className={isMinimized ? 'mx-auto' : ''}
            data-testid="button-toggle-sidebar"
          >
            {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* WhatsApp Connection Status */}
        {!isMinimized && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">WhatsApp</span>
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    whatsappStatus?.connected ? 'status-connected' : 'status-disconnected'
                  }`}
                  data-testid="indicator-whatsapp-status"
                />
                <span className="text-xs text-muted-foreground" data-testid="text-whatsapp-status">
                  {whatsappStatus?.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            <Button 
              className="w-full mt-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setShowWhatsAppModal(true)}
              data-testid="button-manage-whatsapp"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Gerenciar Conexão
            </Button>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full ${isMinimized ? 'justify-center px-2' : 'justify-start'} ${isActive ? 'bg-secondary text-secondary-foreground' : ''}`}
                  data-testid={`button-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  title={isMinimized ? item.label : undefined}
                >
                  <item.icon className={`h-4 w-4 ${isMinimized ? '' : 'mr-3'}`} />
                  {!isMinimized && item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <WhatsAppConnectionModal 
        open={showWhatsAppModal} 
        onOpenChange={setShowWhatsAppModal}
      />
    </>
  );
}
