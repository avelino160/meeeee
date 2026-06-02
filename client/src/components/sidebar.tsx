import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useSettings } from "@/contexts/SettingsContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  CreditCard,
  Plane,
  Megaphone,
  FileText,
  LogOut,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type UserData = {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  planType: string;
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useSettings();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/user/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  if (location.startsWith("/funnel-editor/") || location === "/login" || location === "/register") {
    return null;
  }

  const menuItems = [
    { href: "/", icon: Home, label: t('dashboard'), key: 'dashboard' },
    { href: "/whatsapp-connection", icon: MessageSquare, label: t('whatsapp_connection'), key: 'whatsapp_connection' },
    { href: "/funnel-builder", icon: BarChart3, label: t('sales_funnels'), key: 'sales_funnels' },
    { href: "/contacts", icon: Users, label: t('contacts'), key: 'contacts' },
    { href: "/campaigns", icon: Megaphone, label: t('campaigns'), key: 'campaigns' },
    { href: "/templates", icon: FileText, label: t('templates'), key: 'templates' },
    { href: "/analytics", icon: TrendingUp, label: t('reports'), key: 'reports' },
    { href: "/plans", icon: CreditCard, label: t('plans'), key: 'plans' },
    { href: "/settings", icon: Settings, label: t('settings'), key: 'settings' },
  ];

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const showMinimized = !isMobile && isMinimized;

    return (
      <>
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          {!showMinimized && (
            <div className="flex items-center gap-2.5">
              <Plane className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary" data-testid="text-brand">Pilot Zap</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('whatsapp_automation')}</p>
              </div>
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

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full ${showMinimized ? 'justify-center px-2' : 'justify-start'} ${isActive ? 'bg-secondary text-secondary-foreground' : ''}`}
                  data-testid={`button-nav-${item.key}`}
                  title={showMinimized ? item.label : undefined}
                >
                  <item.icon className={`h-4 w-4 ${showMinimized ? '' : 'mr-3'}`} />
                  {!showMinimized && item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className={`p-4 border-t border-border ${showMinimized ? 'flex justify-center' : ''}`}>
          {showMinimized ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              title="Sair"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-user-name">
                  {user?.firstName || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                  {user?.email || ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                title="Sair"
                data-testid="button-logout"
                className="flex-shrink-0 h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
            className="lg:hidden fixed top-4 left-4 z-40 bg-card border border-border shadow-md"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden><SheetTitle>Menu de Navegação</SheetTitle></VisuallyHidden>
          <div className="bg-card flex flex-col h-full">
            <SidebarContent isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex bg-card border-r border-border flex-col transition-all duration-300 ${isMinimized ? 'w-16' : 'w-64'}`}>
        <SidebarContent isMobile={false} />
      </div>
    </>
  );
}
