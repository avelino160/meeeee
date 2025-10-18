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
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  'pt-BR': {
    'dashboard': 'Dashboard',
    'sales_funnels': 'Funis de venda',
    'contacts': 'Contatos',
    'reports': 'Relatórios',
    'plans': 'Planos',
    'settings': 'Configurações',
    'whatsapp_automation': 'Automação WhatsApp',
    'connected': 'Conectado',
    'disconnected': 'Desconectado',
    'manage_connection': 'Gerenciar Conexão',
  },
  'en-US': {
    'dashboard': 'Dashboard',
    'sales_funnels': 'Sales Funnels',
    'contacts': 'Contacts',
    'reports': 'Reports',
    'plans': 'Plans',
    'settings': 'Settings',
    'whatsapp_automation': 'WhatsApp Automation',
    'connected': 'Connected',
    'disconnected': 'Disconnected',
    'manage_connection': 'Manage Connection',
  },
  'es-ES': {
    'dashboard': 'Panel',
    'sales_funnels': 'Embudos de Venta',
    'contacts': 'Contactos',
    'reports': 'Informes',
    'plans': 'Planes',
    'settings': 'Configuración',
    'whatsapp_automation': 'Automatización WhatsApp',
    'connected': 'Conectado',
    'disconnected': 'Desconectado',
    'manage_connection': 'Gestionar Conexión',
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
