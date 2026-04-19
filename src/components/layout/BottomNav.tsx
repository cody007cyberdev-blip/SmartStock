import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Package, ArrowLeftRight, ClipboardList, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

const NAV_ITEMS = [
  { labelKey: "nav.dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.catalog", href: "/app/catalog", icon: Package },
  { labelKey: "nav.movements", href: "/app/movements", icon: ArrowLeftRight },
  { labelKey: "nav.orders", href: "/app/purchase-orders", icon: ClipboardList },
] as const;

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-border bg-card md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors min-h-[44px]",
              isActive(item.href) ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {t(item.labelKey)}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground min-h-[44px]"
        >
          <MoreHorizontal className="h-5 w-5" />
          {t("nav.more")}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] p-0">
          <SheetTitle className="sr-only">{t("nav.more")}</SheetTitle>
          <Sidebar onNavigate={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
