import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Send, Trash2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SimulatedEmail } from "@/types/inventory";

export function EmailOutbox() {
  const { t, i18n } = useTranslation();
  const { isDemo, demoStore, version, bumpVersion } = useDemo();
  const [selected, setSelected] = useState<SimulatedEmail | null>(null);
  const dateLocale = i18n.language.startsWith("pt") ? ptBR : enUS;

  const emails = useMemo(() => {
    if (!isDemo || !demoStore) return [];
    return demoStore.getOutbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, demoStore, version]);

  const handleClear = () => {
    demoStore?.clearOutbox();
    setSelected(null);
    bumpVersion();
    toast.success(t("settings.emailOutbox.cleared"));
  };

  const handleMarkSent = (id: string) => {
    demoStore?.clearOutbox();
    void id;
    bumpVersion();
    toast.success(t("settings.emailOutbox.markedSent"));
  };

  const typeLabel = (type: string): string => {
    const key = `notifications.types.${type}` as const;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              {t("settings.emailOutbox.title")}
              <Badge variant="outline" className="ml-1 font-mono text-xs">{emails.length}</Badge>
            </h2>
            <p
              className="mt-1 text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: t("settings.emailOutbox.description") }}
            />
          </div>
          {emails.length > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleMarkSent("all")}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {t("settings.emailOutbox.markSent")}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {t("settings.emailOutbox.clear")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {emails.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t("settings.emailOutbox.empty.title")}
          description={t("settings.emailOutbox.empty.description")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-lg border border-border bg-card">
            <ScrollArea className="h-[520px]">
              <ul className="divide-y divide-border">
                {emails.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(e)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        selected?.id === e.id && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{e.recipientName}</span>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {typeLabel(e.type)}
                        </Badge>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{e.to}</span>
                      <span className="line-clamp-1 text-xs text-foreground/80">{e.subject}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            {selected ? (
              <article className="space-y-3">
                <div className="space-y-1 border-b border-border pb-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("settings.emailOutbox.to")}</p>
                  <p className="text-sm font-medium">{selected.recipientName} &lt;{selected.to}&gt;</p>
                </div>
                <div className="space-y-1 border-b border-border pb-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("settings.emailOutbox.subject")}</p>
                  <p className="text-sm font-semibold">{selected.subject}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("settings.emailOutbox.body")}</p>
                  <div className="rounded-md bg-muted/40 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {selected.body}
                    {"\n\n"}—{"\n"}{t("settings.emailOutbox.footer")}
                  </div>
                </div>
                <p className="pt-2 text-[10px] text-muted-foreground">
                  {t("settings.emailOutbox.queued", { when: formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true, locale: dateLocale }) })}
                </p>
              </article>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("settings.emailOutbox.selectToPreview")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
