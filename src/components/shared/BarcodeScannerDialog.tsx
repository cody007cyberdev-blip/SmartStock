import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScanLine, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
}

const SCANNER_ELEMENT_ID = "stockmind-barcode-reader";

export function BarcodeScannerDialog({ open, onOpenChange, onDetected }: BarcodeScannerDialogProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    detectedRef.current = false;
    setError(null);
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        // Ensure container exists in DOM
        const el = document.getElementById(SCANNER_ELEMENT_ID);
        if (!el) return;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
        scannerRef.current = {
          stop: () => scanner.stop().catch(() => {}),
          clear: () => {
            try {
              scanner.clear();
            } catch {
              /* noop */
            }
          },
        };

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.6,
          },
          (decodedText) => {
            if (detectedRef.current) return;
            detectedRef.current = true;
            onDetected(decodedText.trim());
            onOpenChange(false);
          },
          () => {
            /* ignore decode errors */
          },
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/permission|NotAllowed/i.test(msg)) {
          setError(t("common.cameraPermissionDenied"));
        } else if (/NotFound|no camera/i.test(msg)) {
          setError(t("common.cameraNotAvailable"));
        } else {
          setError(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().finally(() => s.clear());
      }
    };
  }, [open, onDetected, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            {t("common.scanWithCamera")}
          </DialogTitle>
          <DialogDescription>{t("common.pointAtBarcode")}</DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg border border-border bg-black">
          <div id={SCANNER_ELEMENT_ID} className="min-h-[280px] w-full [&_video]:!w-full [&_video]:!h-auto" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
          <X className="h-4 w-4" />
          {t("common.stopScanning")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
