import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Check, X, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { useLocationTree, type LocationTreeNode } from "@/hooks/useLocations";
import { useItems } from "@/hooks/useInventoryData";
import { useCreateLocation, useUpdateLocation, useDeleteLocation } from "@/hooks/useInventoryMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { LocationType } from "@/types/inventory";

const CHILD_TYPE: Record<LocationType, LocationType | null> = {
  warehouse: "zone", zone: "aisle", aisle: "shelf", shelf: "bin", bin: null,
};

export function LocationSettings() {
  const { t } = useTranslation();
  const tree = useLocationTree();
  const { data: items } = useItems();
  const createLoc = useCreateLocation();
  const updateLoc = useUpdateLocation();
  const deleteLoc = useDeleteLocation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (addingParentId !== null) addRef.current?.focus(); }, [addingParentId]);
  useEffect(() => { if (editingId) editRef.current?.focus(); }, [editingId]);

  const itemCountMap = new Map<string, number>();
  items.forEach((i) => { if (i.locationId) itemCountMap.set(i.locationId, (itemCountMap.get(i.locationId) ?? 0) + 1); });

  const typeLabel = (type: LocationType) => t(`settings.locations.types.${type}` as const);

  const handleAddRoot = () => {
    setAddingParentId("__root__");
    setNewName("");
  };

  const handleSaveNew = (parentId: string | null, parentType: LocationType | null) => {
    if (!newName.trim()) { toast.error(t("settings.locations.nameRequired")); return; }
    const type: LocationType = parentType ? (CHILD_TYPE[parentType] ?? "bin") : "warehouse";
    const now = new Date().toISOString();
    createLoc.mutate({
      id: crypto.randomUUID(), name: newName.trim(), type, parentId,
      description: "", address: "", isActive: true, createdAt: now, updatedAt: now,
    }, {
      onSuccess: () => { toast.success(t("settings.locations.added")); setAddingParentId(null); setNewName(""); },
    });
  };

  const handleRename = () => {
    if (!editingId || !editName.trim()) return;
    updateLoc.mutate({ id: editingId, updates: { name: editName.trim() } }, {
      onSuccess: () => { toast.success(t("settings.locations.renamed")); setEditingId(null); },
    });
  };

  const handleDelete = (node: LocationTreeNode) => {
    const count = itemCountMap.get(node.id) ?? 0;
    if (count > 0) { toast.error(t("settings.locations.itemsAssigned", { count })); return; }
    if (node.children.length > 0) { toast.error(t("settings.locations.removeChildrenFirst")); return; }
    deleteLoc.mutate(node.id, { onSuccess: () => toast.success(t("settings.locations.deleted")) });
  };

  const renderNode = (node: LocationTreeNode) => {
    const count = itemCountMap.get(node.id) ?? 0;
    const childType = CHILD_TYPE[node.type];
    const isEditing = editingId === node.id;
    const isAddingHere = addingParentId === node.id;

    return (
      <div key={node.id}>
        <div className="flex items-center justify-between gap-2 py-1.5" style={{ paddingLeft: `${node.depth * 20 + 8}px` }}>
          {isEditing ? (
            <div className="flex flex-1 items-center gap-1">
              <Input ref={editRef} value={editName} onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingId(null); }}
                className="h-7 text-sm" />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleRename}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm truncate max-w-[180px]">{node.name}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel(node.type)}</Badge>
                {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {childType && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" title={t("settings.locations.addBtn", { type: typeLabel(childType) })}
                    onClick={() => { setAddingParentId(node.id); setNewName(""); }}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(node.id); setEditName(node.name); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(node)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {isAddingHere && childType && (
          <div className="flex items-center gap-1 py-1" style={{ paddingLeft: `${(node.depth + 1) * 20 + 8}px` }}>
            <Input ref={addRef} value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveNew(node.id, node.type); if (e.key === "Escape") setAddingParentId(null); }}
              placeholder={t("settings.locations.newPh", { type: typeLabel(childType) })} className="h-7 text-sm" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveNew(node.id, node.type)}><Check className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingParentId(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        )}

        {node.children.map(renderNode)}
      </div>
    );
  };

  if (tree.length === 0 && addingParentId !== "__root__") {
    return (
      <EmptyState
        icon={Warehouse}
        title={t("settings.locations.empty.title")}
        description={t("settings.locations.empty.description")}
        actionLabel={t("settings.locations.empty.action")}
        onAction={handleAddRoot}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("settings.locations.rootCount", { count: tree.length })}</p>
        <Button size="sm" variant="outline" onClick={handleAddRoot}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("settings.locations.addWarehouse")}
        </Button>
      </div>

      {addingParentId === "__root__" && (
        <div className="flex items-center gap-1 rounded-lg border border-border p-3">
          <Input ref={addRef} value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveNew(null, null); if (e.key === "Escape") setAddingParentId(null); }}
            placeholder={t("settings.locations.warehousePh")} className="h-8 text-sm" />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveNew(null, null)}><Check className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAddingParentId(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}

      <div className="rounded-lg border border-border divide-y divide-border">
        {tree.map(renderNode)}
      </div>
    </div>
  );
}
