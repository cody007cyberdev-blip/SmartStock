import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Plus, MoreHorizontal, Users, Search, ShieldCheck, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DemoUser } from "@/lib/demo-store";

type RoleType = DemoUser["role"];
const ROLE_COLORS: Record<RoleType, string> = {
  admin: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  manager: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  requestor: "bg-muted text-muted-foreground",
};
const CURRENT_USER_ID = "user-01";

export function UserManagement() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith("pt") ? ptBR : enUS;
  const ROLE_LABELS: Record<RoleType, string> = {
    admin: t("roles.admin"),
    manager: t("roles.inventoryManager"),
    requestor: t("roles.requestor"),
  };

  const { demoStore, bumpVersion, version } = useDemo();
  const users = useMemo(() => demoStore?.getUsers() ?? [], [demoStore, version]);

  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleType>("requestor");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [roleChange, setRoleChange] = useState<{ user: DemoUser; newRole: RoleType } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<DemoUser | null>(null);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const adminCount = users.filter((u) => u.role === "admin" && u.status === "active").length;
  const isLastAdmin = (user: DemoUser) => user.role === "admin" && user.status === "active" && adminCount <= 1;

  const handleInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInviteError(t("settings.users.validEmail")); return; }
    if (users.some((u) => u.email.toLowerCase() === email)) { setInviteError(t("settings.users.userExists")); return; }
    setInviteLoading(true);
    setTimeout(() => {
      demoStore?.addUser({ id: crypto.randomUUID(), name: email.split("@")[0], email, role: inviteRole, status: "pending", joinedAt: new Date().toISOString() });
      bumpVersion();
      toast.success(t("settings.users.invitationSent", { email }));
      setInviteOpen(false); setInviteEmail(""); setInviteRole("requestor"); setInviteError(""); setInviteLoading(false);
    }, 400);
  };

  const confirmRoleChange = () => {
    if (!roleChange || !demoStore) return;
    demoStore.updateUser(roleChange.user.id, { role: roleChange.newRole });
    bumpVersion();
    toast.success(t("settings.users.roleChanged", { name: roleChange.user.name, role: ROLE_LABELS[roleChange.newRole] }));
    setRoleChange(null);
  };

  const confirmDeactivate = () => {
    if (!deactivateTarget || !demoStore) return;
    demoStore.updateUser(deactivateTarget.id, { status: "inactive" });
    bumpVersion();
    toast.success(t("settings.users.deactivated", { name: deactivateTarget.name }));
    setDeactivateTarget(null);
  };

  const handleReactivate = (user: DemoUser) => {
    demoStore?.updateUser(user.id, { status: "active" });
    bumpVersion();
    toast.success(t("settings.users.reactivated", { name: user.name }));
  };

  if (users.length === 0) {
    return <EmptyState icon={Users} title={t("settings.users.empty.title")} description={t("settings.users.empty.description")} />;
  }

  const statusLabel = (s: DemoUser["status"]) => t(`settings.users.statusLabels.${s}` as const);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("settings.users.searchPh")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-white" />
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("settings.users.invite")}
        </Button>
      </div>

      <div className="hidden sm:block rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.users.table.name")}</TableHead>
              <TableHead>{t("settings.users.table.email")}</TableHead>
              <TableHead>{t("settings.users.table.role")}</TableHead>
              <TableHead>{t("settings.users.table.status")}</TableHead>
              <TableHead>{t("settings.users.table.joined")}</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("settings.users.noUsers")}</TableCell></TableRow>
            ) : filtered.map((user) => (
              <TableRow key={user.id} className={cn(user.status === "inactive" && "opacity-50")}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <RoleDropdown user={user} currentUserId={CURRENT_USER_ID} isLastAdmin={isLastAdmin(user)}
                    roleLabels={ROLE_LABELS} roleColors={ROLE_COLORS}
                    cannotChangeOwn={t("settings.users.cannotChangeOwn")}
                    cannotChangeOnlyAdmin={t("settings.users.cannotChangeOnlyAdmin")}
                    onChangeRole={(newRole) => setRoleChange({ user, newRole })} />
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "default" : user.status === "pending" ? "outline" : "secondary"}
                    className={cn("text-xs", user.status === "inactive" && "bg-muted text-muted-foreground")}>
                    {statusLabel(user.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(user.joinedAt), "MMM d, yyyy", { locale: dateLocale })}</TableCell>
                <TableCell>
                  <UserActions user={user} currentUserId={CURRENT_USER_ID} isLastAdmin={isLastAdmin(user)}
                    deactivateLabel={t("settings.users.deactivate")} reactivateLabel={t("settings.users.reactivate")}
                    cannotSelf={t("settings.users.cannotDeactivateSelf")}
                    cannotOnlyAdmin={t("settings.users.cannotDeactivateOnlyAdmin")}
                    onDeactivate={() => setDeactivateTarget(user)} onReactivate={() => handleReactivate(user)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="sm:hidden space-y-3">
        {filtered.map((user) => (
          <div key={user.id} className={cn("rounded-lg border border-border p-3 space-y-2", user.status === "inactive" && "opacity-50")}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{user.name}</span>
              <UserActions user={user} currentUserId={CURRENT_USER_ID} isLastAdmin={isLastAdmin(user)}
                deactivateLabel={t("settings.users.deactivate")} reactivateLabel={t("settings.users.reactivate")}
                cannotSelf={t("settings.users.cannotDeactivateSelf")}
                cannotOnlyAdmin={t("settings.users.cannotDeactivateOnlyAdmin")}
                onDeactivate={() => setDeactivateTarget(user)} onReactivate={() => handleReactivate(user)} />
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</Badge>
              <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">{statusLabel(user.status)}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.users.inviteTitle")}</DialogTitle>
            <DialogDescription>{t("settings.users.inviteDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("settings.users.emailLabel")}</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }} placeholder="user@example.com" />
              {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.users.roleLabel")}</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as RoleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                  <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
                  <SelectItem value="requestor">{ROLE_LABELS.requestor}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>{inviteLoading ? t("settings.users.sending") : t("settings.users.sendInvite")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!roleChange} onOpenChange={(open) => !open && setRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.users.changeRoleTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.users.changeRoleDesc", {
                name: roleChange?.user.name ?? "",
                from: roleChange ? ROLE_LABELS[roleChange.user.role] : "",
                to: roleChange ? ROLE_LABELS[roleChange.newRole] : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.users.deactivateTitle", { name: deactivateTarget?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.users.deactivateDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("settings.users.deactivate")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleDropdown({ user, currentUserId, isLastAdmin, roleLabels, roleColors, cannotChangeOwn, cannotChangeOnlyAdmin, onChangeRole }: {
  user: DemoUser; currentUserId: string; isLastAdmin: boolean;
  roleLabels: Record<RoleType, string>; roleColors: Record<RoleType, string>;
  cannotChangeOwn: string; cannotChangeOnlyAdmin: string;
  onChangeRole: (role: RoleType) => void;
}) {
  const isSelf = user.id === currentUserId;

  if (isSelf) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("text-xs cursor-default", roleColors[user.role])}>{roleLabels[user.role]}</Badge>
          </TooltipTrigger>
          <TooltipContent>{cannotChangeOwn}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLastAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("text-xs cursor-default", roleColors[user.role])}>{roleLabels[user.role]}</Badge>
          </TooltipTrigger>
          <TooltipContent>{cannotChangeOnlyAdmin}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Select value={user.role} onValueChange={(v) => { if (v !== user.role) onChangeRole(v as RoleType); }}>
      <SelectTrigger className="h-7 w-[160px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />{roleLabels.admin}</div>
        </SelectItem>
        <SelectItem value="manager">
          <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />{roleLabels.manager}</div>
        </SelectItem>
        <SelectItem value="requestor">
          <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{roleLabels.requestor}</div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function UserActions({ user, currentUserId, isLastAdmin, deactivateLabel, reactivateLabel, cannotSelf, cannotOnlyAdmin, onDeactivate, onReactivate }: {
  user: DemoUser; currentUserId: string; isLastAdmin: boolean;
  deactivateLabel: string; reactivateLabel: string;
  cannotSelf: string; cannotOnlyAdmin: string;
  onDeactivate: () => void; onReactivate: () => void;
}) {
  const isSelf = user.id === currentUserId;
  const canDeactivate = !isSelf && !isLastAdmin && user.status !== "inactive";
  const canReactivate = user.status === "inactive";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canReactivate ? (
          <DropdownMenuItem onClick={onReactivate}>{reactivateLabel}</DropdownMenuItem>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem disabled={!canDeactivate} onClick={canDeactivate ? onDeactivate : undefined}>
                  {deactivateLabel}
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canDeactivate && (
                <TooltipContent>
                  {isSelf ? cannotSelf : isLastAdmin ? cannotOnlyAdmin : ""}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
