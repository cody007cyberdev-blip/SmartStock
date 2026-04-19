import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";

interface BarcodeScannerButtonProps {
  onDetected: (code: string) => void;
  size?: "icon" | "sm" | "default";
  variant?: "outline" | "ghost" | "default";
  className?: string;
  ariaLabel?: string;
}

export function BarcodeScannerButton({
  onDetected,
  size = "icon",
  variant = "outline",
  className,
  ariaLabel,
}: BarcodeScannerButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = ariaLabel ?? t("common.scanWithCamera");

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        <Camera className="h-4 w-4" />
        {size !== "icon" && <span className="ml-2">{t("common.scan")}</span>}
      </Button>
      <BarcodeScannerDialog
        open={open}
        onOpenChange={setOpen}
        onDetected={(code) => {
          onDetected(code);
        }}
      />
    </>
  );
}
