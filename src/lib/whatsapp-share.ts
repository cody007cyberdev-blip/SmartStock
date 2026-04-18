import type { Notification } from "@/types/inventory";

/**
 * Build a wa.me share URL with a pre-filled message based on the notification.
 * Opens in WhatsApp Web/desktop/mobile depending on the user's device — no API needed.
 */
export function buildWhatsAppShareUrl(n: Notification): string {
  const lines: string[] = [];
  lines.push(`*[Stackwise] ${n.title}*`);
  if (n.message) lines.push("", n.message);
  if (typeof window !== "undefined" && n.link) {
    lines.push("", `${window.location.origin}${n.link}`);
  }
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/?text=${text}`;
}

/** Notification types that warrant WhatsApp escalation. */
export function isShareable(type: Notification["type"]): boolean {
  return type === "low_stock" || type === "zero_stock" || type === "po_overdue";
}
