import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { X, CheckCheck, Bell, Settings2, Share2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDismissNotification } from "@/hooks/useNotifications";
import { getNotificationIcon } from "./notification-icons";
import { buildWhatsAppShareUrl, isShareable } from "@/lib/whatsapp-share";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/inventory";

type FilterTab = "all" | "unread" | "stock" | "po" | "requests";

const TAB_FILTER: Record<FilterTab, (n: Notification) => boolean> = {
  all: () => true,
  unread: (n) => !n.isRead,
  stock: (n) => n.type === "low_stock" || n.type === "zero_stock",
  po: (n) => n.type === "po_reminder" || n.type === "po_overdue",
  requests: (n) => n.type === "request_update",
};

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPrefs?: () => void;
}

export function NotificationCenter({ open, onOpenChange, onOpenPrefs }: NotificationCenterProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith("pt") ? ptBR : enUS;
  const [tab, setTab] = useState<FilterTab>("all");
  const { data: notifications } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const dismiss = useDismissNotification();
  const navigate = useNavigate();

  const filtered = notifications.filter(TAB_FILTER[tab]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) {
      onOpenChange(false);
      navigate({ to: n.link as "/app/dashboard" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="border-b border-border px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SheetTitle className="flex min-w-0 flex-wrap items-center gap-2 text-base">
              <span className="truncate">{t("notifications.title")}</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 font-mono text-xs text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            <div className="flex flex-wrap items-center gap-1 sm:justify-end">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto max-w-full gap-1 px-2 py-1 text-left text-xs whitespace-normal" onClick={markAllAsRead}>
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  {t("notifications.markAllAsRead")}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenPrefs?.()} aria-label={t("notifications.settings")}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="border-b border-border px-4 py-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
            <TabsList className="h-8 w-full">
              <TabsTrigger value="all" className="text-xs flex-1">{t("notifications.tabs.all")}</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs flex-1">{t("notifications.tabs.unread")}</TabsTrigger>
              <TabsTrigger value="stock" className="text-xs flex-1">{t("notifications.tabs.stock")}</TabsTrigger>
              <TabsTrigger value="po" className="text-xs flex-1">{t("notifications.tabs.po")}</TabsTrigger>
              <TabsTrigger value="requests" className="text-xs flex-1">{t("notifications.tabs.requests")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">{t("notifications.empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleClick(n)}
                  onDismiss={() => dismiss(n.id)}
                  shareLabel={t("notifications.actions.shareWhatsApp")}
                  dismissLabel={t("notifications.actions.dismiss")}
                  whenLabel={(d: Date) => formatDistanceToNow(d, { addSuffix: true, locale: dateLocale })}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationItem({
  notification: n,
  onClick,
  onDismiss,
  shareLabel,
  dismissLabel,
  whenLabel,
}: {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
  shareLabel: string;
  dismissLabel: string;
  whenLabel: (d: Date) => string;
}) {
  const shareable = isShareable(n.type);
  return (
    <div
      className={cn(
        "group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !n.isRead && "bg-primary/5",
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {!n.isRead && (
        <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-primary" />
      )}

      {getNotificationIcon(n.type)}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {whenLabel(new Date(n.createdAt))}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1 self-start">
        {shareable && (
          <a
            href={buildWhatsAppShareUrl(n)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded p-1 text-[oklch(0.55_0.17_155)] opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            aria-label={shareLabel}
            title={shareLabel}
          >
            <Share2 className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          type="button"
          className="rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label={dismissLabel}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
