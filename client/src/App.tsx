import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import StarfieldBackground from "@/components/starfield-background";
import Dashboard from "@/pages/dashboard";
import WhatsAppConnection from "@/pages/whatsapp-connection";
import FunnelBuilder from "@/pages/funnel-builder";
import FunnelEditor from "@/pages/funnel-editor";
import Contacts from "@/pages/contacts";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/whatsapp-connection" component={WhatsAppConnection} />
      <Route path="/funnel-builder" component={FunnelBuilder} />
      <Route path="/funnel-editor/:id" component={FunnelEditor} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <StarfieldBackground />
          <div className="relative z-10">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
