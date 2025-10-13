import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMinimized(location === "/funnel-builder");
  }, [location]);

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 30000,
  });

  const menuItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/funnel-builder", icon: BarChart3, label: "Funis de Disparo" },
    { href: "/contacts", icon: Users, label: "Contatos" },
    { href: "/analytics", icon: TrendingUp, label: "Relatórios" },
    { href: "/settings", icon: Settings, label: "Configurações" },
  ];

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showMinimized = !isMobile && isMinimized;
    
    return (
      <>
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          {!showMinimized && (
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary" data-testid="text-brand">RanZap</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Automação WhatsApp</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className={`hidden lg:flex ${showMinimized ? 'mx-auto' : ''}`}
            data-testid="button-toggle-sidebar"
          >
            {showMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {!showMinimized && (
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
              onClick={() => {
                setShowWhatsAppModal(true);
                setIsMobileMenuOpen(false);
              }}
              data-testid="button-manage-whatsapp"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Gerenciar Conexão
            </Button>
          </div>
        )}
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full ${showMinimized ? 'justify-center px-2' : 'justify-start'} ${isActive ? 'bg-secondary text-secondary-foreground' : ''}`}
                  data-testid={`button-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  title={showMinimized ? item.label : undefined}
                >
                  <item.icon className={`h-4 w-4 ${showMinimized ? '' : 'mr-3'}`} />
                  {!showMinimized && item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40 bg-card/80 backdrop-blur-sm border border-border shadow-sm"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="bg-card flex flex-col h-full">
            <SidebarContent isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex bg-card border-r border-border flex-col transition-all duration-300 ${isMinimized ? 'w-16' : 'w-64'}`}>
        <SidebarContent isMobile={false} />
      </div>

      <WhatsAppConnectionModal 
        open={showWhatsAppModal} 
        onOpenChange={setShowWhatsAppModal}
      />
    </>
  );
}
