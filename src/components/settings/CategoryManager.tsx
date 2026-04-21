import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCategories, useItems } from "@/hooks/useInventoryData";
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useInventoryMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
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

export function CategoryManager() {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { data: items } = useItems();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; itemCount: number } | null>(null);
  const [inlineError, setInlineError] = useState("");

  const addRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) addRef.current?.focus(); }, [adding]);
  useEffect(() => { if (editingId) editRef.current?.focus(); }, [editingId]);

  const itemCountMap = new Map<string, number>();
  items.forEach((i) => { if (i.categoryId) itemCountMap.set(i.categoryId, (itemCountMap.get(i.categoryId) ?? 0) + 1); });

  const validate = (name: string, excludeId?: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return t("settings.categories.nameRequired");
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== excludeId))
      return t("settings.categories.alreadyExists");
    return null;
  };

  const handleAdd = () => {
    const err = validate(newName);
    if (err) { setInlineError(err); return; }
    const now = new Date().toISOString();
    createCat.mutate({ id: crypto.randomUUID(), name: newName.trim(), description: "", parentId: null, createdAt: now, updatedAt: now }, {
      onSuccess: () => { toast.success(t("settings.categories.created")); setNewName(""); setAdding(false); setInlineError(""); },
    });
  };

  const handleRename = () => {
    if (!editingId) return;
    const err = validate(editName, editingId);
    if (err) { setInlineError(err); return; }
    updateCat.mutate({ id: editingId, updates: { name: editName.trim() } }, {
      onSuccess: () => { toast.success(t("settings.categories.renamed")); setEditingId(null); setInlineError(""); },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCat.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success(t("settings.categories.deleted")); setDeleteTarget(null); },
    });
  };

  if (categories.length === 0 && !adding) {
    return (
      <EmptyState
        icon={Tag}
        title={t("settings.categories.empty.title")}
        description={t("settings.categories.empty.description")}
        actionLabel={t("settings.categories.empty.action")}
        onAction={() => setAdding(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("settings.categories.countLabel", { count: categories.length })}</p>
        <Button size="sm" variant="outline" onClick={() => { setAdding(true); setInlineError(""); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("settings.categories.addBtn")}
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {adding && (
          <div className="flex items-center gap-2 p-3">
            <Input ref={addRef} value={newName} onChange={(e) => { setNewName(e.target.value); setInlineError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setInlineError(""); } }}
              placeholder={t("settings.categories.placeholder")} className="h-8 text-sm" />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleAdd}><Check className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setAdding(false); setInlineError(""); }}><X className="h-4 w-4" /></Button>
          </div>
        )}
        {inlineError && adding && <p className="px-3 pb-2 text-xs text-destructive">{inlineError}</p>}

        {categories.map((cat) => {
          const count = itemCountMap.get(cat.id) ?? 0;
          const isEditing = editingId === cat.id;

          return (
            <div key={cat.id} className="flex items-center justify-between gap-2 p-3">
              {isEditing ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input ref={editRef} value={editName} onChange={(e) => { setEditName(e.target.value); setInlineError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setEditingId(null); setInlineError(""); } }}
                    className="h-8 text-sm" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleRename}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setEditingId(null); setInlineError(""); }}><X className="h-4 w-4" /></Button>
                  {inlineError && <span className="text-xs text-destructive">{inlineError}</span>}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate max-w-[200px]" title={cat.name}>{cat.name.length > 50 ? cat.name.slice(0, 50) + "…" : cat.name}</span>
                    <Badge variant="secondary" className="text-xs">{t("settings.categories.itemCount", { count })}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(cat.id); setEditName(cat.name); setInlineError(""); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: cat.id, name: cat.name, itemCount: count })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.categories.deleteTitle", { name: deleteTarget?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {(deleteTarget?.itemCount ?? 0) > 0
                ? t("settings.categories.deleteWithItems", { count: deleteTarget!.itemCount })
                : t("settings.categories.deleteWithoutItems")}
              {t("settings.categories.deleteUndoneSuffix")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
