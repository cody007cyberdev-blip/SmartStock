import { useMemo, useState } from "react";
import { Mail, Send, Trash2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SimulatedEmail } from "@/types/inventory";

const TYPE_LABELS: Record<string, string> = {
  low_stock: "Low Stock",
  zero_stock: "Out of Stock",
  po_reminder: "PO Reminder",
  po_overdue: "PO Overdue",
  request_update: "Request Update",
  system: "System",
};

export function EmailOutbox() {
  const { isDemo, demoStore, version, bumpVersion } = useDemo();
  const [selected, setSelected] = useState<SimulatedEmail | null>(null);

  const emails = useMemo(() => {
    if (!isDemo || !demoStore) return [];
    return demoStore.getOutbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, demoStore, version]);

  const handleClear = () => {
    demoStore?.clearOutbox();
    setSelected(null);
    bumpVersion();
    toast.success("Outbox cleared.");
  };

  const handleMarkSent = (id: string) => {
    // Demo only — simulates the email leaving the queue
    demoStore?.clearOutbox();
    void id;
    bumpVersion();
    toast.success("Marked all as sent (simulated).");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              Email Outbox
              <Badge variant="outline" className="ml-1 font-mono text-xs">{emails.length}</Badge>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Simulated email queue — emails that <em>would be</em> sent to admins when stock alerts and PO reminders fire.
              No real emails leave the demo.
            </p>
          </div>
          {emails.length > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleMarkSent("all")}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Mark all sent
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {emails.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No queued emails"
          description="When stock or PO alerts trigger, simulated emails to admins will appear here."
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
                          {TYPE_LABELS[e.type] ?? e.type}
                        </Badge>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{e.to}</span>
                      <span className="line-clamp-1 text-xs text-foreground/80">{e.subject}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
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
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
                  <p className="text-sm font-medium">{selected.recipientName} &lt;{selected.to}&gt;</p>
                </div>
                <div className="space-y-1 border-b border-border pb-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
                  <p className="text-sm font-semibold">{selected.subject}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Body</p>
                  <div className="rounded-md bg-muted/40 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {selected.body}
                    {"\n\n"}—{"\n"}StockMind · automated alert
                  </div>
                </div>
                <p className="pt-2 text-[10px] text-muted-foreground">
                  Queued {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                </p>
              </article>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select an email to preview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
