import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Crown, Phone, Pencil, Check, X, Plus, Wifi, WifiOff, Trash2, Infinity } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPlanLimits, formatLimit } from "@shared/plan-limits";
import type { PlanType } from "@shared/plan-limits";

interface UserData {
  planType: string;
}

interface WhatsAppConnection {
  id: string;
  userId: string;
  phoneNumber: string;
  name: string | null;
  isConnected: boolean | null;
  lastConnectedAt: string | null;
  createdAt: string | null;
}

function formatPhoneNumber(phone: string) {
  if (phone.length === 13 && phone.startsWith("55")) {
    const ddd = phone.slice(2, 4);
    const part1 = phone.slice(4, 9);
    const part2 = phone.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  return `+${phone}`;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Básico",
  pro: "Pro",
  business: "Business",
};

export default function WhatsAppConnection() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: userData } = useQuery<UserData>({ queryKey: ["/api/user/me"] });
  const currentPlan = (userData?.planType || "free") as PlanType;
  const limits = getPlanLimits(currentPlan);
  const maxSlots = limits.maxWhatsappAccounts; // -1 = unlimited

  const { data: allConnections = [], isLoading } = useQuery<WhatsAppConnection[]>({
    queryKey: ["/api/whatsapp/connections"],
    refetchInterval: 5000,
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRequest("PATCH", `/api/whatsapp/connections/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connections"] });
      setEditingId(null);
      setEditName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/whatsapp/connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/connected-count"] });
      setDeletingId(null);
    },
  });

  const connectedCount = allConnections.filter((c) => c.isConnected).length;
  const canAddMore = maxSlots === -1 || connectedCount < maxSlots;

  // Build slot list
  // For unlimited plans: show existing connections + 1 empty slot (if can add more)
  // For limited plans: always show exactly maxSlots slots
  const slots: Array<WhatsAppConnection | null> = (() => {
    const connected = allConnections.filter((c) => c.isConnected);
    if (maxSlots === -1) {
      return [...connected, null]; // unlimited: show all + 1 empty
    }
    const result: Array<WhatsAppConnection | null> = [];
    for (let i = 0; i < maxSlots; i++) {
      result.push(connected[i] ?? null);
    }
    return result;
  })();

  const startEditing = (c: WhatsAppConnection) => {
    setEditingId(c.id);
    setEditName(c.name || "");
  };
  const cancelEditing = () => { setEditingId(null); setEditName(""); };
  const saveEditing = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) { cancelEditing(); return; }
    updateNameMutation.mutate({ id, name: trimmed });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border pl-14 pr-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold" data-testid="text-page-title">
                Conexões WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie as contas WhatsApp do seu plano
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <Crown className="h-3.5 w-3.5 text-yellow-500" />
              Plano {PLAN_LABELS[currentPlan] ?? currentPlan}
              <span className="mx-1 text-muted-foreground">·</span>
              {connectedCount}
              {maxSlots !== -1 ? `/${maxSlots}` : ""}
              {maxSlots === -1 && <Infinity className="h-3.5 w-3.5 ml-0.5" />}
              <span className="text-muted-foreground ml-0.5">conta{connectedCount !== 1 ? "s" : ""}</span>
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Slot grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((connection, index) => (
                  <SlotCard
                    key={connection ? connection.id : `empty-${index}`}
                    slotIndex={index}
                    connection={connection}
                    editingId={editingId}
                    editName={editName}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onSaveEditing={saveEditing}
                    onEditNameChange={setEditName}
                    onConnect={() => setShowConnectionModal(true)}
                    onDelete={(id) => setDeletingId(id)}
                    isSaving={updateNameMutation.isPending}
                    canConnect={canAddMore}
                  />
                ))}
              </div>
            )}

            {/* Upgrade prompt for limited plans at max */}
            {!canAddMore && maxSlots !== -1 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <Crown className="h-8 w-8 text-yellow-500 shrink-0" />
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold">Limite de {maxSlots} conta{maxSlots > 1 ? "s" : ""} atingido</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Faça upgrade para conectar mais contas WhatsApp.
                  </p>
                </div>
                <Link href="/plans">
                  <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold shrink-0">
                    Ver planos
                  </Button>
                </Link>
              </div>
            )}

            {/* Help */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-card border-b border-border">
                <p className="font-medium">Precisa de ajuda?</p>
              </div>
              <Accordion type="single" collapsible className="bg-card">
                <AccordionItem value="qr" className="border-b border-border px-5">
                  <AccordionTrigger className="text-sm text-left py-4">
                    QR Code não aparece?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    Verifique se você está executando o projeto localmente — o WhatsApp pode bloquear conexões de servidores cloud.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="support" className="px-5">
                  <AccordionTrigger className="text-sm text-left py-4">
                    Ainda com dúvidas?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    Entre em contato com o suporte através da página de configurações.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </main>
      </div>

      <WhatsAppConnectionModal open={showConnectionModal} onOpenChange={setShowConnectionModal} />

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta conta será removida e o slot ficará disponível novamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Removendo..." : "Sim, remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Slot Card ──────────────────────────────────────────────────────────────────
interface SlotCardProps {
  slotIndex: number;
  connection: WhatsAppConnection | null;
  editingId: string | null;
  editName: string;
  onStartEditing: (c: WhatsAppConnection) => void;
  onCancelEditing: () => void;
  onSaveEditing: (id: string) => void;
  onEditNameChange: (v: string) => void;
  onConnect: () => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  canConnect: boolean;
}

function SlotCard({
  slotIndex,
  connection,
  editingId,
  editName,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onEditNameChange,
  onConnect,
  onDelete,
  isSaving,
  canConnect,
}: SlotCardProps) {
  const slotNum = slotIndex + 1;

  if (!connection) {
    // Empty slot
    return (
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 p-6 min-h-[160px] ${
          canConnect
            ? "border-border hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer group"
            : "border-border/40 opacity-50"
        }`}
        onClick={canConnect ? onConnect : undefined}
        data-testid={`slot-empty-${slotNum}`}
      >
        <span className="absolute top-3 left-3 text-xs font-medium text-muted-foreground">
          Conta {slotNum}
        </span>
        <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
          canConnect ? "border-muted-foreground/40 group-hover:border-purple-500 group-hover:text-purple-500" : "border-muted-foreground/20"
        }`}>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className={`text-sm font-medium transition-colors ${canConnect ? "text-muted-foreground group-hover:text-purple-400" : "text-muted-foreground/50"}`}>
          {canConnect ? "Conectar WhatsApp" : "Sem slot disponível"}
        </span>
        {canConnect && (
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 mt-1"
            onClick={(e) => { e.stopPropagation(); onConnect(); }}
            data-testid={`button-connect-slot-${slotNum}`}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Conectar
          </Button>
        )}
      </div>
    );
  }

  // Occupied slot
  const isEditing = editingId === connection.id;
  const isConnected = connection.isConnected === true;

  return (
    <div
      className={`relative rounded-xl border-2 p-5 space-y-4 min-h-[160px] transition-colors ${
        isConnected ? "border-green-500/40 bg-green-500/5" : "border-border bg-card"
      }`}
      data-testid={`slot-connection-${connection.id}`}
    >
      {/* Slot label + status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Conta {slotNum}</span>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={`text-xs px-1.5 py-0 ${isConnected ? "bg-green-600 hover:bg-green-600" : ""}`}
          >
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </div>

      {/* Phone icon + number */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isConnected ? "bg-green-500/15" : "bg-muted"
        }`}>
          <Phone className={`h-5 w-5 ${isConnected ? "text-green-500" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                placeholder="Nome da conta"
                className="h-7 text-sm"
                autoFocus
                data-testid={`input-connection-name-${connection.id}`}
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onSaveEditing(connection.id)} disabled={isSaving} data-testid={`button-save-name-${connection.id}`}>
                <Check className="h-3.5 w-3.5 text-green-500" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancelEditing} data-testid={`button-cancel-edit-${connection.id}`}>
                <X className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm truncate">
                {connection.name || formatPhoneNumber(connection.phoneNumber)}
              </span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => onStartEditing(connection)} data-testid={`button-edit-name-${connection.id}`}>
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
          {connection.name && (
            <span className="text-xs text-muted-foreground">{formatPhoneNumber(connection.phoneNumber)}</span>
          )}
        </div>
      </div>

      {/* Remove button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
          onClick={() => onDelete(connection.id)}
          data-testid={`button-delete-connection-${connection.id}`}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Remover
        </Button>
      </div>
    </div>
  );
}
