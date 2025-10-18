import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  companyName: string;
  companyEmail: string;
  timezone: string;
  language: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  t: (key: string) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

const defaultSettings: Settings = {
  companyName: "RanZap",
  companyEmail: "contato@ranzap.com",
  timezone: "Africa/Maputo",
  language: "pt-BR",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  'pt-BR': {
    // Menu
    'dashboard': 'Dashboard',
    'sales_funnels': 'Funis de venda',
    'contacts': 'Contatos',
    'reports': 'Relatórios',
    'plans': 'Planos',
    'settings': 'Configurações',
    'whatsapp_connection': 'Conexão WhatsApp',
    'whatsapp_automation': 'Automação WhatsApp',
    
    // Common
    'connected': 'Conectado',
    'disconnected': 'Desconectado',
    'connect': 'Conectar',
    'disconnect': 'Desconectar',
    'save': 'Salvar',
    'cancel': 'Cancelar',
    'delete': 'Excluir',
    'edit': 'Editar',
    'create': 'Criar',
    'back': 'Voltar',
    
    // Plans
    'choose_plan': 'Escolha o Plano Ideal',
    'monthly': 'Mensal',
    'yearly': 'Anual',
    'month': 'mês',
    'year': 'ano',
    'current_plan': 'Plano Atual',
    'subscribe_now': 'Assinar Agora',
    'start_free': 'Começar Grátis',
    'most_popular': 'Mais Popular',
    'whatsapp_accounts': 'contas WhatsApp',
    'messages_per_hour': 'mensagens/hora',
    'unlimited_funnels': 'Funis ilimitados',
    'unlimited_contacts': 'Contatos ilimitados',
    'email_support': 'Suporte via email',
    'priority_support': 'Suporte prioritário',
    'live_chat': 'Chat ao vivo 24/7',
    'account_manager': 'Gerente de conta dedicado',
    'advanced_reports': 'Relatórios avançados',
    'multiple_accounts': 'Múltiplas contas',
    
    // Dashboard
    'hello': 'Olá',
    'your_sales_center': 'Sua central de vendas automáticas no WhatsApp',
    'active_funnels': 'Funis Ativos',
    'messages_today': 'Mensagens Hoje',
    'active_contacts': 'Contatos Ativos',
    'delivery_rate': 'Taxa de Entrega',
    'metrics_analysis': 'Análise de Métricas',
    'track_performance': 'Acompanhe o desempenho das suas conversas e conversões',
    'last_7_days': 'nos últimos 7 dias',
  },
  'en-US': {
    // Menu
    'dashboard': 'Dashboard',
    'sales_funnels': 'Sales Funnels',
    'contacts': 'Contacts',
    'reports': 'Reports',
    'plans': 'Plans',
    'settings': 'Settings',
    'whatsapp_connection': 'WhatsApp Connection',
    'whatsapp_automation': 'WhatsApp Automation',
    
    // Common
    'connected': 'Connected',
    'disconnected': 'Disconnected',
    'connect': 'Connect',
    'disconnect': 'Disconnect',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'create': 'Create',
    'back': 'Back',
    
    // Plans
    'choose_plan': 'Choose Your Perfect Plan',
    'monthly': 'Monthly',
    'yearly': 'Yearly',
    'month': 'month',
    'year': 'year',
    'current_plan': 'Current Plan',
    'subscribe_now': 'Subscribe Now',
    'start_free': 'Start Free',
    'most_popular': 'Most Popular',
    'whatsapp_accounts': 'WhatsApp accounts',
    'messages_per_hour': 'messages/hour',
    'unlimited_funnels': 'Unlimited funnels',
    'unlimited_contacts': 'Unlimited contacts',
    'email_support': 'Email support',
    'priority_support': 'Priority support',
    'live_chat': 'Live chat 24/7',
    'account_manager': 'Dedicated account manager',
    'advanced_reports': 'Advanced reports',
    'multiple_accounts': 'Multiple accounts',
    
    // Dashboard
    'hello': 'Hello',
    'your_sales_center': 'Your automated WhatsApp sales center',
    'active_funnels': 'Active Funnels',
    'messages_today': 'Messages Today',
    'active_contacts': 'Active Contacts',
    'delivery_rate': 'Delivery Rate',
    'metrics_analysis': 'Metrics Analysis',
    'track_performance': 'Track your conversations and conversions performance',
    'last_7_days': 'in the last 7 days',
  },
  'es-ES': {
    // Menu
    'dashboard': 'Panel',
    'sales_funnels': 'Embudos de Venta',
    'contacts': 'Contactos',
    'reports': 'Informes',
    'plans': 'Planes',
    'settings': 'Configuración',
    'whatsapp_connection': 'Conexión WhatsApp',
    'whatsapp_automation': 'Automatización WhatsApp',
    
    // Common
    'connected': 'Conectado',
    'disconnected': 'Desconectado',
    'connect': 'Conectar',
    'disconnect': 'Desconectar',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'delete': 'Eliminar',
    'edit': 'Editar',
    'create': 'Crear',
    'back': 'Volver',
    
    // Plans
    'choose_plan': 'Elige tu Plan Ideal',
    'monthly': 'Mensual',
    'yearly': 'Anual',
    'month': 'mes',
    'year': 'año',
    'current_plan': 'Plan Actual',
    'subscribe_now': 'Suscribirse Ahora',
    'start_free': 'Comenzar Gratis',
    'most_popular': 'Más Popular',
    'whatsapp_accounts': 'cuentas WhatsApp',
    'messages_per_hour': 'mensajes/hora',
    'unlimited_funnels': 'Embudos ilimitados',
    'unlimited_contacts': 'Contactos ilimitados',
    'email_support': 'Soporte por email',
    'priority_support': 'Soporte prioritario',
    'live_chat': 'Chat en vivo 24/7',
    'account_manager': 'Gerente de cuenta dedicado',
    'advanced_reports': 'Informes avanzados',
    'multiple_accounts': 'Múltiples cuentas',
    
    // Dashboard
    'hello': 'Hola',
    'your_sales_center': 'Tu centro de ventas automáticas en WhatsApp',
    'active_funnels': 'Embudos Activos',
    'messages_today': 'Mensajes Hoy',
    'active_contacts': 'Contactos Activos',
    'delivery_rate': 'Tasa de Entrega',
    'metrics_analysis': 'Análisis de Métricas',
    'track_performance': 'Seguimiento del rendimiento de tus conversaciones y conversiones',
    'last_7_days': 'en los últimos 7 días',
  },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem("generalSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem("generalSettings", JSON.stringify(newSettings));
  };

  const t = (key: string): string => {
    const langTranslations = translations[settings.language] || translations['pt-BR'];
    return langTranslations[key] || key;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(settings.language, {
      timeZone: settings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(settings.language, {
      timeZone: settings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, t, formatDate, formatDateTime }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
