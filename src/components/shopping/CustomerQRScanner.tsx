import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarcodeScannerDialog } from "@/components/shared/BarcodeScannerDialog";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import type { ShoppingList } from "@/types/shopping-list";

interface CustomerQRScannerProps {
  onListFound?: (list: ShoppingList) => void;
  onNavigate?: (listId: string) => void;
}

export function CustomerQRScanner({ onListFound, onNavigate }: CustomerQRScannerProps) {
  const { t } = useTranslation();
  const { demoStore } = useDemo();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQRDetected = (code: string) => {
    setScannerOpen(false);
    processQRCode(code);
  };

  const processQRCode = (code: string) => {
    setLoading(true);
    try {
      // In a real app, this would call an API
      // For now, we'll simulate finding the list by QR code
      const list = demoStore?.getShoppingListByQRCode?.(code);

      if (list) {
        toast.success(t("shoppingList.listCreated"));
        onListFound?.(list);
        if (onNavigate) {
          onNavigate(list.id);
        }
      } else {
        toast.error(t("shoppingList.invalidQR"));
      }
    } catch (error) {
      toast.error(t("common.failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    processQRCode(manualCode.trim());
    setManualCode("");
  };

  return (
    <div className="space-y-4">
      {/* Scanner Button */}
      <Button
        onClick={() => setScannerOpen(true)}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Camera className="h-5 w-5" />
        {t("shoppingList.scanQR")}
      </Button>

      {/* Manual Entry */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("common.reference")} ({t("common.optional")})
        </label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="SHOP-XXXXX-XXXXXX"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            disabled={loading}
            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          />
          <Button
            type="submit"
            disabled={loading}
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            {t("common.search")}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">{t("shoppingList.title")}</p>
          <p className="mt-1">Escaneie o código QR fornecido pela loja para criar sua lista de compras.</p>
        </div>
      </Card>

      {/* Scanner Dialog */}
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleQRDetected}
      />
    </div>
  );
}
