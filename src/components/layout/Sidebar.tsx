import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Truck,
  ClipboardList,
  Inbox,
  MapPin,
  BarChart3,
  Sparkles,
  Brain,
  Settings,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import type { RolePermissions } from "@/lib/roles";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permKey?: keyof RolePermissions;
}

interface NavGroup {
  labelKey: string;
  groupKey: string;
  items: NavItem[];
  permKey?: keyof RolePermissions;
}

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.operations",
    groupKey: "operations",
    items: [
      { labelKey: "nav.dashboard", href: "/app/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.catalog", href: "/app/catalog", icon: Package },
      { labelKey: "nav.movements", href: "/app/movements", icon: ArrowLeftRight, permKey: "canLogMovements" },
      { labelKey: "nav.locations", href: "/app/locations", icon: MapPin },
    ],
  },
  {
    labelKey: "nav.procurement",
    groupKey: "procurement",
    permKey: "canManagePOs",
    items: [
      { labelKey: "nav.suppliers", href: "/app/suppliers", icon: Truck },
      { labelKey: "nav.purchaseOrders", href: "/app/purchase-orders", icon: ClipboardList },
    ],
  },
  {
    labelKey: "nav.intelligence",
    groupKey: "intelligence",
    permKey: "canViewAnalytics",
    items: [
      { labelKey: "nav.analytics", href: "/app/analytics", icon: BarChart3 },
      { labelKey: "nav.aiInsights", href: "/app/ai-insights", icon: Sparkles },
      { labelKey: "nav.mlForecast", href: "/app/ml-forecast", icon: Brain },
    ],
  },
  {
    labelKey: "nav.admin",
    groupKey: "admin",
    permKey: "canAccessSettings",
    items: [
      { labelKey: "nav.settings", href: "/app/settings", icon: Settings },
    ],
  },
];

const standaloneLinks: NavItem[] = [
  { labelKey: "nav.requests", href: "/app/requests", icon: Inbox },
  { labelKey: "nav.help", href: "/app/help", icon: HelpCircle },
];

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { permissions } = useRole();

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) => location.pathname === href;

  const visibleGroups = navGroups
    .filter((g) => !g.permKey || permissions[g.permKey])
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.permKey || permissions[i.permKey]),
    }))
    .filter((g) => g.items.length > 0);

  const groupState = collapsed;
  const setGroupState = setCollapsed;
  const compactLinks = [...visibleGroups.flatMap((group) => group.items), ...standaloneLinks];

  return (
    <nav data-tour="sidebar" className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200", collapsed ? "w-16" : "w-[260px]")}>
      <div className={cn("flex h-14 items-center gap-2", collapsed ? "justify-center px-2" : "px-5")}>
        <Brain className="h-5 w-5 text-sidebar-primary" />
        {!collapsed && <span className="text-lg font-semibold tracking-tight text-sidebar-primary-foreground">StockMind</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {collapsed ? (
          <div className="space-y-1">
            {compactLinks.map((item, idx) => (
              <div key={item.href}>
                {idx === visibleGroups.flatMap((group) => group.items).length && <div className="mx-1 my-2 border-t border-sidebar-border" />}
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  title={t(item.labelKey)}
                  aria-label={t(item.labelKey)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
        {visibleGroups.map((group, idx) => {
          const isCollapsed = groupState[group.groupKey] ?? false;
          return (
            <div key={group.groupKey}>
              {idx > 0 && <div className="mx-2 my-2 border-t border-sidebar-border" />}
              <button
                type="button"
                onClick={() => setGroupState((prev) => ({ ...prev, [group.groupKey]: !prev[group.groupKey] }))}
                className="flex w-full items-center gap-1 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
              >
                <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", !isCollapsed && "rotate-90")} />
                {t(group.labelKey)}
              </button>

              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-accent font-medium text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mx-2 my-2 border-t border-sidebar-border" />
        <div className="space-y-0.5">
          {standaloneLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-accent font-medium text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
        )}
      </div>
    </nav>
  );
}
