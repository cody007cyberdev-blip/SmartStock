import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="rounded-lg bg-primary p-2">
        <ShoppingCart className="h-6 w-6 text-primary-foreground" />
      </div>
      {showText && (
        <div>
          <h1 className="text-xl font-bold text-foreground">SmartStock</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Inteligência Logística</p>
        </div>
      )}
    </div>
  );
}
