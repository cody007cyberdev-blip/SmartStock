import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, ShoppingCart, History, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/shared/BarcodeScannerDialog";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import type { ShoppingList, Sale } from "@/types/shopping-list";
import { EmptyState } from "@/components/shared/EmptyState";

export const Route = createFileRoute("/app/vendor-panel")({
  component: VendorPanelPage,
  head: () => ({ meta: [{ title: "Painel do Vendedor — StockMind" }] }),
});

function VendorPanelPage() {
  const { t } = useTranslation();
  const { demoStore } = useDemo();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [activeTab, setActiveTab] = useState("scan");

  useEffect(() => {
    // Load sales history
    const vendorSales = demoStore?.getSales?.() || [];
    setSales(vendorSales);
  }, [demoStore]);

  const handleQRDetected = (code: string) => {
    setScannerOpen(false);
    processCustomerQR(code);
  };

  const processCustomerQR = (code: string) => {
    try {
      const list = demoStore?.getShoppingListByQRCode?.(code);
      if (list && list.status === "completed") {
        setCurrentList(list);
        toast.success(t("vendorPanel.customerList"));
      } else {
        toast.error(t("vendorPanel.invalidCustomerQR"));
      }
    } catch (error) {
      toast.error(t("common.failed"));
    }
  };

  const handleConfirmSale = () => {
    if (!currentList || currentList.items.length === 0) {
      toast.error(t("shoppingList.emptyList"));
      return;
    }

    try {
      const sale = demoStore?.createSale?.(
        currentList.id,
        currentList.customerId,
        "vendor-001", // Vendor ID - in real app would come from auth
        paymentMethod,
        currentList.items,
      );

      if (sale) {
        setSales([sale, ...sales]);
        setCurrentList(null);
        toast.success(t("vendorPanel.saleCompleted"));
      }
    } catch (error) {
      toast.error(t("common.failed"));
    }
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    if (!currentList) return;

    const item = currentList.items.find((i) => i.itemId === itemId);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);
    if (demoStore?.updateItemQuantity) {
      const updated = demoStore.updateItemQuantity(currentList.id, itemId, newQty);
      if (updated) {
        setCurrentList(updated);
      }
    }
  };

  const calculateTax = (subtotal: number) => subtotal * 0.1;
  const calculateTotal = (subtotal: number) => subtotal + calculateTax(subtotal);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("vendorPanel.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("vendorPanel.scanCustomerQR")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">{t("vendorPanel.scanCustomerQR")}</TabsTrigger>
          <TabsTrigger value="history">{t("vendorPanel.saleHistory")}</TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-4">
          {!currentList ? (
            <Card className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-orange-100 p-4">
                    <QrCode className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {t("vendorPanel.scanCustomerQR")}
                </h2>
                <p className="text-muted-foreground">
                  Escaneie o código QR do cliente para carregar sua lista de compras.
                </p>
                <Button
                  onClick={() => setScannerOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  {t("vendorPanel.scanCustomerQR")}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card className="border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t("vendorPanel.customerList")}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {currentList.customerName || "Cliente"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentList(null)}
                    className="text-orange-600 border-orange-200 hover:bg-orange-100"
                  >
                    {t("common.back")}
                  </Button>
                </div>
              </Card>

              {/* Items List */}
              <Card className="overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h3 className="font-semibold text-gray-900">
                    {t("vendorPanel.items")} ({currentList.items.length})
                  </h3>
                </div>

                <div className="divide-y divide-gray-200">
                  {currentList.items.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.itemName}</p>
                        <p className="text-sm text-gray-600">SKU: {item.itemSku}</p>
                        <p className="mt-1 text-sm text-gray-700">
                          R$ {item.unitPrice.toFixed(2)} cada
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.itemId, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.itemId, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600">{t("vendorPanel.subtotal")}</p>
                          <p className="font-semibold text-orange-600">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t("vendorPanel.paymentMethod")}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["cash", "card", "transfer"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === method
                          ? "border-orange-600 bg-orange-50 text-orange-600 font-semibold"
                          : "border-gray-200 text-gray-700 hover:border-orange-200"
                      }`}
                    >
                      {t(`vendorPanel.${method}`)}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Total */}
              <Card className="border-2 border-orange-200 bg-orange-50 p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>{t("vendorPanel.subtotal")}</span>
                    <span>R$ {currentList.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Imposto (10%)</span>
                    <span>R$ {calculateTax(currentList.totalPrice).toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-orange-200 pt-2 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">{t("vendorPanel.total")}</span>
                    <span className="text-2xl font-bold text-orange-600">
                      R$ {calculateTotal(currentList.totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirmSale}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-lg text-lg"
              >
                <Check className="mr-2 h-5 w-5" />
                {t("vendorPanel.confirmSale")}
              </Button>
            </div>
          )}

          <BarcodeScannerDialog
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            onDetected={handleQRDetected}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {sales.length === 0 ? (
            <EmptyState
              icon={History}
              title={t("vendorPanel.noSales")}
              description="Nenhuma venda registrada ainda."
            />
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <Card key={sale.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {sale.customerId} • {sale.items.length} {t("vendorPanel.items")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(sale.createdAt).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {t("vendorPanel.paymentMethod")}: {t(`vendorPanel.${sale.paymentMethod}`)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        R$ {sale.total.toFixed(2)}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        {t("vendorPanel.saleCompleted")}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
