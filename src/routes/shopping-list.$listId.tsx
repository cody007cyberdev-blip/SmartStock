import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, QrCode, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import type { ShoppingListItem, ShoppingList } from "@/types/shopping-list";

export const Route = createFileRoute("/shopping-list/$listId")({
  component: ShoppingListPage,
  head: () => ({ meta: [{ title: "Lista de Compras — SmartStock" }] }),
});

function ShoppingListPage() {
  const { t } = useTranslation();
  const { listId } = Route.useParams();
  const { demoStore } = useDemo();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll simulate finding the list
    const foundList = demoStore?.getShoppingLists?.().find((l) => l.id === listId);
    if (foundList) {
      setList(foundList);
    } else {
      toast.error(t("shoppingList.invalidQR"));
    }
    setLoading(false);
  }, [listId, demoStore, t]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600 mx-auto" />
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">{t("common.notFound")}</h1>
          <p className="text-gray-600">{t("shoppingList.invalidQR")}</p>
        </Card>
      </div>
    );
  }

  const handleRemoveItem = (itemId: string) => {
    if (demoStore?.removeItemFromList) {
      const updated = demoStore.removeItemFromList(list.id, itemId);
      if (updated) {
        setList(updated);
        toast.success(t("shoppingList.itemRemoved"));
      }
    }
  };

  const handleCheckout = () => {
    if (list.items.length === 0) {
      toast.error(t("shoppingList.emptyList"));
      return;
    }
    if (demoStore?.completeShoppingList) {
      const updated = demoStore.completeShoppingList(list.id);
      if (updated) {
        setList(updated);
        toast.success(t("shoppingList.checkout"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-orange-100 p-3">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t("shoppingList.title")}</h1>
          <p className="mt-2 text-gray-600">
            {list.customerName && `${t("common.customer")}: ${list.customerName}`}
          </p>
        </div>

        {/* QR Code Display */}
        <Card className="mb-6 border-2 border-orange-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">{t("common.reference")}</p>
              <p className="mt-1 text-lg font-mono font-bold text-orange-600">{list.qrCode}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3">
              <QrCode className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Items List */}
        <Card className="mb-6 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="font-semibold text-gray-900">{t("shoppingList.items")} ({list.items.length})</h2>
          </div>

          {list.items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-600">{t("shoppingList.emptyList")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {list.items.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between px-6 py-4 hover:bg-orange-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.itemName}</p>
                    <p className="text-sm text-gray-600">SKU: {item.itemSku}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {item.quantity} × R$ {item.unitPrice.toFixed(2)} = <span className="font-semibold text-orange-600">R$ {item.subtotal.toFixed(2)}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.itemId)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Total */}
        {list.items.length > 0 && (
          <Card className="mb-6 border-2 border-orange-200 bg-orange-50 p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">{t("shoppingList.totalPrice")}</span>
              <span className="text-3xl font-bold text-orange-600">R$ {list.totalPrice.toFixed(2)}</span>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleCheckout}
            disabled={list.items.length === 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {t("shoppingList.checkout")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-lg"
          >
            {t("shoppingList.continueShop")}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>{t("common.appName")} — {t("common.tagline")}</p>
        </div>
      </div>
    </div>
  );
}
